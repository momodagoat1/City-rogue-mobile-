import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import http from 'http';

const PORT = process.env.PORT || 3000;

// HTTP server just to keep Render happy
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("2D GTA WebSocket Server Running");
});

const wss = new WebSocketServer({ server });
let players = {};

wss.on('connection', (ws) => {
  const id = uuidv4();
  players[id] = { x: 200, y: 200 };

  ws.send(JSON.stringify({ type: 'init', id }));
  console.log(`Player connected: ${id}`);

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === 'move' && players[id]) {
        players[id].x = data.x;
        players[id].y = data.y;
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

setInterval(() => {
  const payload = JSON.stringify({ type: 'update', players });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(payload);
    }
  });
}, 50);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
