import 'dotenv/config';
import { GameServer } from './server/index.js';
import { PokerBot } from './bot/index.js';

// When running with ngrok, both frontend and API are served from port 3000
// The built frontend (frontend/dist) is served as static files by Express
// ngrok tunnels port 3000 to a public URL

async function main() {
  const port = parseInt(process.env.PORT) || 3000;

  // Override FRONTEND_URL to be same as BASE_URL (single server mode)
  // ngrok URL will be passed as command line argument or env var
  const publicUrl = process.argv[2] || process.env.PUBLIC_URL || `http://localhost:${port}`;

  // Override env for the session
  process.env.FRONTEND_URL = publicUrl;
  process.env.BASE_URL = publicUrl;

  const server = new GameServer();
  await server.start(port);

  const bot = new PokerBot();

  server.onBotNotify((event, data) => {
    if (event === 'gameRegistered') {
      bot.postGameRegistered(data.gameId);
    } else if (event === 'gameOver') {
      bot.postGameResults(data);
    }
  });

  await bot.start(process.env.BOT_TOKEN);

  console.log('');
  console.log('==========================================');
  console.log('  Discord Poker Bot — PUBLIC MODE');
  console.log(`  Local:  http://localhost:${port}`);
  console.log(`  Public: ${publicUrl}`);
  console.log('==========================================');
  console.log('');
  console.log('Now run ngrok in another terminal:');
  console.log(`  ngrok http ${port}`);
  console.log('');
  console.log('Then update PUBLIC_URL and restart, or');
  console.log('pass the ngrok URL as argument:');
  console.log(`  node start-public.js https://xxxx.ngrok-free.app`);
  console.log('');
}

main().catch(console.error);
