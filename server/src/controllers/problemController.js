const Problem = require('../models/Problem');

const getProblems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.platform) filter.platform = req.query.platform;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;

    const problems = await Problem.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 });
    const total = await Problem.countDocuments(filter);

    res.json({ problems, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPOTD = async (req, res) => {
  try {
    let potd = await Problem.findOne({ isPOTD: true }).sort({ potdDate: -1 });
    
    // If no POTD exists at all, make a random one POTD for demo purposes
    if (!potd) {
      potd = await Problem.findOne();
      if (potd) {
        potd.isPOTD = true;
        potd.potdDate = new Date();
        await potd.save();
      }
    }
    
    res.json(potd || { message: 'No problems available' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const seedProblems = async (req, res) => {
  try {
    const count = await Problem.countDocuments();
    if (count === 0) {
      const sampleProblems = [
        { title: 'Two Sum', platform: 'leetcode', difficulty: 'Easy', url: 'https://leetcode.com/problems/two-sum/', tags: ['Array', 'Hash Table'] },
        { title: 'Add Two Numbers', platform: 'leetcode', difficulty: 'Medium', url: 'https://leetcode.com/problems/add-two-numbers/', tags: ['Linked List', 'Math'] },
        { title: 'Watermelon', platform: 'codeforces', difficulty: 'Easy', url: 'https://codeforces.com/problemset/problem/4/A', tags: ['Math'] },
        { title: 'Way Too Long Words', platform: 'codeforces', difficulty: 'Easy', url: 'https://codeforces.com/problemset/problem/71/A', tags: ['String'] },
        { title: 'Longest Substring Without Repeating Characters', platform: 'leetcode', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', tags: ['Hash Table', 'String', 'Sliding Window'] },
        { title: 'Median of Two Sorted Arrays', platform: 'leetcode', difficulty: 'Hard', url: 'https://leetcode.com/problems/median-of-two-sorted-arrays/', tags: ['Array', 'Binary Search', 'Divide and Conquer'] },
        { title: 'Theatre Square', platform: 'codeforces', difficulty: 'Easy', url: 'https://codeforces.com/problemset/problem/1/A', tags: ['Math'] },
        { title: 'Regular Bracket Sequence', platform: 'codeforces', difficulty: 'Medium', url: 'https://codeforces.com/problemset/problem/26/B', tags: ['Greedy', 'String'] },
      ];
      await Problem.insertMany(sampleProblems);
      return res.json({ message: 'Seeded problems database' });
    }
    res.json({ message: 'Database already has problems' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getProblems,
  getPOTD,
  seedProblems
};
