// Simple multiplayer WebSocket server for the 2D GTA-like game
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

let players = {};

wss.on('connection', (ws) => {
  const id = uuidv4();
  players[id] = { x: 200, y: 200 };

  // Send initial ID to player
  ws.send(JSON.stringify({ type: 'init', id }));

  console.log(`Player connected: ${id}`);

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.type === 'move') {
        if (players[id]) {
          players[id].x = data.x;
          players[id].y = data.y;
        }
      }
    } catch (e) {
      console.error("Invalid message:", e);
    }
  });

  ws.on('close', () => {
    delete players[id];
    console.log(`Player disconnected: ${id}`);
  });
});

// Broadcast positions every 50ms
setInterval(() => {
  const payload = JSON.stringify({ type: 'update', players });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}, 50);

console.log(`WebSocket server running on port ${PORT}`);
