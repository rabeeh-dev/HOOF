/**
 * @file config/session.js
 * @description Centralized session configurations for user and admin portals.
 */

const session = require('express-session');
const MongoStore = require('connect-mongo');
const env = require('./env');

const USER_COOKIE_NAME = 'hoof.user.sid';
const ADMIN_COOKIE_NAME = 'hoof.admin.sid';

// Common base session configuration
const baseOptions = {
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: (MongoStore.default?.create || MongoStore.create)({
    mongoUrl: env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60, // 1 day
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
  },
};

const userSession = session({
  ...baseOptions,
  name: USER_COOKIE_NAME,
});

const adminSession = session({
  ...baseOptions,
  name: ADMIN_COOKIE_NAME,
});

/**
 * Middleware to dispatch requests to the appropriate session store.
 */
const sessionDispatcher = (req, res, next) => {
  if (req.originalUrl.startsWith('/admin')) {
    adminSession(req, res, next);
  } else {
    userSession(req, res, next);
  }
};

module.exports = {
  USER_COOKIE_NAME,
  ADMIN_COOKIE_NAME,
  userSession,
  adminSession,
  sessionDispatcher,
};
