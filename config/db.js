const mongoose = require('mongoose');

/**
 * Connects to the MongoDB database using the URI provided in environment variables.
 * Exits the process if the connection fails.
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/hoof_dev';
    await mongoose.connect(mongoUri);
    console.log('🚀 MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
