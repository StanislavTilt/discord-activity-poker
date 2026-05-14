import { ref } from 'vue';
import { DiscordSDK } from '@discord/embedded-app-sdk';

const CLIENT_ID = '977693958983532594';

const isDiscordActivity = ref(false);
const discordUser = ref(null);
const discordReady = ref(false);
const discordError = ref(null);

let discordSdk = null;
let initPromise = null;

export function useDiscordSDK() {
  async function init() {
    // Only init once
    if (initPromise) return initPromise;

    initPromise = (async () => {
      try {
        // Check if we're inside a Discord iframe
        if (typeof window === 'undefined') return false;

        // Try to create SDK — will fail if not in Discord iframe
        discordSdk = new DiscordSDK(CLIENT_ID);

        // Wait for SDK to be ready
        await discordSdk.ready();
        isDiscordActivity.value = true;
        console.log('[Discord SDK] Ready, channelId:', discordSdk.channelId);

        // Authorize — get OAuth2 code
        const { code } = await discordSdk.commands.authorize({
          client_id: CLIENT_ID,
          response_type: 'code',
          state: '',
          prompt: 'none',
          scope: ['identify', 'guilds']
        });

        console.log('[Discord SDK] Got auth code');

        // Exchange code for token via our backend
        const tokenRes = await fetch('/api/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });

        if (!tokenRes.ok) throw new Error('Token exchange failed');
        const { access_token } = await tokenRes.json();

        // Authenticate with Discord
        const auth = await discordSdk.commands.authenticate({ access_token });
        discordUser.value = auth.user;
        discordReady.value = true;

        console.log('[Discord SDK] Authenticated as:', auth.user.username);

        return true;
      } catch (e) {
        console.log('[Discord SDK] Not in Activity or error:', e.message);
        isDiscordActivity.value = false;
        discordError.value = e.message;
        return false;
      }
    })();

    return initPromise;
  }

  function getChannelId() {
    return discordSdk?.channelId || null;
  }

  function getGuildId() {
    return discordSdk?.guildId || null;
  }

  function getUserId() {
    return discordUser.value?.id || null;
  }

  function getUsername() {
    return discordUser.value?.username || null;
  }

  function getAvatarUrl() {
    if (!discordUser.value) return null;
    const u = discordUser.value;
    if (u.avatar) {
      return `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=128`;
    }
    return `https://cdn.discordapp.com/embed/avatars/${parseInt(u.discriminator || '0') % 5}.png`;
  }

  return {
    init,
    isDiscordActivity,
    discordUser,
    discordReady,
    discordError,
    getChannelId,
    getGuildId,
    getUserId,
    getUsername,
    getAvatarUrl,
    sdk: () => discordSdk
  };
}
