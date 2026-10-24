const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const sendOtpEmail = require('../utils/sendOtpEmail');

const generateToken = (id) => {
  const jwtSecret = process.env.JWT_SECRET || 'lobbyit_secret_key_2026';
  return jwt.sign({ id }, jwtSecret, { expiresIn: '30d' });
};

// Helper to fix common email domain typos (e.g. gmai.com, gamil.com -> gmail.com)
const normalizeEmail = (rawEmail) => {
  if (!rawEmail) return '';
  const clean = rawEmail.toLowerCase().trim();
  const [local, domain] = clean.split('@');
  if (!domain) return clean;
  if (['gmai.com', 'gamil.com', 'gmial.com', 'gmaill.com'].includes(domain)) {
    return `${local}@gmail.com`;
  }
  if (['yaho.com', 'yahooo.com'].includes(domain)) {
    return `${local}@yahoo.com`;
  }
  if (['hotmial.com', 'hotmai.com'].includes(domain)) {
    return `${local}@hotmail.com`;
  }
  return clean;
};

// Helper to generate a unique clean username for organizers if not supplied
const generateOrganizerUsername = async (name, email) => {
  const base = (name || email.split('@')[0])
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 15) || 'organizer';
  
  let candidate = base;
  let counter = 1;
  while (await User.findOne({ username: candidate })) {
    candidate = `${base}${Math.floor(100 + Math.random() * 900)}`;
    counter++;
    if (counter > 10) candidate = `${base}${Date.now().toString().slice(-4)}`;
  }
  return candidate;
};

// @desc    Send 6-digit OTP to user's email for registration or login
// @route   POST /api/auth/send-otp
// @access  Public
const sendOtp = async (req, res) => {
  try {
    const { email, purpose = 'register', role = 'Player', name, username, password } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const cleanEmail = normalizeEmail(email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Registration flow checks
    if (purpose === 'register') {
      const existingEmail = await User.findOne({ 
        $or: [
          { email: cleanEmail },
          { email: email.toLowerCase().trim() }
        ]
      });
      if (existingEmail) {
        return res.status(400).json({ message: 'An account with this email already exists' });
      }

      if (!name || !password) {
        return res.status(400).json({ message: 'Name and password are required' });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }

      if (role === 'Player') {
        if (!username) {
          return res.status(400).json({ message: 'Gamer handle/tag is required for players' });
        }
        const existingUsername = await User.findOne({ username: username.toLowerCase().trim() });
        if (existingUsername) {
          return res.status(400).json({ message: 'Gamer handle is already taken. Try another.' });
        }
      }
    }

    // Login flow checks
    if (purpose === 'login') {
      const existingUser = await User.findOne({ 
        $or: [
          { email: cleanEmail },
          { email: email.toLowerCase().trim() },
          { username: email.toLowerCase().trim() }
        ]
      });
      if (!existingUser) {
        return res.status(404).json({ message: 'No registered account found with this email. Please sign up.' });
      }
    }

    // Generate 6-digit numeric OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Prepare temp data for registration
    let finalUsername = username ? username.toLowerCase().trim() : '';
    if (purpose === 'register' && role === 'Organizer' && !finalUsername) {
      finalUsername = await generateOrganizerUsername(name, cleanEmail);
    }

    // Delete any pending OTPs for this email and purpose
    await Otp.deleteMany({ email: cleanEmail, purpose });

    // Store in Mongo with 10 min TTL
    await Otp.create({
      email: cleanEmail,
      otp: otpCode,
      purpose,
      tempData: purpose === 'register' ? {
        name,
        username: finalUsername,
        email: cleanEmail,
        password,
        role: role || 'Player'
      } : null
    });

    // Send the email to the user's real inbox
    const emailResult = await sendOtpEmail({
      email: cleanEmail,
      otp: otpCode,
      purpose
    });

    if (!emailResult.success) {
      if (emailResult.mode === 'unconfigured') {
        return res.status(500).json({
          message: 'Email service is not configured yet. Please configure EMAIL_USER and EMAIL_PASS in your server environment to send verification codes.'
        });
      }
      return res.status(500).json({
        message: emailResult.message 
          ? `Email delivery failed: ${emailResult.message}` 
          : `Failed to deliver verification code to ${cleanEmail}. Please verify your email address is correct.`
      });
    }

    res.json({
      success: true,
      message: emailResult.message || `Verification code sent to ${cleanEmail}`,
      devOtp: emailResult.otp || null
    });
  } catch (error) {
    console.error('Error in sendOtp:', error);
    res.status(500).json({ message: error.message || 'Failed to send verification code' });
  }
};

// @desc    Verify OTP and complete registration
// @route   POST /api/auth/verify-otp-register
// @access  Public
const verifyOtpRegister = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and 6-digit OTP code are required' });
    }

    const cleanEmail = normalizeEmail(email);
    const rawEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    const otpRecord = await Otp.findOne({
      $or: [
        { email: cleanEmail },
        { email: rawEmail }
      ],
      otp: cleanOtp,
      purpose: 'register'
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired verification code. Please request a new one.' });
    }

    const { name, username, password, role } = otpRecord.tempData || {};

    if (!name || !password || !role) {
      return res.status(400).json({ message: 'Registration session expired. Please fill the form again.' });
    }

    // Re-verify uniqueness
    const existing = await User.findOne({
      $or: [
        { email: cleanEmail },
        { email: rawEmail },
        { username: username.toLowerCase() }
      ]
    });

    if (existing) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'User already registered with this email or username' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      username: username.toLowerCase(),
      email: cleanEmail,
      password: hashedPassword,
      role,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`
    });

    // Delete verified OTP record
    await Otp.deleteOne({ _id: otpRecord._id });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Error in verifyOtpRegister:', error);
    res.status(500).json({ message: error.message || 'Verification failed' });
  }
};

// @desc    Verify OTP and login (1-Click Passwordless Login)
// @route   POST /api/auth/verify-otp-login
// @access  Public
const verifyOtpLogin = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and 6-digit OTP code are required' });
    }

    const cleanEmail = normalizeEmail(email);
    const rawEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    const otpRecord = await Otp.findOne({
      $or: [
        { email: cleanEmail },
        { email: rawEmail }
      ],
      otp: cleanOtp,
      purpose: 'login'
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    const user = await User.findOne({
      $or: [
        { email: cleanEmail },
        { email: rawEmail },
        { username: rawEmail }
      ]
    });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    // Delete used OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Error in verifyOtpLogin:', error);
    res.status(500).json({ message: error.message || 'OTP Login failed' });
  }
};

// @desc    Register a new user directly (fallback)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    let { name, username, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (!['Organizer', 'Team', 'Player'].includes(role)) {
      return res.status(400).json({ message: 'Role must be Organizer or Player' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (role === 'Organizer' && !username) {
      username = await generateOrganizerUsername(name, cleanEmail);
    } else if (!username) {
      return res.status(400).json({ message: 'Gamer handle/username is required' });
    }

    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email address already registered' });
    }

    const existingUsername = await User.findOne({ username: username.toLowerCase().trim() });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      username: username.toLowerCase().trim(),
      email: cleanEmail,
      password: hashedPassword,
      role,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user & get token (standard password)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const cleanInput = email.toLowerCase().trim();
    const normalizedEmail = cleanInput.includes('@') ? normalizeEmail(cleanInput) : '';

    // Allow login with raw email, normalized email (fixing common domain typos), or username
    const queryConditions = [
      { email: cleanInput },
      { username: cleanInput }
    ];
    if (normalizedEmail && normalizedEmail !== cleanInput) {
      queryConditions.push({ email: normalizedEmail });
    }

    const user = await User.findOne({ $or: queryConditions });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged-in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  sendOtp,
  verifyOtpRegister,
  verifyOtpLogin
};

