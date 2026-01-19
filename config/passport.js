const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../model/userModels');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        let user = await User.findOne({ email });

        // If user exists → login
        if (user) {
          return done(null, user);
        }

        // Else → create new Google user
        user = await User.create({
          fullName: profile.displayName,
          email,
          googleId: profile.id,
          authProvider: 'google',
          isEmailVerified: true,
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Save user id in session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Get user from session
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

module.exports = passport;
