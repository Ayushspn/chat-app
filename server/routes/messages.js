const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const authenticate = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    const loggedInUserId = req.userId;
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router;