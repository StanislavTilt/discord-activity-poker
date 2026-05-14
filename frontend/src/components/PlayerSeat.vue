<template>
  <div
    class="player-seat"
    :class="{
      active: isCurrentPlayer,
      folded: player.folded,
      'all-in': player.allIn,
      'is-me': isMe,
      disconnected: player.disconnected
    }"
    :style="seatStyle"
  >
    <!-- Свечение активного игрока -->
    <div v-if="isCurrentPlayer" class="active-glow"></div>

    <div class="seat-ring" :class="{ active: isCurrentPlayer, me: isMe }">
      <img v-if="player.avatarUrl" :src="player.avatarUrl" class="avatar" />
      <div v-else class="avatar avatar-placeholder">{{ player.username[0] }}</div>
    </div>

    <div class="player-info">
      <span class="player-name">{{ player.username }}</span>
      <span class="player-chips">{{ formatChips(player.chips) }}</span>
    </div>

    <Transition name="bet-pop">
      <div v-if="player.bet > 0" class="player-bet">
        <span class="bet-amount">{{ player.bet }}</span>
      </div>
    </Transition>

    <div class="player-cards" v-if="player.holeCards && player.holeCards.length > 0">
      <Card v-for="(c, i) in player.holeCards" :key="i" :card="c" :skin="cardSkin" :faceStyle="cardFace" />
    </div>
    <div class="player-cards" v-else-if="player.hasCards && !isMe">
      <Card :skin="cardSkin" />
      <Card :skin="cardSkin" />
    </div>

    <Transition name="badge-pop">
      <div v-if="player.folded" class="fold-overlay">ФОЛД</div>
    </Transition>

    <Transition name="badge-pop">
      <div v-if="player.allIn" class="allin-badge">ALL IN</div>
    </Transition>

    <div v-if="isDealer" class="dealer-chip">D</div>

    <div v-if="isCurrentPlayer && timer > 0" class="timer-bar">
      <div class="timer-fill" :style="{ width: timerPercent + '%' }" :class="{ urgent: timerPercent < 25 }"></div>
    </div>

  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import Card from './Card.vue';

const props = defineProps({
  player: Object,
  isCurrentPlayer: Boolean,
  isMe: Boolean,
  isDealer: Boolean,
  seatIndex: Number,
  totalSeats: Number,
  timer: { type: Number, default: 0 },
  maxTimer: { type: Number, default: 30 },
  cardSkin: { type: String, default: 'classic' },
  cardFace: { type: String, default: 'classic' }
});

const timerPercent = computed(() => (props.timer / props.maxTimer) * 100);

// Reactive window size
const winW = ref(typeof window !== 'undefined' ? window.innerWidth : 1000);
const winH = ref(typeof window !== 'undefined' ? window.innerHeight : 800);
let resizeHandler = null;
onMounted(() => {
  resizeHandler = () => { winW.value = window.innerWidth; winH.value = window.innerHeight; };
  window.addEventListener('resize', resizeHandler);
});
onUnmounted(() => { if (resizeHandler) window.removeEventListener('resize', resizeHandler); });

const seatStyle = computed(() => {
  const total = props.totalSeats || 2;
  const idx = props.seatIndex;
  const angle = (Math.PI / 2) + (2 * Math.PI * idx / total);

  const w = winW.value;
  const h = winH.value;
  const isPortraitMobile = w <= 430;
  const isLandscapeMobile = h <= 500 && w > h;

  let rx = 50, ry = 42, cx = 50, cy = 46;
  if (isPortraitMobile) { rx = 44; ry = 38; cy = 44; }
  else if (isLandscapeMobile) { rx = 38; ry = 34; cy = 44; }

  const x = cx + rx * Math.cos(angle);
  const y = cy + ry * Math.sin(angle);

  return {
    position: 'absolute',
    left: x + '%',
    top: y + '%',
    transform: 'translate(-50%, -50%)'
  };
});

function formatChips(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}
</script>

<style scoped>
.player-seat {
  width: 90px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  z-index: 2;
  transition: opacity 0.4s ease, transform 0.3s ease;
  animation: seat-appear 0.5s ease;
}

@keyframes seat-appear {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

.player-seat.is-me { width: 120px; }
.player-seat.folded { opacity: 0.35; }
.player-seat.disconnected { opacity: 0.2; }

.active-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(212, 175, 55, 0.2) 0%, transparent 70%);
  border-radius: 50%;
  animation: glow-pulse 2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
}

.seat-ring {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.seat-ring.active {
  border-color: #d4af37;
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.4), 0 0 40px rgba(212, 175, 55, 0.15);
}

.seat-ring.me {
  border-color: rgba(139, 92, 246, 0.6);
  box-shadow: 0 0 16px rgba(139, 92, 246, 0.25);
}

.seat-ring.active.me {
  border-color: #d4af37;
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.4), 0 0 8px rgba(139, 92, 246, 0.3);
}

.avatar { width: 100%; height: 100%; object-fit: cover; }

.avatar-placeholder {
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #1a1a2e, #2a2042);
  color: #d4af37;
  font-size: 1.2rem;
  font-weight: 700;
  width: 100%;
  height: 100%;
}

.player-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(12, 12, 20, 0.9);
  padding: 3px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(4px);
}

.player-name {
  font-size: 0.73rem; font-weight: 600; color: #e8e0f0;
  max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.player-chips {
  font-size: 0.7rem; color: #d4af37; font-weight: 600;
}

.player-bet {
  position: absolute;
  top: -22px;
  background: rgba(212, 175, 55, 0.12);
  border: 1px solid rgba(212, 175, 55, 0.35);
  border-radius: 14px;
  padding: 2px 10px;
}

.bet-amount { font-size: 0.7rem; color: #f5e6a3; font-weight: 700; }

.player-cards { display: flex; gap: 2px; margin-top: 1px; justify-content: center; }
.player-cards :deep(.card) { width: 26px; height: 36px; border-radius: 4px; }
.player-cards :deep(.card-center-suit) { font-size: 0.7rem; }
.player-cards :deep(.corner-rank) { font-size: 0.35rem; }
.player-cards :deep(.corner-suit) { font-size: 0.25rem; }
.player-cards :deep(.top-left) { top: 1px; left: 2px; }
.player-cards :deep(.bottom-right) { bottom: 1px; right: 2px; }

/* My cards — bigger */
.is-me .player-cards { gap: 4px; margin-top: 2px; }
.is-me .player-cards :deep(.card) {
  width: 50px; height: 70px;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(139, 92, 246, 0.2);
}
.is-me .player-cards :deep(.card-center-suit) { font-size: 1.3rem; }
.is-me .player-cards :deep(.corner-rank) { font-size: 0.55rem; }
.is-me .player-cards :deep(.corner-suit) { font-size: 0.4rem; }
.is-me .player-cards :deep(.top-left) { top: 3px; left: 4px; }
.is-me .player-cards :deep(.bottom-right) { bottom: 3px; right: 4px; }

.fold-overlay {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  background: rgba(6, 6, 10, 0.8);
  color: #dc2626;
  font-weight: 700; font-size: 0.7rem;
  padding: 3px 10px; border-radius: 6px;
  border: 1px solid rgba(220, 38, 38, 0.2);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.allin-badge {
  background: linear-gradient(135deg, #d4af37, #b8941f);
  color: #0a0910;
  font-size: 0.6rem; font-weight: 800;
  padding: 2px 8px; border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  animation: allin-flash 1.5s ease infinite;
}

@keyframes allin-flash {
  0%, 100% { box-shadow: 0 0 8px rgba(212, 175, 55, 0.3); }
  50% { box-shadow: 0 0 20px rgba(212, 175, 55, 0.6); }
}

.dealer-chip {
  position: absolute; top: -8px; right: -8px;
  width: 24px; height: 24px;
  background: linear-gradient(135deg, #d4af37, #f5d76e);
  color: #0a0910;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.65rem; font-weight: 800;
  box-shadow: 0 2px 8px rgba(212, 175, 55, 0.4);
  border: 1.5px solid rgba(255, 255, 255, 0.2);
}

.timer-bar {
  width: 80%; height: 3px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 2px;
  overflow: hidden; margin-top: 3px;
}

.timer-fill {
  height: 100%;
  background: linear-gradient(90deg, #d4af37, #f5e6a3);
  transition: width 1s linear;
  border-radius: 2px;
}

.timer-fill.urgent {
  background: linear-gradient(90deg, #dc2626, #f87171);
  animation: timer-blink 0.5s infinite;
}

@keyframes timer-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}


/* Transitions */
.bet-pop-enter-active { animation: pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.bet-pop-leave-active { animation: pop-in 0.2s ease reverse; }

.badge-pop-enter-active { animation: pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.badge-pop-leave-active { animation: pop-in 0.2s ease reverse; }

@keyframes pop-in {
  from { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

/* ===== MOBILE (tablets, small laptops) ===== */
@media (max-width: 768px) {
  .player-seat { width: 64px; }
  .player-seat.is-me { width: 82px; }
  .seat-ring { width: 30px; height: 30px; border-width: 2px; }
  .player-info { padding: 1px 5px; border-radius: 6px; }
  .player-name { font-size: 0.45rem; max-width: 55px; }
  .player-chips { font-size: 0.42rem; }
  .player-cards { gap: 1px; }
  .player-cards :deep(.card) { width: 17px; height: 24px; border-radius: 3px; }
  .player-cards :deep(.card-center-suit) { font-size: 0.5rem; }
  .player-cards :deep(.corner-rank) { font-size: 0.25rem; }
  .player-cards :deep(.corner-suit) { font-size: 0.2rem; }
  .player-cards :deep(.top-left) { top: 0; left: 1px; }
  .player-cards :deep(.bottom-right) { bottom: 0; right: 1px; }
  .player-bet { padding: 1px 4px; top: -12px; }
  .bet-amount { font-size: 0.42rem; }
  .fold-overlay { font-size: 0.4rem; padding: 1px 4px; }
  .allin-badge { font-size: 0.38rem; padding: 1px 3px; }
  .dealer-chip { width: 14px; height: 14px; font-size: 0.4rem; top: -3px; right: -3px; }
  .active-glow { width: 50px; height: 50px; }
  .timer-bar { width: 55%; height: 2px; }
  .is-me .player-cards { gap: 3px; }
  .is-me .player-cards :deep(.card) { width: 32px; height: 44px; border-radius: 5px; }
  .is-me .player-cards :deep(.card-center-suit) { font-size: 0.95rem; }
  .is-me .player-cards :deep(.corner-rank) { font-size: 0.45rem; }
  .is-me .player-cards :deep(.corner-suit) { font-size: 0.35rem; }
  .is-me .player-cards :deep(.top-left) { top: 2px; left: 3px; }
  .is-me .player-cards :deep(.bottom-right) { bottom: 2px; right: 3px; }
}

/* ===== MOBILE (iPhone 17 / 430px portrait) ===== */
@media (max-width: 430px) {
  .player-seat { width: 52px; gap: 1px; }
  .player-seat.is-me { width: 70px; }
  .seat-ring { width: 26px; height: 26px; }
  .avatar-placeholder { font-size: 0.8rem; }
  .player-info { padding: 1px 4px; }
  .player-name { font-size: 0.38rem; max-width: 44px; }
  .player-chips { font-size: 0.36rem; }
  .player-cards :deep(.card) { width: 14px; height: 20px; border-radius: 2px; }
  .player-cards :deep(.card-center-suit) { font-size: 0.4rem; }
  .player-cards :deep(.corner-rank),
  .player-cards :deep(.corner-suit) { display: none; }
  .is-me .player-cards :deep(.card) { width: 30px; height: 42px; }
  .is-me .player-cards :deep(.card-center-suit) { font-size: 0.8rem; }
  .is-me .player-cards :deep(.corner-rank) { display: block; font-size: 0.4rem; }
  .is-me .player-cards :deep(.corner-suit) { display: block; font-size: 0.3rem; }
  .dealer-chip { width: 12px; height: 12px; font-size: 0.3rem; top: -2px; right: -2px; }
  .fold-overlay { font-size: 0.35rem; }
  .allin-badge { font-size: 0.32rem; }
  .bet-amount { font-size: 0.36rem; }
  .player-bet { top: -10px; padding: 0 3px; }
}

/* ===== Landscape phone ===== */
@media (max-height: 500px) and (orientation: landscape) {
  .player-seat { width: 54px; gap: 1px; }
  .player-seat.is-me { width: 72px; }
  .seat-ring { width: 22px; height: 22px; border-width: 2px; }
  .avatar-placeholder { font-size: 0.65rem; }
  .player-info { padding: 0 4px; border-radius: 4px; }
  .player-name { font-size: 0.35rem; max-width: 46px; }
  .player-chips { font-size: 0.33rem; }
  .player-cards { gap: 1px; margin-top: 1px; }
  .player-cards :deep(.card) { width: 14px; height: 20px; border-radius: 2px; }
  .player-cards :deep(.card-center-suit) { font-size: 0.4rem; }
  .player-cards :deep(.corner-rank),
  .player-cards :deep(.corner-suit) { display: none; }
  .is-me .player-cards { gap: 3px; }
  .is-me .player-cards :deep(.card) { width: 30px; height: 42px; border-radius: 4px; }
  .is-me .player-cards :deep(.card-center-suit) { font-size: 0.85rem; }
  .is-me .player-cards :deep(.corner-rank) { display: block; font-size: 0.4rem; }
  .is-me .player-cards :deep(.corner-suit) { display: block; font-size: 0.28rem; }
  .dealer-chip { width: 12px; height: 12px; font-size: 0.3rem; top: -2px; right: -2px; }
  .fold-overlay { font-size: 0.32rem; padding: 1px 3px; }
  .allin-badge { font-size: 0.3rem; padding: 1px 2px; }
  .bet-amount { font-size: 0.32rem; }
  .player-bet { top: -9px; padding: 0 2px; }
  .active-glow { width: 40px; height: 40px; }
}
</style>
