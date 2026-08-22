require('dotenv').config({ override: true });
const mongoose = require('mongoose');
const User = require('./src/models/User');
const QuizAttempt = require('./src/models/QuizAttempt');
const quizController = require('./src/controllers/quizController');

async function testQuizFlow() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for testing quiz system...');

    const user = await User.findOne({ username: 'Akanksha' });
    if (!user) {
      console.error('User Akanksha not found');
      return;
    }

    const reqMockStart = {
      user: { id: user._id.toString() },
      body: { topic: 'Dynamic Programming' }
    };

    let resData = null;
    const resMockStart = {
      json: (d) => { resData = d; },
      status: (code) => ({ json: (d) => { resData = { statusCode: code, ...d }; } })
    };

    console.log('--- STEP 1: Starting Quiz ---');
    await quizController.startQuiz(reqMockStart, resMockStart);
    console.log('Start Quiz Result:', resData?.quiz ? `Quiz ID: ${resData.quiz._id}, Q1: ${resData.quiz.questions[0].questionText.substring(0, 50)}...` : resData);

    const quizId = resData?.quiz?._id;
    if (!quizId) throw new Error('Quiz start failed');

    console.log('--- STEP 2: Submitting "ffff" Answer ---');
    const reqMockAnswer = {
      user: { id: user._id.toString() },
      body: {
        quizId: quizId,
        answer: 'ffff'
      }
    };
    await quizController.submitAnswer(reqMockAnswer, resMockStart);
    const q0 = resData?.quiz?.questions[0];
    console.log('Submit Answer Result:', q0 ? `stepState: ${q0.stepState}, score: ${q0.evaluation?.finalScore}, feedback: "${q0.evaluation?.feedback}"` : resData);

    console.log('--- STEP 2b: Testing Duplicate Initial Answer Submission (Should fail with 400) ---');
    let duplicateResData = null;
    const resMockDup = {
      json: (d) => { duplicateResData = d; },
      status: (code) => ({ json: (d) => { duplicateResData = { statusCode: code, ...d }; } })
    };
    await quizController.submitAnswer(reqMockAnswer, resMockDup);
    console.log('Duplicate Submit Answer Response:', duplicateResData);

    console.log('--- STEP 2.5: Advancing to Next Question ---');
    const reqMockNext = {
      user: { id: user._id.toString() },
      body: { quizId: quizId }
    };
    await quizController.nextQuestion(reqMockNext, resMockStart);
    console.log('Next Question Result:', `Current Index: ${resData?.quiz?.currentQuestionIndex}, Question 2: "${resData?.quiz?.questions[1]?.questionText.substring(0, 40)}..."`);

    console.log('--- STEP 4: Fetching Quiz Stats & History ---');
    const reqMockGet = { user: { id: user._id.toString() } };
    await quizController.getQuizStats(reqMockGet, resMockStart);
    console.log('Quiz Stats:', resData);

    await quizController.getQuizHistory(reqMockGet, resMockStart);
    console.log('Quiz History count:', Array.isArray(resData) ? resData.length : 0);

  } catch (err) {
    console.error('Test Quiz Flow Exception:', err);
  } finally {
    await mongoose.disconnect();
  }
}

testQuizFlow();
