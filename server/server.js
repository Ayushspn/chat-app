// server.js
const express = require('express');
const http = require('http');
const path = require('path');
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

// Serve static frontend files (registration page, CSS, client scripts)
app.use(express.static(path.join(__dirname, 'public')));

// Simple route to the registration page
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'registration.html'));
});

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
// Register socket handlers
const registerSocketHandlers = require('./socketHandlers');
registerSocketHandlers(io);

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));