const mongoose = require('mongoose');

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

const tournamentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  game: { type: String, required: true },
  banner: { type: String, default: '' },
  logo: { type: String, default: '' },
  description: { type: String, required: true },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tournamentType: { type: String, enum: ['Online', 'Offline'], default: 'Online' },
  platform: { type: String, default: 'PC' },
  location: { type: String, default: 'Online' },
  country: { type: String, default: 'India' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  registrationDeadline: { type: Date, required: true },
  teamSize: {
    min: { type: Number, default: 5 },
    max: { type: Number, default: 7 }
  },
  maxTeams: { type: Number, default: 32 },
  prizePool: { type: String, default: '$1,000' },
  rules: { type: String, default: 'Standard esports tournament fair play rules apply.' },
  status: { 
    type: String, 
    enum: ['draft', 'published', 'registration_closed', 'completed'], 
    default: 'draft' 
  },
  matches: [matchSchema]
}, { timestamps: true });

module.exports = mongoose.model('Tournament', tournamentSchema);
