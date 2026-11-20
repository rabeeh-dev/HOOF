/**
 * @file config/passport.js
 * @description Passport.js configuration for Google OAuth2 authentication.
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const env = require('./env');

/**
 * Configure Passport to use Google Strategy.
 * Handles user lookup, account linking, and registration during Google OAuth flow.
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) {
          return done(new Error('No email found in Google profile'), null);
        }

        // 1. Check if user exists by Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          if (user.isBlocked) {
            return done(null, false, { message: 'Your account has been suspended.' });
          }
          return done(null, user);
        }

        // 2. Check if user exists by Email (Link accounts without destroying local password capability)
        user = await User.findOne({ email });

        if (user) {
          if (user.isBlocked) {
            return done(null, false, { message: 'Your account has been suspended.' });
          }
          user.googleId = profile.id;
          if (user.authProvider === 'local') {
            user.authProvider = 'both';
          }
          if (!user.isEmailVerified) {
            user.isEmailVerified = true;
          }
          await user.save({ validateBeforeSave: false });
          return done(null, user);
        }

        // 3. Create new user with Google profile
        const newUser = await User.create({
          fullName: profile.displayName || 'Google User',
          email,
          googleId: profile.id,
          authProvider: 'google',
          isEmailVerified: true,
        });

        return done(null, newUser);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

/**
 * Serializes the user ID into the session.
 */
passport.serializeUser((user, done) => {
  done(null, user._id || user.id);
});

/**
 * Deserializes the user from the session using the stored ID.
 */
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
