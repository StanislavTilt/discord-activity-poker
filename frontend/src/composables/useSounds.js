import { ref } from 'vue';

const enabled = ref(true);
const volume = ref(0.4);
let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// === SOUND GENERATORS ===

// Card deal — short "flick" sound
function playCardDeal() {
  if (!enabled.value) return;
  const ctx = getCtx();
  const noise = ctx.createBufferSource();
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const t = i / data.length;
    data[i] = (Math.random() * 2 - 1) * (1 - t) * 0.6;
    // High-pass feel
    if (i > 0) data[i] = data[i] * 0.4 + data[i - 1] * 0.2;
  }
  noise.buffer = buf;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 2000;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume.value * 0.7, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start();
}

// Card flip — slightly longer whoosh
function playCardFlip() {
  if (!enabled.value) return;
  const ctx = getCtx();
  const noise = ctx.createBufferSource();
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const t = i / data.length;
    data[i] = (Math.random() * 2 - 1) * Math.sin(t * Math.PI) * 0.5;
  }
  noise.buffer = buf;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 3000;
  filter.Q.value = 1;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume.value * 0.6, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start();
}

// Chips — clinking ceramic/plastic sound
function playChips() {
  if (!enabled.value) return;
  const ctx = getCtx();

  // Multiple overlapping tones for chip clink
  const freqs = [3200, 4800, 6400];
  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq + Math.random() * 400;

    const gain = ctx.createGain();
    const t = ctx.currentTime + idx * 0.015;
    gain.gain.setValueAtTime(volume.value * 0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.07);
  });

  // Add noise layer
  const noise = ctx.createBufferSource();
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) * 0.3;
  }
  noise.buffer = buf;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 4000;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume.value * 0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start();
}

// Chip stack — heavier chips sound for big pots
function playChipStack() {
  if (!enabled.value) return;
  const ctx = getCtx();

  for (let i = 0; i < 4; i++) {
    const delay = i * 0.04 + Math.random() * 0.02;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 2500 + Math.random() * 2000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume.value * 0.2, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + 0.09);
  }
}

// Check/tap — soft knock
function playCheck() {
  if (!enabled.value) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 800;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume.value * 0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.11);
}

// Fold — soft swipe
function playFold() {
  if (!enabled.value) return;
  const ctx = getCtx();
  const noise = ctx.createBufferSource();
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const t = i / data.length;
    data[i] = (Math.random() * 2 - 1) * (1 - t) * t * 4 * 0.3;
  }
  noise.buffer = buf;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 2000;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume.value * 0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start();
}

// All-in — dramatic rising tone
function playAllIn() {
  if (!enabled.value) return;
  const ctx = getCtx();

  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(500, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 0.3);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume.value * 0.25, ctx.currentTime);
  gain.gain.setValueAtTime(volume.value * 0.3, ctx.currentTime + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.45);

  // Chip stack on top
  setTimeout(() => playChipStack(), 200);
}

// Win — triumphant chord
function playWin() {
  if (!enabled.value) return;
  const ctx = getCtx();

  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    const t = ctx.currentTime + idx * 0.1;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume.value * 0.2, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.65);
  });
}

// Timer tick — subtle tick near end
function playTick() {
  if (!enabled.value) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 1000;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume.value * 0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.06);
}

// Your turn — notification ding
function playYourTurn() {
  if (!enabled.value) return;
  const ctx = getCtx();

  [880, 1100].forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    const t = ctx.currentTime + idx * 0.12;
    gain.gain.setValueAtTime(volume.value * 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  });
}

// Blinds change — alert horn
function playBlindsChange() {
  if (!enabled.value) return;
  const ctx = getCtx();

  [440, 554, 659].forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;

    const gain = ctx.createGain();
    const t = ctx.currentTime + idx * 0.08;
    gain.gain.setValueAtTime(volume.value * 0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.35);
  });
}

export function useSounds() {
  return {
    enabled,
    volume,
    playCardDeal,
    playCardFlip,
    playChips,
    playChipStack,
    playCheck,
    playFold,
    playAllIn,
    playWin,
    playTick,
    playYourTurn,
    playBlindsChange
  };
}
