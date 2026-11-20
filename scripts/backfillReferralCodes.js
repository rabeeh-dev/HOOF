/**
 * @file scripts/backfillReferralCodes.js
 * @description One-time maintenance script to generate referral codes for existing users who don't have one.
 * Run with: node scripts/backfillReferralCodes.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function backfill() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const usersWithoutCode = await User.find({
      $or: [
        { referralCode: null },
        { referralCode: { $exists: false } },
        { referralCode: '' },
      ],
    });

    console.log(`Found ${usersWithoutCode.length} user(s) without a referral code.`);

    for (const user of usersWithoutCode) {
      await user.save();
      console.log(`  ✓ ${user.fullName} (${user.email}) → ${user.referralCode}`);
    }

    console.log('\nDone! All users now have referral codes.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  backfill();
}

module.exports = backfill;
