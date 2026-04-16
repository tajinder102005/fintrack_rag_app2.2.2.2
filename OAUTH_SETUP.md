# OAuth Setup Guide for FinTrack

## Error: "The OAuth client was not found"

This error occurs because Google/GitHub OAuth applications are not configured.

## Solution: Set up OAuth Applications

### 1. Google OAuth Setup

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create New Project** or select existing project
3. **Enable APIs**:
   - Google+ API
   - Google People API (optional, for profile info)
4. **Create OAuth 2.0 Credentials**:
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`
5. **Copy Client ID and Client Secret**

### 2. GitHub OAuth Setup

1. **Go to GitHub Settings**: https://github.com/settings/developers
2. **Create New OAuth App**:
   - Application name: "FinTrack"
   - Homepage URL: `http://localhost:5000`
   - Authorization callback URL: `http://localhost:5000/api/auth/github/callback`
3. **Copy Client ID and Client Secret**

### 3. Environment Variables

Add these to your `.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# Existing variables
MONGODB_URI=mongodb+srv://tajindertiger_db_user:Singh%40123@fintrackcluster.gy6se5u.mongodb.net/fintrackDB
JWT_SECRET=fintrack_jwt_secret_key_2024_secure
PORT=5000
NODE_ENV=development
SESSION_SECRET=fintrack_session_secret_key_2024
FRONTEND_URL=http://localhost:3000
```

### 4. Create Passport Configuration

Create `server/config/passport.js`:

```javascript
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
  // Google Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      
      if (!user) {
        user = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          avatar: profile.photos[0].value
        });
        await user.save();
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));

  // GitHub Strategy
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "/api/auth/github/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ githubId: profile.id });
      
      if (!user) {
        user = new User({
          githubId: profile.id,
          name: profile.displayName,
          email: profile.email,
          avatar: profile.avatar_url
        });
        await user.save();
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });
};
```

## Quick Fix for Testing

For now, you can **disable OAuth buttons** by commenting them out in Login.js and Register.js:

```javascript
{/* Comment out these sections temporarily */}
{/* 
<div className="social-auth">
  <a href="http://localhost:5000/api/auth/google" className="btn-social btn-google">
    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
    Continue with Google
  </a>
  <a href="http://localhost:5000/api/auth/github" className="btn-social btn-github">
    <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub" />
    Continue with GitHub
  </a>
</div>
*/}
```

## Next Steps

1. **Set up OAuth apps** in Google and GitHub developer consoles
2. **Add environment variables** to `.env` file
3. **Create passport config** file
4. **Restart server** after configuration

Your regular email/password registration will still work without OAuth setup!
