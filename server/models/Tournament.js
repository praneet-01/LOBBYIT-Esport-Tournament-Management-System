const mongoose = require('mongoose');

const matchResultSchema = new mongoose.Schema({
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  teamName: { type: String, default: '' },
  teamLogo: { type: String, default: '' },
  slotNumber: { type: Number, min: 1, max: 16 },
  rank: { type: Number, min: 0, max: 16, default: 0 },
  kills: { type: Number, default: 0, min: 0 },
  placementPoints: { type: Number, default: 0 },
  killPoints: { type: Number, default: 0 },
  totalPoints: { type: Number, default: 0 },
  wwcd: { type: Boolean, default: false },
  screenshotProof: { type: String, default: '' },
  proofStatus: { 
    type: String, 
    enum: ['none', 'submitted', 'verified', 'rejected'], 
    default: 'none' 
  },
  submittedKills: { type: Number, default: 0 },
  submittedRank: { type: Number, default: 0 },
  submittedAt: { type: Date }
}, { timestamps: true });

const groupMatchSchema = new mongoose.Schema({
  matchNumber: { type: Number, default: 1 },
  title: { type: String, default: '' },
  map: { type: String, default: 'Erangel' },
  roomId: { type: String, default: '' },
  password: { type: String, default: '' },
  customNote: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['upcoming', 'live', 'completed', 'cancelled'], 
    default: 'upcoming' 
  },
  scheduledTime: { type: Date },
  credentialsSharedAt: { type: Date },
  results: [matchResultSchema]
}, { timestamps: true });

const slotSchema = new mongoose.Schema({
  slotNumber: { type: Number, required: true, min: 1, max: 16 },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  teamName: { type: String, default: '' },
  teamTag: { type: String, default: '' },
  teamLogo: { type: String, default: '' }
}, { _id: false });

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, default: 'Group A' },
  teams: [slotSchema], // Slots 1 to 16
  matches: [groupMatchSchema]
}, { timestamps: true });

const stageSchema = new mongoose.Schema({
  name: { type: String, required: true, default: 'Round 1 - Qualifiers' },
  stageOrder: { type: Number, default: 1 },
  status: { 
    type: String, 
    enum: ['upcoming', 'live', 'completed'], 
    default: 'upcoming' 
  },
  isFinalStage: { type: Boolean, default: false },
  qualifyCountPerGroup: { type: Number, default: 4 }, // Top X teams advance to next stage (or 0 if final)
  groups: [groupSchema]
}, { timestamps: true });

const matchSchema = new mongoose.Schema({
  matchNumber: { type: Number, default: 1 },
  title: { type: String, default: '' },
  map: { type: String, required: true },
  roomId: { type: String, default: '' },
  password: { type: String, default: '' },
  customNote: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['upcoming', 'live', 'completed', 'cancelled'], 
    default: 'upcoming' 
  },
  scheduledTime: { type: Date },
  credentialsSharedAt: { type: Date }
}, { timestamps: true });

const headToHeadGameSchema = new mongoose.Schema({
  gameNumber: { type: Number, default: 1 },
  map: { type: String, default: '' },
  team1Score: { type: Number, default: 0 },
  team2Score: { type: Number, default: 0 },
  winnerTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  status: { type: String, enum: ['upcoming', 'completed'], default: 'upcoming' },
  screenshotProof: { type: String, default: '' },
  submittedAt: { type: Date }
}, { _id: true });

const bracketMatchSchema = new mongoose.Schema({
  matchNumber: { type: Number, default: 1 },
  roundNumber: { type: Number, default: 1 },
  roundName: { type: String, default: 'Round 1' },
  team1: {
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    teamName: { type: String, default: 'TBD' },
    teamLogo: { type: String, default: '' },
    score: { type: Number, default: 0 }
  },
  team2: {
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    teamName: { type: String, default: 'TBD' },
    teamLogo: { type: String, default: '' },
    score: { type: Number, default: 0 }
  },
  bestOf: { type: Number, default: 3 }, // 1, 3, or 5
  games: [headToHeadGameSchema],
  winner: {
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    teamName: { type: String, default: '' },
    teamLogo: { type: String, default: '' }
  },
  status: { 
    type: String, 
    enum: ['upcoming', 'live', 'completed'], 
    default: 'upcoming' 
  },
  roomId: { type: String, default: '' },
  password: { type: String, default: '' },
  map: { type: String, default: '' },
  scheduledTime: { type: Date },
  isBye: { type: Boolean, default: false }
}, { timestamps: true });

const bracketRoundSchema = new mongoose.Schema({
  roundNumber: { type: Number, required: true },
  roundName: { type: String, required: true },
  matches: [bracketMatchSchema]
}, { timestamps: true });

const tournamentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  game: { type: String, required: true },
  banner: { type: String, default: '' },
  logo: { type: String, default: '' },
  description: { type: String, required: true },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tournamentType: { type: String, enum: ['Online', 'Offline'], default: 'Online' },
  tournamentFormat: {
    type: String,
    enum: ['battle_royale', 'knockout_bracket', 'direct_series'],
    default: 'battle_royale'
  },
  matchType: {
    type: String,
    default: '4v4' // '1v1', '4v4', '5v5'
  },
  seriesLength: {
    type: Number,
    default: 3 // 1, 3, 5 (Bo1, Bo3, Bo5)
  },
  platform: { type: String, default: 'PC' },
  location: { type: String, default: 'Online' },
  country: { type: String, default: 'India' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  registrationDeadline: { type: Date, required: true },
  teamSize: {
    min: { type: Number, default: 4 },
    max: { type: Number, default: 6 }
  },
  maxTeams: { type: Number, default: 32 },
  prizePool: { type: String, default: '₹50,000' },
  isPaid: { type: Boolean, default: false },
  entryFee: { type: Number, default: 0 },
  platformFee: { type: Number, default: 2 },
  organizerUpiId: { type: String, default: 'organizer.esports@icici' },
  payoutStatus: { 
    type: String, 
    enum: ['unpaid', 'processing', 'completed'], 
    default: 'unpaid' 
  },
  payoutDistribution: [{
    place: { type: Number },
    title: { type: String, default: '' },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    teamName: { type: String, default: '' },
    amount: { type: Number, default: 0 },
    upiId: { type: String, default: '' },
    txnId: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'disbursed'], default: 'pending' },
    disbursedAt: { type: Date }
  }],
  rules: { type: String, default: 'Standard esports tournament fair play rules apply.' },
  status: { 
    type: String, 
    enum: ['draft', 'published', 'registration_closed', 'completed'], 
    default: 'draft' 
  },
  brConfig: {
    format: { type: String, default: 'Battle Royale' },
    stagesCount: { type: Number, default: 2 },
    matchesPerGroup: { type: Number, default: 2 },
    qualifyCountPerGroup: { type: Number, default: 8 },
    pointsSystem: { type: String, default: 'BGIS-10' }
  },
  matches: [matchSchema],
  stages: [stageSchema],
  bracket: [bracketRoundSchema],
  champion: {
    firstPlace: {
      team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
      teamName: { type: String, default: '' },
      teamLogo: { type: String, default: '' }
    },
    secondPlace: {
      team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
      teamName: { type: String, default: '' },
      teamLogo: { type: String, default: '' }
    },
    thirdPlace: {
      team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
      teamName: { type: String, default: '' },
      teamLogo: { type: String, default: '' }
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Tournament', tournamentSchema);

