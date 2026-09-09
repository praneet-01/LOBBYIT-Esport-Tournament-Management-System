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
  togglePublishTournament
} = require('../controllers/tournamentController');
const { getTournamentRegistrations } = require('../controllers/registrationController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// Public routes
router.get('/', getTournaments);
router.get('/slug/:slug', getTournamentBySlug);
router.get('/organizer/my', protect, authorize('Organizer'), getMyHostedTournaments);
router.get('/:id', getTournamentById);

// Protected Organizer routes
router.post('/', protect, authorize('Organizer'), createTournament);
router.put('/:id', protect, authorize('Organizer'), updateTournament);
router.delete('/:id', protect, authorize('Organizer'), deleteTournament);
router.patch('/:id/publish', protect, authorize('Organizer'), togglePublishTournament);
router.get('/:id/registrations', protect, authorize('Organizer'), getTournamentRegistrations);

module.exports = router;
