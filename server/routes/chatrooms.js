const express = require('express');
const router = express.Router();
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const authenticate = require('../middleware/auth');

// Create or return an existing one-on-one chat room between the logged-in user and another user
router.post('/', async (req, res) => {
  const { otherUserId } = req.body;
  const userId = req.userId;
  console.log('Creating or fetching chat room between', userId, 'and', otherUserId);

  if (!otherUserId) return res.status(400).json({ error: 'otherUserId is required' });
  if (otherUserId === userId) return res.status(400).json({ error: "Can't create a chat with yourself" });

  try {
    // deterministic roomId so the same two users always map to the same room
    const ids = [userId.toString(), otherUserId.toString()].sort();
    const roomId = ids.join(':');

    let room = await ChatRoom.findOne({ roomId });
    if (!room) {
      room = new ChatRoom({ roomId, participants: ids });
      await room.save();
    }

    room = await ChatRoom.findById(room._id)
      .populate('participants', 'username email')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'username' } });

    return res.json(room);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create or fetch chat room' });
  }
});

// Get all chat rooms for the logged-in user
router.get('/', authenticate, async (req, res) => {
  const userId = req.userId;
  try {
    const rooms = await ChatRoom.find({ participants: userId })
      .sort({ createdAt: -1 })
      .populate('participants', 'username email')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'username' } });

    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch chat rooms' });
  }
});

module.exports = router;
