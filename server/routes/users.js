const express = require('express');
const User = require('../models/User');
const router = express.Router();

router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const users = await User.find({ _id: { $ne: userId } }).select('username email');
    console.log('Fetched users excluding:', users);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;