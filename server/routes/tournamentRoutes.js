const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/tournamentController');
const { getTournamentRegistrations } = require('../controllers/registrationController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// Public routes
router.get('/', getTournaments);
router.get('/slug/:slug', getTournamentBySlug);
router.get('/organizer/my', protect, authorize('Organizer'), getMyHostedTournaments);
router.get('/:id', getTournamentById);
router.get('/:id/matches', getTournamentMatches);

// Protected Organizer routes
router.post('/', protect, authorize('Organizer'), createTournament);
router.put('/:id', protect, authorize('Organizer'), updateTournament);
router.delete('/:id', protect, authorize('Organizer'), deleteTournament);
router.patch('/:id/publish', protect, authorize('Organizer'), togglePublishTournament);
router.get('/:id/registrations', protect, authorize('Organizer'), getTournamentRegistrations);

// Match & Room credentials routes
router.post('/:id/matches', protect, authorize('Organizer'), addMatchToTournament);
router.put('/:id/matches/:matchId', protect, authorize('Organizer'), updateTournamentMatch);
router.delete('/:id/matches/:matchId', protect, authorize('Organizer'), deleteTournamentMatch);

module.exports = router;
