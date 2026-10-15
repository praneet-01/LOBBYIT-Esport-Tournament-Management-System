const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  sendOtp,
  verifyOtpRegister,
  verifyOtpLogin
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/send-otp', sendOtp);
router.post('/verify-otp-register', verifyOtpRegister);
router.post('/verify-otp-login', verifyOtpLogin);
router.get('/me', protect, getMe);

module.exports = router;

