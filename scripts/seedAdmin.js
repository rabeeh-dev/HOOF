/**
 * @file scripts/seedAdmin.js
 * @description Production-grade, idempotent admin account bootstrap script.
 * Usage:
 *   Interactive: node scripts/seedAdmin.js
 *   Automated/CI: ADMIN_EMAIL=admin@hoof.com ADMIN_PASSWORD=secret node scripts/seedAdmin.js
 */

const path = require('path');
const readline = require('readline');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

// Load environment configuration
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Admin = require('../models/Admin');

const BCRYPT_ROUNDS = 12;

function askQuestion(query, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    if (hidden) {
      // Mask password characters in stdout
      process.stdin.on('data', (char) => {
        char = char + '';
        switch (char) {
          case '\n':
          case '\r':
          case '\u0004':
            break;
          default:
            process.stdout.clearLine(0);
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(query + '*'.repeat(rl.line.length));
            break;
        }
      });
    }

    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function seedAdmin() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ Error: MONGO_URI is not set in environment.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to database.');

    // 1. Gather credentials (env vars take precedence for automated pipelines)
    let email = process.env.ADMIN_EMAIL;
    let password = process.env.ADMIN_PASSWORD;

    if (!email) {
      email = await askQuestion('Enter Admin Email: ');
    }
    if (!password) {
      password = await askQuestion('Enter Admin Password: ', true);
      console.log(); // newline after hidden input
    }

    // 2. Validate input
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      console.error('❌ Error: A valid email address is required.');
      process.exit(1);
    }

    if (!password || password.length < 8) {
      console.error('❌ Error: Password must be at least 8 characters long.');
      process.exit(1);
    }

    // 3. Idempotency Check: Prevent accidental overwriting of an existing admin
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.warn(`⚠️ Warning: Admin with email "${email}" already exists. Skipping.`);
      process.exit(0);
    }

    // 4. Hash and store
    console.log('🔒 Hashing password securely...');
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    await Admin.create({
      email,
      password: hashedPassword,
    });

    console.log(`✅ Success: Administrator "${email}" successfully created.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  seedAdmin();
}

module.exports = seedAdmin;