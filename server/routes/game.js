import { Router } from 'express';
import jwt from 'jsonwebtoken';
import * as db from '../db.js';

const router = Router();

// Get game public info (for players)
router.get('/api/game/:gameId', (req, res) => {
  const game = db.getGame(req.params.gameId);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  const players = db.getGamePlayers(req.params.gameId);
  res.json({
    game: {
      id: game.id,
      status: game.status,
      small_blind: game.small_blind,
      big_blind: game.big_blind,
      round_time: game.round_time,
      starting_stack: game.starting_stack,
      max_players: game.max_players,
      admin_username: game.admin_username
    },
    players: players.map(p => ({
      username: p.username,
      avatar_url: p.avatar_url,
      seat: p.seat
    }))
  });
});

// Verify player token
router.get('/api/game/:gameId/verify', (req, res) => {
  const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.gameId !== req.params.gameId) return res.status(403).json({ error: 'Wrong game' });

    const player = db.getPlayerByDiscordId(req.params.gameId, decoded.discordId);
    if (!player) return res.status(404).json({ error: 'Player not in game' });

    res.json({ valid: true, player });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Activity join — find active game in channel and join via Discord user info
router.post('/api/game/activity-join', (req, res) => {
  const { discordId, username, avatarUrl, channelId } = req.body;
  if (!discordId || !username) return res.status(400).json({ error: 'Missing user info' });

  // Find active game in this channel
  const allGames = db.default.prepare(
    "SELECT * FROM games WHERE channel_id = ? AND status IN ('registered', 'playing') ORDER BY created_at DESC LIMIT 1"
  ).get(channelId);

  if (!allGames) {
    return res.status(404).json({ error: 'Нет активной игры в этом канале' });
  }

  const game = allGames;

  // Auto-join if game is in registration and player not yet joined
  if (game.status === 'registered') {
    db.addPlayer(game.id, discordId, username, avatarUrl);
  }

  // Check if player is in this game
  const player = db.getPlayerByDiscordId(game.id, discordId);
  if (!player && game.status === 'playing') {
    return res.status(403).json({ error: 'Игра уже началась, вы не зарегистрированы' });
  }

  // Generate JWT token for WebSocket
  const token = jwt.sign(
    { discordId, gameId: game.id, role: 'player' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, gameId: game.id });
});

export default router;
