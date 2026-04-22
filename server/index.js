import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PokerGame } from './game/engine.js';
import * as db from './db.js';
import adminRoutes from './routes/admin.js';
import gameRoutes from './routes/game.js';
import oauthRoutes from './routes/oauth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class GameServer {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    this.games = new Map();       // gameId -> PokerGame
    this.connections = new Map();  // gameId -> Map<discordId, ws>
    this.botNotifyCallback = null;

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  setupMiddleware() {
    this.app.use(cors({
      origin: true, // Allow all origins (needed for ngrok)
      credentials: true
    }));
    this.app.use(express.json());

    // Serve built frontend
    this.app.use(express.static(join(__dirname, '..', 'frontend', 'dist')));
  }

  setupRoutes() {
    this.app.locals.gameManager = this;
    this.app.locals.notifyBot = (event, data) => {
      if (this.botNotifyCallback) this.botNotifyCallback(event, data);
    };

    this.app.use(adminRoutes);
    this.app.use(gameRoutes);
    this.app.use(oauthRoutes);

    // SPA fallback
    this.app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(join(__dirname, '..', 'frontend', 'dist', 'index.html'));
      }
    });
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        ws.close(4001, 'No token');
        return;
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        ws.close(4001, 'Invalid token');
        return;
      }

      const { gameId, discordId } = decoded;
      this.registerConnection(gameId, discordId, ws);

      // Send current game state
      const game = this.games.get(gameId);
      if (game) {
        ws.send(JSON.stringify({
          type: 'gameState',
          data: game.getPlayerState(discordId)
        }));
      } else {
        ws.send(JSON.stringify({ type: 'waiting', data: { gameId } }));
      }

      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw);
          this.handleMessage(gameId, discordId, msg);
        } catch (e) {
          ws.send(JSON.stringify({ type: 'error', data: { message: 'Invalid message' } }));
        }
      });

      ws.on('close', () => {
        this.removeConnection(gameId, discordId);
        const game = this.games.get(gameId);
        if (game) {
          const player = game.players.find(p => p.discordId === discordId);
          if (player) player.disconnected = true;
          this.broadcastState(gameId);
        }
      });
    });
  }

  handleMessage(gameId, discordId, msg) {
    const game = this.games.get(gameId);
    if (!game) return;

    switch (msg.type) {
      case 'action': {
        const result = game.handleAction(discordId, msg.action, msg.amount);
        const ws = this.getConnection(gameId, discordId);
        if (!result.success && ws) {
          ws.send(JSON.stringify({ type: 'error', data: { message: result.error } }));
        }
        break;
      }
      case 'ping':
        this.sendTo(gameId, discordId, { type: 'pong' });
        break;
    }
  }

  getOrCreateGame(gameId, settings) {
    if (this.games.has(gameId)) return this.games.get(gameId);

    const game = new PokerGame(gameId, settings);
    this.games.set(gameId, game);

    // Bind events to broadcast
    game.on('newHand', () => this.broadcastState(gameId));
    game.on('stateChanged', () => this.broadcastState(gameId));
    game.on('phaseChange', () => this.broadcastState(gameId));
    game.on('turnChange', () => this.broadcastState(gameId));
    game.on('handEnd', (data) => {
      this.broadcastEvent(gameId, 'handEnd', {
        winners: data.winners,
        pot: data.pot
      });
      setTimeout(() => this.broadcastState(gameId), 100);
    });
    game.on('gameOver', (state) => {
      // Save full game log to DB
      try {
        const fullLog = game.getFullGameLog();
        db.saveGameResults(gameId, {
          duration: state.gameDuration,
          totalHands: state.totalHands,
          standings: state.standings,
          gameLog: fullLog
        });
      } catch (e) {
        console.error('[Server] Error saving game log:', e.message);
      }

      this.broadcastEvent(gameId, 'gameOver', {
        winner: state.winner,
        players: state.players,
        standings: state.standings,
        gameDuration: state.gameDuration,
        totalHands: state.totalHands
      });
      const { notifyBot } = this.app.locals;
      if (notifyBot) {
        notifyBot('gameOver', {
          gameId,
          winner: state.winner,
          standings: state.standings,
          gameDuration: state.gameDuration,
          totalHands: state.totalHands
        });
      }
      this.games.delete(gameId);
    });
    game.on('playerEliminated', (data) => {
      this.broadcastEvent(gameId, 'playerEliminated', data);
    });
    game.on('timerStart', (data) => {
      this.broadcastEvent(gameId, 'timerStart', data);
    });
    game.on('blindsChanged', (data) => {
      this.broadcastEvent(gameId, 'blindsChanged', data);
      this.broadcastState(gameId);
    });
    game.on('playerJoined', () => this.broadcastState(gameId));
    game.on('playerLeft', () => this.broadcastState(gameId));

    return game;
  }

  registerConnection(gameId, discordId, ws) {
    if (!this.connections.has(gameId)) {
      this.connections.set(gameId, new Map());
    }
    this.connections.get(gameId).set(discordId, ws);
  }

  removeConnection(gameId, discordId) {
    const gameConns = this.connections.get(gameId);
    if (gameConns) {
      gameConns.delete(discordId);
      if (gameConns.size === 0) this.connections.delete(gameId);
    }
  }

  getConnection(gameId, discordId) {
    return this.connections.get(gameId)?.get(discordId);
  }

  sendTo(gameId, discordId, message) {
    const ws = this.getConnection(gameId, discordId);
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify(message));
    }
  }

  broadcastState(gameId) {
    const game = this.games.get(gameId);
    const conns = this.connections.get(gameId);
    if (!game || !conns) return;

    for (const [discordId, ws] of conns) {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({
          type: 'gameState',
          data: game.getPlayerState(discordId)
        }));
      }
    }
  }

  broadcastEvent(gameId, event, data) {
    const conns = this.connections.get(gameId);
    if (!conns) return;

    for (const [, ws] of conns) {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ type: event, data }));
      }
    }
  }

  onBotNotify(callback) {
    this.botNotifyCallback = callback;
  }

  start(port) {
    return new Promise((resolve) => {
      this.server.listen(port, () => {
        console.log(`[Server] Running on port ${port}`);
        resolve();
      });
    });
  }
}
