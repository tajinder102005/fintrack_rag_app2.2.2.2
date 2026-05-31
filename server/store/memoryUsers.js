const bcrypt = require('bcryptjs');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

const memoryUsers = new Map();
const memoryUsersByGithub = new Map();
const memoryUsersByGoogle = new Map();
let demoReady = false;

async function initMemoryStore() {
  if (demoReady) return;

  const hash = await bcrypt.hash('demo123', 10);
  memoryUsers.set('demo@fintrack.com', {
    _id: 'demo-user-id',
    name: 'Demo User',
    email: 'demo@fintrack.com',
    password: hash,
    avatar: ''
  });
  demoReady = true;
  console.log('In-memory auth ready. Demo: demo@fintrack.com / demo123');
}

function isDbConnected() {
  const mongoose = require('mongoose');
  return mongoose.connection.readyState === 1;
}

async function findByEmail(email) {
  const normalized = normalizeEmail(email);
  if (isDbConnected()) {
    const User = require('../models/User');
    return User.findOne({ email: normalized });
  }
  await initMemoryStore();
  return memoryUsers.get(normalized) || null;
}

async function createUser({ name, email, password }) {
  const normalized = normalizeEmail(email);
  if (isDbConnected()) {
    const User = require('../models/User');
    const user = new User({ name, email: normalized, password });
    await user.save();
    return user;
  }

  await initMemoryStore();
  if (memoryUsers.has(normalized)) {
    const err = new Error('User already exists');
    err.status = 400;
    throw err;
  }

  const hash = await bcrypt.hash(password, 10);
  const user = {
    _id: `mem-${Date.now()}`,
    name,
    email: normalized,
    password: hash,
    avatar: ''
  };
  memoryUsers.set(normalized, user);
  return user;
}

async function comparePassword(user, candidatePassword) {
  if (!user.password) return false;
  if (isDbConnected() && user.comparePassword) {
    return user.comparePassword(candidatePassword);
  }
  return bcrypt.compare(candidatePassword, user.password);
}

async function findById(id) {
  if (isDbConnected()) {
    const User = require('../models/User');
    return User.findById(id);
  }
  await initMemoryStore();
  for (const user of memoryUsers.values()) {
    if (user._id === id) return user;
  }
  return null;
}

async function findByGithubId(githubId) {
  const id = String(githubId);
  if (isDbConnected()) {
    const User = require('../models/User');
    return User.findOne({ githubId: id });
  }
  await initMemoryStore();
  return memoryUsersByGithub.get(id) || null;
}

async function findByGoogleId(googleId) {
  const id = String(googleId);
  if (isDbConnected()) {
    const User = require('../models/User');
    return User.findOne({ googleId: id });
  }
  await initMemoryStore();
  return memoryUsersByGoogle.get(id) || null;
}

function linkOAuthToMemoryUser(user, { githubId, googleId, avatar }) {
  if (githubId) {
    user.githubId = String(githubId);
    memoryUsersByGithub.set(user.githubId, user);
  }
  if (googleId) {
    user.googleId = String(googleId);
    memoryUsersByGoogle.set(user.googleId, user);
  }
  if (avatar && !user.avatar) user.avatar = avatar;
}

async function findOrCreateFromGithub(profile) {
  const githubId = String(profile.id);
  const avatar = profile.photos?.[0]?.value || '';
  const email =
    profile.emails?.[0]?.value || `${profile.username}@github.com`;

  if (isDbConnected()) {
    const User = require('../models/User');
    let user = await User.findOne({ githubId });
    if (user) return user;

    user = await User.findOne({ email });
    if (user) {
      user.githubId = githubId;
      if (!user.avatar) user.avatar = avatar;
      await user.save();
      return user;
    }

    return User.create({
      name: profile.displayName || profile.username,
      email,
      githubId,
      avatar
    });
  }

  await initMemoryStore();
  let user = memoryUsersByGithub.get(githubId);
  if (user) return user;

  user = memoryUsers.get(email);
  if (user) {
    linkOAuthToMemoryUser(user, { githubId, avatar });
    return user;
  }

  user = {
    _id: `mem-${Date.now()}`,
    name: profile.displayName || profile.username,
    email,
    githubId,
    avatar
  };
  memoryUsers.set(email, user);
  memoryUsersByGithub.set(githubId, user);
  return user;
}

async function findOrCreateFromGoogle(profile) {
  const googleId = String(profile.id);
  const email = profile.emails?.[0]?.value;
  const avatar = profile.photos?.[0]?.value || '';

  if (!email) {
    const err = new Error('Google account has no email');
    err.status = 400;
    throw err;
  }

  if (isDbConnected()) {
    const User = require('../models/User');
    let user = await User.findOne({ googleId });
    if (user) return user;

    user = await User.findOne({ email });
    if (user) {
      user.googleId = googleId;
      if (!user.avatar) user.avatar = avatar;
      await user.save();
      return user;
    }

    return User.create({
      name: profile.displayName,
      email,
      googleId,
      avatar
    });
  }

  await initMemoryStore();
  let user = memoryUsersByGoogle.get(googleId);
  if (user) return user;

  user = memoryUsers.get(email);
  if (user) {
    linkOAuthToMemoryUser(user, { googleId, avatar });
    return user;
  }

  user = {
    _id: `mem-${Date.now()}`,
    name: profile.displayName,
    email,
    googleId,
    avatar
  };
  memoryUsers.set(email, user);
  memoryUsersByGoogle.set(googleId, user);
  return user;
}

module.exports = {
  initMemoryStore,
  isDbConnected,
  findByEmail,
  findById,
  findByGithubId,
  findByGoogleId,
  createUser,
  comparePassword,
  findOrCreateFromGithub,
  findOrCreateFromGoogle
};
