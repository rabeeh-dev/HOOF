/**
 * @file config/passport.js
 * @description Passport.js configuration for Google OAuth2 authentication.
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../model/User');

/**
 * Configure Passport to use Google Strategy.
 * Handles user lookup and creation during Google OAuth flow.
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists by email
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // If user exists but is blocked, deny authentication
          if (user.isBlocked) {
            return done(null, false, { message: 'Account is suspended' });
          }
          // If user exists and is active, return user object
          return done(null, user);
        } else {
          // If user does not exist, create a new record (Auto-signup)
          const newUser = await User.create({
            fullName: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            authProvider: 'google',
            isEmailVerified: true
          });
          return done(null, newUser);
        }
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
  done(null, user.id);
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
