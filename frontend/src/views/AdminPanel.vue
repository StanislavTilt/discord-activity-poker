<template>
  <div class="admin-panel">
    <div class="bg-particles">
      <span v-for="i in 20" :key="i" class="particle" :style="particleStyle(i)"></span>
    </div>

    <div class="admin-container" :class="{ 'fade-in': !loading }">
      <div class="logo-glow"></div>
      <h1 class="admin-title">
        <span class="title-icon">🃏</span>
        Покер — Админ-панель
      </h1>

      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <span>Загрузка...</span>
      </div>

      <div v-else-if="errorMsg" class="error-box animate-shake">
        <span class="error-icon">⚠️</span> {{ errorMsg }}
      </div>

      <template v-else>
        <div class="game-info">
          <span class="badge" :class="game.status">
            {{ statusLabel }}
          </span>
          <span class="game-id">Игра: <code>{{ gameId }}</code></span>
        </div>

        <!-- Настройки -->
        <div v-if="game.status === 'setup'" class="settings-form animate-slide-up">
          <h2>⚙️ Настройки игры</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>Малый блайнд</label>
              <input type="number" v-model.number="settings.smallBlind" min="1" />
            </div>
            <div class="form-group">
              <label>Большой блайнд</label>
              <input type="number" v-model.number="settings.bigBlind" min="2" />
            </div>
            <div class="form-group">
              <label>Время на ход (сек)</label>
              <input type="number" v-model.number="settings.roundTime" min="10" max="120" />
            </div>
            <div class="form-group">
              <label>Начальный стек</label>
              <input type="number" v-model.number="settings.startingStack" min="100" step="100" />
            </div>
            <div class="form-group">
              <label>Макс. игроков</label>
              <input type="number" v-model.number="settings.maxPlayers" min="2" max="9" />
            </div>
          </div>
          <div class="btn-group">
            <button class="btn btn-save" @click="saveSettings" :disabled="saving">
              <span class="btn-shine"></span>
              {{ saving ? 'Сохранение...' : '💾 Сохранить' }}
            </button>
            <button class="btn btn-register" @click="registerGame" :disabled="saving">
              <span class="btn-shine"></span>
              📢 Зарегистрировать игру
            </button>
          </div>
        </div>

        <!-- Ожидание игроков -->
        <div v-if="game.status === 'registered'" class="waiting-section animate-slide-up">
          <h2>⏳ Ожидание игроков</h2>
          <p class="hint">Игроки присоединяются через кнопку в Discord.</p>
          <div class="players-list">
            <TransitionGroup name="player-list">
              <div v-for="p in players" :key="p.discord_id" class="player-item">
                <img v-if="p.avatar_url" :src="p.avatar_url" class="player-avatar" />
                <div v-else class="player-avatar placeholder">{{ p.username[0] }}</div>
                <span class="player-name">{{ p.username }}</span>
                <span class="seat-badge">Место {{ p.seat + 1 }}</span>
              </div>
            </TransitionGroup>
            <div v-if="players.length === 0" class="no-players">
              <div class="no-players-icon">👥</div>
              Пока никто не присоединился
            </div>
          </div>
          <button
            class="btn btn-start"
            @click="startGame"
            :disabled="players.length < 2 || starting"
          >
            <span class="btn-shine"></span>
            <span class="btn-pulse" v-if="players.length >= 2"></span>
            {{ starting ? 'Запуск...' : `🚀 Запустить игру (${players.length} игроков)` }}
          </button>
        </div>

        <!-- Игра идёт -->
        <div v-if="game.status === 'playing'" class="playing-section animate-slide-up">
          <h2>🎮 Игра идёт</h2>
          <div class="players-list">
            <div v-for="p in players" :key="p.discord_id" class="player-item">
              <img v-if="p.avatar_url" :src="p.avatar_url" class="player-avatar" />
              <span class="player-name">{{ p.username }}</span>
              <span class="live-dot"></span>
            </div>
          </div>

          <!-- Смена блайндов -->
          <div class="blinds-control">
            <div class="blinds-header">🎰 Управление блайндами</div>
            <div class="blinds-current">
              Текущие: <strong>{{ game.small_blind }} / {{ game.big_blind }}</strong>
            </div>
            <div class="blinds-form">
              <div class="blind-input">
                <label>Малый</label>
                <input type="number" v-model.number="newSmallBlind" min="1" />
              </div>
              <div class="blind-input">
                <label>Большой</label>
                <input type="number" v-model.number="newBigBlind" min="2" />
              </div>
              <button class="btn btn-blinds" @click="changeBlinds" :disabled="changingBlinds">
                <span class="btn-shine"></span>
                {{ changingBlinds ? 'Применение...' : '🔥 Сменить блайнды' }}
              </button>
            </div>
            <!-- Быстрые пресеты -->
            <div class="blinds-presets">
              <button v-for="p in blindPresets" :key="p.label" class="preset-chip" @click="applyBlindPreset(p)">
                {{ p.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Игра завершена — результаты -->
        <div v-if="game.status === 'finished'" class="results-section animate-slide-up">
          <h2>🏆 Результаты игры</h2>

          <!-- Статистика -->
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-label">⏱️ Время игры</span>
              <span class="stat-val">{{ formatDuration(game.duration_ms) }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">🃏 Раздач</span>
              <span class="stat-val">{{ game.total_hands || 0 }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">💰 Стек</span>
              <span class="stat-val">{{ game.starting_stack }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">🎰 Блайнды</span>
              <span class="stat-val">{{ game.small_blind }}/{{ game.big_blind }}</span>
            </div>
          </div>

          <!-- Таблица мест -->
          <div class="standings-table">
            <div class="standings-header">📊 Таблица результатов</div>
            <div v-for="p in sortedPlayers" :key="p.discord_id" class="standing-item" :class="{ winner: p.final_place === 1 }">
              <span class="place-medal">{{ ['🥇','🥈','🥉'][p.final_place - 1] || p.final_place + '.' }}</span>
              <img v-if="p.avatar_url" :src="p.avatar_url" class="player-avatar sm" />
              <span class="player-name">{{ p.username }}</span>
              <span class="place-info">
                <span v-if="p.final_chips > 0" class="chips-badge">{{ p.final_chips }} фишек</span>
                <span v-else-if="p.eliminated_at_hand" class="elim-badge">вылет #{{ p.eliminated_at_hand }}</span>
              </span>
            </div>
          </div>

          <!-- Лог раздач -->
          <div v-if="gameLog && gameLog.hands && gameLog.hands.length > 0" class="hands-log">
            <div class="hands-header" @click="showHandsLog = !showHandsLog">
              📜 Лог раздач ({{ gameLog.hands.length }})
              <span class="toggle-icon">{{ showHandsLog ? '▲' : '▼' }}</span>
            </div>
            <div v-if="showHandsLog" class="hands-list">
              <div v-for="hand in gameLog.hands" :key="hand.handNumber" class="hand-card">
                <div class="hand-header" @click="hand._open = !hand._open">
                  <span class="hand-num">Раздача #{{ hand.handNumber }}</span>
                  <span class="hand-pot">Банк: {{ hand.pot }}</span>
                  <span class="hand-winner" v-if="hand.winners && hand.winners.length">
                    → {{ hand.winners.map(w => w.username).join(', ') }}
                    <span v-if="hand.winners[0]?.handResult" class="hand-combo">({{ hand.winners[0].handResult.rankName }})</span>
                  </span>
                  <span class="toggle-sm">{{ hand._open ? '▲' : '▼' }}</span>
                </div>

                <div v-if="hand._open" class="hand-details">
                  <!-- Карты игроков -->
                  <div class="hand-players">
                    <div v-for="hp in hand.players" :key="hp.discordId" class="hand-player-row">
                      <span class="hp-name">{{ hp.username }}</span>
                      <span class="hp-cards">
                        <span v-for="(c, ci) in hp.holeCards" :key="ci" class="mini-card" :class="cardColor(c)">{{ c.rank }}{{ suitIcon(c.suit) }}</span>
                      </span>
                      <span class="hp-chips">{{ hp.startChips }}</span>
                    </div>
                  </div>

                  <!-- Общие карты -->
                  <div v-if="hand.communityCards && hand.communityCards.length" class="hand-community">
                    <span class="comm-label">Борд:</span>
                    <span v-for="(c, ci) in hand.communityCards" :key="ci" class="mini-card" :class="cardColor(c)">{{ c.rank }}{{ suitIcon(c.suit) }}</span>
                  </div>

                  <!-- Действия -->
                  <div class="hand-actions">
                    <div v-for="(a, ai) in hand.actions" :key="ai" class="action-line">
                      <span class="act-phase">{{ phaseLabel(a.phase) }}</span>
                      <span class="act-player">{{ a.player }}</span>
                      <span class="act-action" :class="a.action">{{ actionLabel(a.action) }}</span>
                      <span v-if="a.amount > 0" class="act-amount">{{ a.amount }}</span>
                    </div>
                  </div>

                  <!-- Результат после раздачи -->
                  <div v-if="hand.playerResults" class="hand-after">
                    <div v-for="pr in hand.playerResults" :key="pr.discordId" class="after-row">
                      <span>{{ pr.username }}</span>
                      <span class="after-chips" :class="{ zero: pr.chips <= 0 }">{{ pr.chips }}</span>
                      <span v-if="pr.folded" class="after-tag fold">фолд</span>
                      <span v-if="pr.allIn" class="after-tag allin">all-in</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({ gameId: String });

const token = new URLSearchParams(window.location.search).get('token');
const API = '/api/admin/game';

const game = ref({});
const players = ref([]);
const loading = ref(true);
const errorMsg = ref('');
const saving = ref(false);
const starting = ref(false);
const gameLog = ref(null);
const showHandsLog = ref(false);
const newSmallBlind = ref(10);
const newBigBlind = ref(20);
const changingBlinds = ref(false);

const blindPresets = [
  { label: '10/20', sb: 10, bb: 20 },
  { label: '25/50', sb: 25, bb: 50 },
  { label: '50/100', sb: 50, bb: 100 },
  { label: '100/200', sb: 100, bb: 200 },
  { label: '200/400', sb: 200, bb: 400 },
  { label: '500/1000', sb: 500, bb: 1000 }
];
const settings = ref({
  smallBlind: 10,
  bigBlind: 20,
  roundTime: 30,
  startingStack: 1000,
  maxPlayers: 6
});

let pollTimer = null;

const statusLabel = computed(() => {
  const labels = { setup: 'Настройка', registered: 'Регистрация', playing: 'Идёт игра', finished: 'Завершена' };
  return labels[game.value.status] || game.value.status;
});

const sortedPlayers = computed(() => {
  return [...players.value].sort((a, b) => (a.final_place || 99) - (b.final_place || 99));
});

const suitIcons = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
function suitIcon(suit) { return suitIcons[suit] || ''; }
function cardColor(card) { return (card.suit === 'hearts' || card.suit === 'diamonds') ? 'red' : 'black'; }

const phaseLabels = { preflop: 'ПФ', flop: 'Ф', turn: 'Т', river: 'Р' };
function phaseLabel(phase) { return phaseLabels[phase] || phase; }

const actionLabels = { fold: 'фолд', check: 'чек', call: 'колл', raise: 'рейз', allin: 'ва-банк' };
function actionLabel(action) { return actionLabels[action] || action; }

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

function particleStyle(i) {
  const x = Math.random() * 100;
  const delay = Math.random() * 8;
  const dur = 6 + Math.random() * 8;
  const size = 2 + Math.random() * 4;
  return {
    left: x + '%',
    width: size + 'px',
    height: size + 'px',
    animationDelay: delay + 's',
    animationDuration: dur + 's'
  };
}

async function fetchGame() {
  try {
    const res = await fetch(`${API}/${props.gameId}?token=${token}`);
    if (!res.ok) throw new Error('Не удалось загрузить игру');
    const data = await res.json();
    game.value = data.game;
    players.value = data.players;
    settings.value = {
      smallBlind: data.game.small_blind,
      bigBlind: data.game.big_blind,
      roundTime: data.game.round_time,
      startingStack: data.game.starting_stack,
      maxPlayers: data.game.max_players
    };

    // If game is finished, load full results
    if (data.game.status === 'finished') {
      await fetchResults();
    }
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function changeBlinds() {
  if (newSmallBlind.value <= 0 || newBigBlind.value <= 0) return;
  changingBlinds.value = true;
  errorMsg.value = '';
  try {
    const url = `${API}/${props.gameId}/blinds?token=${token}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ smallBlind: newSmallBlind.value, bigBlind: newBigBlind.value })
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Сервер не отвечает. Проверьте что бэкенд запущен.');
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Не удалось сменить блайнды');
    await fetchGame();
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    changingBlinds.value = false;
  }
}

function applyBlindPreset(preset) {
  newSmallBlind.value = preset.sb;
  newBigBlind.value = preset.bb;
}

async function fetchResults() {
  try {
    const res = await fetch(`${API}/${props.gameId}/results?token=${token}`);
    if (res.ok) {
      const data = await res.json();
      if (data.gameLog) {
        // Add _open flag for accordion
        if (data.gameLog.hands) {
          data.gameLog.hands.forEach(h => { h._open = false; });
        }
        gameLog.value = data.gameLog;
      }
      if (data.players) {
        players.value = data.players;
      }
    }
  } catch { /* ignore */ }
}

async function saveSettings() {
  saving.value = true;
  try {
    const res = await fetch(`${API}/${props.gameId}/settings?token=${token}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings.value)
    });
    if (!res.ok) throw new Error('Не удалось сохранить');
    await fetchGame();
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    saving.value = false;
  }
}

async function registerGame() {
  saving.value = true;
  try {
    await fetch(`${API}/${props.gameId}/settings?token=${token}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings.value)
    });
    const res = await fetch(`${API}/${props.gameId}/register?token=${token}`, { method: 'POST' });
    if (!res.ok) throw new Error('Не удалось зарегистрировать');
    await fetchGame();
    startPolling();
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    saving.value = false;
  }
}

async function startGame() {
  starting.value = true;
  try {
    const res = await fetch(`${API}/${props.gameId}/start?token=${token}`, { method: 'POST' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Не удалось запустить');
    }
    await fetchGame();
    // Keep polling to detect game end
    startPolling();
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    starting.value = false;
  }
}

function startPolling() {
  stopPolling();
  pollTimer = setInterval(async () => {
    await fetchGame();
    // Stop polling when game is finished (results are loaded in fetchGame)
    if (game.value.status === 'finished') stopPolling();
  }, 3000);
}
function stopPolling() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }

onMounted(() => {
  fetchGame();
  setTimeout(() => {
    if (game.value.status === 'registered' || game.value.status === 'playing') startPolling();
  }, 1000);
});
</script>

<style scoped>
/* === BLACK OPIUM THEME === */
.admin-panel {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 20px;
  background: #06060a;
  position: relative;
  overflow: hidden;
}

.admin-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 50%, rgba(139, 92, 246, 0.06) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 20%, rgba(212, 175, 55, 0.05) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 80%, rgba(220, 38, 38, 0.04) 0%, transparent 50%);
  pointer-events: none;
}

.bg-particles { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.particle {
  position: absolute;
  bottom: -10px;
  background: radial-gradient(circle, rgba(212, 175, 55, 0.6), transparent);
  border-radius: 50%;
  animation: float-up linear infinite;
  opacity: 0;
}

@keyframes float-up {
  0% { transform: translateY(0) scale(0); opacity: 0; }
  15% { opacity: 0.8; transform: scale(1); }
  85% { opacity: 0.3; }
  100% { transform: translateY(-100vh) scale(0.3); opacity: 0; }
}

.admin-container {
  background: linear-gradient(165deg, #0d0d14 0%, #12101c 50%, #0a0910 100%);
  border-radius: 20px;
  padding: 44px;
  width: 100%;
  max-width: 620px;
  border: 1px solid rgba(212, 175, 55, 0.15);
  box-shadow:
    0 0 0 1px rgba(212, 175, 55, 0.05),
    0 25px 80px rgba(0, 0, 0, 0.7),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
  position: relative;
  z-index: 1;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.admin-container.fade-in {
  opacity: 1;
  transform: translateY(0);
}

.logo-glow {
  position: absolute;
  top: -80px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(212, 175, 55, 0.12) 0%, transparent 70%);
  pointer-events: none;
}

.admin-title {
  font-size: 1.6rem;
  margin-bottom: 28px;
  text-align: center;
  color: transparent;
  background: linear-gradient(135deg, #d4af37 0%, #f5e6a3 40%, #d4af37 70%, #b8941f 100%);
  -webkit-background-clip: text;
  background-clip: text;
  letter-spacing: 0.5px;
}

.title-icon {
  display: inline-block;
  animation: title-float 3s ease-in-out infinite;
}

@keyframes title-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.game-info {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(212, 175, 55, 0.1);
}

.badge {
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.badge.setup { background: rgba(100, 100, 140, 0.2); color: #8b8baf; border: 1px solid rgba(100, 100, 140, 0.3); }
.badge.registered { background: rgba(212, 175, 55, 0.15); color: #d4af37; border: 1px solid rgba(212, 175, 55, 0.3); animation: badge-pulse 2s infinite; }
.badge.playing { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); }

@keyframes badge-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.3); }
  50% { box-shadow: 0 0 12px 2px rgba(212, 175, 55, 0.15); }
}

.game-id { color: #5a5a7a; font-size: 0.9rem; }
.game-id code { color: #8b8baf; background: rgba(255, 255, 255, 0.04); padding: 2px 8px; border-radius: 6px; }

h2 {
  font-size: 1.2rem;
  margin-bottom: 20px;
  color: #e8e0f0;
  font-weight: 600;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-bottom: 28px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.form-group label {
  font-size: 0.8rem;
  color: #7a7a9a;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group input {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(212, 175, 55, 0.12);
  border-radius: 10px;
  padding: 12px 16px;
  color: #e8e0f0;
  font-size: 1rem;
  font-family: inherit;
  outline: none;
  transition: all 0.3s ease;
}

.form-group input:focus {
  border-color: rgba(212, 175, 55, 0.5);
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.08);
  background: rgba(255, 255, 255, 0.05);
}

.btn-group { display: flex; gap: 12px; }

.btn {
  padding: 13px 26px;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  font-family: inherit;
}

.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn:not(:disabled):hover { transform: translateY(-2px); }
.btn:not(:disabled):active { transform: translateY(0) scale(0.98); }

.btn-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
  transition: left 0.6s ease;
  pointer-events: none;
}

.btn:not(:disabled):hover .btn-shine { left: 120%; }

.btn-save {
  background: linear-gradient(135deg, #1a1a2e, #2a2a42);
  color: #b0b0d0;
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.btn-save:not(:disabled):hover { box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4); }

.btn-register {
  background: linear-gradient(135deg, #d4af37, #b8941f);
  color: #0a0910;
}
.btn-register:not(:disabled):hover { box-shadow: 0 6px 30px rgba(212, 175, 55, 0.35); }

.btn-start {
  background: linear-gradient(135deg, #d4af37, #f5d76e, #d4af37);
  background-size: 200% 100%;
  animation: shimmer 3s ease infinite;
  color: #0a0910;
  width: 100%;
  margin-top: 24px;
  padding: 16px;
  font-size: 1.1rem;
  font-weight: 700;
  position: relative;
}

.btn-start:not(:disabled):hover { box-shadow: 0 8px 40px rgba(212, 175, 55, 0.4); }

.btn-pulse {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  border: 2px solid rgba(212, 175, 55, 0.5);
  pointer-events: none;
}

@keyframes pulse-ring {
  0% { opacity: 0.6; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.08); }
}

@keyframes shimmer {
  0% { background-position: 200% center; }
  100% { background-position: -200% center; }
}

.hint { color: #5a5a7a; margin-bottom: 20px; font-size: 0.9rem; }

.players-list { display: flex; flex-direction: column; gap: 10px; }

.player-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px solid rgba(212, 175, 55, 0.08);
  transition: all 0.3s ease;
}

.player-item:hover {
  border-color: rgba(212, 175, 55, 0.2);
  background: rgba(255, 255, 255, 0.04);
}

.player-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid rgba(212, 175, 55, 0.3);
}

.player-avatar.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(212, 175, 55, 0.1);
  color: #d4af37;
  font-weight: 700;
}

.player-name { color: #e8e0f0; font-weight: 500; }

.seat-badge {
  margin-left: auto;
  font-size: 0.75rem;
  color: #5a5a7a;
  background: rgba(255, 255, 255, 0.03);
  padding: 3px 10px;
  border-radius: 8px;
}

.live-dot {
  margin-left: auto;
  width: 8px;
  height: 8px;
  background: #4ade80;
  border-radius: 50%;
  animation: live-blink 1.5s infinite;
}

@keyframes live-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.no-players {
  text-align: center;
  color: #3a3a5a;
  padding: 30px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.no-players-icon { font-size: 2rem; opacity: 0.4; }

.player-list-enter-active { animation: slide-in 0.4s ease; }
.player-list-leave-active { animation: slide-in 0.3s ease reverse; }

@keyframes slide-in {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

.animate-slide-up { animation: slide-up 0.5s ease; }

@keyframes slide-up {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-shake { animation: shake 0.5s ease; }

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px;
  color: #5a5a7a;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(212, 175, 55, 0.1);
  border-top-color: #d4af37;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.error-box {
  background: rgba(220, 38, 38, 0.1);
  color: #fca5a5;
  padding: 14px 18px;
  border-radius: 12px;
  border: 1px solid rgba(220, 38, 38, 0.2);
  display: flex;
  align-items: center;
  gap: 8px;
}

/* === BLINDS CONTROL === */
.blinds-control {
  margin-top: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(212, 175, 55, 0.1);
  border-radius: 12px;
}

.blinds-header {
  font-size: 0.9rem;
  font-weight: 600;
  color: #d4af37;
  margin-bottom: 10px;
}

.blinds-current {
  font-size: 0.8rem;
  color: #7a7a9a;
  margin-bottom: 12px;
}

.blinds-current strong { color: #f5e6a3; }

.blinds-form {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-bottom: 10px;
}

.blind-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.blind-input label {
  font-size: 0.7rem;
  color: #5a5a7a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.blind-input input {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(212, 175, 55, 0.12);
  border-radius: 8px;
  padding: 8px 10px;
  color: #e8e0f0;
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
  width: 100%;
  transition: border-color 0.3s;
}

.blind-input input:focus { border-color: rgba(212, 175, 55, 0.4); }

.btn-blinds {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  white-space: nowrap;
  padding: 10px 16px;
  flex-shrink: 0;
}

.btn-blinds:not(:disabled):hover {
  box-shadow: 0 4px 20px rgba(231, 76, 60, 0.4);
  transform: translateY(-2px);
}

.blinds-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.preset-chip {
  padding: 4px 10px;
  background: rgba(212, 175, 55, 0.06);
  border: 1px solid rgba(212, 175, 55, 0.12);
  border-radius: 16px;
  color: #d4af37;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.preset-chip:hover {
  background: rgba(212, 175, 55, 0.15);
  border-color: rgba(212, 175, 55, 0.3);
}

/* === RESULTS SECTION === */
.results-section h2 { margin-bottom: 16px; }

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(212, 175, 55, 0.08);
  border-radius: 10px;
}

.stat-label { font-size: 0.7rem; color: #5a5a7a; }
.stat-val { font-size: 1.1rem; font-weight: 700; color: #d4af37; }

.standings-table { margin-bottom: 20px; }

.standings-header {
  font-size: 0.85rem;
  font-weight: 600;
  color: #8b8baf;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(212, 175, 55, 0.08);
}

.standing-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.04);
  margin-bottom: 6px;
  transition: all 0.3s;
}

.standing-item.winner {
  background: rgba(212, 175, 55, 0.08);
  border-color: rgba(212, 175, 55, 0.2);
}

.place-medal { font-size: 1.2rem; min-width: 28px; text-align: center; }
.player-avatar.sm { width: 28px; height: 28px; }
.place-info { margin-left: auto; }
.chips-badge { color: #d4af37; font-weight: 600; font-size: 0.8rem; }
.elim-badge { color: #5a5a7a; font-size: 0.75rem; font-style: italic; }

/* Hands log */
.hands-log { margin-top: 16px; }

.hands-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(212, 175, 55, 0.08);
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  color: #d4af37;
  transition: background 0.2s;
}

.hands-header:hover { background: rgba(255, 255, 255, 0.04); }
.toggle-icon { font-size: 0.7rem; color: #5a5a7a; }

.hands-list { margin-top: 10px; display: flex; flex-direction: column; gap: 8px; }

.hand-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  overflow: hidden;
}

.hand-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.2s;
  flex-wrap: wrap;
}

.hand-header:hover { background: rgba(255, 255, 255, 0.03); }

.hand-num { font-weight: 600; color: #e8e0f0; font-size: 0.8rem; }
.hand-pot { color: #d4af37; font-size: 0.75rem; font-weight: 600; }
.hand-winner { color: #6ee7b7; font-size: 0.75rem; }
.hand-combo { color: #8b8baf; font-size: 0.7rem; }
.toggle-sm { margin-left: auto; font-size: 0.6rem; color: #5a5a7a; }

.hand-details { padding: 8px 12px 12px; border-top: 1px solid rgba(255, 255, 255, 0.04); }

.hand-players { margin-bottom: 8px; }

.hand-player-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
  font-size: 0.75rem;
}

.hp-name { color: #e8e0f0; min-width: 80px; font-weight: 500; }
.hp-cards { display: flex; gap: 3px; }
.hp-chips { margin-left: auto; color: #5a5a7a; }

.mini-card {
  padding: 1px 4px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 3px;
  font-size: 0.65rem;
  font-weight: 700;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.mini-card.red { color: #dc2626; }
.mini-card.black { color: #1a1a2e; }

.hand-community {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}

.comm-label { font-size: 0.7rem; color: #5a5a7a; margin-right: 4px; }

.hand-actions { margin-bottom: 8px; }

.action-line {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
  font-size: 0.7rem;
}

.act-phase {
  color: #5a5a7a;
  font-weight: 600;
  min-width: 22px;
  text-align: center;
  background: rgba(255, 255, 255, 0.03);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 0.6rem;
}

.act-player { color: #e8e0f0; min-width: 70px; }

.act-action {
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.65rem;
  text-transform: uppercase;
}

.act-action.fold { color: #8b8baf; background: rgba(100, 100, 140, 0.15); }
.act-action.check { color: #6ee7b7; background: rgba(110, 231, 183, 0.1); }
.act-action.call { color: #93c5fd; background: rgba(147, 197, 253, 0.1); }
.act-action.raise { color: #d4af37; background: rgba(212, 175, 55, 0.1); }
.act-action.allin { color: #c084fc; background: rgba(192, 132, 252, 0.1); }

.act-amount { color: #d4af37; font-weight: 600; }

.hand-after {
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  padding-top: 6px;
}

.after-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
  font-size: 0.7rem;
  color: #e8e0f0;
}

.after-chips { margin-left: auto; color: #d4af37; font-weight: 600; }
.after-chips.zero { color: #dc2626; }
.after-tag { font-size: 0.6rem; padding: 1px 4px; border-radius: 3px; }
.after-tag.fold { color: #8b8baf; background: rgba(100, 100, 140, 0.15); }
.after-tag.allin { color: #c084fc; background: rgba(192, 132, 252, 0.1); }

/* ===== MOBILE ===== */
@media (max-width: 768px) {
  .admin-panel { padding: 20px 10px; }
  .admin-container { padding: 24px 18px; border-radius: 14px; }
  .admin-title { font-size: 1.2rem; }
  .form-grid { grid-template-columns: 1fr; gap: 12px; }
  .btn-group { flex-direction: column; }
  .btn { width: 100%; text-align: center; }
  .stats-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
  .stat-card { padding: 10px; }
  .stat-val { font-size: 0.95rem; }
  .blinds-form { flex-direction: column; gap: 8px; }
  .blind-input { width: 100%; }
  .btn-blinds { width: 100%; }
  .blinds-presets { justify-content: center; }
  .hand-header { font-size: 0.7rem; gap: 6px; }
}

@media (max-width: 420px) {
  .admin-container { padding: 18px 14px; }
  .admin-title { font-size: 1rem; }
  .game-info { flex-direction: column; align-items: flex-start; gap: 8px; }
  .stats-grid { grid-template-columns: 1fr; }
}
</style>
