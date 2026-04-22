import { Router } from 'express';
import jwt from 'jsonwebtoken';
import * as db from '../db.js';

const router = Router();

function verifyAdminToken(req, res, next) {
  const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '\u0422\u043e\u043a\u0435\u043d \u043d\u0435 \u043f\u0440\u0435\u0434\u043e\u0441\u0442\u0430\u0432\u043b\u0435\u043d' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: '\u041d\u0435\u0442 \u043f\u0440\u0430\u0432 \u0430\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440\u0430' });
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ error: '\u041d\u0435\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0439 \u0442\u043e\u043a\u0435\u043d' });
  }
}

router.get('/api/admin/game/:gameId', verifyAdminToken, (req, res) => {
  const game = db.getGame(req.params.gameId);
  if (!game) return res.status(404).json({ error: '\u0418\u0433\u0440\u0430 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430' });
  if (game.admin_discord_id !== req.admin.discordId) return res.status(403).json({ error: '\u042d\u0442\u043e \u043d\u0435 \u0432\u0430\u0448\u0430 \u0438\u0433\u0440\u0430' });

  const players = db.getGamePlayers(req.params.gameId);
  res.json({ game, players });
});

router.put('/api/admin/game/:gameId/settings', verifyAdminToken, (req, res) => {
  const game = db.getGame(req.params.gameId);
  if (!game) return res.status(404).json({ error: '\u0418\u0433\u0440\u0430 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430' });
  if (game.admin_discord_id !== req.admin.discordId) return res.status(403).json({ error: '\u042d\u0442\u043e \u043d\u0435 \u0432\u0430\u0448\u0430 \u0438\u0433\u0440\u0430' });
  if (game.status !== 'setup') return res.status(400).json({ error: '\u0418\u0433\u0440\u0430 \u0443\u0436\u0435 \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u0430' });

  const updated = db.updateGameSettings(req.params.gameId, req.body);
  res.json({ game: updated });
});

router.post('/api/admin/game/:gameId/register', verifyAdminToken, (req, res) => {
  const game = db.getGame(req.params.gameId);
  if (!game) return res.status(404).json({ error: '\u0418\u0433\u0440\u0430 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430' });
  if (game.admin_discord_id !== req.admin.discordId) return res.status(403).json({ error: '\u042d\u0442\u043e \u043d\u0435 \u0432\u0430\u0448\u0430 \u0438\u0433\u0440\u0430' });
  if (game.status !== 'setup') return res.status(400).json({ error: '\u0418\u0433\u0440\u0430 \u0443\u0436\u0435 \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u0430' });

  db.updateGameStatus(req.params.gameId, 'registered');

  const { notifyBot } = req.app.locals;
  if (notifyBot) {
    notifyBot('gameRegistered', { gameId: req.params.gameId });
  }

  res.json({ success: true });
});

router.post('/api/admin/game/:gameId/start', verifyAdminToken, (req, res) => {
  const game = db.getGame(req.params.gameId);
  if (!game) return res.status(404).json({ error: '\u0418\u0433\u0440\u0430 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430' });
  if (game.admin_discord_id !== req.admin.discordId) return res.status(403).json({ error: '\u042d\u0442\u043e \u043d\u0435 \u0432\u0430\u0448\u0430 \u0438\u0433\u0440\u0430' });

  const players = db.getGamePlayers(req.params.gameId);
  if (players.length < 2) return res.status(400).json({ error: '\u041d\u0443\u0436\u043d\u043e \u043c\u0438\u043d\u0438\u043c\u0443\u043c 2 \u0438\u0433\u0440\u043e\u043a\u0430' });

  const { gameManager } = req.app.locals;
  const pokerGame = gameManager.getOrCreateGame(req.params.gameId, game);

  for (const p of players) {
    pokerGame.addPlayer(p.discord_id, p.username, p.avatar_url, p.seat);
  }

  const started = pokerGame.startGame();
  if (!started) return res.status(400).json({ error: '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u043f\u0443\u0441\u0442\u0438\u0442\u044c \u0438\u0433\u0440\u0443' });

  db.updateGameStatus(req.params.gameId, 'playing');
  res.json({ success: true });
});

// Change blinds during game
router.post('/api/admin/game/:gameId/blinds', verifyAdminToken, (req, res) => {
  const game = db.getGame(req.params.gameId);
  if (!game) return res.status(404).json({ error: 'Игра не найдена' });
  if (game.admin_discord_id !== req.admin.discordId) return res.status(403).json({ error: 'Это не ваша игра' });
  if (game.status !== 'playing') return res.status(400).json({ error: 'Игра не запущена' });

  const { smallBlind, bigBlind } = req.body;
  if (!smallBlind || !bigBlind || smallBlind <= 0 || bigBlind <= 0) {
    return res.status(400).json({ error: 'Неверные значения блайндов' });
  }

  const { gameManager } = req.app.locals;
  const pokerGame = gameManager.games.get(req.params.gameId);
  if (!pokerGame) return res.status(400).json({ error: 'Игра не найдена в движке' });

  pokerGame.changeBlinds(smallBlind, bigBlind);

  // Update DB too
  db.updateGameSettings(req.params.gameId, {
    smallBlind, bigBlind,
    roundTime: game.round_time,
    startingStack: game.starting_stack,
    maxPlayers: game.max_players
  });

  res.json({ success: true, smallBlind, bigBlind });
});

// Get game results (after game ends)
router.get('/api/admin/game/:gameId/results', verifyAdminToken, (req, res) => {
  const results = db.getGameResults(req.params.gameId);
  if (!results) return res.status(404).json({ error: 'Игра не найдена' });
  if (results.game.admin_discord_id !== req.admin.discordId) return res.status(403).json({ error: 'Это не ваша игра' });
  res.json(results);
});

export default router;
