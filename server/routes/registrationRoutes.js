const express = require('express');
const router = express.Router();
const {
  createRegistration,
  getMyRegistrations,
  getRegistrationById,
  acceptRegistration,
  rejectRegistration
} = require('../controllers/registrationController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.post('/', protect, authorize('Team'), createRegistration);
router.get('/my', protect, authorize('Team'), getMyRegistrations);
router.get('/:id', protect, getRegistrationById);

router.patch('/:id/accept', protect, authorize('Organizer'), acceptRegistration);
router.patch('/:id/reject', protect, authorize('Organizer'), rejectRegistration);

module.exports = router;
