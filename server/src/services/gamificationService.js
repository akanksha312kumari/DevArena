const User = require('../models/User');

const XP_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500];

const getLevelForXP = (xp) => {
  let level = 1;
  for (let i = 0; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
};

const addActivity = (user, type, title, description) => {
  // Prevent duplicate activities of the same type within last 24 hours (for things like streak)
  if (type === 'streak') {
    const today = new Date();
    const hasRecentStreak = user.activityFeed.some(a => 
      a.type === 'streak' && 
      (today.getTime() - new Date(a.timestamp).getTime()) < 24 * 60 * 60 * 1000
    );
    if (hasRecentStreak) return false;
  }
  
  user.activityFeed.unshift({ type, title, description, timestamp: new Date() });
  if (user.activityFeed.length > 50) {
    user.activityFeed.pop(); // Keep only last 50
  }
  return true;
};

const awardXP = async (userId, amount, reason) => {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    user.xp += amount;
    const newLevel = getLevelForXP(user.xp);

    if (newLevel > user.level) {
      user.level = newLevel;
      addActivity(user, 'achievement', `Level Up!`, `You reached Level ${newLevel}!`);
    }

    if (reason === 'duel_win') {
      addActivity(user, 'duel_win', 'Won a Duel!', `Earned ${amount} XP for winning a coding duel.`);
    }

    await user.save();
    return user;
  } catch (err) {
    console.error('Error awarding XP:', err);
    return null;
  }
};

const updateDailyStreak = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    const now = new Date();
    const lastActivity = user.lastActivityDate;
    
    if (!lastActivity) {
      user.stats.dailyStreak = 1;
      addActivity(user, 'streak', 'Streak Started', 'You started a 1-day coding streak!');
    } else {
      const msPerDay = 24 * 60 * 60 * 1000;
      const diffDays = Math.floor((now.getTime() - lastActivity.getTime()) / msPerDay);

      if (diffDays === 1) {
        user.stats.dailyStreak += 1;
        if (user.stats.dailyStreak % 5 === 0) {
          addActivity(user, 'streak', 'Streak Milestone', `You reached a ${user.stats.dailyStreak}-day streak!`);
        }
      } else if (diffDays > 1) {
        // Lost streak
        user.stats.dailyStreak = 1;
        addActivity(user, 'streak', 'Streak Reset', 'You missed a day and started a new streak.');
      }
    }
    
    user.lastActivityDate = now;
    await user.save();
    return user;
  } catch (err) {
    console.error('Error updating streak:', err);
    return null;
  }
};

const checkAndAwardBadges = async (user) => {
  let modified = false;
  
  if (user.stats.dailyStreak >= 7 && !user.badges.includes('7-Day Scholar')) {
    user.badges.push('7-Day Scholar');
    addActivity(user, 'badge', 'Badge Unlocked: 7-Day Scholar', 'Maintain a 7-day coding streak.');
    modified = true;
  }

  if (user.xp >= 1000 && !user.badges.includes('XP Millionaire')) {
    user.badges.push('XP Millionaire');
    addActivity(user, 'badge', 'Badge Unlocked: XP Millionaire', 'Earn 1000 XP.');
    modified = true;
  }

  if (modified) {
    await user.save();
  }
  return user;
};

module.exports = {
  awardXP,
  updateDailyStreak,
  checkAndAwardBadges,
  getLevelForXP
};
