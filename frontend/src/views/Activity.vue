<template>
  <div class="activity-root">
    <AnimatedBackground :theme="currentBg" />

    <!-- Loading -->
    <div v-if="loading" class="activity-overlay">
      <div class="activity-loading">
        <div class="spinner-gold"></div>
        <p>{{ loadingText }}</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="activity-overlay">
      <div class="activity-error">
        <span class="error-icon">&#x26a0;&#xfe0f;</span>
        <p>{{ error }}</p>
        <button class="btn-retry" @click="retry">&#x1f504; Повторить</button>
      </div>
    </div>

    <!-- Game is active — show poker room -->
    <template v-else-if="inGame">
      <PokerTable v-if="gameState && gameState.players" :state="gameState" :cardSkin="currentSkin" :tableTheme="currentTable" :cardFace="currentFace" />

      <Transition name="result-pop">
        <div v-if="myHandName" class="hand-result">{{ myHandName }}</div>
      </Transition>

      <ComboTable :currentCombo="myHandNameEn" :comboCards="myComboCards" />
      <SettingsPanel @changeBg="currentBg = $event" @changeSkin="currentSkin = $event" @changeTable="currentTable = $event" @changeFace="currentFace = $event" />

      <ActionBar
        v-if="gameState && gameState.availableActions"
        :actions="gameState.availableActions"
        :callAmount="gameState.callAmount || 0"
        :minRaise="gameState.minRaise || gameState.bigBlind || 20"
        :maxRaise="myPlayer ? myPlayer.chips : 0"
        :pot="gameState.pot || 0"
        :bigBlind="gameState.bigBlind || 20"
        :myChips="myPlayer ? myPlayer.chips : 0"
        @action="onAction"
      />

      <!-- Blinds change overlay -->
      <Transition name="blinds-fire">
        <div v-if="showBlindsAlert" class="blinds-overlay">
          <div class="blinds-content">
            <div class="blinds-icon">&#x1f525;</div>
            <div class="blinds-title">БЛАЙНДЫ ПОВЫШЕНЫ</div>
            <div class="blinds-values">
              <span class="blinds-old">{{ blindsAlertData.oldSmallBlind }}/{{ blindsAlertData.oldBigBlind }}</span>
              <span class="blinds-arrow">&#x2192;</span>
              <span class="blinds-new">{{ blindsAlertData.newSmallBlind }}/{{ blindsAlertData.newBigBlind }}</span>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Game over -->
      <Transition name="overlay-fade">
        <div v-if="showGameOver" class="overlay game-over-overlay">
          <div class="confetti-container">
            <div v-for="i in 60" :key="i" class="confetti" :style="confettiStyle(i)"></div>
          </div>
          <div class="winner-showcase">
            <div class="winner-trophy">&#x1f3c6;</div>
            <div class="winner-label">ПОБЕДИТЕЛЬ</div>
            <div class="winner-name">{{ gameOverWinner?.username }}</div>
          </div>
        </div>
      </Transition>
    </template>

    <!-- Lobby — waiting for game or no game yet -->
    <div v-else class="activity-lobby">
      <h1 class="lobby-title">&#x1f0cf; MOON Poker</h1>
      <p class="lobby-user" v-if="username">Добро пожаловать, <strong>{{ username }}</strong></p>
      <p class="lobby-status">{{ lobbyText }}</p>
      <div class="lobby-dots"><span></span><span></span><span></span></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useDiscordSDK } from '../composables/useDiscordSDK.js';
import { useWebSocket } from '../composables/useWebSocket.js';
import { useSounds } from '../composables/useSounds.js';
import PokerTable from '../components/PokerTable.vue';
import ActionBar from '../components/ActionBar.vue';
import ComboTable from '../components/ComboTable.vue';
import SettingsPanel from '../components/SettingsPanel.vue';
import AnimatedBackground from '../components/AnimatedBackground.vue';

const discord = useDiscordSDK();
const sounds = useSounds();

const loading = ref(true);
const loadingText = ref('Подключение к Discord...');
const error = ref(null);
const inGame = ref(false);
const username = ref(null);
const lobbyText = ref('Ожидание...');

const currentBg = ref('particles');
const currentSkin = ref('classic');
const currentTable = ref('classic');
const currentFace = ref('classic');

// Game state
const gameState = ref(null);
const showGameOver = ref(false);
const gameOverWinner = ref(null);
const showBlindsAlert = ref(false);
const blindsAlertData = ref({});

let wsConnection = null;

const handNamesRu = {
  'Royal Flush': 'Рояль-флеш', 'Straight Flush': 'Стрит-флеш',
  'Four of a Kind': 'Каре', 'Full House': 'Фулл-хаус',
  'Flush': 'Флеш', 'Straight': 'Стрит',
  'Three of a Kind': 'Тройка', 'Two Pair': 'Две пары',
  'One Pair': 'Пара', 'High Card': 'Старшая карта'
};

const myPlayer = computed(() => {
  if (!gameState.value || gameState.value.myIndex == null) return null;
  return gameState.value.players[gameState.value.myIndex];
});

const myHandNameEn = computed(() => {
  if (myPlayer.value?.handResult?.rankName) return myPlayer.value.handResult.rankName;
  if (gameState.value?.myHandResult?.rankName) return gameState.value.myHandResult.rankName;
  return null;
});

const myHandName = computed(() => myHandNameEn.value ? (handNamesRu[myHandNameEn.value] || myHandNameEn.value) : null);

const myComboCards = computed(() => {
  if (myPlayer.value?.handResult?.cards) return myPlayer.value.handResult.cards;
  if (gameState.value?.myHandResult?.cards) return gameState.value.myHandResult.cards;
  return [];
});

function onAction(action, amount) {
  switch (action) {
    case 'fold': sounds.playFold(); break;
    case 'check': sounds.playCheck(); break;
    case 'call': sounds.playChips(); break;
    case 'raise': sounds.playChipStack(); break;
    case 'allin': sounds.playAllIn(); break;
  }
  if (wsConnection) wsConnection.sendAction(action, amount);
}

function confettiStyle(i) {
  const colors = ['#d4af37', '#f5e6a3', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6'];
  return {
    left: Math.random() * 100 + '%',
    width: (6 + Math.random() * 8) + 'px',
    height: (6 + Math.random() * 8) * (Math.random() > 0.5 ? 0.4 : 0.8) + 'px',
    backgroundColor: colors[i % colors.length],
    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
    animationDelay: Math.random() * 3 + 's',
    animationDuration: (2.5 + Math.random() * 3) + 's'
  };
}

async function retry() {
  error.value = null;
  loading.value = true;
  await initActivity();
}

async function initActivity() {
  try {
    loadingText.value = 'Подключение к Discord...';
    const ok = await discord.init();

    if (!ok) {
      error.value = 'Не удалось подключиться к Discord SDK';
      loading.value = false;
      return;
    }

    username.value = discord.getUsername();
    loadingText.value = `Привет, ${username.value}! Подключение к игре...`;

    // Connect to game via WebSocket using Discord user info
    const userId = discord.getUserId();
    const channelId = discord.getChannelId();

    // Create a special activity token
    const tokenRes = await fetch('/api/game/activity-join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        discordId: userId,
        username: username.value,
        avatarUrl: discord.getAvatarUrl(),
        channelId
      })
    });

    if (!tokenRes.ok) {
      const d = await tokenRes.json().catch(() => ({}));
      lobbyText.value = d.error || 'Нет активной игры в этом канале';
      loading.value = false;
      return;
    }

    const { token, gameId } = await tokenRes.json();

    // Connect WebSocket
    const ws = useWebSocket(gameId, token);
    wsConnection = ws;

    // Watch game state
    watch(ws.gameState, (state) => {
      if (state) {
        gameState.value = state;
        if (!inGame.value && state.phase !== 'waiting') {
          inGame.value = true;
        }
        if (state.phase === 'waiting') {
          lobbyText.value = 'Ожидание запуска игры...';
        }
      }
    });

    watch(ws.lastEvent, (evt) => {
      if (!evt) return;
      if (evt.type === 'handEnd') { sounds.playWin(); }
      else if (evt.type === 'gameOver') {
        sounds.playWin();
        gameOverWinner.value = evt.data.winner;
        showGameOver.value = true;
      } else if (evt.type === 'blindsChanged') {
        sounds.playBlindsChange();
        blindsAlertData.value = evt.data;
        showBlindsAlert.value = true;
        setTimeout(() => showBlindsAlert.value = false, 4000);
      }
    });

    watch(ws.connected, (c) => {
      if (c) {
        loading.value = false;
        if (!inGame.value) lobbyText.value = 'Подключено! Ожидание начала игры...';
      }
    });

    // Sound on phase change
    watch(() => gameState.value?.phase, (phase, old) => {
      if (!phase || phase === old) return;
      if (phase === 'preflop') { sounds.playCardDeal(); setTimeout(() => sounds.playCardDeal(), 150); }
      else if (['flop', 'turn', 'river'].includes(phase)) sounds.playCardFlip();
      if (phase !== 'waiting') inGame.value = true;
    });

    watch(() => gameState.value?.availableActions, (a, old) => {
      if (a && a.length > 0 && (!old || old.length === 0)) sounds.playYourTurn();
    });

  } catch (e) {
    error.value = e.message;
    loading.value = false;
  }
}

onMounted(initActivity);
</script>

<style scoped>
.activity-root {
  height: 100vh; width: 100vw;
  position: fixed; top: 0; left: 0;
  overflow: hidden; background: #06060a;
  display: flex; align-items: center; justify-content: center;
}

.activity-overlay {
  position: fixed; inset: 0;
  display: flex; align-items: center; justify-content: center;
  z-index: 200; background: rgba(6,6,10,0.95);
}

.activity-loading, .activity-error {
  display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center;
}

.activity-loading p { color: #8b8baf; font-size: 0.9rem; }
.activity-error p { color: #fca5a5; font-size: 0.9rem; }
.error-icon { font-size: 2rem; }

.spinner-gold {
  width: 40px; height: 40px;
  border: 3px solid rgba(212,175,55,0.15); border-top-color: #d4af37;
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.btn-retry {
  padding: 8px 20px; background: rgba(212,175,55,0.15);
  border: 1px solid rgba(212,175,55,0.3); color: #d4af37;
  border-radius: 8px; cursor: pointer; font-family: inherit; font-size: 0.85rem;
}

.activity-lobby {
  display: flex; flex-direction: column; align-items: center; gap: 12px; z-index: 1;
}

.lobby-title {
  font-size: 2.5rem; font-weight: 900;
  background: linear-gradient(135deg, #d4af37, #f5e6a3, #d4af37);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}

.lobby-user { color: #8b8baf; font-size: 0.9rem; }
.lobby-user strong { color: #d4af37; }
.lobby-status { color: #5a5a7a; font-size: 0.85rem; }

.lobby-dots { display: flex; gap: 8px; }
.lobby-dots span {
  width: 8px; height: 8px; background: #d4af37; border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}
.lobby-dots span:nth-child(1) { animation-delay: -0.32s; }
.lobby-dots span:nth-child(2) { animation-delay: -0.16s; }
@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
  40% { transform: scale(1); opacity: 1; }
}

/* Game elements */
.hand-result {
  position: fixed; bottom: 70px; left: 50%; transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(212,175,55,0.15), rgba(180,140,30,0.1));
  border: 1px solid rgba(212,175,55,0.4); color: #f5e6a3;
  padding: 5px 16px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; z-index: 90;
}

.overlay { position: fixed; inset: 0; z-index: 200; display: flex; align-items: center; justify-content: center; }
.game-over-overlay { background: rgba(6,6,10,0.95) !important; z-index: 300 !important; }
.confetti-container { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.confetti { position: absolute; top: -20px; animation: confetti-fall linear infinite; opacity: 0; }
@keyframes confetti-fall {
  0% { transform: translateY(0) rotate(0); opacity: 0; }
  5% { opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}

.winner-showcase { display: flex; flex-direction: column; align-items: center; gap: 10px; z-index: 2; }
.winner-trophy { font-size: 3.5rem; animation: trophy-bounce 1s ease; }
@keyframes trophy-bounce { 0% { transform: scale(0); } 60% { transform: scale(1.2); } 100% { transform: scale(1); } }
.winner-label { font-size: 0.8rem; letter-spacing: 5px; color: #d4af37; font-weight: 700; }
.winner-name {
  font-size: 1.8rem; font-weight: 800;
  background: linear-gradient(135deg, #d4af37, #f5e6a3); -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}

.blinds-overlay { position: fixed; inset: 0; z-index: 250; display: flex; align-items: center; justify-content: center; background: rgba(10,2,0,0.85); }
.blinds-content { display: flex; flex-direction: column; align-items: center; gap: 10px; z-index: 2; }
.blinds-icon { font-size: 3rem; }
.blinds-title { font-size: 1.3rem; font-weight: 800; color: #ff9500; letter-spacing: 3px; }
.blinds-values { display: flex; align-items: center; gap: 10px; font-size: 1rem; font-weight: 700; }
.blinds-old { color: #8b8baf; text-decoration: line-through; }
.blinds-arrow { color: #ff6a00; }
.blinds-new { color: #ffcc00; font-size: 1.3rem; }

/* Transitions */
.overlay-fade-enter-active { transition: opacity 0.4s; }
.overlay-fade-leave-active { transition: opacity 0.3s; }
.overlay-fade-enter-from, .overlay-fade-leave-to { opacity: 0; }
.result-pop-enter-active { animation: pop 0.4s cubic-bezier(0.34,1.56,0.64,1); }
.result-pop-leave-active { animation: pop 0.2s ease reverse; }
@keyframes pop { from { opacity: 0; transform: translateX(-50%) scale(0.5); } to { opacity: 1; transform: translateX(-50%) scale(1); } }
.blinds-fire-enter-active { animation: bfi 0.5s ease; }
.blinds-fire-leave-active { animation: bfi 0.8s ease reverse; }
@keyframes bfi { from { opacity: 0; } to { opacity: 1; } }

/* ===== MOBILE — Discord Activity iframe ===== */
@media (max-width: 768px) {
  .hand-result { bottom: 60px; font-size: 0.7rem; padding: 4px 12px; }
  .lobby-title { font-size: 1.8rem; }
  .lobby-user { font-size: 0.8rem; }
  .winner-trophy { font-size: 2.5rem; }
  .winner-name { font-size: 1.3rem; }
  .winner-label { font-size: 0.65rem; letter-spacing: 3px; }
  .blinds-icon { font-size: 2rem; }
  .blinds-title { font-size: 1rem; letter-spacing: 2px; }
  .blinds-values { font-size: 0.85rem; }
  .blinds-new { font-size: 1rem; }
}

@media (max-width: 430px) {
  .hand-result { bottom: 52px; font-size: 0.6rem; padding: 3px 10px; }
  .lobby-title { font-size: 1.4rem; }
  .winner-trophy { font-size: 2rem; }
  .winner-name { font-size: 1rem; }
  .blinds-icon { font-size: 1.5rem; }
  .blinds-title { font-size: 0.8rem; }
}

/* Landscape in Activity */
@media (max-height: 500px) and (orientation: landscape) {
  .hand-result { bottom: 45px; font-size: 0.6rem; }
  .lobby-title { font-size: 1.5rem; }
  .winner-trophy { font-size: 2rem; }
  .winner-name { font-size: 1.2rem; }
  .blinds-icon { font-size: 1.5rem; }
  .blinds-title { font-size: 0.8rem; letter-spacing: 2px; }
}
</style>
