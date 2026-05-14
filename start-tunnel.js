import 'dotenv/config';
import { spawn } from 'child_process';
import { GameServer } from './server/index.js';
import { PokerBot } from './bot/index.js';

const PORT = 3003; // Fixed port to avoid conflicts
const CLOUDFLARED = 'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe';

function startCloudflared() {
  return new Promise((resolve, reject) => {
    console.log('[Tunnel] Starting Cloudflare Tunnel...');
    const proc = spawn(CLOUDFLARED, ['tunnel', '--url', `http://localhost:${PORT}`], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let resolved = false;

    function checkOutput(data) {
      const text = data.toString();
      process.stderr.write(text); // show cloudflared output

      const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (match && !resolved) {
        resolved = true;
        resolve({ url: match[0], proc });
      }
    }

    proc.stdout.on('data', checkOutput);
    proc.stderr.on('data', checkOutput);

    proc.on('error', (err) => {
      if (!resolved) reject(err);
    });

    // Timeout after 30s
    setTimeout(() => {
      if (!resolved) reject(new Error('Cloudflare tunnel timeout'));
    }, 30000);
  });
}

async function main() {
  try {
    // 1. Start Cloudflare tunnel
    const { url: publicUrl, proc: tunnelProc } = await startCloudflared();

    console.log('');
    console.log('==========================================');
    console.log(`  Tunnel URL: ${publicUrl}`);
    console.log('==========================================');
    console.log('');

    // 2. Set env
    process.env.FRONTEND_URL = publicUrl;
    process.env.BASE_URL = publicUrl;

    // 3. Start game server
    const server = new GameServer();
    await server.start(PORT);

    // 4. Start Discord bot
    const bot = new PokerBot();
    server.onBotNotify((event, data) => {
      if (event === 'gameRegistered') bot.postGameRegistered(data.gameId);
      else if (event === 'gameOver') bot.postGameResults(data);
    });
    await bot.start(process.env.BOT_TOKEN);

    console.log('');
    console.log('==========================================');
    console.log('  Discord Poker Bot is LIVE!');
    console.log(`  Public: ${publicUrl}`);
    console.log(`  Local:  http://localhost:${PORT}`);
    console.log('==========================================');
    console.log('  Press Ctrl+C to stop');
    console.log('');

    // Cleanup on exit
    process.on('SIGINT', () => {
      console.log('\n[Shutdown] Stopping...');
      tunnelProc.kill();
      process.exit(0);
    });

  } catch (err) {
    console.error('[Error]', err.message);
    process.exit(1);
  }
}

main();
