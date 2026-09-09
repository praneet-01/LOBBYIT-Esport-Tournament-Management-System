const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  icon: { type: String, default: '' },
  banner: { type: String, default: '' },
  description: { type: String, default: '' },
  category: { type: String, default: 'Tactical Shooter' }
}, { timestamps: true });

module.exports = mongoose.model('Game', gameSchema);
