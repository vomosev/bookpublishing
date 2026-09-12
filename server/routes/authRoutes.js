const express = require('express');
const { rateLimit } = require('express-rate-limit');
const {
  signup,
  login,
  logout,
  getCurrentUser,
} = require('../controllers/authController');

const router = express.Router();

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many signup attempts. Please try again later.',
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error: 'Too many login attempts. Please try again later.',
  },
});

router.post('/signup', signupLimiter, signup);
router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.get('/me', getCurrentUser);

module.exports = router;