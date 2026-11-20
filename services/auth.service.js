/**
 * @file services/auth.service.js
 * @description Core business logic for user authentication, registration, and OTP verification.
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

    // 1. Check if user already exists
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

    // 4. Generate & hash cryptographically secure OTP
    const rawOtp = generateOtp();
    const hashedOtp = await bcrypt.hash(rawOtp, 10);

    // 5. Store OTP with 5-minute expiry
    await Otp.deleteMany({ email: normalizedEmail });
    await Otp.create({
      email: normalizedEmail,
      otp: hashedOtp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      lastSentAt: new Date(),
      attempts: 0,
    });

    // 6. Deliver OTP via email
    await sendOtpEmail(normalizedEmail, rawOtp);

    // Development logging only
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AUTH-DEV] OTP for ${normalizedEmail}: ${rawOtp}`);
    }

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
   * Verifies the submitted OTP code.
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async verifyOtpCode({ otp, email, mode = 'NEW_SIGNUP', userId, pendingUserData }) {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Fetch latest OTP
    const otpRecord = await Otp.findOne({ email: normalizedEmail }).sort({ createdAt: -1 });

    if (!otpRecord) {
      throw new AppError('No active OTP found. Please request a new code.', 400);
    }

    if (otpRecord.expiresAt < Date.now()) {
      await Otp.deleteMany({ email: normalizedEmail });
      throw new AppError('OTP has expired. Please request a new one.', 400);
    }

    // Check brute-force attempt limits (max 5)
    if (otpRecord.attempts >= 5) {
      await Otp.deleteMany({ email: normalizedEmail });
      throw new AppError('Too many failed attempts. This OTP is now invalid. Please request a new code.', 429);
    }

    // 2. Validate OTP
    const isMatch = await bcrypt.compare(otp, otpRecord.otp);
    if (!isMatch) {
      otpRecord.attempts = (otpRecord.attempts || 0) + 1;
      await otpRecord.save();
      const remainingAttempts = 5 - otpRecord.attempts;
      throw new AppError(`Invalid verification code. ${remainingAttempts} attempts remaining.`, 400);
    }

    // 3. Clear OTP records on success
    await Otp.deleteMany({ email: normalizedEmail });

    // 4. Handle context
    if (mode === 'NEW_EMAIL_UPDATE') {
      await User.findByIdAndUpdate(userId, { email: normalizedEmail });
      return { success: true, redirectUrl: '/user/profile?emailChanged=true' };
    }

    if (mode === 'VERIFY_OLD_EMAIL') {
      return { success: true, redirectUrl: '/user/profile/change-email-form' };
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
   * @returns {Promise<string>}
   */
  async processResendOtp(email) {
    const normalizedEmail = email.trim().toLowerCase();
    const existingOtp = await Otp.findOne({ email: normalizedEmail });

    if (existingOtp?.lastSentAt) {
      const diff = Date.now() - existingOtp.lastSentAt.getTime();
      if (diff < 60 * 1000) {
        const remainingSec = Math.ceil((60000 - diff) / 1000);
        throw new AppError(`Please wait ${remainingSec} seconds before requesting another code`, 429);
      }
    }

    await Otp.deleteMany({ email: normalizedEmail });

    const rawOtp = generateOtp();
    const hashedOtp = await bcrypt.hash(rawOtp, 10);

    await Otp.create({
      email: normalizedEmail,
      otp: hashedOtp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      lastSentAt: new Date(),
      attempts: 0,
    });

    await sendOtpEmail(normalizedEmail, rawOtp);

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AUTH-DEV] Resent OTP for ${normalizedEmail}: ${rawOtp}`);
    }

    return rawOtp;
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
}

module.exports = new AuthService();
