const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  inGameName: { type: String, required: true },
  email: { type: String, default: '' },
  country: { type: String, default: 'India' }
});

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  logo: { type: String, default: '' },
  game: { type: String, required: true },
  description: { type: String, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  captain: { type: String, default: '' },
  players: [playerSchema],
  country: { type: String, default: 'Global' }
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
