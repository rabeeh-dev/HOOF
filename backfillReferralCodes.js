/**
 * @file backfillReferralCodes.js
 * @description One-time script to generate referral codes for existing users who don't have one.
 * Run with: node backfillReferralCodes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./model/User');

async function backfill() {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const usersWithoutCode = await User.find({
            $or: [{ referralCode: null }, { referralCode: { $exists: false } }, { referralCode: '' }]
        });

        console.log(`Found ${usersWithoutCode.length} user(s) without a referral code.`);

        for (const user of usersWithoutCode) {
            await user.save(); // The pre-save hook will auto-generate the code
            console.log(`  ✓ ${user.fullName} (${user.email}) → ${user.referralCode}`);
        }

        console.log('\nDone! All users now have referral codes.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

backfill();
