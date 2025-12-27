// filepath: server/socketHandlers.js
const mongoose = require('mongoose');
const ChatRoom = require('./models/ChatRoom');

module.exports = function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    // join a room
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
    });

    // handle incoming messages
    socket.on('send_message', async (data) => {
      // data: { roomId, text, senderId }
      console.log('Message received:', data);

      try {
        const { roomId, text, senderId } = data;
        const room = await ChatRoom.findOne({ roomId });

        if (room) {
          const msgObj = { sender: senderId, text, timestamp: new Date() };
          room.messages.push(msgObj);
          room.lastMessage = undefined; // keep lastMessage ref in sync if used
          await room.save();

          // broadcast to room
          io.to(roomId).emit('receive_message', { roomId, message: msgObj });
          return;
        }

        // create a new room from the deterministic roomId (e.g. "user1:user2")
        const parts = typeof roomId === 'string' ? roomId.split(':').filter(Boolean) : [];
        const toId = id => mongoose.Types.ObjectId.isValid(id) ? mongoose.Types.ObjectId(id) : id;
        const participants = parts.length ? parts.map(toId) : [ toId(senderId) ];

        const newRoom = new ChatRoom({
          roomId,
          participants,
          messages: [{ sender: senderId, text, timestamp: new Date() }]
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