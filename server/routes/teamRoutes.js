const express = require('express');
const router = express.Router();
const {
  createTeam,
  getMyTeam,
  getTeamById,
  updateTeam
} = require('../controllers/teamController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/me', protect, authorize('Team'), getMyTeam);
router.post('/', protect, authorize('Team'), createTeam);
router.get('/:id', getTeamById);
router.put('/:id', protect, authorize('Team'), updateTeam);

module.exports = router;
