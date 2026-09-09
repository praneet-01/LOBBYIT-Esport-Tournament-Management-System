const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const seedData = require('./utils/seedData');
const { errorHandler } = require('./middleware/error');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connect DB & Run Auto-Seed
connectDB().then(async () => {
  await seedData();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'LOBBYIT API Server running successfully',
    timestamp: new Date().toISOString()
  });
});

// Seed API endpoint for manual reset
app.post('/api/seed', async (req, res) => {
  try {
    const User = require('./models/User');
    const Team = require('./models/Team');
    const Tournament = require('./models/Tournament');
    const Registration = require('./models/Registration');
    const Game = require('./models/Game');

    await User.deleteMany({});
    await Team.deleteMany({});
    await Tournament.deleteMany({});
    await Registration.deleteMany({});
    await Game.deleteMany({});

    await seedData();
    res.json({ message: 'Database reset and re-seeded successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tournaments', require('./routes/tournamentRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));
app.use('/api/registrations', require('./routes/registrationRoutes'));
app.use('/api/games', require('./routes/gameRoutes'));

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`[LOBBYIT SERVER] API running on http://localhost:${PORT}`);
});
