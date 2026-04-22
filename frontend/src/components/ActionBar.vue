<template>
  <Transition name="bar-slide">
    <div class="action-bar" v-if="actions && actions.length > 0">
      <div class="action-row">
        <!-- Основные кнопки -->
        <div class="action-main">
          <button
            v-if="actions.includes('fold')"
            class="action-btn fold"
            @click="$emit('action', 'fold')"
          >
            <span class="btn-shine"></span>
            Сброс
          </button>

          <button
            v-if="actions.includes('check')"
            class="action-btn check"
            @click="$emit('action', 'check')"
          >
            <span class="btn-shine"></span>
            Чек
          </button>

          <button
            v-if="actions.includes('call')"
            class="action-btn call"
            @click="$emit('action', 'call')"
          >
            <span class="btn-shine"></span>
            Колл {{ callAmount }}
          </button>
        </div>

        <!-- Рейз блок -->
        <div v-if="actions.includes('raise')" class="raise-block">
          <div class="slider-row">
            <div class="raise-presets">
              <button class="preset-btn" @click="raiseAmount = minRaise">Мин</button>
              <button class="preset-btn" @click="raiseAmount = Math.max(minRaise, Math.floor(pot * 0.5))">½</button>
              <button class="preset-btn" @click="raiseAmount = Math.max(minRaise, pot)">Банк</button>
            </div>
            <input
              type="range"
              class="raise-slider"
              v-model.number="raiseAmount"
              :min="minRaise"
              :max="maxRaise"
              :step="bigBlind"
            />
            <span class="slider-value">{{ raiseAmount }}</span>
          </div>
          <button class="action-btn raise" @click="$emit('action', 'raise', raiseAmount)">
            <span class="btn-shine"></span>
            Рейз {{ raiseAmount }}
          </button>
        </div>

        <!-- Олл-ин -->
        <button
          v-if="actions.includes('allin')"
          class="action-btn allin"
          @click="$emit('action', 'allin')"
        >
          <span class="btn-shine"></span>
          <span class="allin-glow"></span>
          Ва-банк {{ myChips }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  actions: Array,
  callAmount: { type: Number, default: 0 },
  minRaise: { type: Number, default: 0 },
  maxRaise: { type: Number, default: 0 },
  pot: { type: Number, default: 0 },
  bigBlind: { type: Number, default: 20 },
  myChips: { type: Number, default: 0 }
});

defineEmits(['action']);
const raiseAmount = ref(props.minRaise);
watch(() => props.minRaise, (v) => { raiseAmount.value = Math.max(v, 1); });
</script>

<style scoped>
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(6, 6, 10, 0.98), rgba(6, 6, 10, 0.85));
  border-top: 1px solid rgba(212, 175, 55, 0.1);
  padding: 10px 16px 16px;
  z-index: 100;
  backdrop-filter: blur(12px);
}

.action-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  max-width: 900px;
  margin: 0 auto;
}

.action-main {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.raise-block {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(212, 175, 55, 0.08);
  border-radius: 12px;
  padding: 6px 10px;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.raise-presets {
  display: flex;
  gap: 3px;
}

.preset-btn {
  padding: 4px 8px;
  background: rgba(212, 175, 55, 0.08);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 6px;
  color: #d4af37;
  font-size: 0.6rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  white-space: nowrap;
}

.preset-btn:hover {
  border-color: rgba(212, 175, 55, 0.4);
  background: rgba(212, 175, 55, 0.15);
}

.raise-slider {
  width: 100px;
  accent-color: #d4af37;
  height: 4px;
}

.slider-value {
  font-size: 0.7rem;
  color: #d4af37;
  font-weight: 600;
  min-width: 30px;
  text-align: center;
}

/* Buttons */
.action-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
  font-family: inherit;
  white-space: nowrap;
  flex-shrink: 0;
}

.action-btn:active { transform: scale(0.95); }

.btn-shine {
  position: absolute;
  top: 0; left: -100%;
  width: 60%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s ease;
  pointer-events: none;
}

.action-btn:hover .btn-shine { left: 120%; }

.fold {
  background: linear-gradient(135deg, #2a2a3a, #1a1a28);
  color: #8b8baf;
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.fold:hover { color: #c0c0da; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4); transform: translateY(-2px); }

.check {
  background: linear-gradient(135deg, #1a4a2e, #0d3820);
  color: #6ee7b7;
  border: 1px solid rgba(110, 231, 183, 0.15);
}
.check:hover { box-shadow: 0 4px 20px rgba(110, 231, 183, 0.15); transform: translateY(-2px); }

.call {
  background: linear-gradient(135deg, #1e3a6e, #162d5a);
  color: #93c5fd;
  border: 1px solid rgba(147, 197, 253, 0.15);
}
.call:hover { box-shadow: 0 4px 20px rgba(147, 197, 253, 0.15); transform: translateY(-2px); }

.raise {
  background: linear-gradient(135deg, #d4af37, #b8941f);
  color: #0a0910;
  border: none;
}
.raise:hover { box-shadow: 0 4px 24px rgba(212, 175, 55, 0.35); transform: translateY(-2px); }

.allin {
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  color: #e8e0f0;
  border: 1px solid rgba(139, 92, 246, 0.3);
  position: relative;
}
.allin:hover { box-shadow: 0 4px 24px rgba(139, 92, 246, 0.3); transform: translateY(-2px); }

.allin-glow {
  position: absolute; inset: 0;
  border-radius: 10px;
  animation: allin-ring 2s ease infinite;
  border: 2px solid rgba(139, 92, 246, 0.4);
  pointer-events: none;
}

@keyframes allin-ring {
  0% { opacity: 0.6; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.08); }
}

/* Transition */
.bar-slide-enter-active { animation: bar-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.bar-slide-leave-active { animation: bar-up 0.25s ease reverse; }

@keyframes bar-up {
  from { opacity: 0; transform: translateY(100%); }
  to { opacity: 1; transform: translateY(0); }
}

/* Responsive */
@media (max-width: 768px) {
  .action-bar { padding: 8px 10px 14px; }
  .action-row { flex-wrap: wrap; gap: 6px; justify-content: center; }
  .action-main { gap: 5px; flex-wrap: wrap; justify-content: center; }
  .action-btn { padding: 10px 16px; font-size: 0.8rem; min-width: 0; }
  .raise-block { padding: 5px 8px; flex-wrap: wrap; justify-content: center; gap: 5px; }
  .slider-row { gap: 4px; width: 100%; }
  .raise-slider { width: 80px; flex: 1; }
  .preset-btn { padding: 3px 6px; font-size: 0.55rem; }
  .slider-value { font-size: 0.65rem; min-width: 24px; }
}

@media (max-width: 430px) {
  .action-bar { padding: 6px 8px 12px; }
  .action-btn { padding: 8px 10px; font-size: 0.65rem; letter-spacing: 0; border-radius: 8px; }
  .raise-block { width: 100%; padding: 4px 6px; }
  .slider-row { flex-wrap: nowrap; width: 100%; }
  .raise-presets { gap: 2px; }
  .preset-btn { padding: 2px 5px; font-size: 0.5rem; }
  .raise-slider { flex: 1; }
  .slider-value { font-size: 0.55rem; }
}

@media (max-height: 500px) and (orientation: landscape) {
  .action-bar { padding: 4px 10px 8px; }
  .action-btn { padding: 6px 12px; font-size: 0.65rem; border-radius: 6px; }
  .raise-block { padding: 3px 6px; }
  .preset-btn { padding: 2px 4px; font-size: 0.45rem; }
}
</style>
