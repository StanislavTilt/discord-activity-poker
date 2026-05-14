import 'dotenv/config';
import { GameServer } from './server/index.js';
import { PokerBot } from './bot/index.js';

async function main() {
  const port = parseInt(process.env.PORT) || 3000;

  // Start the game server
  const server = new GameServer();
  await server.start(port);

  // Start the Discord bot
  const bot = new PokerBot();

  // Wire up bot notifications from server
  server.onBotNotify((event, data) => {
    if (event === 'gameRegistered') {
      bot.postGameRegistered(data.gameId);
    } else if (event === 'gameOver') {
      bot.postGameResults(data);
    }
  });

  await bot.start(process.env.BOT_TOKEN);

  console.log('');
  console.log('=================================');
  console.log('  Discord Poker Bot is running!');
  console.log(`  Server: http://localhost:${port}`);
  console.log(`  Frontend: ${process.env.FRONTEND_URL}`);
  console.log('=================================');
  console.log('');
}

main().catch(console.error);
