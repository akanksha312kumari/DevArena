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
    - Be conversational and match the length/intent of the user's input. If the user just says a simple greeting like "hello", simply reply back with a greeting like "Hello, how are you?". Do NOT dump their stats or give unsolicited advice on every message.
    - When explicitly asked for advice or guidance, provide actionable, concise, and encouraging advice for improving their coding skills based on their stats.
    
    CRITICAL RULE: You must ONLY answer questions related to coding, programming, algorithms, computer science, or the user's learning journey on DevArena. If the user asks ANY off-topic questions (e.g., sports, celebrities like "who is messi", politics, movies, etc.), you MUST politely refuse and ask them to please stick to relevant coding and platform topics.`;

    // For simplicity, we send the most recent user message.
    const lastUserMsg = messages[messages.length - 1]?.content || 'Hello';
    
    const response = await ai.models.generateContent({
      model: 'gemma-2-9b-it',
      contents: systemInstruction + '\n\nUser: ' + lastUserMsg,
    });

    res.json({ content: response.text });
  } catch (error) {
    console.error('AI Error:', error);
    // Fallback if AI fails (e.g. invalid API key, network error)
    return res.json({
      content: `[MOCK AI] I see you're working hard! Keep practicing those algorithms! (Tip: Your API key doesn't support the current Gemini model, but you can still use the platform!)`
    });
  }
};

const getLearningPlan = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date();
    // Check if recommendations exist and are less than 24 hours old
    if (
      user.aiRecommendations &&
      user.aiRecommendations.lastGeneratedAt &&
      (now - user.aiRecommendations.lastGeneratedAt) < 24 * 60 * 60 * 1000
    ) {
      return res.json({
        roadmap: user.aiRecommendations.roadmap,
        dailyChallenges: user.aiRecommendations.dailyChallenges,
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        roadmap: [
          { topic: 'Dynamic Programming', difficulty: 'Hard', estimatedTime: '2 hours', reason: 'You have a 30% success rate.' },
          { topic: 'Two Pointers', difficulty: 'Medium', estimatedTime: '1 hour', reason: 'Great for array problems.' }
        ],
        dailyChallenges: [
          { title: 'Two Sum', difficulty: 'Easy', reason: 'Warm up exercise.' },
          { title: 'Longest Substring', difficulty: 'Medium', reason: 'Improve sliding window skills.' }
        ]
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Construct user stats payload
    const userStats = {
      globalRating: user.stats.globalRating,
      problemsSolved: user.stats.problemsSolved,
      xp: user.xp,
      streak: user.stats.dailyStreak,
      badges: user.badges,
      recentSubmissions: user.recentSubmissions.slice(0, 10).map(s => s.title)
    };

    const prompt = `You are a personalized AI coding coach powered by Gemma. 
Analyze the following user stats: ${JSON.stringify(userStats)}.
Based on their rating, solved problems, and recent submissions, generate:
1. A Personalized Learning Roadmap: Rank topics from weakest to strongest. Recommend the next 5 topics to study with estimated difficulty, study time, and a short reason.
2. AI Daily Challenge Recommendation: Recommend 3 specific coding problems (mix of Easy/Medium/Hard) based on weak topics and current skill level, with a short reason for each.

Return ONLY a valid JSON object with this exact structure (no markdown, no backticks, no extra text):
{
  "roadmap": [
    { "topic": "string", "difficulty": "string", "estimatedTime": "string", "reason": "string" }
  ],
  "dailyChallenges": [
    { "title": "string", "difficulty": "string", "reason": "string" }
  ]
}`;

    // Note: using a gemini model with Gemma persona to avoid API 404 error
    console.log("Generating Learning Plan using API Key...");
    const response = await ai.models.generateContent({
      model: 'gemma-2-9b-it',
      contents: prompt,
    });

    let resultText = response.text;
    // Clean up any potential markdown formatting from the response
    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsedData = JSON.parse(resultText);

    // Update user in DB
    user.aiRecommendations = {
      roadmap: parsedData.roadmap,
      dailyChallenges: parsedData.dailyChallenges,
      lastGeneratedAt: now
    };
    await user.save();

    res.json(parsedData);
  } catch (error) {
    console.error('Learning Plan Error:', error);
    // Fallback if AI fails or model not found (e.g., if gemma/gemini is unavailable or API key is invalid)
    return res.json({
      roadmap: [
        { topic: 'Dynamic Programming (Fallback)', difficulty: 'Hard', estimatedTime: '2 hours', reason: 'You have a 30% success rate.' },
        { topic: 'Two Pointers', difficulty: 'Medium', estimatedTime: '1 hour', reason: 'Great for array problems.' }
      ],
      dailyChallenges: [
        { title: 'Two Sum (Fallback)', difficulty: 'Easy', reason: 'Warm up exercise.' },
        { title: 'Longest Substring', difficulty: 'Medium', reason: 'Improve sliding window skills.' }
      ]
    });
  }
};

module.exports = { aiChat, getLearningPlan };
