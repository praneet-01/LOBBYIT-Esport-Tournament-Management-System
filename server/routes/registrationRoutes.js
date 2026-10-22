const express = require('express');
const router = express.Router();
const {
  createRegistration,
  getMyRegistrations,
  getMyRegisteredMatches,
  getRegistrationById,
  acceptRegistration,
  rejectRegistration
} = require('../controllers/registrationController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.post('/', protect, authorize('Player', 'Team'), createRegistration);
router.get('/my', protect, authorize('Player', 'Team'), getMyRegistrations);
router.get('/my-matches', protect, authorize('Player', 'Team'), getMyRegisteredMatches);
router.get('/:id', protect, getRegistrationById);

router.patch('/:id/accept', protect, authorize('Organizer'), acceptRegistration);
router.patch('/:id/reject', protect, authorize('Organizer'), rejectRegistration);

module.exports = router;
