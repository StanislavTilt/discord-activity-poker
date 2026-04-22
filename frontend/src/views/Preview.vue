<template>
  <div class="poker-room">
    <AnimatedBackground :theme="currentBg" />

    <SettingsPanel @changeBg="currentBg = $event" @changeSkin="currentSkin = $event" @changeTable="currentTable = $event" @changeFace="currentFace = $event" />

    <PokerTable :state="mockState" :cardSkin="currentSkin" :tableTheme="currentTable" :cardFace="currentFace" />

    <ComboTable currentCombo="Full House" :comboCards="[]" />

    <div class="preview-controls">
      <div class="control-row">
        <span class="control-label">Игроков: <strong>{{ playerCount }}</strong></span>
        <input type="range" class="control-slider" v-model.number="playerCount" min="2" max="15" step="1" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import PokerTable from '../components/PokerTable.vue';
import AnimatedBackground from '../components/AnimatedBackground.vue';
import SettingsPanel from '../components/SettingsPanel.vue';
import ComboTable from '../components/ComboTable.vue';

const currentBg = ref('particles');
const currentSkin = ref('classic');
const currentTable = ref('classic');
const currentFace = ref('classic');
const playerCount = ref(12);

const allNames = [
  'MoonPlayer', 'AceKing99', 'PokerStar', 'BluffMaster',
  'ChipLeader', 'RiverRat', 'NutFlush', 'DeadMoney',
  'SharkBait', 'BigSlick', 'CoolBluff', 'HighRoller',
  'FoldKing', 'LuckyDraw', 'RoyalAce'
];

function buildPlayers(count) {
  return allNames.slice(0, count).map((name, i) => ({
    discordId: `user_${i}`,
    username: name,
    avatarUrl: null,
    seat: i,
    chips: 500 + Math.floor(Math.random() * 1500),
    bet: i === 3 ? 100 : (i === 7 && count > 7 ? 200 : 0),
    folded: (i === 2 || (i === 9 && count > 9)),
    allIn: (i === 7 && count > 7),
    disconnected: false,
    hasCards: !((i === 2) || (i === 9 && count > 9)),
    holeCards: i === 0 ? [
      { rank: 'A', suit: 'spades' },
      { rank: 'K', suit: 'hearts' }
    ] : undefined,
    handResult: undefined
  }));
}

const mockState = computed(() => ({
  gameId: 'preview',
  phase: 'flop',
  pot: 650,
  communityCards: [
    { rank: '10', suit: 'hearts' },
    { rank: 'J', suit: 'spades' },
    { rank: 'Q', suit: 'diamonds' }
  ],
  currentBet: 200,
  minRaise: 200,
  dealerIndex: 1,
  currentPlayerIndex: Math.min(5, playerCount.value - 1),
  currentPlayerId: `user_${Math.min(5, playerCount.value - 1)}`,
  handNumber: 3,
  players: buildPlayers(playerCount.value),
  myIndex: 0,
  myCards: [
    { rank: 'A', suit: 'spades' },
    { rank: 'K', suit: 'hearts' }
  ],
  smallBlind: 10,
  bigBlind: 20,
  roundTime: 30000
}));
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

.preview-controls {
  position: fixed;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(10, 9, 16, 0.9);
  border: 1px solid rgba(212, 175, 55, 0.2);
  padding: 10px 20px;
  border-radius: 14px;
  z-index: 100;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 220px;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-label {
  font-size: 0.75rem;
  color: #8b8baf;
  white-space: nowrap;
}

.control-label strong {
  color: #d4af37;
  font-size: 1rem;
}

.control-slider {
  flex: 1;
  accent-color: #d4af37;
  height: 4px;
}
</style>
