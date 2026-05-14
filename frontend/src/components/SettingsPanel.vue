<template>
  <div class="settings-toggle" @click="open = !open">
    <span class="gear-icon">⚙</span>
  </div>

  <Transition name="panel-slide">
    <div v-if="open" class="settings-panel">
      <div class="panel-header">
        <span>Настройки</span>
        <button class="close-btn" @click="open = false">✕</button>
      </div>

      <!-- Звук -->
      <div class="section sound-section">
        <div class="sound-row">
          <span class="section-title" style="margin-bottom:0">Звук</span>
          <button class="sound-toggle" :class="{ on: soundOn }" @click="toggleSound">
            {{ soundOn ? '🔊' : '🔇' }}
          </button>
        </div>
        <div v-if="soundOn" class="volume-row">
          <span class="vol-label">Громкость</span>
          <input type="range" class="vol-slider" min="0" max="1" step="0.1" :value="soundVolume" @input="setVolume($event.target.value)" />
        </div>
      </div>

      <!-- Фон -->
      <div class="section">
        <div class="section-title">Фон</div>
        <div class="option-grid">
          <button
            v-for="bg in backgrounds"
            :key="bg.id"
            class="option-btn"
            :class="{ active: selectedBg === bg.id }"
            @click="selectBg(bg.id)"
          >
            <div class="option-preview" :style="{ background: bg.preview }"></div>
            <span>{{ bg.name }}</span>
          </button>
        </div>
      </div>

      <!-- Стол -->
      <div class="section">
        <div class="section-title">Стол</div>
        <div class="option-grid">
          <button
            v-for="t in tableThemes"
            :key="t.id"
            class="option-btn"
            :class="{ active: selectedTable === t.id }"
            @click="selectTable(t.id)"
          >
            <div class="table-preview">
              <div class="table-mini" :style="{ background: t.felt, borderColor: t.rim }"></div>
            </div>
            <span>{{ t.name }}</span>
          </button>
        </div>
      </div>

      <!-- Стиль карт (лицо) -->
      <div class="section">
        <div class="section-title">Стиль карт</div>
        <div class="option-grid">
          <button
            v-for="f in faceStyles"
            :key="f.id"
            class="option-btn"
            :class="{ active: selectedFace === f.id }"
            @click="selectFace(f.id)"
          >
            <div class="face-preview" :style="f.previewStyle">
              <span class="fp-rank" :style="{ color: f.rankColor }">A</span>
              <span class="fp-suit" :style="{ color: f.suitColor }">♠</span>
            </div>
            <span>{{ f.name }}</span>
          </button>
        </div>
      </div>

      <!-- Рубашка карт -->
      <div class="section">
        <div class="section-title">Рубашка карт</div>
        <div class="option-grid">
          <button
            v-for="skin in cardSkins"
            :key="skin.id"
            class="option-btn"
            :class="{ active: selectedSkin === skin.id }"
            @click="selectSkin(skin.id)"
          >
            <div class="card-preview" :style="{ background: skin.preview }">
              <div class="card-preview-pattern" :style="skin.patternStyle"></div>
            </div>
            <span>{{ skin.name }}</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref } from 'vue';
import { useSounds } from '../composables/useSounds.js';

const emit = defineEmits(['changeBg', 'changeSkin', 'changeTable', 'changeFace']);
const open = ref(false);
const soundsCtrl = useSounds();
const soundOn = ref(soundsCtrl.enabled.value);
const soundVolume = ref(soundsCtrl.volume.value);

function toggleSound() {
  soundOn.value = !soundOn.value;
  soundsCtrl.enabled.value = soundOn.value;
}

function setVolume(val) {
  soundVolume.value = parseFloat(val);
  soundsCtrl.volume.value = soundVolume.value;
}

const backgrounds = [
  { id: 'particles', name: 'Частицы', preview: 'linear-gradient(135deg, #06060a, #1a1a2e)' },
  { id: 'nebula', name: 'Туманность', preview: 'linear-gradient(135deg, #0a0020, #1a0040, #0a0020)' },
  { id: 'aurora', name: 'Северное сияние', preview: 'linear-gradient(135deg, #001a1a, #002a1a, #001a2a)' },
  { id: 'fire', name: 'Огонь', preview: 'linear-gradient(135deg, #1a0a00, #2a1000, #1a0500)' },
  { id: 'matrix', name: 'Матрица', preview: 'linear-gradient(135deg, #000a00, #001a00, #000a00)' },
  { id: 'ocean', name: 'Океан', preview: 'linear-gradient(135deg, #000a1a, #001030, #000a20)' }
];

const cardSkins = [
  { id: 'classic', name: 'Классика', preview: 'linear-gradient(135deg, #1a0a2e, #0d0418)', patternStyle: { border: '1.5px solid rgba(212,175,55,0.3)', background: 'repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(212,175,55,0.05) 3px,rgba(212,175,55,0.05) 6px)' } },
  { id: 'royal', name: 'Королевская', preview: 'linear-gradient(135deg, #1a0a00, #2a1500)', patternStyle: { border: '1.5px solid rgba(255,200,50,0.4)', background: 'repeating-linear-gradient(60deg,transparent,transparent 4px,rgba(255,200,50,0.08) 4px,rgba(255,200,50,0.08) 8px)' } },
  { id: 'neon', name: 'Неон', preview: 'linear-gradient(135deg, #0a001a, #15002a)', patternStyle: { border: '1.5px solid rgba(0,255,200,0.3)', background: 'repeating-linear-gradient(30deg,transparent,transparent 3px,rgba(0,255,200,0.06) 3px,rgba(0,255,200,0.06) 6px)' } },
  { id: 'crimson', name: 'Кармин', preview: 'linear-gradient(135deg, #1a0008, #2a0010)', patternStyle: { border: '1.5px solid rgba(220,38,38,0.35)', background: 'repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(220,38,38,0.06) 3px,rgba(220,38,38,0.06) 6px)' } },
  { id: 'emerald', name: 'Изумруд', preview: 'linear-gradient(135deg, #001a0a, #002a12)', patternStyle: { border: '1.5px solid rgba(16,185,129,0.35)', background: 'repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(16,185,129,0.06) 3px,rgba(16,185,129,0.06) 6px)' } },
  { id: 'silver', name: 'Серебро', preview: 'linear-gradient(135deg, #0a0a10, #1a1a24)', patternStyle: { border: '1.5px solid rgba(200,200,220,0.3)', background: 'repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(200,200,220,0.05) 3px,rgba(200,200,220,0.05) 6px)' } }
];

const tableThemes = [
  { id: 'classic', name: 'Классика', felt: 'radial-gradient(ellipse, #1a6b3c, #0a3a1e)', rim: '#2a1a0a' },
  { id: 'royal', name: 'Королевский', felt: 'radial-gradient(ellipse, #1a3d6b, #0a1e3a)', rim: '#1a1a3a' },
  { id: 'crimson', name: 'Кармин', felt: 'radial-gradient(ellipse, #6b1a2a, #3a0a15)', rim: '#2a0a0a' },
  { id: 'purple', name: 'Аметист', felt: 'radial-gradient(ellipse, #3d1a6b, #1e0a3a)', rim: '#1a0a2a' },
  { id: 'black', name: 'Чёрный', felt: 'radial-gradient(ellipse, #2a2a30, #121218)', rim: '#1a1a1a' },
  { id: 'gold', name: 'Золото', felt: 'radial-gradient(ellipse, #4a3a10, #2a1e08)', rim: '#3a2a0a' },
  { id: 'ocean', name: 'Океан', felt: 'radial-gradient(ellipse, #0a4a5a, #052a35)', rim: '#0a2030' },
  { id: 'emerald', name: 'Изумруд', felt: 'radial-gradient(ellipse, #0a5a3a, #053520)', rim: '#0a2a18' }
];

const selectedBg = ref('particles');
const selectedSkin = ref('classic');
const selectedTable = ref('classic');
const selectedFace = ref('classic');

const faceStyles = [
  { id: 'classic', name: 'Классика', previewStyle: { background: 'linear-gradient(145deg, #fff, #f5f3ed)', border: '1px solid #d0c8b8' }, rankColor: '#1a1a2e', suitColor: '#1a1a2e' },
  { id: 'dark', name: 'Тёмная', previewStyle: { background: 'linear-gradient(145deg, #1a1a28, #12121e)', border: '1px solid rgba(212,175,55,0.2)' }, rankColor: '#c0c0e0', suitColor: '#c0c0e0' },
  { id: 'neon', name: 'Неон', previewStyle: { background: 'linear-gradient(145deg, #0a0a18, #080814)', border: '1px solid rgba(0,255,200,0.15)' }, rankColor: '#00ffc8', suitColor: '#00ffc8' },
  { id: 'vintage', name: 'Винтаж', previewStyle: { background: 'linear-gradient(145deg, #f0e6d0, #e8dcc0)', border: '1px solid #c0a880' }, rankColor: '#2a2a20', suitColor: '#a03030' },
  { id: 'luxury', name: 'Люкс', previewStyle: { background: 'linear-gradient(145deg, #fefef8, #f0ecd8)', border: '1.5px solid #d4af37' }, rankColor: '#1a1a1a', suitColor: '#b91c1c' }
];

function selectBg(id) {
  selectedBg.value = id;
  emit('changeBg', id);
}

function selectSkin(id) {
  selectedSkin.value = id;
  emit('changeSkin', id);
}

function selectTable(id) {
  selectedTable.value = id;
  emit('changeTable', id);
}

function selectFace(id) {
  selectedFace.value = id;
  emit('changeFace', id);
}
</script>

<style scoped>
.settings-toggle {
  position: fixed;
  top: 12px;
  left: 12px;
  width: 36px;
  height: 36px;
  background: rgba(10, 9, 16, 0.8);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 150;
  transition: all 0.3s;
  backdrop-filter: blur(8px);
}

.settings-toggle:hover {
  border-color: rgba(212, 175, 55, 0.4);
  transform: rotate(45deg);
}

.gear-icon {
  font-size: 1.1rem;
  color: #d4af37;
}

.settings-panel {
  position: fixed;
  top: 56px;
  left: 12px;
  width: 220px;
  max-height: calc(100vh - 80px);
  overflow-y: auto;
  background: rgba(10, 9, 16, 0.92);
  border: 1px solid rgba(212, 175, 55, 0.12);
  border-radius: 14px;
  z-index: 150;
  backdrop-filter: blur(12px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}

.settings-panel::-webkit-scrollbar { width: 3px; }
.settings-panel::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.2); border-radius: 2px; }

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(212, 175, 55, 0.08);
  font-weight: 600;
  font-size: 0.85rem;
  color: #d4af37;
}

.close-btn {
  background: none;
  border: none;
  color: #5a5a7a;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 2px 6px;
  border-radius: 4px;
  transition: color 0.2s;
}

.close-btn:hover { color: #e8e0f0; }

.section {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.section:last-child { border-bottom: none; }

.section-title {
  font-size: 0.65rem;
  color: #5a5a7a;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
  font-weight: 600;
}

.option-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.option-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s;
  font-family: inherit;
}

.option-btn:hover {
  border-color: rgba(212, 175, 55, 0.2);
  background: rgba(255, 255, 255, 0.04);
}

.option-btn.active {
  border-color: rgba(212, 175, 55, 0.5);
  background: rgba(212, 175, 55, 0.08);
}

.option-btn span {
  font-size: 0.6rem;
  color: #7a7a9a;
  font-weight: 500;
}

.option-btn.active span { color: #d4af37; }

.option-preview {
  width: 100%;
  height: 28px;
  border-radius: 5px;
}

.card-preview {
  width: 28px;
  height: 40px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.card-preview-pattern {
  width: 18px;
  height: 28px;
  border-radius: 2px;
}

.face-preview {
  width: 32px;
  height: 44px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
}

.fp-rank { font-size: 0.7rem; font-weight: 800; line-height: 1; }
.fp-suit { font-size: 0.85rem; line-height: 1; }

.table-preview {
  width: 100%;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-mini {
  width: 60px;
  height: 24px;
  border-radius: 50% / 45%;
  border: 3px solid;
  box-shadow: inset 0 0 10px rgba(0,0,0,0.3);
}

/* Transition */
.panel-slide-enter-active { animation: panel-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.panel-slide-leave-active { animation: panel-in 0.2s ease reverse; }

@keyframes panel-in {
  from { opacity: 0; transform: translateY(-10px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.sound-section { padding: 10px 12px !important; }
.sound-row { display: flex; justify-content: space-between; align-items: center; }
.sound-toggle {
  width: 32px; height: 32px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(212,175,55,0.12);
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}
.sound-toggle.on { border-color: rgba(212,175,55,0.3); background: rgba(212,175,55,0.08); }
.sound-toggle:hover { border-color: rgba(212,175,55,0.4); }
.volume-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.vol-label { font-size: 0.6rem; color: #5a5a7a; }
.vol-slider { flex: 1; accent-color: #d4af37; height: 3px; }

@media (max-width: 768px) {
  .settings-panel { width: 180px; max-height: calc(100vh - 70px); }
  .option-grid { grid-template-columns: 1fr 1fr; gap: 4px; }
  .option-btn { padding: 4px; }
  .option-btn span { font-size: 0.5rem; }
  .option-preview { height: 22px; }
  .section { padding: 8px 10px; }
  .section-title { font-size: 0.55rem; margin-bottom: 6px; }
  .panel-header { padding: 8px 10px; font-size: 0.75rem; }
}
</style>
