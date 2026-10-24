/**
 * LOBBYIT Voice Signaling Gateway (Socket.io)
 * Coordinates low-overhead WebRTC peer-to-peer audio connections between teammates.
 * Zero voice data flows through the server; only lightweight SDP/ICE signals.
 */

function setupVoiceSocket(io) {
  // Map of roomId -> Map(socketId -> { user, socketId, isMuted, isDeafened, isSpeaking })
  const rooms = new Map();
  // Map of socketId -> roomId
  const socketToRoom = new Map();

  io.on('connection', (socket) => {
    // 1. Join Squad Voice Room
    socket.on('voice:join-room', ({ roomId, roomName = 'Squad Voice', user }) => {
      if (!roomId || !user) return;
      const cleanRoomId = roomId.toString().trim().toLowerCase();

      // Leave any prior voice room first
      const prevRoomId = socketToRoom.get(socket.id);
      if (prevRoomId && prevRoomId !== cleanRoomId) {
        leaveCurrentRoom(socket);
      }

      socket.join(cleanRoomId);
      socketToRoom.set(socket.id, cleanRoomId);

      if (!rooms.has(cleanRoomId)) {
        rooms.set(cleanRoomId, new Map());
      }
      const roomPeers = rooms.get(cleanRoomId);

      const peerInfo = {
        socketId: socket.id,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          avatar: user.avatar
        },
        isMuted: false,
        isDeafened: false,
        isSpeaking: false,
        joinedAt: new Date()
      };

      // Existing peers in the room before this user joined
      const existingPeers = Array.from(roomPeers.values());

      // Store new peer
      roomPeers.set(socket.id, peerInfo);

      // Send existing peers to new user (initiates WebRTC offer)
      socket.emit('voice:all-peers', {
        roomId: cleanRoomId,
        roomName,
        peers: existingPeers
      });

      // Notify existing peers that a new teammate joined
      socket.to(cleanRoomId).emit('voice:peer-joined', peerInfo);

      console.log(`[Voice] ${user.username} joined room ${cleanRoomId} (Total: ${roomPeers.size})`);
    });

    // 2. Relay WebRTC Signal (Offer / Answer / ICE Candidate)
    socket.on('voice:signal', ({ targetSocketId, signalData, fromUser }) => {
      if (!targetSocketId || !signalData) return;
      io.to(targetSocketId).emit('voice:signal', {
        fromSocketId: socket.id,
        signalData,
        fromUser
      });
    });

    // 3. Speaking Activity Broadcast (Voice meter green halo)
    socket.on('voice:speaking-state', ({ roomId, isSpeaking }) => {
      const currentRoomId = roomId || socketToRoom.get(socket.id);
      if (!currentRoomId) return;

      const roomPeers = rooms.get(currentRoomId);
      if (roomPeers && roomPeers.has(socket.id)) {
        roomPeers.get(socket.id).isSpeaking = isSpeaking;
      }

      socket.to(currentRoomId).emit('voice:user-speaking', {
        socketId: socket.id,
        isSpeaking
      });
    });

    // 4. Mute / Deafen State Sync
    socket.on('voice:mute-state', ({ roomId, isMuted, isDeafened }) => {
      const currentRoomId = roomId || socketToRoom.get(socket.id);
      if (!currentRoomId) return;

      const roomPeers = rooms.get(currentRoomId);
      if (roomPeers && roomPeers.has(socket.id)) {
        const peer = roomPeers.get(socket.id);
        peer.isMuted = isMuted;
        peer.isDeafened = isDeafened;
      }

      socket.to(currentRoomId).emit('voice:user-mute-state', {
        socketId: socket.id,
        isMuted,
        isDeafened
      });
    });

    // 5. Leave Squad Voice Room
    socket.on('voice:leave-room', () => {
      leaveCurrentRoom(socket);
    });

    // 6. Handle Disconnect / Closed Tab
    socket.on('disconnect', () => {
      leaveCurrentRoom(socket);
    });
  });

  function leaveCurrentRoom(socket) {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;

    socketToRoom.delete(socket.id);
    socket.leave(roomId);

    const roomPeers = rooms.get(roomId);
    if (roomPeers) {
      roomPeers.delete(socket.id);

      // Notify others in room
      socket.to(roomId).emit('voice:peer-left', {
        socketId: socket.id
      });

      if (roomPeers.size === 0) {
        rooms.delete(roomId);
        console.log(`[Voice] Room ${roomId} empty and pruned.`);
      } else {
        console.log(`[Voice] Peer ${socket.id} left room ${roomId} (Remaining: ${roomPeers.size})`);
      }
    }
  }
}

module.exports = setupVoiceSocket;
