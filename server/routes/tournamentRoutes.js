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
  getTournamentMatches,
  // Battle Royale Engine
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
  // Head-to-Head / Bracket
  generateBracketRounds,
  updateBracketMatchScore,
  advanceBracketWinners,
  submitBracketProof,
  getTournamentBracket
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
router.get('/:id/stages', getTournamentStagesAndLeaderboard);
router.get('/:id/bracket', getTournamentBracket);

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

// ==========================================
// Battle Royale Engine Endpoints
// ==========================================
// Auto Group 16 teams / group with Slots 1 to 16
router.post('/:id/stages/auto-group', protect, authorize('Organizer'), autoGroupTeams);

// Group match management
router.post('/:id/stages/:stageId/groups/:groupId/matches', protect, authorize('Organizer'), addGroupMatch);
router.put('/:id/stages/:stageId/groups/:groupId/matches/:matchId/credentials', protect, authorize('Organizer'), updateGroupMatchCredentials);

// Scorecard & Fast Matrix entry
router.put('/:id/stages/:stageId/groups/:groupId/matches/:matchId/score-matrix', protect, authorize('Organizer'), saveMatchScoreMatrix);

// Proof screenshot submission (Teams) & verification (Organizer)
router.post('/:id/stages/:stageId/groups/:groupId/matches/:matchId/submit-proof', protect, submitMatchScreenshotProof);
router.patch('/:id/stages/:stageId/groups/:groupId/matches/:matchId/verify-proof/:resultId', protect, authorize('Organizer'), verifyScreenshotProof);

// Progression & Champions
router.post('/:id/stages/:stageId/promote', protect, authorize('Organizer'), promoteStageTeams);
router.post('/:id/crown-champions', protect, authorize('Organizer'), crownTournamentChampions);
router.post('/:id/payout', protect, authorize('Organizer'), disbursePrizePayout);

// ==========================================
// Head-to-Head & Knockout Bracket Endpoints
// (1v1 Football, 4v4 Clash Squad / WOW, 5v5 Valorant)
// ==========================================
router.post('/:id/bracket/generate', protect, authorize('Organizer'), generateBracketRounds);
router.put('/:id/bracket/round/:roundNumber/match/:matchId', protect, authorize('Organizer'), updateBracketMatchScore);
router.post('/:id/bracket/advance', protect, authorize('Organizer'), advanceBracketWinners);
router.post('/:id/bracket/round/:roundNumber/match/:matchId/proof', protect, submitBracketProof);

module.exports = router;


