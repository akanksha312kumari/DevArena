const express = require('express');
const router = express.Router();
const { updateProfile, searchUsers, getFriends, sendFriendRequest } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.put('/profile', protect, updateProfile);
router.get('/search', protect, searchUsers);
router.get('/friends', protect, getFriends);
router.post('/friends/request/:id', protect, sendFriendRequest);

module.exports = router;
