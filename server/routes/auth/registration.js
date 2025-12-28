const express = require('express');
const bcrypt = require('bcryptjs');

const User = require('../../models/User');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const { v4: uuidv4 } = await import('uuid');
    const userId = uuidv4(); // Generate a unique userId
    const newUser = new User({ username, email, password: hashedPassword, userId });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

module.exports = router;