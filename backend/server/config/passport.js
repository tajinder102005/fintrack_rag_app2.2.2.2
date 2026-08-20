const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

const userId = (user) => String(user._id || user.id);

passport.serializeUser((user, done) => {
  done(null, userId(user));
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
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
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
          return done(null, user);
        }

        if (profile.emails && profile.emails.length > 0) {
          user = await User.findOne({ email: profile.emails[0].value.toLowerCase() });
          
          if (user) {
            user.googleId = profile.id;
            if (!user.avatar && profile.photos && profile.photos.length > 0) {
              user.avatar = profile.photos[0].value;
            }
            await user.save();
            return done(null, user);
          }
        }

        user = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value.toLowerCase() : '',
          avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '',
          emailVerified: true
        });

        await user.save();
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
        let user = await User.findOne({ githubId: profile.id });
        
        if (user) {
          return done(null, user);
        }

        if (profile.emails && profile.emails.length > 0) {
          user = await User.findOne({ email: profile.emails[0].value.toLowerCase() });
          
          if (user) {
            user.githubId = profile.id;
            if (!user.avatar && profile.photos && profile.photos.length > 0) {
              user.avatar = profile.photos[0].value;
            }
            await user.save();
            return done(null, user);
          }
        }

        user = new User({
          githubId: profile.id,
          name: profile.displayName || profile.username,
          email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value.toLowerCase() : `${profile.username}@users.noreply.github.com`,
          avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '',
          emailVerified: true
        });

        await user.save();
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
