// server.js
const express = require('express');
const http = require('http');
require('dotenv').config();
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const Message = require('./models/Message');
const messagesRoute = require('./routes/messages');
const chatroomsRoute = require('./routes/chatrooms');
const loginRoutes = require('./routes/auth/login');
const registrationRoutes = require('./routes/auth/registration');
const userRoutes = require('./routes/users');
const PORT = process.env.PORT;
const app = express();

app.use(express.json());
app.use(cors());

app.use('/messages', messagesRoute);
app.use('/chatrooms', chatroomsRoute);
app.use('/auth', loginRoutes);
app.use('/auth', registrationRoutes);
app.use('/users', userRoutes);


mongoose.connect('mongodb://localhost:27017/chat-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.once('open', () => {
  console.log('✅ Connected to MongoDB');
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000' }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // join a room
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
  });

  socket.on('send_message', async (data) => {
    // data: { roomId, text, senderId }
    console.log('Message received:', data);

    try {
      // save message into ChatRoom.messages array
      const ChatRoom = require('./models/ChatRoom');
      const { roomId, text, senderId } = data;

      const room = await ChatRoom.findOne({ roomId });

      if (room) {
        const msgObj = { sender: senderId, text, timestamp: new Date() };
        room.messages.push(msgObj);
        room.lastMessage = undefined; // optional: keep lastMessage ref in sync if you use Message model
        await room.save();

        // broadcast to room
        io.to(roomId).emit('receive_message', { roomId, message: msgObj });
      } else {
        // create a new room from the deterministic roomId (e.g. "user1:user2")
        const parts = typeof roomId === 'string' ? roomId.split(':').filter(Boolean) : [];
        const participants = parts.length
          ? parts.map(id => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id)
          : [ mongoose.Types.ObjectId.isValid(senderId) ? new mongoose.Types.ObjectId(senderId) : senderId ];

        const newRoom = new ChatRoom({ roomId, participants, messages: [{ sender: senderId, text, timestamp: new Date() }] });
        console.log('Creating new room for message:', newRoom);
        await newRoom.save();

        // emit the saved message (the first message) to the room
        io.to(roomId).emit('receive_message', { roomId, message: newRoom.messages[newRoom.messages.length - 1] });
      }
    } catch (err) {
      console.error('Error saving message to room', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));