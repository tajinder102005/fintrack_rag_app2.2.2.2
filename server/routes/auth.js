const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const userStore = require('../store/memoryUsers');

const JWT_SECRET = process.env.JWT_SECRET || 'fintrack_jwt_secret_key_2024_secure';

const signToken = (user) =>
  jwt.sign(
    { userId: user._id, email: user.email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

const formatUser = (user) => ({
  id: user._id?.toString?.() || user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar || ''
});

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, password } = req.body;
    const email = String(req.body.email || '').trim().toLowerCase();

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await userStore.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await userStore.createUser({ name, email, password });
    const token = signToken(user);

    res.status(201).json({
      token,
      user: formatUser(user)
    });
  } catch (error) {
    res.status(error.status || 400).json({ message: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await userStore.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        message: 'No account found with this email. Please sign up first.'
      });
    }

    if (!user.password && (user.googleId || user.githubId)) {
      return res.status(401).json({
        message: 'This account was created with Google or GitHub. Use that button to sign in.'
      });
    }

    const isMatch = await userStore.comparePassword(user, password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password. Try again or sign up.' });
    }

    const token = signToken(user);

    res.json({
      token,
      user: formatUser(user)
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Google Auth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${frontendUrl}/login?error=google`, session: true }),
  (req, res) => {
    const token = signToken(req.user);
    res.redirect(`${frontendUrl}/login?token=${token}&user=${encodeURIComponent(JSON.stringify(formatUser(req.user)))}`);
  }
);

// GitHub Auth
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: `${frontendUrl}/login?error=github`, session: true }),
  (req, res) => {
    const token = signToken(req.user);
    res.redirect(`${frontendUrl}/login?token=${token}&user=${encodeURIComponent(JSON.stringify(formatUser(req.user)))}`);
  }
);

module.exports = router;
