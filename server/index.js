require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');
const { analyze } = require('./sentiment');

const PORT = process.env.PORT || 3000;

// HTTP server
const app = express();
app.use(express.static(path.join(__dirname, '../client')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

const server = http.createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('[ws] client connected');

  const pingInterval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    }
  }, 30_000);

  ws.on('message', async (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    if (msg.type === 'text') {
      const result = await analyze(msg.content);
      console.log(`[emotion] "${msg.content.slice(0, 40)}..." →`, result);

      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'emotion', ...result }));
      }
    }
  });

  ws.on('close', () => {
    clearInterval(pingInterval);
    console.log('[ws] client disconnected');
  });

  ws.on('error', (err) => {
    console.error('[ws] error:', err.message);
  });
});

server.listen(PORT, () => {
  console.log(`\n  feels-with-you running at http://localhost:${PORT}\n`);
});
