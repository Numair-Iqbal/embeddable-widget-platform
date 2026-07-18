const express = require('express');
const router = express.Router();
const authService = require('../services/auth.service');

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const newOwner = await authService.register(email, password);
    res.status(201).json({
      message: 'Owner registered successfully',
      owner: newOwner
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.status(200).json({
      message: 'Login successful',
      ...result
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

module.exports = router;