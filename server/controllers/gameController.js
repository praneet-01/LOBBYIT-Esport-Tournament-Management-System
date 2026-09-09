const Game = require('../models/Game');
const Tournament = require('../models/Tournament');

// @desc    Get all seeded games
// @route   GET /api/games
// @access  Public
const getGames = async (req, res) => {
  try {
    const games = await Game.find().sort({ name: 1 });

    const gamesWithCount = await Promise.all(
      games.map(async (game) => {
        const tournamentCount = await Tournament.countDocuments({
          game: { $regex: new RegExp(`^${game.name}$`, 'i') },
          status: { $ne: 'draft' }
        });
        return {
          ...game.toObject(),
          tournamentCount
        };
      })
    );

    res.json(gamesWithCount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single game by slug with tournaments
// @route   GET /api/games/:slug
// @access  Public
const getGameBySlug = async (req, res) => {
  try {
    const game = await Game.findOne({ slug: req.params.slug.toLowerCase() });
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    const tournaments = await Tournament.find({
      game: { $regex: new RegExp(`^${game.name}$`, 'i') },
      status: { $ne: 'draft' }
    }).populate('organizer', 'name username avatar');

    res.json({
      ...game.toObject(),
      tournaments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getGames, getGameBySlug };
