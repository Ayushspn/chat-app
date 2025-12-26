const express = require('express');
const Message = require('./models/Message');

const app = express();

const router = express.Router();
router.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/messages', async (req, res) => {
  try {
    console.log('Creating message with data:', req.body);
    const newMessage = new Message(req.body);
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create message' });
  }
});

module.exports = router;