const express = require('express');
const router = express.Router();
const { createRoom, getRoom } = require('../controllers/roomController');

// Ensure these paths do not conflict with frontend paths
// React app calls: axios.post('/api/rooms/create')
router.post('/create', createRoom);
router.get('/:code', getRoom);

module.exports = router;