require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

// Use reliable public DNS for SRV record resolution
dns.setServers(['8.8.8.8', '1.1.1.1']);

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('Set MONGODB_URI in .env (see .env.example).');
  process.exit(1);
}

async function testConnection() {
  try {
    await mongoose.connect(uri);
    console.log('OK — connected. Database:', mongoose.connection.db?.databaseName);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Failed:', error.message);
    process.exit(1);
  }
}

testConnection();
