import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import * as db from '../server/db.js';

export class PokerBot {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
      ]
    });

    this.setupEvents();
  }

  setupEvents() {
    this.client.on('ready', () => {
      console.log(`[Bot] Logged in as ${this.client.user.tag}`);
    });

    this.client.on('interactionCreate', async (interaction) => {
      if (interaction.isChatInputCommand()) {
        await this.handleCommand(interaction);
      } else if (interaction.isButton()) {
        await this.handleButton(interaction);
      }
    });
  }

  async handleCommand(interaction) {
    if (interaction.commandName !== 'poker') return;
    const sub = interaction.options.getSubcommand();

    if (sub === 'create') {
      await this.handleCreate(interaction);
    }
  }

  async handleCreate(interaction) {
    const member = interaction.member;

    const allowedRoleIds = (process.env.ALLOWED_ROLE_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
    const allowedUserIds = (process.env.ALLOWED_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);

    const hasAllowedRole = allowedRoleIds.length > 0 && member.roles.cache.some(r => allowedRoleIds.includes(r.id));
    const isAllowedUser = allowedUserIds.includes(interaction.user.id);
    const isAdmin = member.permissions.has('Administrator');

    if (!hasAllowedRole && !isAllowedUser && !isAdmin) {
      await interaction.reply({
        content: '\u274c У вас нет прав для создания покерных игр.',
        ephemeral: true
      });
      return;
    }

    const gameId = uuidv4().substring(0, 8);
    const adminToken = jwt.sign(
      { discordId: interaction.user.id, gameId, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    db.createGame(gameId, interaction.user.id, interaction.user.username, interaction.channelId);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const adminUrl = `${frontendUrl}/admin/${gameId}?token=${adminToken}`;

    const embed = new EmbedBuilder()
      .setTitle('\ud83c\udccf Покерная комната создана')
      .setDescription('Используйте админ-панель для настройки и регистрации игры.')
      .setColor(0xd4af37)
      .addFields(
        { name: '\ud83c\udfae ID игры', value: `\`${gameId}\``, inline: true },
        { name: '\ud83d\udc51 Админ', value: interaction.user.username, inline: true }
      );

    await interaction.reply({
      content: `\u2728 **Админ-панель:** ${adminUrl}`,
      embeds: [embed],
      ephemeral: true
    });
  }

  async handleButton(interaction) {
    if (!interaction.customId.startsWith('join_poker_')) return;

    const gameId = interaction.customId.replace('join_poker_', '');
    const game = db.getGame(gameId);

    if (!game) {
      await interaction.reply({ content: '\u274c Игра не найдена.', ephemeral: true });
      return;
    }

    if (game.status === 'playing') {
      await interaction.reply({ content: '\u26a0\ufe0f Игра уже началась.', ephemeral: true });
      return;
    }

    const players = db.getGamePlayers(gameId);
    if (players.length >= game.max_players) {
      await interaction.reply({ content: '\ud83d\udeab Все места заняты.', ephemeral: true });
      return;
    }

    const avatarUrl = interaction.user.displayAvatarURL({ size: 128 });
    const player = db.addPlayer(gameId, interaction.user.id, interaction.user.username, avatarUrl);

    if (!player) {
      await interaction.reply({ content: '\u274c Не удалось присоединиться к игре.', ephemeral: true });
      return;
    }

    // Send Activity invite instead of a link
    try {
      await interaction.reply({
        content: `\u2705 Вы присоединились к игре! Запускаю покерную комнату...`,
        ephemeral: true
      });

      // Create Activity in the channel
      const channel = await this.client.channels.fetch(game.channel_id);
      if (channel && channel.isVoiceBased && channel.isVoiceBased()) {
        // Voice channel — can launch activity directly
        // Activity is launched via the embedded app, users join via voice channel
      }

      // Send an activity invite message in the channel
      // Use the application's activity URL
      const clientId = process.env.CLIENT_ID;
      const activityLink = `https://discord.com/activities/${clientId}`;

      await interaction.followUp({
        content: `\ud83c\udccf **${interaction.user.username}** присоединился к покеру!\n\n**Запустить покер:** ${activityLink}`,
        ephemeral: true
      });
    } catch (e) {
      // Fallback to link if Activity fails
      const playerToken = jwt.sign(
        { discordId: interaction.user.id, gameId, role: 'player' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const roomUrl = `${frontendUrl}/room/${gameId}#${playerToken}`;
      await interaction.followUp({
        content: `\ud83c\udccf **Покерная комната:** ${roomUrl}`,
        ephemeral: true
      });
    }

    // Обновить сообщение со счётчиком игроков
    try {
      const channel = await this.client.channels.fetch(game.channel_id);
      if (channel && game.message_id) {
        const message = await channel.messages.fetch(game.message_id);
        const updatedPlayers = db.getGamePlayers(gameId);
        const playerList = updatedPlayers.map(p => `\u2022 ${p.username}`).join('\n') || '\u2014';

        const embed = EmbedBuilder.from(message.embeds[0])
          .spliceFields(2, 1, {
            name: `\ud83d\udc65 Игроки (${updatedPlayers.length}/${game.max_players})`,
            value: playerList
          });

        await message.edit({ embeds: [embed] });
      }
    } catch (e) {
      console.error('[Bot] Error updating message:', e.message);
    }
  }

  async postGameRegistered(gameId) {
    const game = db.getGame(gameId);
    if (!game) return;

    try {
      const channel = await this.client.channels.fetch(game.channel_id);
      if (!channel) return;

      const embed = new EmbedBuilder()
        .setTitle('\ud83c\udccf Texas Hold\u2019em Poker')
        .setDescription(`**${game.admin_username}** создал покерную игру!\n\nНажмите кнопку ниже, чтобы занять место за столом.`)
        .setColor(0xd4af37)
        .addFields(
          { name: '\ud83d\udcb0 Блайнды', value: `${game.small_blind} / ${game.big_blind}`, inline: true },
          { name: '\ud83c\udfe6 Начальный стек', value: `${game.starting_stack}`, inline: true },
          { name: `\ud83d\udc65 Игроки (0/${game.max_players})`, value: '\u2014' },
          { name: '\u23f1\ufe0f Время на ход', value: `${game.round_time} сек`, inline: true }
        )
        .setFooter({ text: `ID игры: ${gameId}` })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`join_poker_${gameId}`)
          .setLabel('\ud83c\udccf Участвовать')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setLabel('\ud83c\udfae Открыть покер')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/activities/${process.env.CLIENT_ID}`)
      );

      const msg = await channel.send({ embeds: [embed], components: [row] });
      db.setGameMessage(gameId, msg.id);
    } catch (e) {
      console.error('[Bot] Error posting game:', e.message);
    }
  }

  async postGameResults(data) {
    const { gameId, winner, standings, gameDuration, totalHands } = data;
    console.log(`[Bot] postGameResults called for game ${gameId}, winner: ${winner?.username}`);

    const game = db.getGame(gameId);
    if (!game) {
      console.log('[Bot] Game not found in DB:', gameId);
      return;
    }

    try {
      const channel = await this.client.channels.fetch(game.channel_id);
      if (!channel) {
        console.log('[Bot] Channel not found:', game.channel_id);
        return;
      }

      const duration = this.formatDuration(gameDuration || 0);
      const medals = ['🥇', '🥈', '🥉'];

      let standingsText = '';
      if (standings && standings.length > 0) {
        for (const s of standings) {
          const medal = medals[s.place - 1] || `**${s.place}.**`;
          const handInfo = s.eliminatedAtHand ? ` *(вылет #${s.eliminatedAtHand})*` : '';
          const chipsInfo = s.chips ? ` — **${s.chips}** фишек` : '';
          standingsText += `${medal} **${s.username}**${chipsInfo}${handInfo}\n`;
        }
      } else {
        standingsText = `🥇 **${winner?.username || 'Неизвестно'}**`;
      }

      const embed = new EmbedBuilder()
        .setTitle('🏆 Игра завершена!')
        .setDescription(`Победитель — **${winner?.username || 'Неизвестно'}**!`)
        .setColor(0xd4af37)
        .addFields(
          { name: '📊 Результаты', value: standingsText },
          { name: '⏱️ Время игры', value: String(duration), inline: true },
          { name: '🃏 Раздач сыграно', value: String(totalHands || 0), inline: true },
          { name: '💰 Начальный стек', value: String(game.starting_stack), inline: true },
          { name: '🎰 Блайнды', value: `${game.small_blind}/${game.big_blind}`, inline: true }
        )
        .setFooter({ text: `ID игры: ${gameId}` })
        .setTimestamp();

      // Установить аватарку победителя если есть
      if (winner?.avatarUrl) {
        embed.setThumbnail(winner.avatarUrl);
      }

      // Удалить старые сообщения бота (кнопка + activity invite)
      try {
        const messages = await channel.messages.fetch({ limit: 20 });
        const botMessages = messages.filter(m =>
          m.author.id === this.client.user.id &&
          (m.id === game.message_id || m.activity || m.embeds.length === 0 || m.components.length > 0)
        );
        for (const [, msg] of botMessages) {
          try { await msg.delete(); } catch {}
        }
      } catch (e) {
        console.log('[Bot] Could not clean up messages:', e.message);
      }

      await channel.send({ embeds: [embed] });
      console.log('[Bot] Results posted successfully');
    } catch (e) {
      console.error('[Bot] Error posting results:', e.message);
    }
  }

  formatDuration(ms) {
    if (!ms || ms <= 0) return '< 1 мин';
    const totalSec = Math.floor(ms / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours} ч`);
    if (minutes > 0) parts.push(`${minutes} мин`);
    if (seconds > 0 && hours === 0) parts.push(`${seconds} сек`);
    return parts.join(' ') || '< 1 сек';
  }

  async start(token) {
    await this.client.login(token);
  }
}
