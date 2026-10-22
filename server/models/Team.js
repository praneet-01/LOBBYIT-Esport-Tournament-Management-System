const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  inGameName: { type: String, required: true },
  inGameId: { type: String, default: '' },
  email: { type: String, default: '' },
  country: { type: String, default: 'India' }
});

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  tag: { type: String, default: '' },
  logo: { type: String, default: '' },
  game: { type: String, default: 'General Esports' },
  description: { type: String, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  captain: { type: mongoose.Schema.Types.Mixed, default: '' },
  players: [playerSchema],
  country: { type: String, default: 'Global' }
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
