const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../model/userModels');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    // Example logic for Google Strategy Callback
async (accessToken, refreshToken, profile, done) => {
    try {
        // 1. Check if user already exists
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
            // 2. If user exists but is blocked, stop them!
            if (user.isBlocked) {
                return done(null, false, { message: 'Account is suspended' });
            }
            // 3. If user exists and is fine, log them in
            return done(null, user);
        } else {
            // 4. IF USER DOES NOT EXIST -> CREATE THEM (The "Signup" part)
            const newUser = await User.create({
                fullName: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id,
                authProvider: 'google',
                isEmailVerified: true // Google emails are pre-verified
            });
            return done(null, newUser);
        }
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
