<template>
  <div class="table-wrapper">
    <div class="poker-table">
      <div class="table-felt" :class="`felt-${tableTheme}`">
        <!-- MOON лого -->
        <div class="table-logo">
          <span class="logo-text">MOON</span>
          <span class="logo-crescent"></span>
        </div>

        <!-- Общие карты -->
        <TransitionGroup name="card-flip" tag="div" class="community-cards" v-if="state.communityCards && state.communityCards.length > 0">
          <Card v-for="(c, i) in state.communityCards" :key="i" :card="c" :skin="cardSkin" :faceStyle="cardFace" />
        </TransitionGroup>

        <!-- Банк -->
        <Transition name="pot-pop">
          <div class="pot-display" v-if="state.pot > 0">
            <span class="pot-label">Банк</span>
            <span class="pot-amount">{{ state.pot }}</span>
          </div>
        </Transition>

        <!-- Фаза -->
        <div class="phase-badge">{{ phaseLabel }}</div>

        <!-- Места -->
        <PlayerSeat
          v-for="(p, i) in state.players"
          :key="p.discordId"
          :player="p"
          :isCurrentPlayer="state.currentPlayerId === p.discordId"
          :isMe="state.myIndex === i"
          :isDealer="state.dealerIndex === i"
          :seatIndex="reindexSeat(i)"
          :totalSeats="state.players.length"
          :timer="state.currentPlayerId === p.discordId ? timer : 0"
          :maxTimer="(state.roundTime || 30000) / 1000"
          :cardSkin="cardSkin"
          :cardFace="cardFace"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onUnmounted } from 'vue';
import Card from './Card.vue';
import PlayerSeat from './PlayerSeat.vue';

const props = defineProps({
  state: Object,
  cardSkin: { type: String, default: 'classic' },
  tableTheme: { type: String, default: 'classic' },
  cardFace: { type: String, default: 'classic' }
});

const phaseLabels = {
  waiting: 'Ожидание',
  preflop: 'Пре-флоп',
  flop: 'Флоп',
  turn: 'Тёрн',
  river: 'Ривер',
  showdown: 'Вскрытие',
  finished: 'Конец игры'
};

const phaseLabel = computed(() => phaseLabels[props.state.phase] || props.state.phase);

const timer = ref(0);
let timerInterval = null;

function reindexSeat(index) {
  const myIdx = props.state.myIndex ?? 0;
  const total = props.state.players.length;
  return (index - myIdx + total) % total;
}

watch(() => props.state.currentPlayerId, () => {
  timer.value = (props.state.roundTime || 30000) / 1000;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer.value = Math.max(0, timer.value - 1);
    if (timer.value <= 0) clearInterval(timerInterval);
  }, 1000);
});

onUnmounted(() => { if (timerInterval) clearInterval(timerInterval); });
</script>

<style scoped>
.table-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 40px 90px;
  width: 100%;
}

.poker-table {
  width: 100%;
  max-width: 920px;
  aspect-ratio: 16 / 9;
  position: relative;
}

.table-felt {
  width: 100%;
  height: 100%;
  border-radius: 50% / 40%;
  border: 14px solid #2a1a0a;
  position: relative;
  overflow: visible;
  transition: background 0.6s ease, border-color 0.6s ease, box-shadow 0.6s ease;
  /* Default — classic green */
  background: radial-gradient(ellipse at center, #1a6b3c 0%, #145a31 40%, #0d4425 70%, #0a3a1e 100%);
  box-shadow:
    inset 0 0 80px rgba(0, 0, 0, 0.35),
    inset 0 0 30px rgba(0, 0, 0, 0.15),
    0 0 0 3px #4a3520, 0 0 0 6px #2a1a0a,
    0 0 0 8px rgba(212, 175, 55, 0.15),
    0 15px 60px rgba(0, 0, 0, 0.6);
}

/* === TABLE THEMES === */
.felt-classic {
  background: radial-gradient(ellipse at center, #1a6b3c 0%, #145a31 40%, #0d4425 70%, #0a3a1e 100%);
  border-color: #2a1a0a;
  box-shadow: inset 0 0 80px rgba(0,0,0,0.35), inset 0 0 30px rgba(0,0,0,0.15), 0 0 0 3px #4a3520, 0 0 0 6px #2a1a0a, 0 0 0 8px rgba(212,175,55,0.15), 0 15px 60px rgba(0,0,0,0.6);
}

.felt-royal {
  background: radial-gradient(ellipse at center, #1a3d6b 0%, #14315a 40%, #0d2545 70%, #0a1e3a 100%);
  border-color: #1a1a3a;
  box-shadow: inset 0 0 80px rgba(0,0,0,0.35), inset 0 0 30px rgba(0,0,20,0.2), 0 0 0 3px #2a2a5a, 0 0 0 6px #1a1a3a, 0 0 0 8px rgba(100,130,255,0.1), 0 15px 60px rgba(0,0,0,0.6);
}

.felt-crimson {
  background: radial-gradient(ellipse at center, #6b1a2a 0%, #5a1422 40%, #451018 70%, #3a0a15 100%);
  border-color: #2a0a0a;
  box-shadow: inset 0 0 80px rgba(0,0,0,0.35), inset 0 0 30px rgba(20,0,0,0.2), 0 0 0 3px #4a1a1a, 0 0 0 6px #2a0a0a, 0 0 0 8px rgba(255,80,80,0.1), 0 15px 60px rgba(0,0,0,0.6);
}

.felt-purple {
  background: radial-gradient(ellipse at center, #3d1a6b 0%, #31145a 40%, #250d45 70%, #1e0a3a 100%);
  border-color: #1a0a2a;
  box-shadow: inset 0 0 80px rgba(0,0,0,0.35), inset 0 0 30px rgba(10,0,20,0.2), 0 0 0 3px #3a1a5a, 0 0 0 6px #1a0a2a, 0 0 0 8px rgba(160,80,255,0.1), 0 15px 60px rgba(0,0,0,0.6);
}

.felt-black {
  background: radial-gradient(ellipse at center, #2a2a30 0%, #202028 40%, #181820 70%, #121218 100%);
  border-color: #1a1a1a;
  box-shadow: inset 0 0 80px rgba(0,0,0,0.5), inset 0 0 30px rgba(0,0,0,0.3), 0 0 0 3px #2a2a2a, 0 0 0 6px #1a1a1a, 0 0 0 8px rgba(200,200,200,0.05), 0 15px 60px rgba(0,0,0,0.6);
}

.felt-gold {
  background: radial-gradient(ellipse at center, #4a3a10 0%, #3a2e0c 40%, #2e2208 70%, #2a1e08 100%);
  border-color: #3a2a0a;
  box-shadow: inset 0 0 80px rgba(0,0,0,0.3), inset 0 0 30px rgba(20,15,0,0.2), 0 0 0 3px #5a4a1a, 0 0 0 6px #3a2a0a, 0 0 0 8px rgba(212,175,55,0.2), 0 15px 60px rgba(0,0,0,0.6);
}

.felt-ocean {
  background: radial-gradient(ellipse at center, #0a4a5a 0%, #083a48 40%, #052e3a 70%, #052a35 100%);
  border-color: #0a2030;
  box-shadow: inset 0 0 80px rgba(0,0,0,0.35), inset 0 0 30px rgba(0,10,20,0.2), 0 0 0 3px #1a3a4a, 0 0 0 6px #0a2030, 0 0 0 8px rgba(14,165,233,0.1), 0 15px 60px rgba(0,0,0,0.6);
}

.felt-emerald {
  background: radial-gradient(ellipse at center, #0a5a3a 0%, #084a30 40%, #053a25 70%, #053520 100%);
  border-color: #0a2a18;
  box-shadow: inset 0 0 80px rgba(0,0,0,0.35), inset 0 0 30px rgba(0,10,5,0.2), 0 0 0 3px #1a4a30, 0 0 0 6px #0a2a18, 0 0 0 8px rgba(16,185,129,0.1), 0 15px 60px rgba(0,0,0,0.6);
}

/* MOON Logo */
.table-logo {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1;
  pointer-events: none;
  user-select: none;
}

.logo-text {
  font-size: 9rem;
  font-weight: 900;
  letter-spacing: 8px;
  color: rgba(255, 255, 255, 0.045);
  text-transform: uppercase;
  font-family: 'Inter', sans-serif;
}

.logo-crescent {
  display: inline-block;
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  box-shadow: inset -20px -2px 0 0 rgba(255, 255, 255, 0.05);
  margin-left: 6px;
}

.community-cards {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  gap: 8px;
  z-index: 5;
}

.pot-display {
  position: absolute;
  top: 33%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 5;
}

.pot-label {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 2px;
}

.pot-amount {
  font-size: 1.3rem;
  font-weight: 700;
  color: #f5e6a3;
  text-shadow: 0 0 16px rgba(212, 175, 55, 0.5), 0 2px 4px rgba(0, 0, 0, 0.5);
}

.phase-badge {
  position: absolute;
  top: 18%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.45);
  color: #d4af37;
  padding: 5px 18px;
  border-radius: 14px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  z-index: 5;
  border: 1px solid rgba(212, 175, 55, 0.15);
  backdrop-filter: blur(4px);
}

/* Transitions */
.card-flip-enter-active {
  animation: card-appear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes card-appear {
  from { opacity: 0; transform: rotateY(90deg) scale(0.5); }
  to { opacity: 1; transform: rotateY(0) scale(1); }
}

.pot-pop-enter-active { animation: pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.pot-pop-leave-active { animation: pop 0.2s ease reverse; }

@keyframes pop {
  from { opacity: 0; transform: translateX(-50%) scale(0.6); }
  to { opacity: 1; transform: translateX(-50%) scale(1); }
}

/* ===== MOBILE ===== */
@media (max-width: 768px) {
  .table-wrapper { padding: 10px 6px 80px; }
  .poker-table { max-width: 100%; }
  .table-felt { border-width: 6px; }
  .community-cards { gap: 3px; }
  .community-cards :deep(.card) { width: 30px; height: 42px; border-radius: 4px; }
  .community-cards :deep(.card-center-suit) { font-size: 0.85rem; }
  .community-cards :deep(.corner-rank) { font-size: 0.35rem; }
  .community-cards :deep(.corner-suit) { font-size: 0.3rem; }
  .community-cards :deep(.top-left) { top: 1px; left: 2px; }
  .community-cards :deep(.bottom-right) { bottom: 1px; right: 2px; }
  .pot-display { top: 28%; }
  .pot-amount { font-size: 0.8rem; }
  .pot-label { font-size: 0.45rem; letter-spacing: 1px; }
  .phase-badge { font-size: 0.5rem; padding: 2px 8px; top: 12%; }
  .logo-text { font-size: 2.5rem; letter-spacing: 3px; }
  .logo-crescent { width: 2.5rem; height: 2.5rem; box-shadow: inset -12px -1px 0 0 rgba(255,255,255,0.05); }
}

@media (max-width: 430px) {
  .table-wrapper { padding: 5px 2px 75px; }
  .table-felt { border-width: 5px; }
  .community-cards :deep(.card) { width: 26px; height: 36px; }
  .community-cards :deep(.card-center-suit) { font-size: 0.7rem; }
  .pot-amount { font-size: 0.7rem; }
  .pot-label { font-size: 0.4rem; }
  .phase-badge { font-size: 0.45rem; padding: 2px 6px; }
  .logo-text { font-size: 1.8rem; letter-spacing: 2px; }
  .logo-crescent { width: 1.8rem; height: 1.8rem; box-shadow: inset -8px -1px 0 0 rgba(255,255,255,0.05); }
}

/* Landscape phone — вписываем стол в экран */
@media (max-height: 500px) and (orientation: landscape) {
  .table-wrapper { padding: 5px 10% 55px; height: 100vh; width: 100vw; align-items: center; justify-content: center; box-sizing: border-box; overflow: visible; }
  .poker-table { width: 100%; max-width: 100%; aspect-ratio: 2 / 1; max-height: 65vh; overflow: visible; }
  .table-felt { border-width: 5px; }
  .community-cards { gap: 2px; }
  .community-cards :deep(.card) { width: 24px; height: 34px; border-radius: 3px; }
  .community-cards :deep(.card-center-suit) { font-size: 0.65rem; }
  .community-cards :deep(.corner-rank) { font-size: 0.25rem; }
  .community-cards :deep(.corner-suit) { font-size: 0.2rem; }
  .pot-display { top: 25%; }
  .pot-amount { font-size: 0.65rem; }
  .pot-label { font-size: 0.35rem; }
  .phase-badge { font-size: 0.4rem; padding: 2px 6px; top: 10%; }
  .logo-text { font-size: 1.6rem; letter-spacing: 2px; }
  .logo-crescent { width: 1.6rem; height: 1.6rem; box-shadow: inset -8px -1px 0 0 rgba(255,255,255,0.05); }
}
</style>
