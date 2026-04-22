<template>
  <div class="card" :class="[faceDown ? 'face-down' : '', suitClass, `face-${faceStyle}`]">
    <template v-if="card">
      <div class="card-corner top-left">
        <span class="corner-rank">{{ card.rank }}</span>
        <span class="corner-suit">{{ suitSymbol }}</span>
      </div>
      <span class="card-center-suit">{{ suitSymbol }}</span>
      <div class="card-corner bottom-right">
        <span class="corner-rank">{{ card.rank }}</span>
        <span class="corner-suit">{{ suitSymbol }}</span>
      </div>
    </template>
    <div v-else class="card-back" :class="`skin-${skin}`">
      <div class="card-pattern">
        <div class="card-logo">{{ backLogo }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  card: { type: Object, default: null },
  skin: { type: String, default: 'classic' },
  faceStyle: { type: String, default: 'classic' }
});

const suitSymbols = { hearts: '\u2665', diamonds: '\u2666', clubs: '\u2663', spades: '\u2660' };
const suitSymbol = computed(() => props.card ? suitSymbols[props.card.suit] : '');
const suitClass = computed(() => props.card ? `suit-${props.card.suit}` : '');
const faceDown = computed(() => !props.card);

const backLogos = { classic: '\u2666', royal: '\u265a', neon: '\u2726', crimson: '\u2764', emerald: '\u2618', silver: '\u2605' };
const backLogo = computed(() => backLogos[props.skin] || '\u2666');
</script>

<style scoped>
.card {
  width: 56px;
  height: 80px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  position: relative;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
  flex-shrink: 0;
  animation: card-deal 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes card-deal {
  from { opacity: 0; transform: scale(0.5) rotate(-10deg); }
  to { opacity: 1; transform: scale(1) rotate(0); }
}

.card:hover { transform: translateY(-4px); }

/* ============================================ */
/* FACE STYLE 1: Classic — white, clean         */
/* ============================================ */
.face-classic:not(.face-down) {
  background: linear-gradient(145deg, #ffffff, #f5f3ed);
  border: 1px solid #d0c8b8;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.9);
}
.face-classic .card-center-suit { font-size: 1.6rem; }
.face-classic .corner-rank { font-size: 0.65rem; }
.face-classic .corner-suit { font-size: 0.55rem; }
.face-classic.suit-hearts, .face-classic.suit-diamonds { color: #dc2626; }
.face-classic.suit-clubs, .face-classic.suit-spades { color: #1a1a2e; }

/* ============================================ */
/* FACE STYLE 2: Dark — dark card, light text   */
/* ============================================ */
.face-dark:not(.face-down) {
  background: linear-gradient(145deg, #1a1a28, #12121e);
  border: 1px solid rgba(212, 175, 55, 0.2);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
.face-dark .card-center-suit { font-size: 1.8rem; text-shadow: 0 0 10px currentColor; }
.face-dark .corner-rank { font-size: 0.65rem; }
.face-dark .corner-suit { font-size: 0.55rem; }
.face-dark.suit-hearts, .face-dark.suit-diamonds { color: #f87171; }
.face-dark.suit-clubs, .face-dark.suit-spades { color: #c0c0e0; }

/* ============================================ */
/* FACE STYLE 3: Neon — dark bg, glowing text   */
/* ============================================ */
.face-neon:not(.face-down) {
  background: linear-gradient(145deg, #0a0a18, #080814);
  border: 1px solid rgba(0, 255, 200, 0.15);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5), 0 0 8px rgba(0, 255, 200, 0.05);
}
.face-neon .card-center-suit { font-size: 1.8rem; filter: drop-shadow(0 0 6px currentColor); }
.face-neon .corner-rank { font-size: 0.7rem; font-weight: 800; }
.face-neon .corner-suit { font-size: 0.55rem; filter: drop-shadow(0 0 4px currentColor); }
.face-neon.suit-hearts, .face-neon.suit-diamonds { color: #ff3a6e; }
.face-neon.suit-clubs, .face-neon.suit-spades { color: #00ffc8; }

/* ============================================ */
/* FACE STYLE 4: Vintage — aged paper look      */
/* ============================================ */
.face-vintage:not(.face-down) {
  background: linear-gradient(145deg, #f0e6d0, #e8dcc0, #ddd0b4);
  border: 1px solid #c0a880;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 0 15px rgba(139, 109, 60, 0.08);
}
.face-vintage .card-center-suit { font-size: 1.5rem; opacity: 0.85; }
.face-vintage .corner-rank { font-size: 0.7rem; font-family: 'Georgia', serif; }
.face-vintage .corner-suit { font-size: 0.5rem; }
.face-vintage.suit-hearts, .face-vintage.suit-diamonds { color: #a03030; }
.face-vintage.suit-clubs, .face-vintage.suit-spades { color: #2a2a20; }

/* ============================================ */
/* FACE STYLE 5: Luxury — gold accents          */
/* ============================================ */
.face-luxury:not(.face-down) {
  background: linear-gradient(145deg, #fefef8, #f8f4e8, #f0ecd8);
  border: 1.5px solid #d4af37;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2), 0 0 0 0.5px rgba(212, 175, 55, 0.3), inset 0 0 20px rgba(212, 175, 55, 0.03);
}
.face-luxury .card-center-suit { font-size: 1.7rem; }
.face-luxury .corner-rank { font-size: 0.7rem; font-weight: 800; letter-spacing: -0.5px; }
.face-luxury .corner-suit { font-size: 0.55rem; }
.face-luxury.suit-hearts, .face-luxury.suit-diamonds { color: #b91c1c; }
.face-luxury.suit-clubs, .face-luxury.suit-spades { color: #1a1a1a; }

/* ============================================ */
/* CARD LAYOUT — corners & center               */
/* ============================================ */
.card-corner {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
  gap: 0px;
}

.top-left { top: 4px; left: 5px; }
.bottom-right { bottom: 4px; right: 5px; transform: rotate(180deg); }

.card-center-suit {
  font-size: 1.6rem;
  line-height: 1;
}

.corner-rank { font-size: 0.65rem; line-height: 1; }
.corner-suit { font-size: 0.5rem; line-height: 1; }

/* ============================================ */
/* FACE DOWN (back side)                        */
/* ============================================ */
.face-down { box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3); }

.card-back {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; border-radius: 6px;
}

.card-pattern {
  width: 38px; height: 58px;
  border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
}

.card-logo { font-size: 1.2rem; }

/* === BACK SKINS === */
.skin-classic { background: linear-gradient(135deg, #1a0a2e, #0d0418, #2a1040); border: 1.5px solid rgba(212, 175, 55, 0.3); }
.skin-classic .card-pattern { border: 1.5px solid rgba(212, 175, 55, 0.25); background: repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(212, 175, 55, 0.05) 3px, rgba(212, 175, 55, 0.05) 6px); }
.skin-classic .card-logo { color: rgba(212, 175, 55, 0.4); }

.skin-royal { background: linear-gradient(135deg, #1a0a00, #2a1500, #1a0800); border: 1.5px solid rgba(255, 200, 50, 0.4); }
.skin-royal .card-pattern { border: 1.5px solid rgba(255, 200, 50, 0.3); background: repeating-conic-gradient(rgba(255, 200, 50, 0.04) 0% 25%, transparent 0% 50%) 0 0 / 8px 8px; }
.skin-royal .card-logo { color: rgba(255, 200, 50, 0.5); font-size: 1.4rem; }

.skin-neon { background: linear-gradient(135deg, #0a001a, #15002a, #0a0020); border: 1.5px solid rgba(0, 255, 200, 0.3); box-shadow: inset 0 0 15px rgba(0, 255, 200, 0.05); }
.skin-neon .card-pattern { border: 1.5px solid rgba(0, 255, 200, 0.25); background: repeating-linear-gradient(30deg, transparent, transparent 3px, rgba(0, 255, 200, 0.06) 3px, rgba(0, 255, 200, 0.06) 6px); }
.skin-neon .card-logo { color: rgba(0, 255, 200, 0.5); text-shadow: 0 0 8px rgba(0, 255, 200, 0.4); }

.skin-crimson { background: linear-gradient(135deg, #1a0008, #2a0010, #1a0005); border: 1.5px solid rgba(220, 38, 38, 0.35); }
.skin-crimson .card-pattern { border: 1.5px solid rgba(220, 38, 38, 0.3); background: repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(220, 38, 38, 0.06) 3px, rgba(220, 38, 38, 0.06) 6px); }
.skin-crimson .card-logo { color: rgba(220, 38, 38, 0.5); }

.skin-emerald { background: linear-gradient(135deg, #001a0a, #002a12, #001a08); border: 1.5px solid rgba(16, 185, 129, 0.35); }
.skin-emerald .card-pattern { border: 1.5px solid rgba(16, 185, 129, 0.25); background: repeating-linear-gradient(60deg, transparent, transparent 4px, rgba(16, 185, 129, 0.06) 4px, rgba(16, 185, 129, 0.06) 8px); }
.skin-emerald .card-logo { color: rgba(16, 185, 129, 0.5); }

.skin-silver { background: linear-gradient(145deg, #14141e, #1e1e2a, #14141e); border: 1.5px solid rgba(200, 200, 220, 0.3); }
.skin-silver .card-pattern { border: 1.5px solid rgba(200, 200, 220, 0.2); background: repeating-conic-gradient(rgba(200, 200, 220, 0.03) 0% 25%, transparent 0% 50%) 0 0 / 6px 6px; }
.skin-silver .card-logo { color: rgba(200, 200, 220, 0.4); }
</style>
