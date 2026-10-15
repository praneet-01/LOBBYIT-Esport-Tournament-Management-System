const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    lowercase: true, 
    trim: true,
    index: true
  },
  otp: { 
    type: String, 
    required: true 
  },
  purpose: { 
    type: String, 
    enum: ['register', 'login', 'reset'], 
    default: 'register' 
  },
  tempData: {
    type: Object,
    default: null
  },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    expires: 600 // Automatically delete document after 10 minutes (600 seconds)
  }
});

module.exports = mongoose.model('Otp', otpSchema);
