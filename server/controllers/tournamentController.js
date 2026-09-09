const jwt = require('jsonwebtoken');
const Tournament = require('../models/Tournament');
const Registration = require('../models/Registration');
const User = require('../models/User');

// Helper to generate slug from title
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// @desc    Get all tournaments with filtering, search, and sorting
// @route   GET /api/tournaments
// @access  Public
const getTournaments = async (req, res) => {
  try {
    const { search, game, tournamentType, status, country, sort, organizer } = req.query;

    const query = {};

    // Search query
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Filters
    if (game && game !== 'all') {
      query.game = { $regex: new RegExp(`^${game}$`, 'i') };
    }

    if (tournamentType && tournamentType !== 'all') {
      query.tournamentType = tournamentType;
    }

    if (status && status !== 'all') {
      query.status = status;
    } else if (!organizer) {
      // By default for public users, don't show drafts unless specified
      query.status = { $ne: 'draft' };
    }

    if (country && country !== 'all') {
      query.country = country;
    }

    // Handle organizer filter
    if (organizer) {
      if (organizer === 'me') {
        let userId = null;
        if (req.user) {
          userId = req.user._id;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
          try {
            const token = req.headers.authorization.split(' ')[1];
            const jwtSecret = process.env.JWT_SECRET || 'lobbyit_secret_key_2026';
            const decoded = jwt.verify(token, jwtSecret);
            userId = decoded.id;
          } catch (e) {
            console.error('Token decode failed in getTournaments:', e.message);
          }
        }

        if (userId) {
          query.organizer = userId;
        } else {
          return res.status(401).json({ message: 'Authentication required for organizer tournaments' });
        }
      } else {
        query.organizer = organizer;
      }
    }

    // Sort options
    let sortOptions = { createdAt: -1 };
    if (sort === 'upcoming') {
      sortOptions = { startDate: 1 };
    } else if (sort === 'deadline') {
      sortOptions = { registrationDeadline: 1 };
    } else if (sort === 'oldest') {
      sortOptions = { createdAt: 1 };
    }

    const tournaments = await Tournament.find(query)
      .populate('organizer', 'name username avatar email bio')
      .sort(sortOptions);

    // Attach registered team count for each tournament
    const tournamentsWithStats = await Promise.all(
      tournaments.map(async (t) => {
        const registeredCount = await Registration.countDocuments({
          tournament: t._id,
          status: { $in: ['accepted', 'pending'] }
        });
        const acceptedCount = await Registration.countDocuments({
          tournament: t._id,
          status: 'accepted'
        });

        return {
          ...t.toObject(),
          registeredTeamsCount: registeredCount,
          acceptedTeamsCount: acceptedCount
        };
      })
    );

    res.json(tournamentsWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get tournaments hosted by current organizer
// @route   GET /api/tournaments/organizer/my
// @access  Private (Organizer)
const getMyHostedTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find({ organizer: req.user._id })
      .populate('organizer', 'name username avatar email bio')
      .sort({ createdAt: -1 });

    const tournamentsWithStats = await Promise.all(
      tournaments.map(async (t) => {
        const registeredCount = await Registration.countDocuments({
          tournament: t._id,
          status: { $in: ['accepted', 'pending'] }
        });
        const acceptedCount = await Registration.countDocuments({
          tournament: t._id,
          status: 'accepted'
        });

        return {
          ...t.toObject(),
          registeredTeamsCount: registeredCount,
          acceptedTeamsCount: acceptedCount
        };
      })
    );

    res.json(tournamentsWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get tournament by ID
// @route   GET /api/tournaments/:id
// @access  Public
const getTournamentById = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('organizer', 'name username avatar email bio');

    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    const acceptedRegistrations = await Registration.find({
      tournament: tournament._id,
      status: 'accepted'
    }).populate('team', 'name logo game country captain players');

    const registeredTeamsCount = await Registration.countDocuments({
      tournament: tournament._id,
      status: { $in: ['accepted', 'pending'] }
    });

    res.json({
      ...tournament.toObject(),
      registeredTeamsCount,
      acceptedTeams: acceptedRegistrations.map((r) => r.team)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get tournament by slug
// @route   GET /api/tournaments/slug/:slug
// @access  Public
const getTournamentBySlug = async (req, res) => {
  try {
    const tournament = await Tournament.findOne({ slug: req.params.slug.toLowerCase() })
      .populate('organizer', 'name username avatar email bio');

    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    const acceptedRegistrations = await Registration.find({
      tournament: tournament._id,
      status: 'accepted'
    }).populate('team', 'name logo game country captain players');

    const registeredTeamsCount = await Registration.countDocuments({
      tournament: tournament._id,
      status: { $in: ['accepted', 'pending'] }
    });

    res.json({
      ...tournament.toObject(),
      registeredTeamsCount,
      acceptedTeams: acceptedRegistrations.map((r) => r.team)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new tournament
// @route   POST /api/tournaments
// @access  Private (Organizer)
const createTournament = async (req, res) => {
  try {
    const {
      title,
      game,
      banner,
      logo,
      description,
      tournamentType,
      platform,
      location,
      country,
      startDate,
      endDate,
      registrationDeadline,
      teamSize,
      maxTeams,
      prizePool,
      rules,
      status
    } = req.body;

    if (!title || !game || !description) {
      return res.status(400).json({ message: 'Title, Game, and Description are required' });
    }

    // Auto-default dates if missing or empty for instant friction-free submission
    const now = new Date();
    const defaultStart = startDate ? new Date(startDate) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const defaultEnd = endDate ? new Date(endDate) : new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const defaultDeadline = registrationDeadline ? new Date(registrationDeadline) : new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

    let slugBase = slugify(title);
    let slug = slugBase;
    let counter = 1;
    while (await Tournament.findOne({ slug })) {
      slug = `${slugBase}-${counter}`;
      counter++;
    }

    const tournament = await Tournament.create({
      title,
      slug,
      game,
      banner: banner || 'https://static-cdn.jtvnw.net/ttv-boxart/516575-285x380.jpg',
      logo: logo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(title),
      description,
      organizer: req.user._id,
      tournamentType: tournamentType || 'Online',
      platform: platform || 'PC',
      location: location || 'Online',
      country: country || 'India',
      startDate: defaultStart,
      endDate: defaultEnd,
      registrationDeadline: defaultDeadline,
      teamSize: teamSize || { min: 5, max: 7 },
      maxTeams: maxTeams || 32,
      prizePool: prizePool || '₹50,000',
      rules: rules || 'Standard competitive rules apply.',
      status: status || 'published'
    });

    console.log(`[TOURNAMENT CREATED] ID: ${tournament._id}, Title: "${tournament.title}", Status: ${tournament.status}`);

    res.status(201).json(tournament);
  } catch (error) {
    console.error('[CREATE TOURNAMENT ERROR]', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update tournament
// @route   PUT /api/tournaments/:id
// @access  Private (Organizer owner)
const updateTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    if (tournament.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this tournament' });
    }

    const updated = await Tournament.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete tournament
// @route   DELETE /api/tournaments/:id
// @access  Private (Organizer owner)
const deleteTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    if (tournament.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this tournament' });
    }

    await Registration.deleteMany({ tournament: tournament._id });
    await tournament.deleteOne();

    res.json({ message: 'Tournament and related registrations deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle publish / unpublish status
// @route   PATCH /api/tournaments/:id/publish
// @access  Private (Organizer owner)
const togglePublishTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    if (tournament.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to publish/unpublish this tournament' });
    }

    const newStatus = tournament.status === 'published' ? 'draft' : 'published';
    tournament.status = newStatus;
    await tournament.save();

    res.json({ message: `Tournament status updated to ${newStatus}`, tournament });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTournaments,
  getMyHostedTournaments,
  getTournamentById,
  getTournamentBySlug,
  createTournament,
  updateTournament,
  deleteTournament,
  togglePublishTournament
};
