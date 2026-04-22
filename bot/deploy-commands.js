import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { data } from './commands/poker.js';

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

try {
  console.log('Registering slash commands...');
  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: [data.toJSON()] }
  );
  console.log('Slash commands registered successfully!');
} catch (error) {
  console.error('Error registering commands:', error);
}
