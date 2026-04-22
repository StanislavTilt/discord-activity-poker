<template>
  <div class="animated-bg" :class="`theme-${theme}`">
    <!-- Частицы (золото) -->
    <template v-if="theme === 'particles'">
      <div class="particles-layer">
        <span v-for="i in 60" :key="i" class="gold-particle" :style="goldParticle(i)"></span>
      </div>
      <!-- Большие плавающие карточные масти -->
      <div class="floating-suits">
        <span v-for="i in 8" :key="i" class="floating-suit" :style="floatingSuit(i)">{{ suits[i % 4] }}</span>
      </div>
      <div class="glow glow-1"></div>
      <div class="glow glow-2"></div>
      <div class="glow glow-3"></div>
    </template>

    <!-- Туманность -->
    <template v-if="theme === 'nebula'">
      <div class="nebula-clouds">
        <div class="nebula-cloud c1"></div>
        <div class="nebula-cloud c2"></div>
        <div class="nebula-cloud c3"></div>
        <div class="nebula-cloud c4"></div>
        <div class="nebula-cloud c5"></div>
      </div>
      <div class="particles-layer">
        <span v-for="i in 80" :key="i" class="star-particle" :style="starParticle(i)"></span>
      </div>
      <div class="particles-layer">
        <span v-for="i in 12" :key="'sh'+i" class="shooting-star" :style="shootingStar(i)"></span>
      </div>
    </template>

    <!-- Северное сияние -->
    <template v-if="theme === 'aurora'">
      <div class="aurora-waves">
        <div class="aurora-wave w1"></div>
        <div class="aurora-wave w2"></div>
        <div class="aurora-wave w3"></div>
        <div class="aurora-wave w4"></div>
        <div class="aurora-wave w5"></div>
        <div class="aurora-wave w6"></div>
      </div>
      <div class="particles-layer">
        <span v-for="i in 50" :key="i" class="aurora-dot" :style="auroraDot(i)"></span>
      </div>
      <div class="aurora-shimmer"></div>
    </template>

    <!-- Огонь -->
    <template v-if="theme === 'fire'">
      <div class="fire-layer">
        <div class="fire-ember" v-for="i in 70" :key="i" :style="fireEmber(i)"></div>
      </div>
      <div class="fire-layer">
        <div class="fire-spark" v-for="i in 20" :key="'sp'+i" :style="fireSpark(i)"></div>
      </div>
      <div class="fire-glow"></div>
      <div class="fire-glow-2"></div>
      <div class="fire-glow-3"></div>
    </template>

    <!-- Матрица -->
    <template v-if="theme === 'matrix'">
      <div class="matrix-layer">
        <div class="matrix-col" v-for="i in 35" :key="i" :style="matrixCol(i)">
          <span v-for="j in 18" :key="j" class="matrix-char" :style="matrixChar(j)">{{ randomChar() }}</span>
        </div>
      </div>
      <div class="matrix-scan"></div>
    </template>

    <!-- Океан -->
    <template v-if="theme === 'ocean'">
      <div class="ocean-layer">
        <div class="ocean-wave ow1"></div>
        <div class="ocean-wave ow2"></div>
        <div class="ocean-wave ow3"></div>
        <div class="ocean-wave ow4"></div>
        <div class="ocean-wave ow5"></div>
      </div>
      <div class="particles-layer">
        <span v-for="i in 50" :key="i" class="bubble" :style="bubble(i)"></span>
      </div>
      <div class="ocean-light-rays">
        <div v-for="i in 5" :key="i" class="light-ray" :style="lightRay(i)"></div>
      </div>
    </template>
  </div>
</template>

<script setup>
defineProps({
  theme: { type: String, default: 'particles' }
});

const suits = ['♠', '♥', '♦', '♣'];

function goldParticle(i) {
  const size = 2 + Math.random() * 6;
  return {
    left: Math.random() * 100 + '%',
    width: size + 'px',
    height: size + 'px',
    animationDelay: (Math.random() * 10) + 's',
    animationDuration: (4 + Math.random() * 8) + 's',
    filter: size > 5 ? 'blur(1px)' : 'none'
  };
}

function floatingSuit(i) {
  return {
    left: (10 + Math.random() * 80) + '%',
    animationDelay: (Math.random() * 15) + 's',
    animationDuration: (12 + Math.random() * 10) + 's',
    fontSize: (20 + Math.random() * 30) + 'px',
    opacity: 0.03 + Math.random() * 0.05
  };
}

function starParticle(i) {
  const size = 1 + Math.random() * 3;
  return {
    left: Math.random() * 100 + '%',
    top: Math.random() * 100 + '%',
    width: size + 'px',
    height: size + 'px',
    animationDelay: (Math.random() * 6) + 's',
    animationDuration: (1.5 + Math.random() * 4) + 's',
    boxShadow: size > 2 ? `0 0 ${size * 2}px rgba(255,255,255,0.3)` : 'none'
  };
}

function shootingStar(i) {
  return {
    top: (Math.random() * 60) + '%',
    left: (Math.random() * 80) + '%',
    animationDelay: (Math.random() * 20) + 's',
    animationDuration: (0.6 + Math.random() * 0.8) + 's'
  };
}

function auroraDot(i) {
  return {
    left: Math.random() * 100 + '%',
    animationDelay: (Math.random() * 8) + 's',
    animationDuration: (5 + Math.random() * 6) + 's',
    width: (2 + Math.random() * 4) + 'px',
    height: (2 + Math.random() * 4) + 'px'
  };
}

function fireEmber(i) {
  const size = 2 + Math.random() * 8;
  const colors = ['rgba(255,160,20,0.9)', 'rgba(255,80,0,0.8)', 'rgba(255,220,50,0.7)', 'rgba(255,50,0,0.6)'];
  return {
    left: (5 + Math.random() * 90) + '%',
    animationDelay: (Math.random() * 5) + 's',
    animationDuration: (1.5 + Math.random() * 3) + 's',
    width: size + 'px',
    height: size + 'px',
    background: `radial-gradient(circle, ${colors[Math.floor(Math.random() * colors.length)]}, transparent)`
  };
}

function fireSpark(i) {
  return {
    left: (20 + Math.random() * 60) + '%',
    animationDelay: (Math.random() * 6) + 's',
    animationDuration: (0.5 + Math.random() * 1.5) + 's'
  };
}

function matrixCol(i) {
  return {
    left: (i * 2.85) + '%',
    animationDelay: (Math.random() * 10) + 's',
    animationDuration: (3 + Math.random() * 7) + 's'
  };
}

function matrixChar(j) {
  return {
    animationDelay: (j * 0.1 + Math.random() * 0.5) + 's',
    animationDuration: (1 + Math.random() * 2) + 's'
  };
}

function randomChar() {
  const chars = '01アイウエオカキクケコサシスセソタチツテト♠♥♦♣AKQJ10ラリルレロ';
  return chars[Math.floor(Math.random() * chars.length)];
}

function bubble(i) {
  const size = 3 + Math.random() * 12;
  return {
    left: Math.random() * 100 + '%',
    width: size + 'px',
    height: size + 'px',
    animationDelay: (Math.random() * 12) + 's',
    animationDuration: (5 + Math.random() * 8) + 's',
    borderWidth: (size > 8 ? 2 : 1) + 'px'
  };
}

function lightRay(i) {
  return {
    left: (10 + i * 18) + '%',
    animationDelay: (i * 1.5) + 's',
    animationDuration: (6 + Math.random() * 4) + 's',
    width: (30 + Math.random() * 50) + 'px',
    opacity: 0.03 + Math.random() * 0.04
  };
}
</script>

<style scoped>
.animated-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.particles-layer {
  position: absolute;
  inset: 0;
}

/* ===== PARTICLES (GOLD) ===== */
.theme-particles { background: #06060a; }

.gold-particle {
  position: absolute;
  bottom: -10px;
  background: radial-gradient(circle, rgba(212, 175, 55, 0.9), rgba(212, 175, 55, 0) 70%);
  border-radius: 50%;
  animation: float-up linear infinite;
  opacity: 0;
}

.floating-suits {
  position: absolute;
  inset: 0;
}

.floating-suit {
  position: absolute;
  bottom: -50px;
  color: rgba(212, 175, 55, 0.06);
  animation: suit-float linear infinite;
  pointer-events: none;
}

@keyframes suit-float {
  0% { transform: translateY(0) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(-110vh) rotate(360deg); opacity: 0; }
}

.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  animation: glow-drift 12s ease-in-out infinite alternate;
}

.glow-1 { width: 500px; height: 500px; background: rgba(212, 175, 55, 0.08); top: 15%; left: 5%; }
.glow-2 { width: 400px; height: 400px; background: rgba(139, 92, 246, 0.07); bottom: 15%; right: 10%; animation-delay: -6s; }
.glow-3 { width: 350px; height: 350px; background: rgba(220, 38, 38, 0.04); top: 50%; left: 50%; animation-delay: -3s; animation-duration: 15s; }

@keyframes glow-drift {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(60px, -40px) scale(1.3); }
}

@keyframes float-up {
  0% { transform: translateY(0) scale(0); opacity: 0; }
  8% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; }
  100% { transform: translateY(-110vh) scale(0.15); opacity: 0; }
}

/* ===== NEBULA ===== */
.theme-nebula { background: #030010; }

.nebula-clouds { position: absolute; inset: 0; }

.nebula-cloud {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  animation: nebula-pulse ease-in-out infinite alternate;
}

.c1 { width: 550px; height: 550px; background: rgba(139, 92, 246, 0.15); top: 5%; left: 15%; animation-duration: 10s; }
.c2 { width: 450px; height: 450px; background: rgba(236, 72, 153, 0.12); top: 35%; right: 5%; animation-duration: 14s; animation-delay: -4s; }
.c3 { width: 400px; height: 400px; background: rgba(59, 130, 246, 0.1); bottom: 5%; left: 25%; animation-duration: 12s; animation-delay: -8s; }
.c4 { width: 300px; height: 300px; background: rgba(168, 85, 247, 0.08); top: 60%; left: 60%; animation-duration: 16s; animation-delay: -2s; }
.c5 { width: 350px; height: 350px; background: rgba(244, 114, 182, 0.06); top: 20%; right: 30%; animation-duration: 18s; animation-delay: -10s; }

@keyframes nebula-pulse {
  0% { transform: scale(1) translate(0, 0); opacity: 0.5; }
  100% { transform: scale(1.4) translate(40px, -25px); opacity: 1; }
}

.star-particle {
  position: absolute;
  background: white;
  border-radius: 50%;
  animation: star-twinkle ease-in-out infinite;
}

@keyframes star-twinkle {
  0%, 100% { opacity: 0.05; transform: scale(0.3); }
  50% { opacity: 1; transform: scale(1.3); }
}

.shooting-star {
  position: absolute;
  width: 2px;
  height: 2px;
  background: white;
  border-radius: 50%;
  animation: shoot linear infinite;
  opacity: 0;
}

@keyframes shoot {
  0% { transform: translate(0, 0) scale(1); opacity: 0; box-shadow: none; }
  5% { opacity: 1; box-shadow: -30px 0 20px 1px rgba(255,255,255,0.3), -60px 0 10px rgba(255,255,255,0.1); }
  15% { opacity: 1; }
  30% { transform: translate(150px, 80px) scale(0); opacity: 0; box-shadow: none; }
  100% { transform: translate(150px, 80px) scale(0); opacity: 0; }
}

/* ===== AURORA ===== */
.theme-aurora { background: #020e10; }

.aurora-waves { position: absolute; inset: 0; }

.aurora-wave {
  position: absolute;
  width: 200%;
  height: 35%;
  left: -50%;
  border-radius: 50%;
  filter: blur(50px);
  animation: aurora-move ease-in-out infinite;
  mix-blend-mode: screen;
}

.w1 { top: 3%; background: linear-gradient(90deg, transparent 5%, rgba(16, 185, 129, 0.2) 25%, rgba(6, 182, 212, 0.15) 50%, rgba(52, 211, 153, 0.12) 75%, transparent 95%); animation-duration: 7s; }
.w2 { top: 12%; background: linear-gradient(90deg, transparent 10%, rgba(6, 182, 212, 0.15) 30%, rgba(34, 197, 94, 0.2) 55%, rgba(16, 185, 129, 0.1) 80%, transparent 95%); animation-duration: 11s; animation-delay: -3s; }
.w3 { top: 6%; background: linear-gradient(90deg, transparent 0%, rgba(52, 211, 153, 0.1) 20%, rgba(139, 92, 246, 0.15) 45%, rgba(6, 182, 212, 0.15) 70%, transparent 90%); animation-duration: 14s; animation-delay: -7s; }
.w4 { top: 18%; background: linear-gradient(90deg, transparent 15%, rgba(45, 212, 191, 0.12) 35%, rgba(16, 185, 129, 0.1) 55%, transparent 75%); animation-duration: 9s; animation-delay: -5s; }
.w5 { top: 25%; background: linear-gradient(90deg, transparent 20%, rgba(34, 197, 94, 0.08) 40%, rgba(6, 182, 212, 0.12) 65%, transparent 85%); animation-duration: 16s; animation-delay: -9s; }
.w6 { top: 0%; background: linear-gradient(90deg, transparent 10%, rgba(139, 92, 246, 0.08) 30%, rgba(52, 211, 153, 0.1) 60%, transparent 80%); animation-duration: 20s; animation-delay: -12s; }

@keyframes aurora-move {
  0% { transform: translateX(-20%) scaleY(1); }
  50% { transform: translateX(20%) scaleY(1.6); }
  100% { transform: translateX(-20%) scaleY(1); }
}

.aurora-dot {
  position: absolute;
  bottom: -5px;
  background: radial-gradient(circle, rgba(52, 211, 153, 0.7), transparent);
  border-radius: 50%;
  animation: float-up linear infinite;
  opacity: 0;
}

.aurora-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(52, 211, 153, 0.02) 0%, transparent 40%, transparent 60%, rgba(6, 182, 212, 0.015) 100%);
  animation: shimmer-pulse 4s ease-in-out infinite alternate;
}

@keyframes shimmer-pulse {
  0% { opacity: 0.3; }
  100% { opacity: 1; }
}

/* ===== FIRE ===== */
.theme-fire { background: #080100; }

.fire-layer { position: absolute; inset: 0; }

.fire-ember {
  position: absolute;
  bottom: -10px;
  border-radius: 50%;
  animation: ember-rise linear infinite;
}

@keyframes ember-rise {
  0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 0; }
  8% { opacity: 1; }
  35% { opacity: 0.8; }
  100% { transform: translateY(-110vh) scale(0.05) rotate(400deg); opacity: 0; }
}

.fire-spark {
  position: absolute;
  bottom: 0;
  width: 3px;
  height: 3px;
  background: #ffe066;
  border-radius: 50%;
  animation: spark-burst ease-out infinite;
  opacity: 0;
}

@keyframes spark-burst {
  0% { transform: translateY(0) scale(0); opacity: 0; }
  10% { opacity: 1; transform: scale(1.5); }
  100% { transform: translateY(-50vh) translateX(calc(-50px + 100px * var(--r, 0.5))) scale(0); opacity: 0; }
}

.fire-glow {
  position: absolute;
  bottom: -120px; left: 50%; transform: translateX(-50%);
  width: 800px; height: 400px;
  background: radial-gradient(ellipse, rgba(255, 100, 0, 0.2) 0%, rgba(255, 50, 0, 0.1) 40%, transparent 70%);
  filter: blur(40px);
  animation: fire-breathe 2.5s ease-in-out infinite alternate;
}

.fire-glow-2 {
  position: absolute;
  bottom: -60px; left: 50%; transform: translateX(-50%);
  width: 600px; height: 250px;
  background: radial-gradient(ellipse, rgba(255, 200, 0, 0.15) 0%, transparent 60%);
  filter: blur(50px);
  animation: fire-breathe 3.5s ease-in-out infinite alternate;
  animation-delay: -1.5s;
}

.fire-glow-3 {
  position: absolute;
  bottom: -80px; left: 30%; transform: translateX(-50%);
  width: 400px; height: 200px;
  background: radial-gradient(ellipse, rgba(255, 60, 0, 0.12) 0%, transparent 60%);
  filter: blur(60px);
  animation: fire-breathe 4s ease-in-out infinite alternate;
  animation-delay: -3s;
}

@keyframes fire-breathe {
  0% { opacity: 0.5; transform: translateX(-50%) scaleX(0.85); }
  100% { opacity: 1; transform: translateX(-50%) scaleX(1.15); }
}

/* ===== MATRIX ===== */
.theme-matrix { background: #000300; }

.matrix-layer { position: absolute; inset: 0; overflow: hidden; }

.matrix-col {
  position: absolute;
  top: -120%;
  display: flex;
  flex-direction: column;
  animation: matrix-fall linear infinite;
}

@keyframes matrix-fall {
  0% { transform: translateY(0); }
  100% { transform: translateY(220vh); }
}

.matrix-char {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.4;
  color: rgba(0, 255, 65, 0.8);
  text-shadow: 0 0 10px rgba(0, 255, 65, 0.5), 0 0 20px rgba(0, 255, 65, 0.2);
  animation: char-fade ease-in-out infinite;
}

@keyframes char-fade {
  0%, 100% { opacity: 0.05; color: rgba(0, 255, 65, 0.3); }
  50% { opacity: 1; color: rgba(0, 255, 65, 1); }
}

.matrix-scan {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 255, 65, 0.03) 50%, transparent 100%);
  background-size: 100% 200%;
  animation: matrix-scan-move 4s linear infinite;
}

@keyframes matrix-scan-move {
  0% { background-position: 0% 0%; }
  100% { background-position: 0% 200%; }
}

/* ===== OCEAN ===== */
.theme-ocean { background: #010812; }

.ocean-layer { position: absolute; inset: 0; }

.ocean-wave {
  position: absolute;
  width: 200%;
  left: -50%;
  border-radius: 45%;
  animation: ocean-sway ease-in-out infinite;
}

.ow1 { bottom: -120px; height: 220px; background: rgba(14, 165, 233, 0.1); animation-duration: 6s; opacity: 0.6; }
.ow2 { bottom: -150px; height: 250px; background: rgba(59, 130, 246, 0.08); animation-duration: 10s; animation-delay: -3s; opacity: 0.5; }
.ow3 { bottom: -100px; height: 200px; background: rgba(6, 182, 212, 0.09); animation-duration: 8s; animation-delay: -6s; opacity: 0.5; }
.ow4 { bottom: -170px; height: 230px; background: rgba(37, 99, 235, 0.06); animation-duration: 13s; animation-delay: -2s; opacity: 0.4; }
.ow5 { bottom: -130px; height: 210px; background: rgba(14, 165, 233, 0.05); animation-duration: 16s; animation-delay: -8s; opacity: 0.4; }

@keyframes ocean-sway {
  0% { transform: translateX(-8%) rotate(-2deg); }
  50% { transform: translateX(8%) rotate(2deg); }
  100% { transform: translateX(-8%) rotate(-2deg); }
}

.bubble {
  position: absolute;
  bottom: -15px;
  border-radius: 50%;
  border-style: solid;
  border-color: rgba(147, 197, 253, 0.25);
  background: radial-gradient(circle at 30% 30%, rgba(147, 197, 253, 0.15), transparent 70%);
  animation: bubble-rise linear infinite;
  opacity: 0;
}

@keyframes bubble-rise {
  0% { transform: translateY(0) translateX(0) scale(0.3); opacity: 0; }
  8% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 0.5; transform: translateX(15px); }
  100% { transform: translateY(-110vh) translateX(-10px) scale(0.2); opacity: 0; }
}

.ocean-light-rays { position: absolute; inset: 0; }

.light-ray {
  position: absolute;
  top: 0;
  height: 100%;
  background: linear-gradient(180deg, rgba(147, 197, 253, 0.06) 0%, transparent 60%);
  animation: ray-sway ease-in-out infinite alternate;
  transform-origin: top center;
}

@keyframes ray-sway {
  0% { transform: rotate(-3deg) scaleX(1); opacity: 0.5; }
  100% { transform: rotate(3deg) scaleX(1.3); opacity: 1; }
}
</style>
