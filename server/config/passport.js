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
        // 1. Check if user exists by Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          if (user.isBlocked) {
            return done(null, false, { message: 'Account is suspended' });
          }
          return done(null, user);
        }

        // 2. Check if user exists by Email (Link accounts)
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          if (user.isBlocked) {
            return done(null, false, { message: 'Account is suspended' });
          }
          // Link Google account to existing local account
          user.googleId = profile.id;
          user.authProvider = 'google';
          await user.save();
          return done(null, user);
        }

        // 3. Create new user
        const newUser = await User.create({
          fullName: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          authProvider: 'google',
          isEmailVerified: true
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
