const Team = require('../models/Team');

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private (Team user)
const createTeam = async (req, res) => {
  try {
    const { name, logo, game, description, captain, players, country } = req.body;

    if (!name || !game) {
      return res.status(400).json({ message: 'Team name and game are required' });
    }

    const existingTeam = await Team.findOne({ owner: req.user._id });
    if (existingTeam) {
      return res.status(400).json({ 
        message: 'You already have a registered team. Update your existing team instead.' 
      });
    }

    const team = await Team.create({
      name,
      logo: logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
      game,
      description: description || '',
      owner: req.user._id,
      captain: captain || req.user.name,
      players: players || [],
      country: country || 'India'
    });

    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user's team
// @route   GET /api/teams/me
// @access  Private (Team user)
const getMyTeam = async (req, res) => {
  try {
    const team = await Team.findOne({ owner: req.user._id }).populate('owner', 'name username email avatar');
    if (!team) {
      return res.status(404).json({ message: 'No team profile found for this user account' });
    }
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get team by ID
// @route   GET /api/teams/:id
// @access  Public
const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate('owner', 'name username avatar');
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    // Clean private emails for public output if accessed publicly
    const safeTeam = team.toObject();
    safeTeam.players = safeTeam.players.map(p => ({
      name: p.name,
      inGameName: p.inGameName,
      country: p.country
    }));

    res.json(safeTeam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private (Team owner)
const updateTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this team' });
    }

    const updated = await Team.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTeam, getMyTeam, getTeamById, updateTeam };
