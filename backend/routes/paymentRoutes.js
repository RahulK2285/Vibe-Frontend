const express = require('express');
const router = express.Router();
// Import the NEW functions we created in the controller
const { createSubscription, verifySubscription } = require('../controllers/paymentController');

// These MUST match your Lobby.jsx axios calls exactly
router.post('/subscribe', createSubscription);
router.post('/verify-subscription', verifySubscription);

module.exports = router;