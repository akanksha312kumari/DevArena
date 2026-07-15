const express = require('express');
const router = express.Router();
const { getProblems, getPOTD, seedProblems } = require('../controllers/problemController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getProblems);
router.get('/potd', protect, getPOTD);
router.post('/seed', protect, seedProblems);

module.exports = router;
