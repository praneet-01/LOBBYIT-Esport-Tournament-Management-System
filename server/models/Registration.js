const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  players: [{
    name: { type: String, required: true },
    inGameName: { type: String, required: true },
    email: { type: String, default: '' },
    country: { type: String, default: 'India' }
  }],
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected'], 
    default: 'pending' 
  },
  submittedAt: { type: Date, default: Date.now },
  organizerMessage: { type: String, default: '' },
  reviewedAt: { type: Date }
}, { timestamps: true });

// Prevent duplicate registrations for the same team & tournament
registrationSchema.index({ tournament: 1, team: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
