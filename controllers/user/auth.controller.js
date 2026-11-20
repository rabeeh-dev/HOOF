/**
 * @file controllers/user/auth.controller.js
 * @description Controller handling all user authentication HTTP requests (Register, Login, OTP, OAuth, Password Reset, Logout).
 */

const authService = require('../../services/auth.service');
const passwordService = require('../../services/password.service');
const { USER_COOKIE_NAME } = require('../../config/session');

/**
 * @desc    Render user registration page.
 * @route   GET /user/signup
 * @access  Public (Guest Only)
 */
exports.signupPage = (req, res) => {
  res.render('User/auth/register', {
    layout: 'layouts/user',
    message: null,
    formData: {},
  });
};

/**
 * @desc    Handle user registration and dispatch verification OTP.
 * @route   POST /user/signup
 * @access  Public (Guest Only)
 */
exports.signup = async (req, res) => {
  const { fullName, email, password, confirmPassword, referralCode } = req.body;

  try {
    // 1. Basic validation
    if (!fullName || !email || !password || !confirmPassword) {
      return res.render('User/auth/register', {
        layout: 'layouts/user',
        message: { type: 'error', text: 'All fields are required' },
        formData: { fullName, email, referralCode },
      });
    }

    if (password.length < 8) {
      return res.render('User/auth/register', {
        layout: 'layouts/user',
        message: { type: 'error', text: 'Password must be at least 8 characters' },
        formData: { fullName, email, referralCode },
      });
    }

    if (password !== confirmPassword) {
      return res.render('User/auth/register', {
        layout: 'layouts/user',
        message: { type: 'error', text: 'Passwords do not match' },
        formData: { fullName, email, referralCode },
      });
    }

    // 2. Initiate signup in service layer
    const result = await authService.initiateSignup(fullName, email, password, referralCode || null);

    // 3. Save pending state to session
    req.session.pendingUser = result.pendingUser;
    req.session.otpEmail = result.pendingUser.email;

    return res.redirect('/user/verify-otp');
  } catch (err) {
    console.error('Signup Error:', err);
    return res.render('User/auth/register', {
      layout: 'layouts/user',
      message: { type: 'error', text: err.message || 'Something went wrong. Please try again.' },
      formData: { fullName, email, referralCode },
    });
  }
};

/**
 * @desc    Render OTP verification page.
 * @route   GET /user/verify-otp
 * @access  Public (Session-based)
 */
exports.verifyOtpPage = (req, res) => {
  res.render('User/auth/verify-otp', {
    layout: 'layouts/user',
    error: null,
  });
};

/**
 * @desc    Verify submitted OTP code for signup or email change.
 * @route   POST /user/verify-otp
 * @access  Public (Session-based)
 */
exports.verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const isOldEmailFlow = !!req.session.changeEmailFlow;
    const isNewEmailFlow = !!req.session.newEmailOtpSent;

    let mode = 'NEW_SIGNUP';
    let email = req.session.pendingUser?.email || req.session.otpEmail;

    if (isNewEmailFlow) {
      mode = 'NEW_EMAIL_UPDATE';
      email = req.session.tempNewEmail;
    } else if (isOldEmailFlow) {
      mode = 'VERIFY_OLD_EMAIL';
      email = req.session.currentEmailToVerify;
    }

    if (!email) {
      return res.status(400).json({ success: false, message: 'Session expired. Please start again.' });
    }

    const result = await authService.verifyOtpCode({
      otp,
      email,
      mode,
      userId: req.session.userId,
      pendingUserData: req.session.pendingUser,
    });

    // Clean up context flags
    if (mode === 'NEW_EMAIL_UPDATE') {
      req.session.emailVerifiedForChange = null;
      req.session.newEmailOtpSent = null;
      req.session.tempNewEmail = null;
    } else if (mode === 'VERIFY_OLD_EMAIL') {
      req.session.emailVerifiedForChange = true;
      req.session.changeEmailFlow = null;
    } else {
      req.session.pendingUser = null;
      req.session.otpEmail = null;

      // Auto-login: establish session for newly created user
      if (result.newUser) {
        req.session.userId = result.newUser._id;
        req.session.userName = result.newUser.fullName;
        req.session.userEmail = result.newUser.email;
      }
    }

    return res.json({ success: true, redirectUrl: result.redirectUrl });
  } catch (err) {
    console.error('OTP Verification Error:', err);
    return res.status(err.statusCode || 400).json({
      success: false,
      message: err.message || 'Error during verification.',
    });
  }
};

/**
 * @desc    Resend a new OTP to the session email address.
 * @route   POST /user/resend-otp
 * @access  Public (Session-based)
 */
exports.resendOtp = async (req, res) => {
  try {
    const isNewEmailFlow = !!req.session.newEmailOtpSent;
    const isOldEmailFlow = !!req.session.changeEmailFlow;

    let email = req.session.otpEmail || req.session.pendingUser?.email;
    let action = 'SIGNUP';

    if (isNewEmailFlow) {
      email = req.session.tempNewEmail;
      action = 'EMAIL_CHANGE_NEW';
    } else if (isOldEmailFlow) {
      email = req.session.currentEmailToVerify;
      action = 'EMAIL_CHANGE_OLD';
    }

    if (!email) {
      return res.status(400).json({
        message: 'Session expired. Please start the verification process again.',
      });
    }

    await authService.processResendOtp(email, action);
    return res.json({ success: true, message: 'New verification code sent to your email successfully.' });
  } catch (err) {
    console.error('Resend OTP Error:', err);
    const status = err.statusCode || err.status || 500;
    return res.status(status).json({ message: err.message || 'Failed to resend verification code' });
  }
};

/**
 * @desc    Render user login page.
 * @route   GET /user/login
 * @access  Public (Guest Only)
 */
exports.loginPage = (req, res) => {
  const signupSuccess = req.query.signupSuccess === 'true';
  const resetSuccess = req.query.resetSuccess === 'true';
  const accountBlocked = req.query.error === 'account_blocked';

  let successMessage = null;
  let errorMessage = null;

  if (signupSuccess) {
    successMessage = 'Account created successfully! Please log in.';
  } else if (resetSuccess) {
    successMessage = 'Password reset successful! You can now log in with your new password.';
  } else if (accountBlocked) {
    errorMessage = 'Your account has been suspended. Please contact support.';
  }

  res.render('User/auth/login', {
    layout: 'layouts/user',
    error: errorMessage,
    successMessage,
  });
};

/**
 * @desc    Authenticate user credentials and create session.
 * @route   POST /user/login
 * @access  Public (Guest Only)
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authService.authenticateUser(email, password);

    // Establish user session
    req.session.userId = user._id;
    req.session.userName = user.fullName;
    req.session.userEmail = user.email;

    req.session.save((err) => {
      if (err) {
        console.error('Session Save Error:', err);
        return res.redirect('/user/login');
      }
      return res.redirect('/user/home');
    });
  } catch (err) {
    console.error('Login Error:', err.message);
    return res.render('User/auth/login', {
      layout: 'layouts/user',
      error: err.message || 'Invalid email or password.',
      successMessage: null,
    });
  }
};

/**
 * @desc    Handle Google OAuth callback and establish session.
 * @route   GET /auth/google/callback OR /user/auth/google/callback
 * @access  Public
 */
exports.googleCallback = (req, res) => {
  if (!req.user) {
    return res.redirect('/user/login');
  }

  // Populate session with authenticated user data
  req.session.userId = req.user._id;
  req.session.userName = req.user.fullName;
  req.session.userEmail = req.user.email;

  req.session.save((err) => {
    if (err) {
      console.error('OAuth Session Save Error:', err);
      return res.redirect('/user/login');
    }
    return res.redirect('/user/home');
  });
};

/**
 * @desc    Render forgot password email request form.
 * @route   GET /user/forgot-password
 * @access  Public (Guest Only)
 */
exports.forgotPasswordPage = (req, res) => {
  res.render('User/auth/forgot-password', {
    layout: 'layouts/user',
    message: null,
  });
};

/**
 * @desc    Dispatch password reset email.
 * @route   POST /user/forgot-password
 * @access  Public (Guest Only)
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    await passwordService.initiatePasswordReset(email);

    return res.render('User/auth/forgot-password', {
      layout: 'layouts/user',
      message: 'If an account exists with that email, a password reset link has been sent.',
    });
  } catch (err) {
    console.error('Forgot Password Error:', err);
    return res.render('User/auth/forgot-password', {
      layout: 'layouts/user',
      message: 'Something went wrong. Please try again.',
    });
  }
};

/**
 * @desc    Render reset password form using validated token.
 * @route   GET /user/reset-password/:token
 * @access  Public (Token-based)
 */
exports.resetPasswordPage = async (req, res) => {
  try {
    const { token } = req.params;

    // Check if token corresponds to an active OTP-verified reset session
    if (req.session.passwordResetOtpVerified && req.session.passwordResetEmail === decodeURIComponent(token)) {
      return res.render('User/auth/reset-password', {
        layout: 'layouts/user',
        token,
        error: null,
      });
    }

    await passwordService.verifyResetToken(token);

    return res.render('User/auth/reset-password', {
      layout: 'layouts/user',
      token,
      error: null,
    });
  } catch (err) {
    console.error('Reset Password Link Error:', err.message);
    return res.render('User/auth/forgot-password', {
      layout: 'layouts/user',
      message: err.message || 'Invalid or expired password reset link.',
    });
  }
};

/**
 * @desc    Process new password update.
 * @route   POST /user/reset-password/:token
 * @access  Public (Token-based)
 */
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  try {
    if (password !== confirmPassword) {
      return res.render('User/auth/reset-password', {
        layout: 'layouts/user',
        token,
        error: 'Passwords do not match',
      });
    }

    // Direct password reset via OTP verification
    if (req.session.passwordResetOtpVerified && req.session.passwordResetEmail === decodeURIComponent(token)) {
      await passwordService.resetPasswordDirect(req.session.passwordResetEmail, password);
      req.session.passwordResetOtpVerified = null;
      req.session.passwordResetEmail = null;
      return res.redirect('/user/login?resetSuccess=true');
    }

    await passwordService.resetPassword(token, password);
    return res.redirect('/user/login?resetSuccess=true');
  } catch (err) {
    console.error('Reset Password Submission Error:', err);
    return res.render('User/auth/reset-password', {
      layout: 'layouts/user',
      token,
      error: err.message || 'Failed to reset password. Please try again.',
    });
  }
};

/**
 * @desc    Destroy user session and clear authentication cookie.
 * @route   POST /user/logout
 * @access  Private (isUser)
 */
exports.logout = (req, res) => {
  req.session.userId = null;
  req.session.userName = null;
  req.session.userEmail = null;

  req.session.destroy((err) => {
    if (err) {
      console.error('Logout Session Destroy Error:', err);
      return res.redirect('/user/home');
    }

    // Correctly clear the user cookie
    res.clearCookie(USER_COOKIE_NAME, { path: '/' });
    // Also clear default connect.sid in case of legacy sessions
    res.clearCookie('connect.sid', { path: '/' });

    return res.redirect('/user/login');
  });
};
