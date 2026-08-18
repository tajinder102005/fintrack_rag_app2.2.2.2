const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const userStore = require('../store/memoryUsers');

const userId = (user) => String(user._id || user.id);

passport.serializeUser((user, done) => {
  done(null, userId(user));
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await userStore.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'placeholder',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder',
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        `${backendUrl}/api/auth/google/callback`,
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await userStore.findOrCreateFromGoogle(profile);
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID || 'placeholder',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'placeholder',
      callbackURL:
        process.env.GITHUB_CALLBACK_URL ||
        `${backendUrl}/api/auth/github/callback`,
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await userStore.findOrCreateFromGithub(profile);
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
