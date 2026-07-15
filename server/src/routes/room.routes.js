const express = require('express');
const router = express.Router();
const { createRoom, getRooms, joinRoom } = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createRoom);
router.get('/', protect, getRooms);
router.post('/join', protect, joinRoom);

module.exports = router;
