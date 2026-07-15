const axios = require('axios');
const cheerio = require('cheerio');

class CodeChefAdapter {
  constructor() {
    this.name = 'codechef';
  }

  async fetchStats(handle) {
    try {
      const response = await axios.get(`https://www.codechef.com/users/${handle}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      const $ = cheerio.load(response.data);
      
      const ratingStr = $('.rating-number').text().trim().split(/\s+/)[0];
      const rating = parseInt(ratingStr) || 0;

      const solvedStr = $('h3:contains("Total Problems Solved")').text();
      const total = parseInt(solvedStr.replace(/[^0-9]/g, '')) || 0;

      const contestsStr = $('.contest-participated-count b').text();
      const contests = parseInt(contestsStr) || 0;

      return {
        rating,
        problemsSolved: { easy: 0, medium: 0, hard: 0, total },
        contests,
        streak: 0,
        maxStreak: 0,
      };
    } catch (error) {
      console.log(`CodeChef sync failed for ${handle}:`, error.message);
      return { rating: 0, problemsSolved: { easy: 0, medium: 0, hard: 0, total: 0 }, contests: 0, streak: 0, maxStreak: 0 };
    }
  }
}

module.exports = new CodeChefAdapter();
