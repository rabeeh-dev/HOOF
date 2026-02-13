/**
 * @file config/db.js
 * @description Database connection configuration using Mongoose.
 */

const mongoose = require('mongoose');

/**
 * Connects to the MongoDB database using the URI provided in environment variables.
 * Exits the process if the connection fails.
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🚀 MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
