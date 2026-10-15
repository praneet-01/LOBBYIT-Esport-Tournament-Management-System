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

router.get('/me', protect, authorize('Player', 'Team'), getMyTeam);
router.post('/', protect, authorize('Player', 'Team'), createTeam);
router.get('/:id', getTeamById);
router.put('/:id', protect, authorize('Player', 'Team'), updateTeam);

module.exports = router;
