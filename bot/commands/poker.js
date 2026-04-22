import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('poker')
  .setDescription('\u041a\u043e\u043c\u0430\u043d\u0434\u044b \u043f\u043e\u043a\u0435\u0440\u043d\u043e\u0439 \u0438\u0433\u0440\u044b')
  .addSubcommand(sub =>
    sub.setName('create')
      .setDescription('\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u043d\u043e\u0432\u0443\u044e \u043f\u043e\u043a\u0435\u0440\u043d\u0443\u044e \u043a\u043e\u043c\u043d\u0430\u0442\u0443')
  );

export const name = 'poker';
