<template>
  <div class="poker-room">
    <AnimatedBackground :theme="currentBg" />

    <!-- Подключение -->
    <Transition name="overlay-fade">
      <div v-if="!connected" class="overlay">
        <div class="overlay-content">
          <div class="spinner-gold"></div>
          <p>Подключение к игре...</p>
        </div>
      </div>
    </Transition>

    <!-- Ошибка -->
    <Transition name="toast-slide">
      <div v-if="error" class="toast error-toast">{{ error }}</div>
    </Transition>

    <!-- Ожидание запуска -->
    <Transition name="overlay-fade">
      <div v-if="gameState && gameState.phase === 'waiting'" class="overlay">
        <div class="overlay-content">
          <div class="waiting-logo">🃏</div>
          <h2>Ожидание запуска</h2>
          <p>Хост запустит игру из админ-панели.</p>
          <div class="waiting-dots"><span></span><span></span><span></span></div>
        </div>
      </div>
    </Transition>

    <!-- Конец игры — полноэкранный победитель + конфетти -->
    <Transition name="overlay-fade">
      <div v-if="showGameOver" class="overlay game-over-overlay">
        <!-- Конфетти -->
        <div class="confetti-container">
          <div v-for="i in 80" :key="i" class="confetti" :style="confettiStyle(i)"></div>
        </div>

        <div class="winner-showcase">
          <div class="winner-glow"></div>
          <div class="winner-trophy">🏆</div>
          <div class="winner-label">ПОБЕДИТЕЛЬ</div>
          <img v-if="gameOverWinner?.avatarUrl" :src="gameOverWinner.avatarUrl" class="winner-avatar" />
          <div class="winner-name">{{ gameOverWinner?.username }}</div>
          <div class="winner-chips">{{ gameOverWinner?.chips }} фишек</div>

          <!-- Статистика -->
          <div class="game-stats">
            <div class="stat">
              <span class="stat-icon">⏱️</span>
              <span class="stat-value">{{ formatDuration(gameOverDuration) }}</span>
            </div>
            <div class="stat">
              <span class="stat-icon">🃏</span>
              <span class="stat-value">{{ gameOverHands }} раздач</span>
            </div>
          </div>

          <!-- Таблица мест -->
          <div class="final-standings">
            <div
              v-for="s in (gameOverStandings.length > 0 ? gameOverStandings : sortedPlayers.map((p, i) => ({ ...p, place: i + 1 })))"
              :key="s.discordId"
              class="standing-row"
              :class="{ 'is-winner': s.place === 1 }"
            >
              <span class="standing-medal">{{ ['🥇','🥈','🥉'][s.place - 1] || s.place + '.' }}</span>
              <span class="standing-name">{{ s.username }}</span>
              <span class="standing-detail" v-if="s.chips">{{ s.chips }}</span>
              <span class="standing-detail elim" v-else-if="s.eliminatedAtHand">раздача #{{ s.eliminatedAtHand }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Смена блайндов — огненное оповещение -->
    <Transition name="blinds-fire">
      <div v-if="showBlindsAlert" class="blinds-overlay">
        <div class="blinds-fire-bg">
          <div v-for="i in 40" :key="i" class="fire-particle" :style="fireParticle(i)"></div>
        </div>
        <div class="blinds-fire-glow"></div>
        <div class="blinds-content">
          <div class="blinds-icon">🔥</div>
          <div class="blinds-title">БЛАЙНДЫ ПОВЫШЕНЫ</div>
          <div class="blinds-values">
            <span class="blinds-old">{{ blindsAlertData.oldSmallBlind }}/{{ blindsAlertData.oldBigBlind }}</span>
            <span class="blinds-arrow">→</span>
            <span class="blinds-new">{{ blindsAlertData.newSmallBlind }}/{{ blindsAlertData.newBigBlind }}</span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Настройки (лево верх) -->
    <SettingsPanel @changeBg="onChangeBg" @changeSkin="onChangeSkin" @changeTable="onChangeTable" @changeFace="onChangeFace" />

    <!-- Стол -->
    <PokerTable v-if="gameState && gameState.players" :state="gameState" :cardSkin="currentSkin" :tableTheme="currentTable" :cardFace="currentFace" />

    <!-- Комбинация текст — под столом -->
    <Transition name="result-pop">
      <div v-if="myHandName" class="hand-result">{{ myHandName }}</div>
    </Transition>

    <!-- Таблица комбинаций (справа) -->
    <ComboTable
      :currentCombo="myHandName ? myHandNameEn : null"
      :comboCards="myComboCards"
    />

    <!-- Кнопки действий -->
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

    <!-- Лог -->
    <!-- Лог скрыт для игроков -->
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useWebSocket } from '../composables/useWebSocket.js';
import PokerTable from '../components/PokerTable.vue';
import ActionBar from '../components/ActionBar.vue';
import ChatLog from '../components/ChatLog.vue';
import Card from '../components/Card.vue';
import ComboTable from '../components/ComboTable.vue';
import SettingsPanel from '../components/SettingsPanel.vue';
import AnimatedBackground from '../components/AnimatedBackground.vue';
import { useSounds } from '../composables/useSounds.js';

const props = defineProps({ gameId: String });
const sounds = useSounds();
const token = window.location.hash.substring(1);
const { gameState, connected, error, lastEvent, sendAction } = useWebSocket(props.gameId, token);

const logMessages = ref([]);
const currentBg = ref('particles');
const currentSkin = ref('classic');
const currentTable = ref('classic');
const currentFace = ref('classic');

const myPlayer = computed(() => {
  if (!gameState.value || gameState.value.myIndex == null) return null;
  return gameState.value.players[gameState.value.myIndex];
});

const handNamesRu = {
  'Royal Flush': 'Рояль-флеш',
  'Straight Flush': 'Стрит-флеш',
  'Four of a Kind': 'Каре',
  'Full House': 'Фулл-хаус',
  'Flush': 'Флеш',
  'Straight': 'Стрит',
  'Three of a Kind': 'Тройка',
  'Two Pair': 'Две пары',
  'One Pair': 'Пара',
  'High Card': 'Старшая карта'
};

// English name for matching combo table keys
const myHandNameEn = computed(() => {
  // Showdown result first
  if (myPlayer.value?.handResult?.rankName) return myPlayer.value.handResult.rankName;
  // Live combo from server
  if (gameState.value?.myHandResult?.rankName) return gameState.value.myHandResult.rankName;
  return null;
});

const myHandName = computed(() => {
  const en = myHandNameEn.value;
  return en ? (handNamesRu[en] || en) : null;
});

const myComboCards = computed(() => {
  if (myPlayer.value?.handResult?.cards) return myPlayer.value.handResult.cards;
  if (gameState.value?.myHandResult?.cards) return gameState.value.myHandResult.cards;
  return [];
});

const sortedPlayers = computed(() => {
  if (!gameState.value?.players) return [];
  return [...gameState.value.players].sort((a, b) => b.chips - a.chips);
});

// Game over state
const showGameOver = ref(false);
const gameOverWinner = ref(null);
const gameOverStandings = ref([]);
const gameOverDuration = ref(0);
const gameOverHands = ref(0);

// Blinds change alert
const showBlindsAlert = ref(false);
const blindsAlertData = ref({ oldSmallBlind: 0, oldBigBlind: 0, newSmallBlind: 0, newBigBlind: 0 });

function onAction(action, amount) {
  // Play sound based on action
  switch (action) {
    case 'fold': sounds.playFold(); break;
    case 'check': sounds.playCheck(); break;
    case 'call': sounds.playChips(); break;
    case 'raise': sounds.playChipStack(); break;
    case 'allin': sounds.playAllIn(); break;
  }
  sendAction(action, amount);
}

function fireParticle(i) {
  const x = 10 + Math.random() * 80;
  const delay = Math.random() * 2;
  const dur = 1 + Math.random() * 2;
  const size = 4 + Math.random() * 10;
  const colors = ['#ff4500', '#ff6a00', '#ff9500', '#ffcc00', '#ffe066'];
  return {
    left: x + '%',
    bottom: '-10px',
    width: size + 'px',
    height: size + 'px',
    backgroundColor: colors[Math.floor(Math.random() * colors.length)],
    animationDelay: delay + 's',
    animationDuration: dur + 's'
  };
}

function showBlindsChangeAlert(data) {
  blindsAlertData.value = data;
  showBlindsAlert.value = true;
  setTimeout(() => { showBlindsAlert.value = false; }, 4000);
}

function formatDuration(ms) {
  if (!ms || ms <= 0) return '< 1 мин';
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const parts = [];
  if (h > 0) parts.push(`${h} ч`);
  if (m > 0) parts.push(`${m} мин`);
  if (s > 0 && h === 0) parts.push(`${s} сек`);
  return parts.join(' ') || '< 1 сек';
}
function onChangeBg(id) { currentBg.value = id; }
function onChangeSkin(id) { currentSkin.value = id; }
function onChangeTable(id) { currentTable.value = id; }
function onChangeFace(id) { currentFace.value = id; }

// Confetti generator
const confettiColors = ['#d4af37', '#f5e6a3', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#e67e22', '#1abc9c'];
function confettiStyle(i) {
  const color = confettiColors[i % confettiColors.length];
  const left = Math.random() * 100;
  const delay = Math.random() * 3;
  const dur = 2.5 + Math.random() * 3;
  const size = 6 + Math.random() * 8;
  const rotation = Math.random() * 360;
  const isCircle = Math.random() > 0.5;
  return {
    left: left + '%',
    width: (isCircle ? size * 0.8 : size) + 'px',
    height: (isCircle ? size * 0.8 : size * 0.4) + 'px',
    backgroundColor: color,
    borderRadius: isCircle ? '50%' : '2px',
    animationDelay: delay + 's',
    animationDuration: dur + 's',
    '--rotation': rotation + 'deg'
  };
}

watch(lastEvent, (evt) => {
  if (!evt) return;
  if (evt.type === 'handEnd') {
    sounds.playWin();
    sounds.playChipStack();
    for (const w of evt.data.winners) {
      logMessages.value.push({
        type: 'winner',
        text: `🏆 ${w.username} выигрывает ${evt.data.pot} — ${handNamesRu[w.handResult?.rankName] || 'лучшая рука'}`
      });
    }
  } else if (evt.type === 'gameOver') {
    sounds.playWin();
    logMessages.value.push({ type: 'info', text: '🎮 Игра окончена!' });
    gameOverWinner.value = evt.data.winner || null;
    gameOverStandings.value = evt.data.standings || [];
    gameOverDuration.value = evt.data.gameDuration || 0;
    gameOverHands.value = evt.data.totalHands || 0;
    if (!gameOverWinner.value && evt.data.players) {
      const sorted = [...evt.data.players].sort((a, b) => b.chips - a.chips);
      if (sorted.length > 0) gameOverWinner.value = sorted[0];
    }
    showGameOver.value = true;
  } else if (evt.type === 'playerEliminated') {
    logMessages.value.push({
      type: 'info',
      text: `💀 ${evt.data.username} выбывает на раздаче #${evt.data.hand} (осталось ${evt.data.remaining})`
    });
  } else if (evt.type === 'blindsChanged') {
    sounds.playBlindsChange();
    showBlindsChangeAlert(evt.data);
    logMessages.value.push({
      type: 'phase',
      text: `🔥 Блайнды: ${evt.data.oldSmallBlind}/${evt.data.oldBigBlind} → ${evt.data.newSmallBlind}/${evt.data.newBigBlind}`
    });
  }
});

watch(() => gameState.value?.phase, (phase, old) => {
  if (phase && phase !== old && phase !== 'waiting') {
    const labels = { preflop: 'Пре-флоп', flop: 'Флоп', turn: 'Тёрн', river: 'Ривер', showdown: 'Вскрытие' };
    if (labels[phase]) logMessages.value.push({ type: 'phase', text: `—— ${labels[phase]} ——` });

    // Sound for phase change
    if (phase === 'preflop') {
      // Deal cards — multiple card sounds
      sounds.playCardDeal();
      setTimeout(() => sounds.playCardDeal(), 150);
      setTimeout(() => sounds.playCardDeal(), 300);
      setTimeout(() => sounds.playCardDeal(), 450);
    } else if (phase === 'flop') {
      sounds.playCardFlip();
      setTimeout(() => sounds.playCardFlip(), 100);
      setTimeout(() => sounds.playCardFlip(), 200);
    } else if (phase === 'turn' || phase === 'river') {
      sounds.playCardFlip();
    } else if (phase === 'showdown') {
      sounds.playCardFlip();
      setTimeout(() => sounds.playCardFlip(), 150);
    }
  }
  // Если gameState пришёл с finished, но gameOver ивент не пришёл
  if (phase === 'finished' && !showGameOver.value) {
    const sorted = [...(gameState.value?.players || [])].sort((a, b) => b.chips - a.chips);
    if (sorted.length > 0) {
      gameOverWinner.value = sorted[0];
      showGameOver.value = true;
    }
  }
});

watch(() => gameState.value?.handNumber, (num, old) => {
  if (num && num !== old) logMessages.value.push({ type: 'info', text: `Раздача #${num}` });
});

// Sound when it becomes your turn
watch(() => gameState.value?.availableActions, (actions, oldActions) => {
  if (actions && actions.length > 0 && (!oldActions || oldActions.length === 0)) {
    sounds.playYourTurn();
  }
});

// Chip sounds when pot changes significantly
let lastPot = 0;
watch(() => gameState.value?.pot, (pot) => {
  if (pot && pot > lastPot && pot - lastPot > 0) {
    sounds.playChips();
  }
  lastPot = pot || 0;
});
</script>

<style scoped>
.poker-room {
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
  background: #06060a;
}

/* Overlays */
.overlay {
  position: fixed; inset: 0;
  background: rgba(6, 6, 10, 0.92);
  display: flex; align-items: center; justify-content: center;
  z-index: 200; backdrop-filter: blur(8px);
}
.overlay-content {
  text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px;
}
.overlay-content h2 {
  font-size: 1.8rem;
  background: linear-gradient(135deg, #d4af37, #f5e6a3);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.overlay-content p { color: #5a5a7a; }

.spinner-gold {
  width: 44px; height: 44px;
  border: 3px solid rgba(212, 175, 55, 0.15); border-top-color: #d4af37;
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.waiting-logo { font-size: 4rem; animation: logo-float 3s ease-in-out infinite; }
@keyframes logo-float {
  0%, 100% { transform: translateY(0) rotate(0); }
  50% { transform: translateY(-12px) rotate(5deg); }
}

.waiting-dots { display: flex; gap: 10px; }
.waiting-dots span {
  width: 10px; height: 10px; background: #d4af37; border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}
.waiting-dots span:nth-child(1) { animation-delay: -0.32s; }
.waiting-dots span:nth-child(2) { animation-delay: -0.16s; }
@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
  40% { transform: scale(1); opacity: 1; }
}

/* === GAME OVER — Winner + Confetti === */
.game-over-overlay {
  background: rgba(6, 6, 10, 0.95) !important;
  z-index: 300 !important;
}

.confetti-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.confetti {
  position: absolute;
  top: -20px;
  animation: confetti-fall linear infinite;
  opacity: 0;
}

@keyframes confetti-fall {
  0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 0; }
  5% { opacity: 1; }
  50% { opacity: 0.8; }
  100% { transform: translateY(100vh) rotate(var(--rotation, 720deg)) scale(0.4); opacity: 0; }
}

.winner-showcase {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  z-index: 2;
  animation: winner-appear 1s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes winner-appear {
  0% { opacity: 0; transform: scale(0.3) translateY(40px); }
  60% { transform: scale(1.05) translateY(-5px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.winner-glow {
  position: absolute;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 60%);
  border-radius: 50%;
  animation: glow-breathe 3s ease-in-out infinite;
  pointer-events: none;
}

@keyframes glow-breathe {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.3); opacity: 1; }
}

.winner-trophy {
  font-size: 5rem;
  animation: trophy-bounce 1s ease, trophy-shine 2s ease-in-out infinite 1s;
  filter: drop-shadow(0 0 30px rgba(212, 175, 55, 0.5));
}

@keyframes trophy-bounce {
  0% { transform: scale(0) rotate(-20deg); opacity: 0; }
  60% { transform: scale(1.3) rotate(5deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

@keyframes trophy-shine {
  0%, 100% { filter: drop-shadow(0 0 30px rgba(212, 175, 55, 0.5)); }
  50% { filter: drop-shadow(0 0 50px rgba(212, 175, 55, 0.8)) brightness(1.1); }
}

.winner-label {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 6px;
  color: #d4af37;
  font-weight: 700;
  animation: label-fade 0.8s ease 0.3s both;
}

@keyframes label-fade {
  from { opacity: 0; letter-spacing: 20px; }
  to { opacity: 1; letter-spacing: 6px; }
}

.winner-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 4px solid #d4af37;
  box-shadow: 0 0 40px rgba(212, 175, 55, 0.4);
  animation: avatar-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both;
}

@keyframes avatar-pop {
  from { opacity: 0; transform: scale(0); }
  to { opacity: 1; transform: scale(1); }
}

.winner-name {
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #d4af37, #f5e6a3, #d4af37);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: name-shine 3s linear infinite, name-appear 0.6s ease 0.7s both;
  text-shadow: none;
}

@keyframes name-shine {
  0% { background-position: 200% center; }
  100% { background-position: -200% center; }
}

@keyframes name-appear {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.winner-chips {
  font-size: 1.2rem;
  color: #f5e6a3;
  font-weight: 600;
  animation: name-appear 0.5s ease 0.9s both;
}

/* Stats */
.game-stats {
  display: flex;
  gap: 24px;
  margin-top: 4px;
  animation: name-appear 0.5s ease 1s both;
}

.stat {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-icon { font-size: 1rem; }
.stat-value { color: #8b8baf; font-size: 0.85rem; font-weight: 500; }

/* Standings */
.final-standings {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 300px;
  margin-top: 16px;
  animation: name-appear 0.5s ease 1.1s both;
}

.standing-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s;
}

.standing-row.is-winner {
  background: rgba(212, 175, 55, 0.1);
  border-color: rgba(212, 175, 55, 0.3);
}

.standing-medal {
  font-size: 1.1rem;
  min-width: 28px;
  text-align: center;
}

.standing-name {
  flex: 1;
  color: #e8e0f0;
  font-size: 0.85rem;
  font-weight: 500;
}

.standing-detail {
  color: #d4af37;
  font-weight: 700;
  font-size: 0.85rem;
}

.standing-detail.elim {
  color: #5a5a7a;
  font-weight: 400;
  font-size: 0.75rem;
  font-style: italic;
}

/* My hand */
.hand-result {
  position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(180, 140, 30, 0.1));
  border: 1px solid rgba(212, 175, 55, 0.4); color: #f5e6a3;
  padding: 6px 20px; border-radius: 10px; font-weight: 700; font-size: 0.95rem;
  z-index: 90; text-shadow: 0 0 12px rgba(212, 175, 55, 0.3);
}

.toast {
  position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
  padding: 10px 24px; border-radius: 10px; font-size: 0.9rem; z-index: 300;
}
.error-toast {
  background: rgba(220, 38, 38, 0.15); color: #fca5a5;
  border: 1px solid rgba(220, 38, 38, 0.3); backdrop-filter: blur(8px);
}

/* Transitions */
.overlay-fade-enter-active { transition: opacity 0.4s ease; }
.overlay-fade-leave-active { transition: opacity 0.3s ease; }
.overlay-fade-enter-from, .overlay-fade-leave-to { opacity: 0; }

.toast-slide-enter-active { animation: toast-in 0.4s ease; }
.toast-slide-leave-active { animation: toast-in 0.3s ease reverse; }
@keyframes toast-in {
  from { opacity: 0; transform: translateX(-50%) translateY(-16px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.result-pop-enter-active { animation: pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.result-pop-leave-active { animation: pop 0.2s ease reverse; }
@keyframes pop {
  from { opacity: 0; transform: translateX(-50%) scale(0.5); }
  to { opacity: 1; transform: translateX(-50%) scale(1); }
}

/* === BLINDS CHANGE FIRE OVERLAY === */
.blinds-overlay {
  position: fixed;
  inset: 0;
  z-index: 250;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 2, 0, 0.85);
  backdrop-filter: blur(6px);
}

.blinds-fire-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.fire-particle {
  position: absolute;
  border-radius: 50%;
  animation: fire-rise linear infinite;
  opacity: 0;
  filter: blur(2px);
}

@keyframes fire-rise {
  0% { transform: translateY(0) scale(1) rotate(0); opacity: 0; }
  10% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { transform: translateY(-100vh) scale(0.2) rotate(180deg); opacity: 0; }
}

.blinds-fire-glow {
  position: absolute;
  bottom: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  height: 350px;
  background: radial-gradient(ellipse at center bottom, rgba(255, 100, 0, 0.25) 0%, rgba(255, 50, 0, 0.12) 30%, transparent 60%);
  animation: fire-glow-breathe 1.5s ease-in-out infinite alternate;
  pointer-events: none;
}

@keyframes fire-glow-breathe {
  0% { opacity: 0.6; transform: translateX(-50%) scaleX(0.8); }
  100% { opacity: 1; transform: translateX(-50%) scaleX(1.2); }
}

.blinds-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  z-index: 2;
  animation: blinds-appear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes blinds-appear {
  0% { opacity: 0; transform: scale(0.3) translateY(30px); }
  60% { transform: scale(1.1) translateY(-5px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.blinds-icon {
  font-size: 5rem;
  animation: fire-icon-pulse 0.8s ease-in-out infinite alternate;
  filter: drop-shadow(0 0 30px rgba(255, 100, 0, 0.6));
}

@keyframes fire-icon-pulse {
  0% { transform: scale(1) rotate(-3deg); }
  100% { transform: scale(1.15) rotate(3deg); }
}

.blinds-title {
  font-size: 2rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 6px;
  background: linear-gradient(135deg, #ff4500, #ff9500, #ffcc00, #ff9500, #ff4500);
  background-size: 300% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: fire-text-shimmer 2s linear infinite;
  text-shadow: none;
}

@keyframes fire-text-shimmer {
  0% { background-position: 300% center; }
  100% { background-position: -300% center; }
}

.blinds-values {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 1.5rem;
  font-weight: 700;
}

.blinds-old {
  color: #8b8baf;
  text-decoration: line-through;
  opacity: 0.6;
}

.blinds-arrow {
  color: #ff6a00;
  font-size: 2rem;
  animation: arrow-pulse 0.6s ease-in-out infinite alternate;
}

@keyframes arrow-pulse {
  0% { transform: scale(1); opacity: 0.7; }
  100% { transform: scale(1.3); opacity: 1; }
}

.blinds-new {
  color: #ffcc00;
  font-size: 2.2rem;
  text-shadow: 0 0 20px rgba(255, 200, 0, 0.5), 0 0 40px rgba(255, 100, 0, 0.3);
}

/* Transition */
.blinds-fire-enter-active { animation: blinds-in 0.5s ease; }
.blinds-fire-leave-active { animation: blinds-out 0.8s ease; }

@keyframes blinds-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes blinds-out {
  0% { opacity: 1; }
  100% { opacity: 0; transform: scale(1.05); }
}

/* ===== MOBILE RESPONSIVE ===== */
@media (max-width: 768px) {
  .hand-result { bottom: 70px; font-size: 0.8rem; padding: 4px 14px; }

  .overlay-content h2 { font-size: 1.3rem; }

  .winner-name { font-size: 1.6rem; }
  .winner-trophy { font-size: 3.5rem; }
  .winner-avatar { width: 70px; height: 70px; }
  .winner-label { font-size: 0.7rem; letter-spacing: 4px; }
  .winner-chips { font-size: 1rem; }
  .game-stats { gap: 16px; }
  .final-standings { min-width: 240px; }
  .standing-row { padding: 6px 12px; }

  .blinds-title { font-size: 1.3rem; letter-spacing: 3px; }
  .blinds-values { font-size: 1.1rem; gap: 10px; }
  .blinds-new { font-size: 1.5rem; }
  .blinds-icon { font-size: 3.5rem; }
}

@media (max-width: 430px) {
  .hand-result { bottom: 55px; font-size: 0.65rem; padding: 3px 10px; }

  .winner-name { font-size: 1.2rem; }
  .winner-trophy { font-size: 2.5rem; }
  .winner-avatar { width: 56px; height: 56px; }
  .winner-label { font-size: 0.6rem; letter-spacing: 3px; }
  .final-standings { min-width: 200px; }
  .standing-row { padding: 5px 10px; font-size: 0.75rem; }

  .blinds-title { font-size: 1rem; letter-spacing: 2px; }
  .blinds-values { font-size: 0.9rem; }
  .blinds-new { font-size: 1.2rem; }
  .blinds-icon { font-size: 2.5rem; }
}

/* Landscape phone */
@media (max-height: 500px) and (orientation: landscape) {
  .poker-room { overflow: hidden !important; }
  .hand-result { bottom: 45px; font-size: 0.65rem; padding: 3px 10px; }
  .blinds-icon { font-size: 2rem; }
  .blinds-title { font-size: 0.9rem; }
  .winner-trophy { font-size: 2.5rem; }
  .winner-name { font-size: 1.2rem; }
  .winner-avatar { width: 50px; height: 50px; }
  .final-standings { min-width: 200px; }
}
</style>
