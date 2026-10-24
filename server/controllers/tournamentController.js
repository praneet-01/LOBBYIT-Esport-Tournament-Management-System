const jwt = require('jsonwebtoken');
const Tournament = require('../models/Tournament');
const Registration = require('../models/Registration');
const User = require('../models/User');
const Team = require('../models/Team');
const { 
  calculateMatchPoints, 
  calculateGroupLeaderboard, 
  calculateStageWideLeaderboard 
} = require('../utils/brScoring');
const { sendNotification, broadcastNotification } = require('./notificationController');


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
  if (!userId) return { canAccess: false, status: null, teamId: null };
  // If organizer
  const orgId = tournament.organizer?._id || tournament.organizer;
  if (orgId && orgId.toString() === userId.toString()) {
    return { canAccess: true, status: 'organizer', teamId: null };
  }
  // Check registration status - MUST BE ACCEPTED
  const reg = await Registration.findOne({
    tournament: tournament._id,
    submittedBy: userId
  });
  if (!reg) return { canAccess: false, status: null, teamId: null };
  if (reg.status === 'accepted') {
    return { canAccess: true, status: 'accepted', teamId: reg.team };
  }
  return { canAccess: false, status: reg.status, teamId: reg.team }; // 'pending' or 'rejected'
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
      status,
      tournamentFormat,
      matchType,
      seriesLength
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
      tournamentFormat: tournamentFormat || 'battle_royale',
      matchType: matchType || (tournamentFormat === 'battle_royale' ? 'Squad' : '4v4'),
      seriesLength: seriesLength !== undefined ? Number(seriesLength) : 3,
      platform: platform || 'PC',
      location: location || 'Online',
      country: country || 'India',
      startDate: defaultStart,
      endDate: defaultEnd,
      registrationDeadline: defaultDeadline,
      teamSize: teamSize || (matchType === '1v1' ? { min: 1, max: 2 } : { min: 4, max: 6 }),
      maxTeams: maxTeams || (tournamentFormat === 'direct_series' ? 2 : 32),
      prizePool: prizePool || '₹50,000',
      isPaid: Boolean(req.body.isPaid),
      entryFee: Boolean(req.body.isPaid) ? (Math.max(0, Number(req.body.entryFee)) || 0) : 0,
      platformFee: 2,
      organizerUpiId: req.body.organizerUpiId?.trim() || 'organizer.esports@icici',
      rules: rules || 'Standard competitive rules apply.',
      status: status || 'published',
      brConfig: req.body.brConfig || {
        format: 'Battle Royale',
        stagesCount: 2,
        matchesPerGroup: 2,
        qualifyCountPerGroup: 8,
        pointsSystem: 'BGIS-10'
      }
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

// ==========================================
// BATTLE ROYALE (BGMI / FREE FIRE) ENGINE
// ==========================================


// @desc    Auto-divide accepted teams into Groups (16 teams per group) with Slots 1 to 16
// @route   POST /api/tournaments/:id/stages/auto-group
// @access  Private (Organizer owner)
const autoGroupTeams = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }
    if (tournament.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to manage this tournament' });
    }

    const { 
      stageName = 'Round 1 - Qualifiers', 
      qualifyCountPerGroup = 8,
      matchesPerGroup = 2,
      shuffle = true,
      isFinalStage = false
    } = req.body;

    // Fetch accepted registrations
    const acceptedRegistrations = await Registration.find({
      tournament: tournament._id,
      status: 'accepted'
    }).populate('team', 'name tag logo captain');

    if (acceptedRegistrations.length === 0) {
      return res.status(400).json({ 
        message: 'No accepted team registrations found. Please review and accept team registrations first.' 
      });
    }

    // Optionally shuffle teams for fair random draw
    let teamsToAssign = [...acceptedRegistrations];
    if (shuffle !== false) {
      for (let i = teamsToAssign.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [teamsToAssign[i], teamsToAssign[j]] = [teamsToAssign[j], teamsToAssign[i]];
      }
    }

    // Chunk teams into groups of up to 16 teams
    const GROUP_NAMES = ['Group A', 'Group B', 'Group C', 'Group D', 'Group E', 'Group F', 'Group G', 'Group H'];
    const groups = [];
    const chunkSize = 16;
    const MAP_CYCLE = ['Erangel', 'Miramar', 'Sanhok', 'Vikendi', 'Rondo', 'Karakin'];
    const numMatches = Math.max(1, Math.min(6, parseInt(matchesPerGroup, 10) || 2));

    for (let i = 0; i < teamsToAssign.length; i += chunkSize) {
      const chunk = teamsToAssign.slice(i, i + chunkSize);
      const groupIndex = Math.floor(i / chunkSize);
      const groupName = GROUP_NAMES[groupIndex] || `Group ${String.fromCharCode(65 + groupIndex)}`;

      // Assign Slots 1 to 16
      const groupTeams = chunk.map((reg, idx) => ({
        slotNumber: idx + 1,
        team: reg.team?._id || reg.team,
        teamName: reg.team?.name || reg.teamName || `Slot ${idx + 1}`,
        teamTag: reg.team?.tag || reg.teamTag || '',
        teamLogo: reg.team?.logo || ''
      }));

      // Generate configured matches for this group
      const matches = [];
      for (let m = 0; m < numMatches; m++) {
        const mapName = MAP_CYCLE[m % MAP_CYCLE.length];
        matches.push({
          matchNumber: m + 1,
          title: `${groupName} - Match ${m + 1} (${mapName})`,
          map: mapName,
          roomId: '',
          password: '',
          customNote: 'Custom room credentials will unlock before match start. Strictly join your assigned slot.',
          status: 'upcoming',
          scheduledTime: new Date(Date.now() + m * 3600000),
          results: groupTeams.map((t) => ({
            team: t.team,
            teamName: t.teamName,
            teamLogo: t.teamLogo,
            slotNumber: t.slotNumber,
            rank: 0,
            kills: 0,
            placementPoints: 0,
            killPoints: 0,
            totalPoints: 0,
            wwcd: false,
            proofStatus: 'none'
          }))
        });
      }

      groups.push({
        name: groupName,
        teams: groupTeams,
        matches
      });
    }

    const isFinal = Boolean(isFinalStage) || stageName.toLowerCase().includes('final');

    // Remove existing stage with same name if any, or push
    const existingStageIndex = tournament.stages.findIndex((s) => s.name.toLowerCase() === stageName.toLowerCase());
    const newStage = {
      name: stageName,
      stageOrder: existingStageIndex >= 0 ? tournament.stages[existingStageIndex].stageOrder : (tournament.stages.length + 1),
      status: 'upcoming',
      isFinalStage: isFinal,
      qualifyCountPerGroup: isFinal ? 0 : (Number(qualifyCountPerGroup) || 8),
      groups
    };

    if (existingStageIndex >= 0) {
      tournament.stages[existingStageIndex] = newStage;
    } else {
      tournament.stages.push(newStage);
    }

    await tournament.save();

    res.status(200).json({
      message: `Successfully created ${stageName} with ${groups.length} group(s), Slots 1 to 16 allocated, and ${numMatches} match(es) per group!`,
      stage: tournament.stages[existingStageIndex >= 0 ? existingStageIndex : tournament.stages.length - 1],
      totalAcceptedTeams: acceptedRegistrations.length
    });
  } catch (error) {
    console.error('Error in autoGroupTeams:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a new match to a group in a stage (e.g., Match 2 - Miramar)
// @route   POST /api/tournaments/:id/stages/:stageId/groups/:groupId/matches
// @access  Private (Organizer owner)
const addGroupMatch = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
    if (tournament.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to manage this tournament' });
    }

    const stage = tournament.stages.id(req.params.stageId);
    if (!stage) return res.status(404).json({ message: 'Stage not found' });

    const group = stage.groups.id(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const { title, map = 'Miramar', scheduledTime, customNote } = req.body;
    const nextMatchNumber = (group.matches?.length || 0) + 1;

    // Initialize 16 team result rows corresponding to the group's assigned slots
    const initialResults = (group.teams || []).map((t) => ({
      team: t.team,
      teamName: t.teamName,
      teamLogo: t.teamLogo,
      slotNumber: t.slotNumber,
      rank: 0,
      kills: 0,
      placementPoints: 0,
      killPoints: 0,
      totalPoints: 0,
      wwcd: false,
      proofStatus: 'none'
    }));

    const newMatch = {
      matchNumber: nextMatchNumber,
      title: title || `${group.name} - Match ${nextMatchNumber} (${map})`,
      map,
      roomId: '',
      password: '',
      customNote: customNote || '',
      status: 'upcoming',
      scheduledTime: scheduledTime ? new Date(scheduledTime) : new Date(),
      results: initialResults
    };

    group.matches.push(newMatch);
    await tournament.save();

    res.status(201).json({
      message: `Match ${nextMatchNumber} added to ${group.name}`,
      match: group.matches[group.matches.length - 1],
      matches: group.matches
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Room ID & Password or Map for a group match
// @route   PUT /api/tournaments/:id/stages/:stageId/groups/:groupId/matches/:matchId/credentials
// @access  Private (Organizer owner)
const updateGroupMatchCredentials = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
    if (tournament.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to manage this tournament' });
    }

    const stage = tournament.stages.id(req.params.stageId);
    if (!stage) return res.status(404).json({ message: 'Stage not found' });

    const group = stage.groups.id(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const match = group.matches.id(req.params.matchId);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const { roomId, password, map, status, customNote, scheduledTime } = req.body;

    if (roomId !== undefined) match.roomId = roomId.trim();
    if (password !== undefined) match.password = password.trim();
    if (map !== undefined) match.map = map.trim();
    if (customNote !== undefined) match.customNote = customNote;
    if (scheduledTime !== undefined) match.scheduledTime = new Date(scheduledTime);
    if (status !== undefined) match.status = status;

    if (roomId || password) {
      match.credentialsSharedAt = new Date();
      if (!status || status === 'upcoming') {
        match.status = 'live';
      }
    }

    await tournament.save();

    // In-App Push Notification: Notify all accepted teams in this group
    if (match.roomId && match.password) {
      try {
        const teamIds = (group.teams || []).map((t) => t.team?._id || t.team).filter(Boolean);
        const acceptedRegs = await Registration.find({
          tournament: tournament._id,
          team: { $in: teamIds }
        });
        const recipientIds = acceptedRegs.map((r) => r.submittedBy).filter(Boolean);
        if (recipientIds.length > 0) {
          await broadcastNotification({
            recipients: recipientIds,
            sender: req.user._id,
            tournament: tournament._id,
            title: `🔑 Room ID Released: ${match.title}`,
            message: `Room ID: ${match.roomId} | Password: ${match.password}. Check your assigned slot in ${group.name} and join room.`,
            type: 'room_credentials',
            metadata: {
              matchId: match._id.toString(),
              matchTitle: match.title,
              roomId: match.roomId,
              password: match.password,
              stageName: stage.name,
              groupName: group.name
            },
            link: `/tournaments/${tournament.slug || tournament._id}`
          });
        }
      } catch (notifErr) {
        console.warn('[Room credentials notification failed]:', notifErr.message);
      }
    }

    res.json({
      message: 'Group match credentials updated successfully',
      match
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Fast-Save 16-Team Score Matrix for a Match (Auto calculates placement + kill pts + WWCD)
// @route   PUT /api/tournaments/:id/stages/:stageId/groups/:groupId/matches/:matchId/score-matrix
// @access  Private (Organizer owner)
const saveMatchScoreMatrix = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
    if (tournament.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to manage this tournament' });
    }

    const stage = tournament.stages.id(req.params.stageId);
    if (!stage) return res.status(404).json({ message: 'Stage not found' });

    const group = stage.groups.id(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const match = group.matches.id(req.params.matchId);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const { scores = [], markCompleted = true } = req.body;
    // scores: Array of { slotNumber, teamId, rank, kills, proofStatus }

    if (!Array.isArray(scores) || scores.length === 0) {
      return res.status(400).json({ message: 'Scores array must contain team rank and kills data' });
    }

    // Process each team's score with official BR Scoring engine
    const updatedResults = scores.map((item) => {
      const calc = calculateMatchPoints(item.rank, item.kills);
      const existingRes = match.results?.find((r) => r.slotNumber === item.slotNumber || (item.teamId && r.team?.toString() === item.teamId.toString()));

      return {
        team: item.teamId || existingRes?.team,
        teamName: item.teamName || existingRes?.teamName || `Slot ${item.slotNumber}`,
        teamLogo: item.teamLogo || existingRes?.teamLogo || '',
        slotNumber: item.slotNumber,
        rank: calc.rank,
        kills: calc.kills,
        placementPoints: calc.placementPoints,
        killPoints: calc.killPoints,
        totalPoints: calc.totalPoints,
        wwcd: calc.wwcd,
        screenshotProof: existingRes?.screenshotProof || item.screenshotProof || '',
        proofStatus: item.proofStatus || existingRes?.proofStatus || 'verified',
        submittedKills: existingRes?.submittedKills || 0,
        submittedRank: existingRes?.submittedRank || 0,
        submittedAt: existingRes?.submittedAt
      };
    });

    match.results = updatedResults;
    if (markCompleted) {
      match.status = 'completed';
    }

    await tournament.save();

    // Compute updated group leaderboard & stage leaderboard
    const leaderboard = calculateGroupLeaderboard(group.teams, group.matches);
    const stageLeaderboard = calculateStageWideLeaderboard(stage.groups);

    res.json({
      message: 'Scores calculated & saved successfully! Leaderboard updated.',
      match,
      leaderboard,
      stageLeaderboard
    });
  } catch (error) {
    console.error('Error in saveMatchScoreMatrix:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Team submits screenshot proof and claimed rank/kills
// @route   POST /api/tournaments/:id/stages/:stageId/groups/:groupId/matches/:matchId/submit-proof
// @access  Private (Team Captain / Player)
const submitMatchScreenshotProof = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

    const stage = tournament.stages.id(req.params.stageId);
    if (!stage) return res.status(404).json({ message: 'Stage not found' });

    const group = stage.groups.id(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const match = group.matches.id(req.params.matchId);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const { screenshotProof, submittedRank, submittedKills, teamId, slotNumber } = req.body;

    if (!screenshotProof) {
      return res.status(400).json({ message: 'End-game screenshot proof URL is required' });
    }

    // Locate the team's result record in this match
    let targetResult = match.results.find((r) => 
      (teamId && r.team && r.team.toString() === teamId.toString()) || 
      (slotNumber && r.slotNumber === Number(slotNumber))
    );

    if (!targetResult) {
      // Find team in group slot list
      const slotItem = group.teams.find((t) => 
        (teamId && t.team && t.team.toString() === teamId.toString()) || 
        (slotNumber && t.slotNumber === Number(slotNumber))
      );

      targetResult = {
        team: slotItem?.team || teamId,
        teamName: slotItem?.teamName || `Slot ${slotNumber}`,
        teamLogo: slotItem?.teamLogo || '',
        slotNumber: slotItem?.slotNumber || Number(slotNumber) || 1,
        rank: Number(submittedRank) || 16,
        kills: Number(submittedKills) || 0,
        placementPoints: 0,
        killPoints: 0,
        totalPoints: 0,
        wwcd: false
      };
      match.results.push(targetResult);
      targetResult = match.results[match.results.length - 1];
    }

    targetResult.screenshotProof = screenshotProof;
    targetResult.submittedRank = Number(submittedRank) || 16;
    targetResult.submittedKills = Number(submittedKills) || 0;
    targetResult.proofStatus = 'submitted';
    targetResult.submittedAt = new Date();

    await tournament.save();

    res.json({
      message: 'Proof submitted successfully! The organizer will verify and confirm points.',
      result: targetResult
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Organizer approves or rejects screenshot proof
// @route   PATCH /api/tournaments/:id/stages/:stageId/groups/:groupId/matches/:matchId/verify-proof/:resultId
// @access  Private (Organizer owner)
const verifyScreenshotProof = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
    if (tournament.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to manage this tournament' });
    }

    const stage = tournament.stages.id(req.params.stageId);
    if (!stage) return res.status(404).json({ message: 'Stage not found' });

    const group = stage.groups.id(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const match = group.matches.id(req.params.matchId);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const result = match.results.id(req.params.resultId);
    if (!result) return res.status(404).json({ message: 'Result record not found' });

    const { action = 'approve', confirmedRank, confirmedKills } = req.body;

    if (action === 'approve') {
      const finalRank = confirmedRank !== undefined ? Number(confirmedRank) : result.submittedRank;
      const finalKills = confirmedKills !== undefined ? Number(confirmedKills) : result.submittedKills;

      const calc = calculateMatchPoints(finalRank, finalKills);
      result.rank = calc.rank;
      result.kills = calc.kills;
      result.placementPoints = calc.placementPoints;
      result.killPoints = calc.killPoints;
      result.totalPoints = calc.totalPoints;
      result.wwcd = calc.wwcd;
      result.proofStatus = 'verified';
    } else {
      result.proofStatus = 'rejected';
    }

    await tournament.save();

    const leaderboard = calculateGroupLeaderboard(group.teams, group.matches);

    res.json({
      message: `Proof ${action === 'approve' ? 'approved & points awarded' : 'rejected'}.`,
      result,
      leaderboard
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all Stages, Groups, Slots (1-16), and Live Standings Leaderboard
// @route   GET /api/tournaments/:id/stages
// @access  Public (Masks credentials if user not authorized)
const getTournamentStagesAndLeaderboard = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('organizer', 'name username avatar')
      .populate('champion.firstPlace.team')
      .populate('champion.secondPlace.team')
      .populate('champion.thirdPlace.team');

    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

    // Auth check for credentials
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

    // Compute leaderboard for every group in every stage
    const stagesWithLeaderboards = (tournament.stages || []).map((stage) => {
      const stageObj = stage.toObject();
      const groupsWithData = stageObj.groups.map((group) => {
        const leaderboard = calculateGroupLeaderboard(group.teams, group.matches);

        // Check if the user is the organizer or a member of a team qualified/assigned to this specific group
        const isTeamInThisGroup = authInfo.teamId && group.teams.some((t) => {
          const tId = t.team?._id || t.team;
          return tId && tId.toString() === authInfo.teamId.toString();
        });
        const canAccessGroupCredentials = authInfo.status === 'organizer' || isTeamInThisGroup;

        // Mask credentials for unauthorized users or teams not qualified for this stage group
        const safeMatches = group.matches.map((m) => {
          if (!canAccessGroupCredentials) {
            const lockLabel = !authInfo.canAccess
              ? 'LOCKED (Accepted Teams Only)'
              : 'LOCKED (Qualified Teams Only)';
            return {
              ...m,
              isRoomUnlocked: false,
              roomId: m.roomId ? lockLabel : '',
              password: m.password ? '••••••••' : ''
            };
          }
          return {
            ...m,
            isRoomUnlocked: true
          };
        });

        return {
          ...group,
          matches: safeMatches,
          leaderboard
        };
      });

      // Compute Stage-Wide Overall Standings across all groups in this stage
      const stageLeaderboard = calculateStageWideLeaderboard(stageObj.groups);

      return {
        ...stageObj,
        groups: groupsWithData,
        stageLeaderboard
      };
    });

    res.json({
      tournamentId: tournament._id,
      tournamentTitle: tournament.title,
      game: tournament.game,
      status: tournament.status,
      prizePool: tournament.prizePool,
      isPaid: tournament.isPaid,
      entryFee: tournament.entryFee,
      platformFee: tournament.platformFee,
      payoutStatus: tournament.payoutStatus,
      payoutDistribution: tournament.payoutDistribution || [],
      champion: tournament.champion,
      isRoomUnlocked: authInfo.canAccess,
      stages: stagesWithLeaderboards
    });
  } catch (error) {
    console.error('Error in getTournamentStagesAndLeaderboard:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Promote Top X teams from each group in current stage to Next Stage (e.g., Grand Finals)
// @route   POST /api/tournaments/:id/stages/:stageId/promote
// @access  Private (Organizer owner)
const promoteStageTeams = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
    if (tournament.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to manage this tournament' });
    }

    const currentStage = tournament.stages.id(req.params.stageId);
    if (!currentStage) return res.status(404).json({ message: 'Current stage not found' });

    const {
      nextStageName = 'Grand Finals',
      qualifyCount = currentStage.qualifyCountPerGroup || 4
    } = req.body;

    const qualifiedTeams = [];

    // Extract top X teams from each group based on leaderboard
    currentStage.groups.forEach((group) => {
      const lb = calculateGroupLeaderboard(group.teams, group.matches);
      const topSlice = lb.slice(0, Number(qualifyCount));
      topSlice.forEach((item) => {
        qualifiedTeams.push({
          team: item.teamId,
          teamName: item.teamName,
          teamTag: item.teamTag,
          teamLogo: item.teamLogo
        });
      });
    });

    if (qualifiedTeams.length === 0) {
      return res.status(400).json({ message: 'No teams could be qualified. Ensure matches have been scored.' });
    }

    // Limit to max 16 teams for Grand Finals lobby
    const finalsLobbyTeams = qualifiedTeams.slice(0, 16).map((t, idx) => ({
      slotNumber: idx + 1,
      team: t.team,
      teamName: t.teamName,
      teamTag: t.teamTag,
      teamLogo: t.teamLogo
    }));

    // Mark current stage completed
    currentStage.status = 'completed';

    const isFinal = Boolean(req.body.isFinalStage) || nextStageName.toLowerCase().includes('final');
    const numMatches = Math.max(1, Math.min(6, parseInt(req.body.matchesCount || req.body.matchesPerGroup, 10) || 2));
    const MAP_CYCLE = ['Erangel', 'Miramar', 'Sanhok', 'Vikendi', 'Rondo'];

    const finalsMatches = [];
    for (let m = 0; m < numMatches; m++) {
      const mapName = MAP_CYCLE[m % MAP_CYCLE.length];
      finalsMatches.push({
        matchNumber: m + 1,
        title: `${nextStageName} - Match ${m + 1} (${mapName})`,
        map: mapName,
        roomId: '',
        password: '',
        customNote: isFinal ? `Grand Finals Match ${m + 1}: Elite 16 battle for the championship trophy.` : `Match ${m + 1}`,
        status: 'upcoming',
        scheduledTime: new Date(Date.now() + (m + 1) * 3600000),
        results: finalsLobbyTeams.map((t) => ({
          team: t.team,
          teamName: t.teamName,
          teamLogo: t.teamLogo,
          slotNumber: t.slotNumber,
          rank: 0,
          kills: 0,
          placementPoints: 0,
          killPoints: 0,
          totalPoints: 0,
          wwcd: false,
          proofStatus: 'none'
        }))
      });
    }

    // Create next stage
    const nextStage = {
      name: nextStageName,
      stageOrder: currentStage.stageOrder + 1,
      status: 'upcoming',
      isFinalStage: isFinal,
      qualifyCountPerGroup: isFinal ? 0 : 3,
      groups: [
        {
          name: isFinal ? 'Grand Finals Lobby' : `${nextStageName} Lobby`,
          teams: finalsLobbyTeams,
          matches: finalsMatches
        }
      ]
    };

    tournament.stages.push(nextStage);
    await tournament.save();

    // In-App Push Notification: Notify qualified teams
    try {
      const qualifiedTeamIds = finalsLobbyTeams.map((t) => t.team).filter(Boolean);
      const qualifiedRegs = await Registration.find({
        tournament: tournament._id,
        team: { $in: qualifiedTeamIds }
      });
      const recipientIds = qualifiedRegs.map((r) => r.submittedBy).filter(Boolean);
      if (recipientIds.length > 0) {
        await broadcastNotification({
          recipients: recipientIds,
          sender: req.user._id,
          tournament: tournament._id,
          title: `🏆 Congratulations! Qualified for ${nextStageName}!`,
          message: `Your squad finished in the top rank and qualified for ${nextStageName}. Room credentials will unlock in your lobby when live.`,
          type: 'qualification',
          metadata: { stageName: nextStageName },
          link: `/tournaments/${tournament.slug || tournament._id}`
        });
      }
    } catch (notifErr) {
      console.warn('[Qualification notification failed]:', notifErr.message);
    }

    res.status(201).json({
      message: `Successfully qualified ${finalsLobbyTeams.length} teams into ${nextStageName}!`,
      newStage: tournament.stages[tournament.stages.length - 1]
    });
  } catch (error) {
    console.error('Error in promoteStageTeams:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Crown Tournament Champions (1st, 2nd, 3rd) & Complete Tournament
// @route   POST /api/tournaments/:id/crown-champions
// @access  Private (Organizer owner)
const crownTournamentChampions = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
    if (tournament.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to crown champions' });
    }

    const { firstPlace, secondPlace, thirdPlace } = req.body;

    if (!firstPlace || !firstPlace.teamName) {
      return res.status(400).json({ message: '1st Place Champion details are required' });
    }

    tournament.champion = {
      firstPlace: {
        team: firstPlace.teamId || firstPlace.team,
        teamName: firstPlace.teamName,
        teamLogo: firstPlace.teamLogo || ''
      },
      secondPlace: {
        team: secondPlace?.teamId || secondPlace?.team,
        teamName: secondPlace?.teamName || '',
        teamLogo: secondPlace?.teamLogo || ''
      },
      thirdPlace: {
        team: thirdPlace?.teamId || thirdPlace?.team,
        teamName: thirdPlace?.teamName || '',
        teamLogo: thirdPlace?.teamLogo || ''
      }
    };

    tournament.status = 'completed';
    await tournament.save();

    res.json({
      message: `🏆 Congratulations to ${firstPlace.teamName}! Tournament officially completed.`,
      champion: tournament.champion,
      tournament
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Disburse or record prize distribution payouts to winners
// @route   POST /api/tournaments/:id/payout
// @access  Private (Organizer owner)
const disbursePrizePayout = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
    if (tournament.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to manage prize payouts for this tournament' });
    }

    const { distribution = [] } = req.body;
    if (!Array.isArray(distribution) || distribution.length === 0) {
      return res.status(400).json({ message: 'Prize distribution list cannot be empty' });
    }

    const formatted = distribution.map((item, idx) => ({
      place: item.place || idx + 1,
      title: item.title || (item.place === 1 ? 'Champion' : item.place === 2 ? '1st Runner-Up' : '2nd Runner-Up'),
      team: item.team || item.teamId,
      teamName: item.teamName,
      amount: Number(item.amount) || 0,
      upiId: item.upiId || 'winner@upi',
      txnId: item.txnId || `TXN_PAYOUT_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'disbursed',
      disbursedAt: new Date()
    }));

    tournament.payoutDistribution = formatted;
    tournament.payoutStatus = 'completed';
    await tournament.save();

    res.json({
      message: `Prize distribution of ₹${formatted.reduce((s, i) => s + i.amount, 0).toLocaleString()} successfully processed and disbursed!`,
      payoutDistribution: tournament.payoutDistribution,
      payoutStatus: tournament.payoutStatus
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// Head-to-Head (1v1, 4v4, 5v5) Bracket & Series Engine
// ==========================================

// Helper: Determine appropriate round title from count of matches
const getRoundTitle = (matchCount, isFinal = false) => {
  if (isFinal || matchCount === 1) return 'Grand Finals';
  if (matchCount === 2) return 'Semi-Finals';
  if (matchCount <= 4) return 'Quarter-Finals';
  if (matchCount <= 8) return 'Round of 16';
  return `Round 1`;
};

// @desc    Generate Bracket Round 1 (Pairs up teams for 1v1, 4v4, 5v5 knockout or direct series)
// @route   POST /api/tournaments/:id/bracket/generate
// @access  Private (Organizer owner)
const generateBracketRounds = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
    if (tournament.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to manage this tournament' });
    }

    const { 
      format = tournament.tournamentFormat || 'knockout_bracket',
      matchType = tournament.matchType || '4v4',
      bestOf = tournament.seriesLength || 3,
      shuffle = true
    } = req.body;

    // Fetch accepted registrations
    const acceptedRegistrations = await Registration.find({
      tournament: tournament._id,
      status: 'accepted'
    }).populate('team', 'name tag logo captain players');

    if (acceptedRegistrations.length < 2) {
      return res.status(400).json({ 
        message: 'At least 2 accepted teams are required to generate head-to-head fixtures.' 
      });
    }

    let teamsList = acceptedRegistrations.map((r) => ({
      team: r.team?._id || r.team,
      teamName: r.team?.name || r.teamName || 'Team',
      teamLogo: r.team?.logo || '',
      teamTag: r.team?.tag || ''
    }));

    // Optional shuffle
    if (shuffle !== false) {
      for (let i = teamsList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [teamsList[i], teamsList[j]] = [teamsList[j], teamsList[i]];
      }
    }

    const numBestOf = Math.max(1, Math.min(7, parseInt(bestOf, 10) || 3));
    const isDirectSeries = format === 'direct_series' || teamsList.length === 2;

    tournament.tournamentFormat = isDirectSeries ? 'direct_series' : 'knockout_bracket';
    tournament.matchType = matchType;
    tournament.seriesLength = numBestOf;
    tournament.bracket = []; // Reset bracket for clean new draw
    tournament.champion = null;

    if (isDirectSeries) {
      // CASE 1: Exactly 2 teams playing a direct series (Bo1, Bo3, Bo5)
      const t1 = teamsList[0];
      const t2 = teamsList[1];

      const games = [];
      for (let g = 1; g <= numBestOf; g++) {
        games.push({
          gameNumber: g,
          map: `Game ${g}`,
          team1Score: 0,
          team2Score: 0,
          status: 'upcoming'
        });
      }

      tournament.bracket.push({
        roundNumber: 1,
        roundName: 'Grand Finals Showdown',
        matches: [
          {
            matchNumber: 1,
            roundNumber: 1,
            roundName: 'Grand Finals Showdown',
            team1: { team: t1.team, teamName: t1.teamName, teamLogo: t1.teamLogo, score: 0 },
            team2: { team: t2.team, teamName: t2.teamName, teamLogo: t2.teamLogo, score: 0 },
            bestOf: numBestOf,
            games,
            status: 'upcoming',
            roomId: '',
            password: '',
            map: `${matchType} Arena`
          }
        ]
      });
    } else {
      // CASE 2: Multi-team knockout tournament (e.g. 10 teams -> 5 matches, 8 teams -> 4 matches)
      const matches = [];
      let matchNum = 1;

      for (let i = 0; i < teamsList.length; i += 2) {
        const t1 = teamsList[i];
        const t2 = teamsList[i + 1];

        const games = [];
        for (let g = 1; g <= numBestOf; g++) {
          games.push({
            gameNumber: g,
            map: `Game ${g}`,
            team1Score: 0,
            team2Score: 0,
            status: 'upcoming'
          });
        }

        if (t2) {
          matches.push({
            matchNumber: matchNum++,
            roundNumber: 1,
            roundName: 'Round 1',
            team1: { team: t1.team, teamName: t1.teamName, teamLogo: t1.teamLogo, score: 0 },
            team2: { team: t2.team, teamName: t2.teamName, teamLogo: t2.teamLogo, score: 0 },
            bestOf: numBestOf,
            games,
            status: 'upcoming',
            roomId: '',
            password: '',
            map: `${matchType} Arena`,
            isBye: false
          });
        } else {
          // Odd team gets a bye directly to Round 2
          matches.push({
            matchNumber: matchNum++,
            roundNumber: 1,
            roundName: 'Round 1',
            team1: { team: t1.team, teamName: t1.teamName, teamLogo: t1.teamLogo, score: 0 },
            team2: { team: null, teamName: 'BYE (Auto-Advances)', teamLogo: '', score: 0 },
            bestOf: numBestOf,
            games: [],
            winner: { team: t1.team, teamName: t1.teamName, teamLogo: t1.teamLogo },
            status: 'completed',
            isBye: true
          });
        }
      }

      const initialRoundTitle = getRoundTitle(matches.length, matches.length === 1);

      matches.forEach((m) => { m.roundName = initialRoundTitle; });

      tournament.bracket.push({
        roundNumber: 1,
        roundName: initialRoundTitle,
        matches
      });
    }

    await tournament.save();

    res.status(201).json({
      message: `Successfully generated ${tournament.tournamentFormat === 'direct_series' ? 'Direct Series' : 'Knockout Bracket'} with ${acceptedRegistrations.length} teams!`,
      bracket: tournament.bracket,
      tournamentFormat: tournament.tournamentFormat,
      matchType: tournament.matchType,
      seriesLength: tournament.seriesLength
    });
  } catch (error) {
    console.error('Error in generateBracketRounds:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update match score (Game by game or Series result)
// @route   PUT /api/tournaments/:id/bracket/round/:roundNumber/match/:matchId
// @access  Private (Organizer owner)
const updateBracketMatchScore = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
    if (tournament.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to manage this tournament' });
    }

    const roundNum = Number(req.params.roundNumber);
    const round = tournament.bracket.find((r) => r.roundNumber === roundNum);
    if (!round) return res.status(404).json({ message: 'Bracket round not found' });

    const match = round.matches.id(req.params.matchId);
    if (!match) return res.status(404).json({ message: 'Match fixture not found' });

    const {
      team1Score,
      team2Score,
      winnerTeamId,
      roomId,
      password,
      map,
      status,
      games
    } = req.body;

    if (roomId !== undefined) match.roomId = roomId.trim();
    if (password !== undefined) match.password = password.trim();
    if (map !== undefined) match.map = map.trim();
    if (status !== undefined) match.status = status;

    if (team1Score !== undefined) match.team1.score = Number(team1Score);
    if (team2Score !== undefined) match.team2.score = Number(team2Score);

    // Update individual games if provided
    if (Array.isArray(games)) {
      match.games = games;
      // Auto compute team series scores based on individual game winners
      let t1Wins = 0;
      let t2Wins = 0;
      match.games.forEach((g) => {
        if (g.winnerTeamId && match.team1.team && g.winnerTeamId.toString() === match.team1.team.toString()) {
          t1Wins++;
        } else if (g.winnerTeamId && match.team2.team && g.winnerTeamId.toString() === match.team2.team.toString()) {
          t2Wins++;
        } else if (g.team1Score > g.team2Score && (g.team1Score > 0 || g.status === 'completed')) {
          t1Wins++;
          g.winnerTeamId = match.team1.team;
        } else if (g.team2Score > g.team1Score && (g.team2Score > 0 || g.status === 'completed')) {
          t2Wins++;
          g.winnerTeamId = match.team2.team;
        }
      });
      match.team1.score = t1Wins;
      match.team2.score = t2Wins;
    }

    // Check majority threshold for Best-of-N
    const winsRequired = Math.ceil(match.bestOf / 2);
    let resolvedWinnerId = winnerTeamId;

    if (!resolvedWinnerId) {
      if (match.team1.score >= winsRequired) {
        resolvedWinnerId = match.team1.team;
      } else if (match.team2.score >= winsRequired) {
        resolvedWinnerId = match.team2.team;
      }
    }

    if (resolvedWinnerId) {
      if (match.team1.team && resolvedWinnerId.toString() === match.team1.team.toString()) {
        match.winner = {
          team: match.team1.team,
          teamName: match.team1.teamName,
          teamLogo: match.team1.teamLogo
        };
        match.status = 'completed';
      } else if (match.team2.team && resolvedWinnerId.toString() === match.team2.team.toString()) {
        match.winner = {
          team: match.team2.team,
          teamName: match.team2.teamName,
          teamLogo: match.team2.teamLogo
        };
        match.status = 'completed';
      }
    }

    // If this match is the Grand Finals and is completed, auto-crown champion!
    const isFinalMatch = match.roundName.toLowerCase().includes('final') || 
                         round.roundName.toLowerCase().includes('final') || 
                         round.matches.length === 1;

    if (isFinalMatch && match.winner && match.winner.team) {
      const isTeam1Winner = match.team1.team && match.winner.team.toString() === match.team1.team.toString();
      const runnerUp = isTeam1Winner ? match.team2 : match.team1;

      tournament.champion = {
        firstPlace: {
          team: match.winner.team,
          teamName: match.winner.teamName,
          teamLogo: match.winner.teamLogo || ''
        },
        secondPlace: runnerUp?.team ? {
          team: runnerUp.team,
          teamName: runnerUp.teamName,
          teamLogo: runnerUp.teamLogo || ''
        } : null,
        thirdPlace: null
      };

      tournament.status = 'completed';
    }

    await tournament.save();

    res.json({
      message: 'Match score updated successfully!',
      match,
      bracket: tournament.bracket,
      champion: tournament.champion
    });
  } catch (error) {
    console.error('Error in updateBracketMatchScore:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Advance Winners of the current round to generate the next round
// @route   POST /api/tournaments/:id/bracket/advance
// @access  Private (Organizer owner)
const advanceBracketWinners = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
    if (tournament.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to manage this tournament' });
    }

    if (!tournament.bracket || tournament.bracket.length === 0) {
      return res.status(400).json({ message: 'No active bracket exists.' });
    }

    const currentRound = tournament.bracket[tournament.bracket.length - 1];
    
    // Check if all matches in current round are completed
    const uncompleted = currentRound.matches.filter((m) => m.status !== 'completed' && !m.winner?.team);
    if (uncompleted.length > 0) {
      return res.status(400).json({ 
        message: `Please complete all matches in ${currentRound.roundName} before advancing. (${uncompleted.length} match(es) pending).` 
      });
    }

    // Extract all advancing teams
    const advancingTeams = [];
    currentRound.matches.forEach((m) => {
      if (m.winner && m.winner.team) {
        advancingTeams.push({
          team: m.winner.team,
          teamName: m.winner.teamName,
          teamLogo: m.winner.teamLogo
        });
      }
    });

    if (advancingTeams.length <= 1) {
      // Tournament is finished! Winner is crowned
      if (advancingTeams[0]) {
        tournament.champion = {
          firstPlace: advancingTeams[0],
          secondPlace: null,
          thirdPlace: null
        };
        tournament.status = 'completed';
        await tournament.save();
      }
      return res.json({
        message: `🏆 Tournament completed! ${advancingTeams[0]?.teamName || 'Winner'} is the Champion.`,
        champion: tournament.champion,
        bracket: tournament.bracket
      });
    }

    // Pair up advancing teams for next round
    const nextRoundNumber = currentRound.roundNumber + 1;
    const isNextFinal = advancingTeams.length === 2;
    const nextRoundTitle = isNextFinal ? 'Grand Finals' : advancingTeams.length <= 4 ? 'Semi-Finals' : `Round ${nextRoundNumber}`;

    const numBestOf = tournament.seriesLength || 3;
    const nextMatches = [];
    let matchCounter = 1;

    for (let i = 0; i < advancingTeams.length; i += 2) {
      const t1 = advancingTeams[i];
      const t2 = advancingTeams[i + 1];

      const games = [];
      for (let g = 1; g <= numBestOf; g++) {
        games.push({
          gameNumber: g,
          map: `Game ${g}`,
          team1Score: 0,
          team2Score: 0,
          status: 'upcoming'
        });
      }

      if (t2) {
        nextMatches.push({
          matchNumber: matchCounter++,
          roundNumber: nextRoundNumber,
          roundName: nextRoundTitle,
          team1: { team: t1.team, teamName: t1.teamName, teamLogo: t1.teamLogo, score: 0 },
          team2: { team: t2.team, teamName: t2.teamName, teamLogo: t2.teamLogo, score: 0 },
          bestOf: numBestOf,
          games,
          status: 'upcoming',
          roomId: '',
          password: '',
          map: `${tournament.matchType || '4v4'} Arena`,
          isBye: false
        });
      } else {
        // Odd team gets a bye
        nextMatches.push({
          matchNumber: matchCounter++,
          roundNumber: nextRoundNumber,
          roundName: nextRoundTitle,
          team1: { team: t1.team, teamName: t1.teamName, teamLogo: t1.teamLogo, score: 0 },
          team2: { team: null, teamName: 'BYE (Auto-Advances)', teamLogo: '', score: 0 },
          bestOf: numBestOf,
          games: [],
          winner: { team: t1.team, teamName: t1.teamName, teamLogo: t1.teamLogo },
          status: 'completed',
          isBye: true
        });
      }
    }

    tournament.bracket.push({
      roundNumber: nextRoundNumber,
      roundName: nextRoundTitle,
      matches: nextMatches
    });

    await tournament.save();

    res.status(201).json({
      message: `Successfully advanced ${advancingTeams.length} winners to ${nextRoundTitle}!`,
      newRound: tournament.bracket[tournament.bracket.length - 1],
      bracket: tournament.bracket
    });
  } catch (error) {
    console.error('Error in advanceBracketWinners:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit screenshot proof for a head-to-head match/game
// @route   POST /api/tournaments/:id/bracket/round/:roundNumber/match/:matchId/proof
// @access  Private (Registered player/team)
const submitBracketProof = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

    const round = tournament.bracket.find((r) => r.roundNumber === Number(req.params.roundNumber));
    if (!round) return res.status(404).json({ message: 'Round not found' });

    const match = round.matches.id(req.params.matchId);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const { screenshotProof, gameNumber, claimedWinnerTeamId } = req.body;
    if (!screenshotProof) {
      return res.status(400).json({ message: 'Screenshot proof image URL is required' });
    }

    if (gameNumber && match.games && match.games.length > 0) {
      const game = match.games.find((g) => g.gameNumber === Number(gameNumber)) || match.games[0];
      if (game) {
        game.screenshotProof = screenshotProof.trim();
        game.submittedAt = new Date();
      }
    } else {
      match.proofScreenshot = screenshotProof.trim();
    }

    await tournament.save();

    res.json({
      message: 'Match result screenshot proof submitted successfully! Pending organizer review.',
      match
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get tournament bracket with credentials masked for unaccepted users
// @route   GET /api/tournaments/:id/bracket
// @access  Public
const getTournamentBracket = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('organizer', 'name username avatar')
      .populate('champion.firstPlace.team')
      .populate('champion.secondPlace.team');

    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

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

    const safeBracket = (tournament.bracket || []).map((round) => {
      const rObj = round.toObject();
      const safeMatches = rObj.matches.map((m) => {
        const t1Id = m.team1?.team?._id || m.team1?.team;
        const t2Id = m.team2?.team?._id || m.team2?.team;
        const isPlayingThisMatch = authInfo.teamId && (
          (t1Id && t1Id.toString() === authInfo.teamId.toString()) ||
          (t2Id && t2Id.toString() === authInfo.teamId.toString())
        );
        const canAccessMatchCredentials = authInfo.status === 'organizer' || isPlayingThisMatch;

        if (!canAccessMatchCredentials) {
          const lockLabel = !authInfo.canAccess
            ? 'LOCKED (Accepted Teams Only)'
            : 'LOCKED (Match Participants Only)';
          return {
            ...m,
            isRoomUnlocked: false,
            roomId: m.roomId ? lockLabel : '',
            password: m.password ? '••••••••' : ''
          };
        }
        return {
          ...m,
          isRoomUnlocked: true
        };
      });
      return {
        ...rObj,
        matches: safeMatches
      };
    });

    res.json({
      tournamentId: tournament._id,
      tournamentTitle: tournament.title,
      tournamentFormat: tournament.tournamentFormat || 'knockout_bracket',
      matchType: tournament.matchType || '4v4',
      seriesLength: tournament.seriesLength || 3,
      status: tournament.status,
      champion: tournament.champion,
      isRoomUnlocked: authInfo.canAccess,
      bracket: safeBracket
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
  getTournamentMatches,
  // Battle Royale Engine Exports
  autoGroupTeams,
  addGroupMatch,
  updateGroupMatchCredentials,
  saveMatchScoreMatrix,
  submitMatchScreenshotProof,
  verifyScreenshotProof,
  getTournamentStagesAndLeaderboard,
  promoteStageTeams,
  crownTournamentChampions,
  disbursePrizePayout,
  // Head-to-Head & Bracket Exports
  generateBracketRounds,
  updateBracketMatchScore,
  advanceBracketWinners,
  submitBracketProof,
  getTournamentBracket
};


