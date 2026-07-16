const User = require('../models/User');
const codeforcesAdapter = require('./platforms/codeforcesAdapter');
const leetcodeAdapter = require('./platforms/leetcodeAdapter');
const codechefAdapter = require('./platforms/codechefAdapter');
const hackerrankAdapter = require('./platforms/hackerrankAdapter');
const atcoderAdapter = require('./platforms/atcoderAdapter');
const gfgAdapter = require('./platforms/gfgAdapter');
const gamificationService = require('./gamificationService');

class PlatformService {
  constructor() {
    this.adapters = {
      codeforces: codeforcesAdapter,
      leetcode: leetcodeAdapter,
      codechef: codechefAdapter,
      hackerrank: hackerrankAdapter,
      atcoder: atcoderAdapter,
      gfg: gfgAdapter
    };
  }

  async syncPlatform(userId, platform) {
    if (!this.adapters[platform]) {
      throw new Error(`Platform ${platform} is not supported`);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const handle = user.platforms && user.platforms[platform];
    if (!handle) {
      throw new Error(`No handle connected for ${platform}`);
    }

    // Rate limiting check (e.g. sync at most once every 2 minutes per platform)
    const lastSynced = user.lastSynced && user.lastSynced[platform];
    // Allow bypassing rate limit via a 'force' param if needed, or just let it pass if explicitly requested
    if (lastSynced && (Date.now() - new Date(lastSynced).getTime() < 20 * 1000)) {
      throw new Error(`Please wait 20 seconds between syncing ${platform}`);
    }

    const adapter = this.adapters[platform];
    const stats = await adapter.fetchStats(handle);

    // Save platform specific stats
    if (!user.platformStats) user.platformStats = {};
    if (!user.platformStats[platform]) user.platformStats[platform] = {};
    
    user.platformStats[platform] = {
      ...user.platformStats[platform],
      ...stats
    };

    if (!user.lastSynced) user.lastSynced = {};
    user.lastSynced[platform] = new Date();

    const oldTotal = user.stats?.problemsSolved?.total || 0;

    // Recompute global stats
    this.recalculateGlobalStats(user);

    const newTotal = user.stats?.problemsSolved?.total || 0;
    await gamificationService.processProblemSolvingActivity(user, oldTotal, newTotal);

    await user.save();
    return user;
  }

  async syncAllPlatforms(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const results = [];
    const platforms = ['codeforces', 'leetcode', 'codechef', 'hackerrank', 'atcoder', 'gfg'];

    for (const platform of platforms) {
      const handle = user.platforms && user.platforms[platform];
      if (!handle) continue; // Skip unconnected platforms

      try {
        // Enforce rate limits gracefully during syncAll
        const lastSynced = user.lastSynced && user.lastSynced[platform];
        if (lastSynced && (Date.now() - new Date(lastSynced).getTime() < 60 * 1000)) {
          results.push({ platform, status: 'skipped', reason: 'rate-limited' });
          continue;
        }

        const adapter = this.adapters[platform];
        const stats = await adapter.fetchStats(handle);

        if (!user.platformStats) user.platformStats = {};
        user.platformStats[platform] = {
          ...user.platformStats[platform],
          ...stats
        };

        if (!user.lastSynced) user.lastSynced = {};
        user.lastSynced[platform] = new Date();
        
        results.push({ platform, status: 'success' });
      } catch (err) {
        console.error(`Failed to sync ${platform} for user ${userId}:`, err.message);
        results.push({ platform, status: 'failed', reason: err.message });
      }
    }

    const oldTotal = user.stats?.problemsSolved?.total || 0;

    this.recalculateGlobalStats(user);

    const newTotal = user.stats?.problemsSolved?.total || 0;
    await gamificationService.processProblemSolvingActivity(user, oldTotal, newTotal);

    await user.save();
    return { user, results };
  }

  recalculateGlobalStats(user) {
    if (!user.stats) {
      user.stats = { 
        globalRating: 0, 
        problemsSolved: { easy: 0, medium: 0, hard: 0, total: 0 }, 
        dailyStreak: 0,
        maxStreak: 0,
        totalContests: 0
      };
    } else {
      // Reset to 0 before aggregating
      user.stats.problemsSolved = { easy: 0, medium: 0, hard: 0, total: 0 };
      user.stats.globalRating = 0;
      user.stats.dailyStreak = 0;
      user.stats.maxStreak = 0;
      user.stats.totalContests = 0;
    }

    if (!user.platformStats) return;

    for (const [platform, stats] of Object.entries(user.platformStats)) {
      if (!stats) continue;

      // Rating: we take the maximum across platforms (or could sum, but max is common for global "peak" rating)
      if (stats.rating && stats.rating > user.stats.globalRating) {
        user.stats.globalRating = stats.rating;
      }

      // Solved problems: sum them up
      if (stats.problemsSolved) {
        user.stats.problemsSolved.easy += (stats.problemsSolved.easy || 0);
        user.stats.problemsSolved.medium += (stats.problemsSolved.medium || 0);
        user.stats.problemsSolved.hard += (stats.problemsSolved.hard || 0);
        user.stats.problemsSolved.total += (stats.problemsSolved.total || 0);
      }

      // Streaks: take max
      if (stats.streak && stats.streak > user.stats.dailyStreak) {
        user.stats.dailyStreak = stats.streak;
      }
      if (stats.maxStreak && stats.maxStreak > user.stats.maxStreak) {
        user.stats.maxStreak = stats.maxStreak;
      }

      // Contests: sum
      if (stats.contests) {
        user.stats.totalContests += stats.contests;
      }
    }

    // Now aggregate heatmap and recent submissions
    const globalHeatmap = new Map();
    let globalRecent = [];

    const userObj = user.toJSON();

    for (const [platform, stats] of Object.entries(userObj.platformStats || {})) {
      if (!stats) continue;
      
      if (stats.heatmapData) {
        for (const [dateStr, count] of Object.entries(stats.heatmapData)) {
          globalHeatmap.set(dateStr, (globalHeatmap.get(dateStr) || 0) + count);
        }
      }

      if (stats.recentSubmissions && Array.isArray(stats.recentSubmissions)) {
        globalRecent = globalRecent.concat(stats.recentSubmissions);
      }
    }

    globalRecent.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    user.recentSubmissions = globalRecent.slice(0, 15);
    
    // Calculate streak from aggregated heatmap
    const sortedDates = Array.from(globalHeatmap.keys()).sort((a, b) => new Date(b) - new Date(a));
    let currentStreak = 0;
    
    if (sortedDates.length > 0) {
      let streak = 1;
      const oneDayMs = 24 * 60 * 60 * 1000;
      let lastDate = new Date(sortedDates[0]);
      
      const today = new Date();
      today.setHours(0,0,0,0);
      
      // Calculate diff in days between today and the most recent active date
      const diffStart = Math.floor((today - lastDate) / oneDayMs);
      
      if (diffStart <= 1) {
        for (let i = 1; i < sortedDates.length; i++) {
          const currDate = new Date(sortedDates[i]);
          const diff = Math.floor((lastDate - currDate) / oneDayMs);
          if (diff === 1) {
            streak++;
            lastDate = currDate;
          } else if (diff === 0) {
            continue; // Same day (shouldn't happen with set keys but just in case)
          } else {
            break;
          }
        }
        currentStreak = streak;
      }
    }

    // Always trust the higher streak (if adapter gave a higher one)
    user.stats.dailyStreak = Math.max(user.stats.dailyStreak, currentStreak);
    
    // Save map
    user.heatmapData = globalHeatmap;
  }
}

module.exports = new PlatformService();
