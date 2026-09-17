import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Room } from './gameState.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const rooms = new Map(); // roomCode -> Room instance

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Ensure unique
  if (rooms.has(code)) return generateRoomCode();
  return code;
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', activeRooms: rooms.size });
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('create_room', ({ playerName }) => {
    const code = generateRoomCode();
    const room = new Room(code, socket.id, playerName || 'Chủ Phòng');
    room.setIO(io);
    rooms.set(code, room);

    socket.join(code);
    socket.data.roomCode = code;
    socket.data.playerId = socket.id;

    socket.emit('room_created', {
      roomCode: code,
      playerId: socket.id
    });

    room.broadcastState();
  });

  socket.on('join_room', ({ roomCode, playerName }) => {
    const code = (roomCode || '').toUpperCase().trim();
    const room = rooms.get(code);

    if (!room) {
      socket.emit('error_message', { message: 'Phòng không tồn tại!' });
      return;
    }

    if (room.phase !== 'LOBBY') {
      socket.emit('error_message', { message: 'Ván đấu đang diễn ra, không thể tham gia lúc này!' });
      return;
    }

    if (room.players.length >= 16) {
      socket.emit('error_message', { message: 'Phòng đã đủ 16 người chơi!' });
      return;
    }

    const player = room.addPlayer(socket.id, playerName, false, false);
    if (!player) {
      socket.emit('error_message', { message: 'Không thể vào phòng!' });
      return;
    }

    socket.join(code);
    socket.data.roomCode = code;
    socket.data.playerId = player.id;

    socket.emit('room_joined', {
      roomCode: code,
      playerId: player.id
    });

    room.broadcastState();
  });

  socket.on('reconnect_room', ({ roomCode, playerId }) => {
    const code = (roomCode || '').toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) {
      socket.emit('error_message', { message: 'Phòng không tồn tại hoặc đã kết thúc.' });
      return;
    }

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.socketId = socket.id;
      if (player.isHost) {
        room.hostSocketId = socket.id;
      }
      socket.join(code);
      socket.data.roomCode = code;
      socket.data.playerId = player.id;

      socket.emit('room_joined', {
        roomCode: code,
        playerId: player.id
      });
      room.broadcastState();
    } else {
      socket.emit('error_message', { message: 'Không tìm thấy thông tin người chơi!' });
    }
  });

  socket.on('add_bot', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    if (socket.id !== room.hostSocketId) return;

    room.addBot();
    room.broadcastState();
  });

  socket.on('remove_bot', ({ roomCode, botId }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    if (socket.id !== room.hostSocketId) return;

    room.removeBot(botId);
    room.broadcastState();
  });

  socket.on('update_roles', ({ roomCode, selectedRoles }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    if (socket.id !== room.hostSocketId) return;
    room.updateSelectedRoles(selectedRoles);
  });

  socket.on('start_game', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    if (socket.id !== room.hostSocketId) return;

    const result = room.startGame();
    if (!result.success) {
      socket.emit('error_message', { message: result.message });
    }
  });

  socket.on('player_ready', ({ roomCode, playerId }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    room.handlePlayerReady(playerId);
  });

  socket.on('night_action', ({ roomCode, playerId, targetId, actionData }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    room.submitNightAction(playerId, actionData !== undefined ? actionData : targetId);
  });

  socket.on('hunter_shot', ({ roomCode, hunterId, targetId }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    room.submitHunterShot(hunterId, targetId);
  });

  socket.on('skip_discussion', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    if (socket.id !== room.hostSocketId) return;
    room.skipDiscussion();
  });

  socket.on('submit_vote', ({ roomCode, voterId, targetId }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    room.submitVote(voterId, targetId);
  });

  socket.on('send_chat', ({ roomCode, playerId, text }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const player = room.players.find(p => p.id === playerId);
    if (!player) return;
    if (!player.isAlive) {
      socket.emit('error_message', { message: 'Linh hồn đã hy sinh, không thể nói chuyện trong phiên thảo luận!' });
      return;
    }
    room.addChatMessage(player.id, player.name, text, false);
  });

  socket.on('play_again', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    if (socket.id !== room.hostSocketId) return;
    room.playAgain();
  });

  // --- WEBRTC VOICE SIGNALING ---
  socket.on('voice_join', ({ roomCode, playerId }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    socket.data.voiceJoined = true;

    // Send list of other human connected peers in this room to the joining peer
    const existingPeers = room.players
      .filter(p => !p.isBot && p.socketId && p.socketId !== socket.id)
      .map(p => ({ socketId: p.socketId, playerId: p.id }));

    socket.emit('voice_all_peers', { peers: existingPeers });

    // Announce to other peers in room
    socket.to(roomCode).emit('voice_peer_joined', {
      socketId: socket.id,
      playerId
    });
  });

  socket.on('voice_signal', ({ toSocketId, signal }) => {
    io.to(toSocketId).emit('voice_signal', {
      fromSocketId: socket.id,
      signal
    });
  });

  socket.on('voice_status_update', ({ roomCode, playerId, isMuted, isDeafened, isSpeaking }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.voiceStatus = {
        isMuted: Boolean(isMuted),
        isDeafened: Boolean(isDeafened),
        isSpeaking: Boolean(isSpeaking)
      };
    }
    // Broadcast status to room
    io.to(roomCode).emit('voice_player_status', {
      socketId: socket.id,
      playerId,
      isMuted: Boolean(isMuted),
      isDeafened: Boolean(isDeafened),
      isSpeaking: Boolean(isSpeaking)
    });
  });

  socket.on('voice_leave', ({ roomCode, playerId }) => {
    socket.data.voiceJoined = false;
    socket.to(roomCode).emit('voice_peer_left', {
      socketId: socket.id,
      playerId
    });
  });

  socket.on('disconnect', () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    if (room.phase === 'LOBBY') {
      room.removePlayer(socket.id);
      if (room.players.length === 0 || room.players.every(p => p.isBot)) {
        room.clearTimer();
        rooms.delete(roomCode);
      } else {
        room.broadcastState();
      }
    } else {
      // Game in progress: mark connection dropped, keep player slot for reconnect
      const player = room.players.find(p => p.socketId === socket.id);
      if (player) {
        player.socketId = null;
      }
    }
  });
});

app.use((req, res, next) => {
  if (req.url.startsWith('/api') || req.url.startsWith('/socket.io')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Nightfall Server is running on http://localhost:${PORT}`);
});
