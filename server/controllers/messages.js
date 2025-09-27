const express = require('express');
const Message = require('./models/Message');

const app = express();

const router = express.Router();
router.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    console.log(messages)
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router;