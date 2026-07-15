const express = require('express');
const router = express.Router();
const { syncCodeforces, syncLeetCode } = require('../controllers/platformController');
const { protect } = require('../middleware/authMiddleware');

router.post('/codeforces', protect, syncCodeforces);
router.post('/leetcode', protect, syncLeetCode);

module.exports = router;
