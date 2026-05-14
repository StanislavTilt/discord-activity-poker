import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, '..', 'poker.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    admin_discord_id TEXT NOT NULL,
    admin_username TEXT NOT NULL,
    channel_id TEXT,
    message_id TEXT,
    status TEXT NOT NULL DEFAULT 'setup',
    small_blind INTEGER DEFAULT 10,
    big_blind INTEGER DEFAULT 20,
    round_time INTEGER DEFAULT 30,
    starting_stack INTEGER DEFAULT 1000,
    max_players INTEGER DEFAULT 6,
    created_at TEXT DEFAULT (datetime('now')),
    started_at TEXT,
    ended_at TEXT,
    duration_ms INTEGER,
    total_hands INTEGER,
    game_log TEXT
  );

  CREATE TABLE IF NOT EXISTS game_players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL REFERENCES games(id),
    discord_id TEXT NOT NULL,
    username TEXT NOT NULL,
    avatar_url TEXT,
    seat INTEGER,
    joined_at TEXT DEFAULT (datetime('now')),
    final_place INTEGER,
    final_chips INTEGER,
    eliminated_at_hand INTEGER,
    UNIQUE(game_id, discord_id)
  );
`);

// Add new columns if they don't exist (for existing DBs)
try { db.exec('ALTER TABLE games ADD COLUMN ended_at TEXT'); } catch {}
try { db.exec('ALTER TABLE games ADD COLUMN duration_ms INTEGER'); } catch {}
try { db.exec('ALTER TABLE games ADD COLUMN total_hands INTEGER'); } catch {}
try { db.exec('ALTER TABLE games ADD COLUMN game_log TEXT'); } catch {}
try { db.exec('ALTER TABLE game_players ADD COLUMN final_place INTEGER'); } catch {}
try { db.exec('ALTER TABLE game_players ADD COLUMN final_chips INTEGER'); } catch {}
try { db.exec('ALTER TABLE game_players ADD COLUMN eliminated_at_hand INTEGER'); } catch {}

export function createGame(id, adminDiscordId, adminUsername, channelId) {
  db.prepare('INSERT INTO games (id, admin_discord_id, admin_username, channel_id) VALUES (?, ?, ?, ?)').run(id, adminDiscordId, adminUsername, channelId);
  return getGame(id);
}

export function getGame(id) {
  return db.prepare('SELECT * FROM games WHERE id = ?').get(id);
}

export function updateGameSettings(id, settings) {
  const { smallBlind, bigBlind, roundTime, startingStack, maxPlayers } = settings;
  db.prepare('UPDATE games SET small_blind = ?, big_blind = ?, round_time = ?, starting_stack = ?, max_players = ? WHERE id = ?')
    .run(smallBlind, bigBlind, roundTime, startingStack, maxPlayers, id);
  return getGame(id);
}

export function updateGameStatus(id, status) {
  db.prepare('UPDATE games SET status = ? WHERE id = ?').run(status, id);
  if (status === 'playing') {
    db.prepare("UPDATE games SET started_at = datetime('now') WHERE id = ?").run(id);
  }
  return getGame(id);
}

export function setGameMessage(id, messageId) {
  db.prepare('UPDATE games SET message_id = ? WHERE id = ?').run(messageId, id);
}

export function addPlayer(gameId, discordId, username, avatarUrl) {
  const game = getGame(gameId);
  if (!game) return null;

  const playerCount = db.prepare('SELECT COUNT(*) as count FROM game_players WHERE game_id = ?').get(gameId).count;
  if (playerCount >= game.max_players) return null;

  const existing = db.prepare('SELECT * FROM game_players WHERE game_id = ? AND discord_id = ?').get(gameId, discordId);
  if (existing) return existing;

  const seat = playerCount;
  db.prepare('INSERT INTO game_players (game_id, discord_id, username, avatar_url, seat) VALUES (?, ?, ?, ?, ?)')
    .run(gameId, discordId, username, avatarUrl, seat);

  return db.prepare('SELECT * FROM game_players WHERE game_id = ? AND discord_id = ?').get(gameId, discordId);
}

export function getGamePlayers(gameId) {
  return db.prepare('SELECT * FROM game_players WHERE game_id = ? ORDER BY seat').all(gameId);
}

export function getPlayerByDiscordId(gameId, discordId) {
  return db.prepare('SELECT * FROM game_players WHERE game_id = ? AND discord_id = ?').get(gameId, discordId);
}

// Save full game results when game ends
export function saveGameResults(gameId, results) {
  const { duration, totalHands, standings, gameLog } = results;

  db.prepare(`
    UPDATE games SET status = 'finished', ended_at = datetime('now'),
    duration_ms = ?, total_hands = ?, game_log = ? WHERE id = ?
  `).run(duration, totalHands, JSON.stringify(gameLog), gameId);

  // Update each player's final stats
  if (standings) {
    const stmt = db.prepare('UPDATE game_players SET final_place = ?, final_chips = ?, eliminated_at_hand = ? WHERE game_id = ? AND discord_id = ?');
    for (const s of standings) {
      stmt.run(s.place, s.chips || 0, s.eliminatedAtHand || null, gameId, s.discordId);
    }
  }
}

// Get game results for admin panel
export function getGameResults(gameId) {
  const game = getGame(gameId);
  if (!game) return null;

  const players = db.prepare('SELECT * FROM game_players WHERE game_id = ? ORDER BY COALESCE(final_place, 999), seat').all(gameId);

  let gameLog = null;
  if (game.game_log) {
    try { gameLog = JSON.parse(game.game_log); } catch { gameLog = null; }
  }

  return {
    game,
    players,
    gameLog
  };
}

export default db;
