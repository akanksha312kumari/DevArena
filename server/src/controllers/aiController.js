const { GoogleGenAI } = require('@google/genai');
const User = require('../models/User');

const aiChat = async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: 'Invalid messages array' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Try to init Gemini API
    if (!process.env.GEMINI_API_KEY) {
      // Fallback for when no API key is provided
      return res.json({
        content: `[MOCK AI] I see you have ${user.xp} XP and a ${user.stats.dailyStreak}-day streak! Keep up the good work. (Note: Add GEMINI_API_KEY to server/.env to enable real AI).`
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Construct System Prompt
    const systemInstruction = `You are the DevArena AI Coach. 
    You are advising user ${user.username}.
    Their stats: Level ${user.level}, XP ${user.xp}, Daily Streak: ${user.stats.dailyStreak}.
    Global Rating: ${user.stats.globalRating}.
    Problems Solved: ${user.stats.problemsSolved.easy} Easy, ${user.stats.problemsSolved.medium} Medium, ${user.stats.problemsSolved.hard} Hard.
    Their badges: ${user.badges.join(', ') || 'None'}.
    Provide actionable, concise, and encouraging advice for improving their coding skills based on their stats.`;

    // Map messages for Gemini Chat
    // Google GenAI sdk uses 'user' and 'model'
    const chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });

    // We can just send the last user message, or re-run the history.
    // For simplicity, we send the most recent user message.
    const lastUserMsg = messages[messages.length - 1]?.content || 'Hello';
    
    const response = await chatSession.sendMessage({ message: lastUserMsg });

    res.json({ content: response.text });
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ message: 'Error generating AI response', error: error.message });
  }
};

module.exports = { aiChat };
