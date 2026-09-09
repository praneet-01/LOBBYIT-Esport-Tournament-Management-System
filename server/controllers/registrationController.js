const Registration = require('../models/Registration');
const Tournament = require('../models/Tournament');
const Team = require('../models/Team');

// @desc    Register a team for a tournament
// @route   POST /api/registrations
// @access  Private (Team user)
const createRegistration = async (req, res) => {
  try {
    const { tournamentId, teamId, players } = req.body;

    if (!tournamentId || !teamId || !players) {
      return res.status(400).json({ message: 'Tournament, Team, and Player lineup are required' });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // 1. Check if tournament is published
    if (tournament.status !== 'published') {
      return res.status(400).json({ message: 'Cannot register: Tournament is not accepting registrations' });
    }

    // 2. Check registration deadline
    if (new Date() > new Date(tournament.registrationDeadline)) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }

    // 3. Check max teams limit
    const existingAcceptedCount = await Registration.countDocuments({
      tournament: tournament._id,
      status: 'accepted'
    });
    if (existingAcceptedCount >= tournament.maxTeams) {
      return res.status(400).json({ message: 'Tournament has reached maximum capacity' });
    }

    // 4. Validate team ownership
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team profile not found' });
    }
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only register your own team' });
    }

    // 5. Validate team size requirement
    const minSize = tournament.teamSize?.min || 1;
    const maxSize = tournament.teamSize?.max || 10;
    if (players.length < minSize || players.length > maxSize) {
      return res.status(400).json({
        message: `Lineup must contain between ${minSize} and ${maxSize} players. You provided ${players.length}.`
      });
    }

    // 6. Check duplicate registration
    const duplicate = await Registration.findOne({
      tournament: tournamentId,
      team: teamId
    });
    if (duplicate) {
      return res.status(400).json({ message: 'Your team has already registered for this tournament' });
    }

    const registration = await Registration.create({
      tournament: tournamentId,
      team: teamId,
      submittedBy: req.user._id,
      players,
      status: 'pending',
      submittedAt: new Date()
    });

    const populated = await Registration.findById(registration._id)
      .populate('tournament', 'title game banner startDate prizePool slug')
      .populate('team', 'name logo country captain');

    res.status(201).json({
      message: 'Registration submitted successfully. Status: Pending Organizer Review.',
      registration: populated
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get team's own registrations
// @route   GET /api/registrations/my
// @access  Private (Team user)
const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ submittedBy: req.user._id })
      .populate('tournament', 'title game banner startDate registrationDeadline status slug prizePool tournamentType')
      .populate('team', 'name logo game country captain')
      .sort({ createdAt: -1 });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get registrations for a specific tournament (Organizer)
// @route   GET /api/tournaments/:id/registrations
// @access  Private (Organizer owner)
const getTournamentRegistrations = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    if (tournament.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view registrations for this tournament' });
    }

    const registrations = await Registration.find({ tournament: req.params.id })
      .populate('team', 'name logo game country captain description owner')
      .populate('submittedBy', 'name email username')
      .sort({ createdAt: -1 });

    res.json({
      tournament,
      registrations
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single registration detail
// @route   GET /api/registrations/:id
// @access  Private
const getRegistrationById = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate('tournament')
      .populate('team')
      .populate('submittedBy', 'name email username');

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    res.json(registration);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept registration
// @route   PATCH /api/registrations/:id/accept
// @access  Private (Organizer owner)
const acceptRegistration = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate('tournament');

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (registration.tournament.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to manage this registration' });
    }

    registration.status = 'accepted';
    registration.reviewedAt = new Date();
    if (req.body.organizerMessage) {
      registration.organizerMessage = req.body.organizerMessage;
    }
    await registration.save();

    res.json({ message: 'Registration accepted successfully', registration });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject registration
// @route   PATCH /api/registrations/:id/reject
// @access  Private (Organizer owner)
const rejectRegistration = async (req, res) => {
  try {
    const { organizerMessage } = req.body;
    const registration = await Registration.findById(req.params.id)
      .populate('tournament');

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (registration.tournament.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to manage this registration' });
    }

    registration.status = 'rejected';
    registration.organizerMessage = organizerMessage || 'Registration rejected by organizer.';
    registration.reviewedAt = new Date();
    await registration.save();

    res.json({ message: 'Registration rejected', registration });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRegistration,
  getMyRegistrations,
  getTournamentRegistrations,
  getRegistrationById,
  acceptRegistration,
  rejectRegistration
};
