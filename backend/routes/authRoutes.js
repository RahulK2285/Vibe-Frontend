const express = require('express');
const router = express.Router();
const { signup, login, getMe } = require('../controllers/authController');

// 1. Signup Route
router.post('/signup', signup);

// 2. Login Route
router.post('/login', login);

// 3. Get Current User Route (Used by AuthContext to keep you logged in)
router.get('/me', getMe);

module.exports = router;