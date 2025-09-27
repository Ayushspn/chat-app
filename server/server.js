// server.js
const express = require('express');
const http = require('http');
require('dotenv').config();
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const Message = require('./models/Message');
const messagesRoute = require('./routes/messages');
const loginRoutes = require('./routes/auth/login');
const registrationRoutes = require('./routes/auth/registration');
const userRoutes = require('./routes/users');
const PORT = process.env.PORT;
const app = express();

app.use(express.json());
app.use(cors());

app.use('/messages', messagesRoute);
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
// const io = new Server(server, {
//   cors: { origin: 'http://localhost:3000' }
// });

// io.on('connection', (socket) => {
//   console.log('User connected:', socket.id);

//   socket.on('send_message', async (data) => {
//     const msg = new Message({ text: data.text });
//     await msg.save()
//     io.emit('receive_message', data);
//   });

//   socket.on('disconnect', () => {
//     console.log('User disconnected:', socket.id);
//   });
// });

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));