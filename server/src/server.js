require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const platformRoutes = require('./routes/platform.routes');

// Connect to database
// Note: We only connect if MONGO_URI is set, to avoid crashing if it's not set up yet
if (process.env.MONGO_URI && process.env.MONGO_URI !== 'your_mongodb_atlas_uri_here') {
  connectDB();
} else {
  console.log('MongoDB connection skipped: MONGO_URI not configured properly in .env');
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('DevArena API is running. Visit /api/health to check health status.');
});
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/platforms', platformRoutes);

// Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
