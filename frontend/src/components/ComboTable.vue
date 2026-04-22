<template>
  <div class="combo-table">
    <div class="combo-header">Комбинации</div>
    <div
      v-for="combo in combos"
      :key="combo.key"
      class="combo-row"
      :class="{ highlighted: currentCombo === combo.key }"
    >
      <span class="combo-rank">{{ combo.rank }}</span>
      <span class="combo-name">{{ combo.name }}</span>
    </div>

    <!-- Карты текущей комбинации -->
    <div v-if="comboCards && comboCards.length > 0" class="combo-cards-section">
      <div class="combo-cards-label">Ваша рука</div>
      <div class="combo-cards">
        <div
          v-for="(c, i) in comboCards"
          :key="i"
          class="mini-card"
          :class="cardColorClass(c)"
        >
          <span>{{ c.rank }}{{ suitSymbol(c.suit) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  currentCombo: { type: String, default: null },
  comboCards: { type: Array, default: () => [] }
});

const combos = [
  { key: 'Royal Flush', rank: '1', name: 'Рояль-флеш' },
  { key: 'Straight Flush', rank: '2', name: 'Стрит-флеш' },
  { key: 'Four of a Kind', rank: '3', name: 'Каре' },
  { key: 'Full House', rank: '4', name: 'Фулл-хаус' },
  { key: 'Flush', rank: '5', name: 'Флеш' },
  { key: 'Straight', rank: '6', name: 'Стрит' },
  { key: 'Three of a Kind', rank: '7', name: 'Тройка' },
  { key: 'Two Pair', rank: '8', name: 'Две пары' },
  { key: 'One Pair', rank: '9', name: 'Пара' },
  { key: 'High Card', rank: '10', name: 'Старшая' }
];

const suitSymbols = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
function suitSymbol(suit) { return suitSymbols[suit] || ''; }
function cardColorClass(card) {
  return (card.suit === 'hearts' || card.suit === 'diamonds') ? 'red' : 'black';
}
</script>

<style scoped>
.combo-table {
  position: fixed;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 140px;
  background: rgba(10, 9, 16, 0.75);
  border: 1px solid rgba(212, 175, 55, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(8px);
  z-index: 50;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
}

.combo-header {
  padding: 6px 10px;
  font-size: 0.65rem;
  font-weight: 600;
  color: #d4af37;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 1px solid rgba(212, 175, 55, 0.08);
  text-align: center;
}

.combo-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3.5px 10px;
  transition: all 0.4s ease;
}

.combo-row:last-of-type {
  border-bottom: none;
}

.combo-rank {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.5rem;
  font-weight: 700;
  color: rgba(200, 195, 215, 0.2);
  background: rgba(255, 255, 255, 0.02);
  border-radius: 50%;
  flex-shrink: 0;
  transition: all 0.4s ease;
}

.combo-name {
  font-size: 0.62rem;
  color: rgba(200, 195, 215, 0.3);
  font-weight: 500;
  transition: all 0.4s ease;
}

.combo-row.highlighted {
  background: rgba(212, 175, 55, 0.1);
}

.combo-row.highlighted .combo-rank {
  background: rgba(212, 175, 55, 0.25);
  color: #f5e6a3;
}

.combo-row.highlighted .combo-name {
  color: #f5e6a3;
  font-weight: 700;
  text-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
}

/* Карты комбинации */
.combo-cards-section {
  border-top: 1px solid rgba(212, 175, 55, 0.08);
  padding: 6px 8px 8px;
}

.combo-cards-label {
  font-size: 0.55rem;
  color: #5a5a7a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  text-align: center;
}

.combo-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  justify-content: center;
}

.mini-card {
  padding: 2px 4px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 3px;
  font-size: 0.55rem;
  font-weight: 700;
  border: 1px solid rgba(212, 175, 55, 0.3);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  animation: card-highlight 0.4s ease;
}

.mini-card.red span { color: #dc2626; }
.mini-card.black span { color: #1a1a2e; }

@keyframes card-highlight {
  from { opacity: 0; transform: scale(0.7); }
  to { opacity: 1; transform: scale(1); }
}

@media (max-width: 768px) {
  .combo-table { width: 110px; right: 6px; }
  .combo-header { font-size: 0.55rem; padding: 4px 6px; }
  .combo-row { padding: 2px 6px; }
  .combo-rank { width: 14px; height: 14px; font-size: 0.4rem; }
  .combo-name { font-size: 0.5rem; }
  .combo-cards-section { padding: 4px 6px; }
  .mini-card { font-size: 0.5rem; padding: 1px 3px; }
}

@media (max-width: 420px) {
  .combo-table { display: none; }
}
</style>
