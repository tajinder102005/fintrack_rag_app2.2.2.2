/**
 * Wipe all FinTrack data from MongoDB (users, transactions, budgets, notifications).
 * Run: node scripts/reset-database.js
 */
require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');

dns.setServers(['8.8.8.8', '1.1.1.1']);

const User = require('../server/models/User');
const Transaction = require('../server/models/Transaction');
const Budget = require('../server/models/Budget');
const Notification = require('../server/models/Notification');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    console.log('Connected to:', mongoose.connection.db.databaseName);

    const results = await Promise.all([
      User.deleteMany({}),
      Transaction.deleteMany({}),
      Budget.deleteMany({}),
      Notification.deleteMany({})
    ]);

    console.log('\nDatabase reset complete:');
    console.log('  users:         ', results[0].deletedCount, 'deleted');
    console.log('  transactions:  ', results[1].deletedCount, 'deleted');
    console.log('  budgets:       ', results[2].deletedCount, 'deleted');
    console.log('  notifications: ', results[3].deletedCount, 'deleted');
    console.log('\nAll data cleared. Sign up again at http://localhost:3000/register');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Reset failed:', err.message);
    process.exit(1);
  }
}

main();
