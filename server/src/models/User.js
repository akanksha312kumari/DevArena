const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    profile: {
      avatar: {
        type: String,
        default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
      },
      bio: {
        type: String,
        default: 'Competitive programmer.',
      },
      college: {
        type: String,
        default: '',
      },
    },
    platforms: {
      codeforces: { type: String, default: '' },
      leetcode: { type: String, default: '' },
      codechef: { type: String, default: '' },
      atcoder: { type: String, default: '' },
      hackerrank: { type: String, default: '' },
    },
    stats: {
      globalRating: { type: Number, default: 0 },
      problemsSolved: {
        easy: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        hard: { type: Number, default: 0 },
      },
      dailyStreak: { type: Number, default: 0 },
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    friendRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: [{ type: String }],
    achievements: [
      {
        name: { type: String, required: true },
        description: { type: String, required: true },
        unlockedAt: { type: Date, default: Date.now },
      },
    ],
    activityFeed: [
      {
        type: { type: String, enum: ['duel_win', 'streak', 'badge', 'rating', 'achievement'], required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    lastActivityDate: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
