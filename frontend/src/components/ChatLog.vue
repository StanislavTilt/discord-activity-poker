<template>
  <div class="chat-log" ref="logEl">
    <div class="chat-header">📜 Лог игры</div>
    <div class="chat-messages">
      <TransitionGroup name="msg-slide">
        <div v-for="(msg, i) in messages" :key="i" class="log-entry" :class="msg.type">
          <span class="log-text">{{ msg.text }}</span>
        </div>
      </TransitionGroup>
      <div v-if="messages.length === 0" class="log-empty">Ожидание начала игры...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';

const props = defineProps({ messages: { type: Array, default: () => [] } });
const logEl = ref(null);

watch(() => props.messages.length, async () => {
  await nextTick();
  if (logEl.value) {
    const msgs = logEl.value.querySelector('.chat-messages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }
});
</script>

<style scoped>
.chat-log {
  position: fixed;
  top: 12px;
  right: 12px;
  width: 270px;
  max-height: 320px;
  background: rgba(10, 9, 16, 0.88);
  border: 1px solid rgba(212, 175, 55, 0.1);
  border-radius: 14px;
  z-index: 50;
  backdrop-filter: blur(10px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}

.chat-header {
  padding: 8px 14px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #d4af37;
  border-bottom: 1px solid rgba(212, 175, 55, 0.08);
  letter-spacing: 0.5px;
}

.chat-messages {
  padding: 8px 12px;
  overflow-y: auto;
  flex: 1;
}

.chat-messages::-webkit-scrollbar { width: 3px; }
.chat-messages::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.2); border-radius: 2px; }

.log-entry {
  padding: 4px 0;
  font-size: 0.73rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.log-entry:last-child { border-bottom: none; }

.log-entry.action { color: #7a7a9a; }
.log-entry.winner { color: #f5e6a3; font-weight: 600; }
.log-entry.phase { color: #6ee7b7; font-weight: 500; text-align: center; }
.log-entry.info { color: #5a5a7a; font-style: italic; }

.log-empty {
  color: #3a3a5a;
  text-align: center;
  font-size: 0.75rem;
  padding: 20px 0;
}

.msg-slide-enter-active { animation: msg-in 0.3s ease; }

@keyframes msg-in {
  from { opacity: 0; transform: translateX(12px); }
  to { opacity: 1; transform: translateX(0); }
}

@media (max-width: 768px) {
  .chat-log { width: 200px; max-height: 220px; top: 8px; right: 8px; border-radius: 10px; }
  .chat-header { padding: 5px 10px; font-size: 0.65rem; }
  .chat-messages { padding: 5px 8px; }
  .log-entry { font-size: 0.6rem; }
}

@media (max-width: 420px) {
  .chat-log { width: 150px; max-height: 160px; }
  .log-entry { font-size: 0.5rem; }
  .log-empty { font-size: 0.55rem; }
}
</style>
