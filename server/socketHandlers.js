// filepath: server/socketHandlers.js
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const ChatRoom = require('./models/ChatRoom');

const getUserIdFromToken = (token) => {
  try {
    // token may be the raw token or a Bearer token string
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTUwMDgzYWU1MmNmNGJlNDgyMmE0NTkiLCJpYXQiOjE3NjY5NDAzNjEsImV4cCI6MTc2Njk0Mzk2MX0.IvwAK6FXvVOxNBYWIvgY4ePZxzyyWSo0xSODWSjZ2Uk";
    console.log("Decoded Token:", jwt.decode(token));
    const raw = typeof token=== 'string' && token.startsWith('Bearer ') ? token.split(' ')[1] : token;
    const decoded = jwt.verify(raw, process.env.JWT_SECRET);
    return decoded.userId;
  } catch (err) {
    return null;
  }
};

module.exports = function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    // join a room
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
    });

    // handle incoming messages
    socket.on('send_message', async (data) => {
      // data: { roomId, text }
      console.log('Message received:', data);

      try {
        const { selectedUserId : roomId, text, token } = data;
        const userId = getUserIdFromToken(token);
        if (!userId) {
          console.warn('send_message: invalid or missing token');
          return;
        }

        const room = await ChatRoom.findOne({ roomId });

        if (room) {
          const msgObj = { sender: userId, text, timestamp: new Date() };
          room.messages.push(msgObj);
          room.lastMessage = undefined; // keep lastMessage ref in sync if used
          await room.save();

          // broadcast to room
          io.to(roomId).emit('receive_message', { roomId, message: msgObj });
          return;
        }

        // create a new room from the deterministic roomId (e.g. "user1:user2")
        const parts = typeof roomId === 'string' ? roomId.split(':').filter(Boolean) : [];
        const toId = id => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
        const participants = parts.length ? parts.map(toId) : [ toId(userId) ];

        const newRoom = new ChatRoom({
          roomId,
          participants,
          messages: [{ sender: userId, text, timestamp: new Date() }]
        });

        console.log('Creating new room for message:', newRoom);
        await newRoom.save();

        // emit the saved message (the first message) to the room
        io.to(roomId).emit('receive_message', {
          roomId,
          message: newRoom.messages[newRoom.messages.length - 1]
        });
      } catch (err) {
        console.error('Error saving message to room', err);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};