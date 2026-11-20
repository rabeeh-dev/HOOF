/**
 * @file services/auth.service.js
 * @description Core business logic for user authentication, registration, email updates, and OTP verification lifecycle.
 */

const bcrypt = require('bcrypt');
const User = require('../models/User');
const Otp = require('../models/Otp');
const ReferralConfig = require('../models/ReferralConfig');
const { generateOtp } = require('../utils/generateOtp');
const { sendOtpEmail } = require('../utils/sendEmail');
const AppError = require('../utils/AppError');

class AuthService {
  /**
   * Centralized helper to generate, hash, persist, and dispatch a 6-digit OTP.
   * @param {Object} params
   * @param {string} params.email - Recipient email address.
   * @param {string} [params.action='SIGNUP'] - Purpose of OTP ('SIGNUP', 'PASSWORD_RESET', 'EMAIL_CHANGE_OLD', 'EMAIL_CHANGE_NEW').
   * @param {string} [params.title='Verify Your Email'] - Email subject & title.
   * @param {string} [params.description='Use the code below to complete verification.'] - Body text in email.
   * @returns {Promise<string>} The raw 6-digit OTP code (for dev logging).
   */
  async sendOtp({
    email,
    action = 'SIGNUP',
    title = 'Verify Your Email',
    description = 'Use the code below to complete your verification.',
  }) {
    const normalizedEmail = (email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      throw new AppError('Email address is required', 400);
    }

    // 1. Enforce 60-second resend cooldown per (email, action)
    const existingOtp = await Otp.findOne({ email: normalizedEmail, action }).sort({ createdAt: -1 });
    if (existingOtp?.lastSentAt) {
      const diff = Date.now() - existingOtp.lastSentAt.getTime();
      if (diff < 60 * 1000) {
        const remainingSec = Math.ceil((60000 - diff) / 1000);
        throw new AppError(`Please wait ${remainingSec} seconds before requesting another code.`, 429);
      }
    }

    // 2. Generate cryptographically secure OTP & hash it
    const rawOtp = generateOtp();
    const hashedOtp = await bcrypt.hash(rawOtp, 10);

    // 3. Clear previous OTPs for this email & action, then store new record (5-minute TTL)
    await Otp.deleteMany({ email: normalizedEmail, action });
    await Otp.create({
      email: normalizedEmail,
      otp: hashedOtp,
      action,
      expiresAt: Date.now() + 5 * 60 * 1000,
      lastSentAt: new Date(),
      attempts: 0,
    });

    // 4. Dispatch email via Nodemailer
    await sendOtpEmail(normalizedEmail, rawOtp, title, description);

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AUTH-DEV] ${action} OTP for ${normalizedEmail}: ${rawOtp}`);
    }

    return rawOtp;
  }

  /**
   * Initiates local user registration by validating details, hashing password, and sending OTP.
   * @param {string} fullName
   * @param {string} email
   * @param {string} password
   * @param {string|null} referralCode
   * @returns {Promise<Object>}
   */
  async initiateSignup(fullName, email, password, referralCode = null) {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanFullName = fullName.trim();

    // 1. Check duplicate user
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new AppError('An account with this email already exists', 409);
    }

    // 2. Validate referral code if provided
    let cleanReferral = null;
    if (referralCode) {
      cleanReferral = referralCode.trim().toUpperCase();
      const referrer = await User.findOne({ referralCode: cleanReferral });
      if (!referrer) {
        throw new AppError('Invalid referral code provided', 400);
      }
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Send OTP via centralized helper
    const rawOtp = await this.sendOtp({
      email: normalizedEmail,
      action: 'SIGNUP',
      title: 'Verify Your Email',
      description: 'Thank you for signing up with HOOF! Use the code below to verify your email address.',
    });

    return {
      pendingUser: {
        fullName: cleanFullName,
        email: normalizedEmail,
        password: hashedPassword,
        referralCode: cleanReferral,
      },
      otp: rawOtp,
    };
  }

  /**
   * Initiates step 1 of email change: sends OTP to user's CURRENT registered email.
   * @param {string} userId
   * @returns {Promise<string>} Current email
   */
  async initiateEmailChangeCurrent(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    await this.sendOtp({
      email: user.email,
      action: 'EMAIL_CHANGE_OLD',
      title: 'Authorize Email Change',
      description: 'You requested to change your HOOF registered email address. Use this code to authorize the request.',
    });

    return user.email;
  }

  /**
   * Initiates step 2 of email change: sends OTP to the user's NEW email address.
   * @param {string} userId
   * @param {string} newEmail
   * @returns {Promise<string>} Normalized new email
   */
  async initiateEmailChangeNew(userId, newEmail) {
    const normalizedNewEmail = (newEmail || '').trim().toLowerCase();
    if (!normalizedNewEmail) {
      throw new AppError('New email address is required', 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedNewEmail)) {
      throw new AppError('Please enter a valid email address', 400);
    }

    // Check if new email is already taken
    const exists = await User.findOne({ email: normalizedNewEmail });
    if (exists) {
      throw new AppError('This email is already registered to another account.', 409);
    }

    await this.sendOtp({
      email: normalizedNewEmail,
      action: 'EMAIL_CHANGE_NEW',
      title: 'Confirm Your New Email',
      description: 'Enter this verification code to confirm your new email address for your HOOF account.',
    });

    return normalizedNewEmail;
  }

  /**
   * Initiates password reset via OTP code.
   * @param {string} email
   * @returns {Promise<boolean>}
   */
  async initiatePasswordResetOtp(email) {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (user && (user.authProvider === 'local' || user.authProvider === 'both' || user.password)) {
      await this.sendOtp({
        email: normalizedEmail,
        action: 'PASSWORD_RESET',
        title: 'Reset Your Password',
        description: 'You requested to reset your HOOF password. Use the verification code below to proceed.',
      });
    }

    return true;
  }

  /**
   * Verifies the submitted OTP code across any authentication context.
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async verifyOtpCode({ otp, email, mode = 'NEW_SIGNUP', userId, pendingUserData }) {
    const normalizedEmail = (email || '').trim().toLowerCase();

    // Map verification mode to action
    let action = 'SIGNUP';
    if (mode === 'NEW_EMAIL_UPDATE') action = 'EMAIL_CHANGE_NEW';
    else if (mode === 'VERIFY_OLD_EMAIL') action = 'EMAIL_CHANGE_OLD';
    else if (mode === 'PASSWORD_RESET') action = 'PASSWORD_RESET';

    // 1. Fetch latest OTP matching email & action (or fallback to email for backwards compatibility)
    let otpRecord = await Otp.findOne({ email: normalizedEmail, action }).sort({ createdAt: -1 });
    if (!otpRecord) {
      otpRecord = await Otp.findOne({ email: normalizedEmail }).sort({ createdAt: -1 });
    }

    if (!otpRecord) {
      throw new AppError('No active verification code found. Please request a new code.', 400);
    }

    if (otpRecord.expiresAt < Date.now()) {
      await Otp.deleteMany({ email: normalizedEmail });
      throw new AppError('Verification code has expired. Please request a new code.', 400);
    }

    // Brute-force check: max 5 failed attempts
    if (otpRecord.attempts >= 5) {
      await Otp.deleteMany({ email: normalizedEmail });
      throw new AppError('Too many failed attempts. This code is now invalid. Please request a new code.', 429);
    }

    // 2. Validate OTP hash
    const isMatch = await bcrypt.compare(otp, otpRecord.otp);
    if (!isMatch) {
      otpRecord.attempts = (otpRecord.attempts || 0) + 1;
      await otpRecord.save();
      const remaining = 5 - otpRecord.attempts;
      throw new AppError(`Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`, 400);
    }

    // 3. Clear OTPs on success
    await Otp.deleteMany({ email: normalizedEmail });

    // 4. Handle context execution
    if (mode === 'NEW_EMAIL_UPDATE') {
      await User.findByIdAndUpdate(userId, { email: normalizedEmail });
      return { success: true, redirectUrl: '/user/profile?emailChanged=true' };
    }

    if (mode === 'VERIFY_OLD_EMAIL') {
      return { success: true, redirectUrl: '/user/profile/change-email-form' };
    }

    if (mode === 'PASSWORD_RESET') {
      return { success: true, redirectUrl: `/user/reset-password/${encodeURIComponent(normalizedEmail)}?verified=true` };
    }

    // Default: NEW_SIGNUP
    const newUserData = {
      ...pendingUserData,
      authProvider: 'local',
      isEmailVerified: true,
    };

    // Credit referral points if referee provided a valid code
    if (pendingUserData?.referralCode) {
      const referrer = await User.findOne({ referralCode: pendingUserData.referralCode });
      if (referrer) {
        newUserData.referredBy = referrer._id;
        const refConfig = await ReferralConfig.getConfig();
        if (refConfig && refConfig.isActive && refConfig.pointsPerReferral > 0) {
          referrer.referralPoints = (referrer.referralPoints || 0) + refConfig.pointsPerReferral;
          await referrer.save();
        }
      }
    }

    delete newUserData.referralCode;

    const newUser = await User.create(newUserData);

    return {
      success: true,
      redirectUrl: '/user/home',
      newUser,
    };
  }

  /**
   * Resends an OTP with a 60-second cooldown period.
   * @param {string} email
   * @param {string} [action='SIGNUP']
   * @returns {Promise<string>}
   */
  async processResendOtp(email, action = 'SIGNUP') {
    let title = 'Verify Your Email';
    let description = 'Use the code below to complete your verification.';

    if (action === 'EMAIL_CHANGE_NEW') {
      title = 'Confirm Your New Email';
      description = 'Enter this verification code to confirm your new email address.';
    } else if (action === 'EMAIL_CHANGE_OLD') {
      title = 'Authorize Email Change';
      description = 'Use this code to authorize changing your email address.';
    } else if (action === 'PASSWORD_RESET') {
      title = 'Reset Your Password';
      description = 'Use the verification code below to reset your password.';
    }

    return await this.sendOtp({ email, action, title, description });
  }

  /**
   * Authenticates user credentials for local login.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>}
   */
  async authenticateUser(email, password) {
    const normalizedEmail = (email || '').trim().toLowerCase();

    // 1. Fetch user with password
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    // 2. Validate existence and local auth eligibility
    if (!user || (!user.password && user.authProvider === 'google')) {
      throw new AppError('Invalid email or password', 401);
    }

    // 3. Check blocked status
    if (user.isBlocked) {
      throw new AppError('Your account has been suspended. Please contact support.', 403);
    }

    // 4. Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    return {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
    };
  }

  /**
   * Verifies administrator login credentials.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>} Authenticated admin document
   */
  async verifyAdminLogin(email, password) {
    const Admin = require('../models/Admin');
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const adminData = await Admin.findOne({ email: email.trim() });
    if (!adminData) {
      throw new AppError('Invalid email or password', 401);
    }

    const passwordMatch = await bcrypt.compare(password, adminData.password);
    if (!passwordMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    return adminData;
  }
}

module.exports = new AuthService();
