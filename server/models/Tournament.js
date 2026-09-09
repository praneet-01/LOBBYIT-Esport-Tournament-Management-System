const mongoose = require('mongoose');

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
  }
}, { timestamps: true });

module.exports = mongoose.model('Tournament', tournamentSchema);
