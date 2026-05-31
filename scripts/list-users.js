/**
 * List all users in MongoDB (for debugging login issues).
 * Run: node scripts/list-users.js
 */
require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');

dns.setServers(['8.8.8.8', '1.1.1.1']);

const User = require('../server/models/User');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    const users = await User.find({}).select('name email googleId githubId createdAt');

    console.log(`\nDatabase: ${mongoose.connection.db.databaseName}`);
    console.log(`Users found: ${users.length}\n`);

    if (users.length === 0) {
      console.log('No users yet. Sign up at http://localhost:3000/register');
    } else {
      users.forEach((u, i) => {
        const loginType = u.googleId
          ? 'Google only'
          : u.githubId
            ? 'GitHub only'
            : 'Email + password';
        console.log(`${i + 1}. ${u.email}`);
        console.log(`   Name: ${u.name} | Login: ${loginType}`);
        console.log(`   Created: ${u.createdAt}\n`);
      });
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
}

main();
