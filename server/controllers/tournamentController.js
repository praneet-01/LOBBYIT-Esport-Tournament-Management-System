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

// Helper to check if a user is the organizer or has an ACCEPTED registration
const checkUserCanAccessCredentials = async (tournament, userId) => {
  if (!userId) return { canAccess: false, status: null };
  // If organizer
  const orgId = tournament.organizer?._id || tournament.organizer;
  if (orgId && orgId.toString() === userId.toString()) {
    return { canAccess: true, status: 'organizer' };
  }
  // Check registration status - MUST BE ACCEPTED
  const reg = await Registration.findOne({
    tournament: tournament._id,
    submittedBy: userId
  });
  if (!reg) return { canAccess: false, status: null };
  if (reg.status === 'accepted') {
    return { canAccess: true, status: 'accepted' };
  }
  return { canAccess: false, status: reg.status }; // 'pending' or 'rejected'
};

// Format matches: mask Room ID & Password if not accepted or organizer
const formatMatchesForUser = (matches, isAuthorized, userRegStatus) => {
  if (!matches) return [];
  return matches.map((m) => {
    const obj = m.toObject ? m.toObject() : { ...m };
    if (!isAuthorized) {
      obj.isRoomUnlocked = false;
      obj.roomId = obj.roomId 
        ? (userRegStatus === 'pending' ? 'LOCKED (Pending Organizer Approval)' : 'LOCKED (Accepted Teams Only)') 
        : '';
      obj.password = obj.password ? '••••••••' : '';
      obj.lockReason = userRegStatus === 'pending' 
        ? 'Your registration is pending organizer review. Room credentials unlock automatically once accepted.' 
        : 'Credentials restricted to accepted teams.';
    } else {
      obj.isRoomUnlocked = true;
    }
    return obj;
  });
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

    let userId = req.user ? req.user._id : null;
    if (!userId && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwtSecret = process.env.JWT_SECRET || 'lobbyit_secret_key_2026';
        const decoded = jwt.verify(token, jwtSecret);
        userId = decoded.id;
      } catch (e) {}
    }

    const acceptedRegistrations = await Registration.find({
      tournament: tournament._id,
      status: 'accepted'
    }).populate('team', 'name logo game country captain players');

    const registeredTeamsCount = await Registration.countDocuments({
      tournament: tournament._id,
      status: { $in: ['accepted', 'pending'] }
    });

    const authInfo = await checkUserCanAccessCredentials(tournament, userId);
    const safeMatches = formatMatchesForUser(tournament.matches, authInfo.canAccess, authInfo.status);

    res.json({
      ...tournament.toObject(),
      matches: safeMatches,
      isRoomUnlocked: authInfo.canAccess,
      userRegistrationStatus: authInfo.status,
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

    let userId = req.user ? req.user._id : null;
    if (!userId && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwtSecret = process.env.JWT_SECRET || 'lobbyit_secret_key_2026';
        const decoded = jwt.verify(token, jwtSecret);
        userId = decoded.id;
      } catch (e) {}
    }

    const acceptedRegistrations = await Registration.find({
      tournament: tournament._id,
      status: 'accepted'
    }).populate('team', 'name logo game country captain players');

    const registeredTeamsCount = await Registration.countDocuments({
      tournament: tournament._id,
      status: { $in: ['accepted', 'pending'] }
    });

    const authInfo = await checkUserCanAccessCredentials(tournament, userId);
    const safeMatches = formatMatchesForUser(tournament.matches, authInfo.canAccess, authInfo.status);

    res.json({
      ...tournament.toObject(),
      matches: safeMatches,
      isRoomUnlocked: authInfo.canAccess,
      userRegistrationStatus: authInfo.status,
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

// @desc    Add a match round to a tournament
// @route   POST /api/tournaments/:id/matches
// @access  Private (Organizer owner)
const addMatchToTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }
    if (tournament.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to add matches to this tournament' });
    }

    const {
      matchNumber,
      title,
      map,
      roomId,
      password,
      customNote,
      scheduledTime,
      status
    } = req.body;

    if (!map) {
      return res.status(400).json({ message: 'Map name is required (e.g. Erangel, Bermuda, Miramar)' });
    }

    const nextNumber = matchNumber || (tournament.matches.length + 1);
    const hasCreds = Boolean(roomId || password);
    const newMatch = {
      matchNumber: nextNumber,
      title: title || `Match ${nextNumber} - ${map.trim()}`,
      map: map.trim(),
      roomId: roomId ? roomId.trim() : '',
      password: password ? password.trim() : '',
      customNote: customNote || '',
      status: status || (hasCreds ? 'live' : 'upcoming'),
      scheduledTime: scheduledTime ? new Date(scheduledTime) : new Date(),
      credentialsSharedAt: hasCreds ? new Date() : undefined
    };

    tournament.matches.push(newMatch);
    await tournament.save();

    res.status(201).json({
      message: 'Match created successfully',
      match: tournament.matches[tournament.matches.length - 1],
      matches: tournament.matches
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update match round (e.g. set Room ID, Password, Map, Status)
// @route   PUT /api/tournaments/:id/matches/:matchId
// @access  Private (Organizer owner)
const updateTournamentMatch = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }
    if (tournament.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit matches for this tournament' });
    }

    const match = tournament.matches.id(req.params.matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match round not found' });
    }

    const {
      matchNumber,
      title,
      map,
      roomId,
      password,
      customNote,
      scheduledTime,
      status
    } = req.body;

    if (matchNumber !== undefined) match.matchNumber = matchNumber;
    if (title !== undefined) match.title = title;
    if (map !== undefined) match.map = map.trim();
    if (customNote !== undefined) match.customNote = customNote;
    if (scheduledTime !== undefined) match.scheduledTime = new Date(scheduledTime);
    if (status !== undefined) match.status = status;

    if (roomId !== undefined) match.roomId = roomId.trim();
    if (password !== undefined) match.password = password.trim();

    if (roomId || password) {
      match.credentialsSharedAt = new Date();
      if (!status || status === 'upcoming') {
        match.status = 'live';
      }
    }

    await tournament.save();

    res.json({
      message: 'Match details & room credentials updated successfully',
      match,
      matches: tournament.matches
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a match round
// @route   DELETE /api/tournaments/:id/matches/:matchId
// @access  Private (Organizer owner)
const deleteTournamentMatch = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }
    if (tournament.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete matches for this tournament' });
    }

    tournament.matches.pull({ _id: req.params.matchId });
    await tournament.save();

    res.json({
      message: 'Match round deleted successfully',
      matches: tournament.matches
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get matches for a tournament with security check
// @route   GET /api/tournaments/:id/matches
// @access  Public (Credentials unlocked only for organizer & registered squads)
const getTournamentMatches = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    let userId = req.user ? req.user._id : null;
    if (!userId && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwtSecret = process.env.JWT_SECRET || 'lobbyit_secret_key_2026';
        const decoded = jwt.verify(token, jwtSecret);
        userId = decoded.id;
      } catch (e) {}
    }

    const authInfo = await checkUserCanAccessCredentials(tournament, userId);
    const safeMatches = formatMatchesForUser(tournament.matches, authInfo.canAccess, authInfo.status);

    res.json({
      tournamentId: tournament._id,
      tournamentTitle: tournament.title,
      isRoomUnlocked: authInfo.canAccess,
      userRegistrationStatus: authInfo.status,
      matches: safeMatches,
      lastUpdated: new Date()
    });
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
  togglePublishTournament,
  addMatchToTournament,
  updateTournamentMatch,
  deleteTournamentMatch,
  getTournamentMatches
};
