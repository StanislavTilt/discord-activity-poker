import { ref, onUnmounted } from 'vue';

export function useWebSocket(gameId, token) {
  const gameState = ref(null);
  const connected = ref(false);
  const error = ref(null);
  const lastEvent = ref(null);
  let ws = null;
  let reconnectTimer = null;
  let pingTimer = null;

  function connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.host;
    const url = `${protocol}://${host}/ws?token=${token}&gameId=${gameId}`;

    ws = new WebSocket(url);

    ws.onopen = () => {
      connected.value = true;
      error.value = null;
      startPing();
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case 'gameState':
          gameState.value = msg.data;
          break;
        case 'waiting':
          gameState.value = { phase: 'waiting', gameId: msg.data.gameId };
          break;
        case 'error':
          error.value = msg.data.message;
          setTimeout(() => error.value = null, 3000);
          break;
        default:
          lastEvent.value = msg;
      }
    };

    ws.onclose = () => {
      connected.value = false;
      stopPing();
      reconnectTimer = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      error.value = 'Connection error';
    };
  }

  function sendAction(action, amount) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'action', action, amount }));
    }
  }

  function startPing() {
    pingTimer = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  function stopPing() {
    if (pingTimer) clearInterval(pingTimer);
  }

  function disconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    stopPing();
    if (ws) ws.close();
  }

  connect();

  onUnmounted(() => {
    disconnect();
  });

  return { gameState, connected, error, lastEvent, sendAction, disconnect };
}
