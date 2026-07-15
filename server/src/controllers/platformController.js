const axios = require('axios');
const User = require('../models/User');

const syncCodeforces = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const handle = user.platforms.codeforces;
    if (!handle) return res.status(400).json({ message: 'Codeforces handle not connected' });

    const response = await axios.get(`https://codeforces.com/api/user.info?handles=${handle}`);
    if (response.data.status !== 'OK') {
      return res.status(400).json({ message: 'Failed to fetch from Codeforces' });
    }

    const cfUser = response.data.result[0];
    user.stats.globalRating = cfUser.rating || user.stats.globalRating;
    await user.save();

    res.json({ message: 'Codeforces synced successfully', stats: user.stats });
  } catch (error) {
    res.status(500).json({ message: 'Codeforces API unavailable or handle invalid' });
  }
};

const syncLeetCode = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const handle = user.platforms.leetcode;
    if (!handle) return res.status(400).json({ message: 'LeetCode handle not connected' });

    // Using a reliable public API proxy for LeetCode
    const response = await axios.get(`https://alfa-leetcode-api.onrender.com/${handle}/solved`);
    
    if (response.data && !response.data.errors) {
      user.stats.problemsSolved.easy = response.data.easySolved || user.stats.problemsSolved.easy;
      user.stats.problemsSolved.medium = response.data.mediumSolved || user.stats.problemsSolved.medium;
      user.stats.problemsSolved.hard = response.data.hardSolved || user.stats.problemsSolved.hard;
      await user.save();
      return res.json({ message: 'LeetCode synced successfully', stats: user.stats });
    }
    res.status(400).json({ message: 'Failed to fetch from LeetCode' });
  } catch (error) {
    // If alfa API is down, fail gracefully
    res.status(500).json({ message: 'LeetCode API unavailable' });
  }
};

module.exports = {
  syncCodeforces,
  syncLeetCode,
};
