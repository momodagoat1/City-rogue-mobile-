require('dotenv').config();
const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;
const server = http.createServer((req,res)=>{ res.writeHead(200); res.end('Urban Sandbox WS server')});
const wss = new WebSocket.Server({ server });

const rooms = new Map();
const now = () => Date.now();
const TICK_MS = 50;

function getRoom(id){
  if(!rooms.has(id)) rooms.set(id, { players:new Map(), bullets:new Map() });
  return rooms.get(id);
}
function snapshot(room){
  return {
    t:'snapshot',
    players: [...room.players.values()],
    bullets: [...room.bullets.values()],
    count: room.players.size,
  };
}

wss.on('connection', (ws) => {
  ws.id = Math.random().toString(36).slice(2);
  ws.room = null;
  ws.color = '#f3a952';
  ws.send(JSON.stringify({t:'welcome', id: ws.id}));

  ws.on('message', (data) => {
    let msg; try{ msg = JSON.parse(data); }catch{ return; }
    if(msg.t==='join'){
      ws.room = msg.room || 'lobby';
      const room = getRoom(ws.room);
      room.players.set(ws.id, { id:ws.id, x:1500, y:1500, ang:0, hp:100, color: ws.color, last: now() });
      ws.send(JSON.stringify(snapshot(room)));
    }
    else if(msg.t==='state' && ws.room){
      const room = getRoom(ws.room); const p = room.players.get(ws.id); if(!p) return;
      p.x = Math.max(16, Math.min(2984, msg.p.x|0));
      p.y = Math.max(16, Math.min(2984, msg.p.y|0));
      p.ang = +msg.p.ang || 0; p.hp = Math.max(0, Math.min(100, +msg.p.hp || 100));
      p.last = now();
    }
    else if(msg.t==='shoot' && ws.room){
      const room = getRoom(ws.room);
      const id = Math.random().toString(36).slice(2);
      room.bullets.set(id, { id, x: msg.b.x, y: msg.b.y, vx: msg.b.vx, vy: msg.b.vy, owner: ws.id });
    }
  });

  ws.on('close', ()=>{
    if(ws.room){ const room = getRoom(ws.room); room.players.delete(ws.id); }
  });
});

set
