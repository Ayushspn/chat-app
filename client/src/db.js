const mongoose = require('mongoose');

const MONGO_URI = process.env.REACT_APP_MONGO_URI || 'mongodb://localhost:27017/chat-app';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
});