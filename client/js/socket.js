/**
 * socket.js — WebSocket client
 * Connects to the server, sends text, dispatches emotion events.
 */

const Socket = (() => {
  let ws = null;
  let reconnectTimer = null;
  const RECONNECT_DELAY = 3000;

  const handlers = {};

  function on(event, fn) {
    handlers[event] = fn;
  }

  function emit(event, data) {
    if (handlers[event]) handlers[event](data);
  }

  function connect() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(`${proto}://${location.host}`);

    ws.addEventListener('open', () => {
      console.log('[ws] connected');
      emit('connected');
    });

    ws.addEventListener('message', (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }

      if (msg.type === 'emotion') emit('emotion', msg);
      if (msg.type === 'ping') send({ type: 'pong' });
    });

    ws.addEventListener('close', () => {
      console.log('[ws] disconnected, retrying...');
      emit('disconnected');
      reconnectTimer = setTimeout(connect, RECONNECT_DELAY);
    });

    ws.addEventListener('error', () => {
      ws.close();
    });
  }

  function send(payload) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }

  function sendText(text) {
    send({ type: 'text', content: text });
  }

  connect();

  return { on, sendText };
})();
