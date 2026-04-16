# GitHub OAuth Setup Instructions

## 1. Get GitHub OAuth Credentials
Go to: https://github.com/settings/developers
Click: "New OAuth App"
Fill in:
- Application name: FinTrack Development
- Homepage URL: http://localhost:5000
- Authorization callback URL: http://localhost:5000/api/auth/github/callback

## 2. Update Your .env File
Add these lines to your .env file:

```
GITHUB_CLIENT_ID=your_actual_github_client_id
GITHUB_CLIENT_SECRET=your_actual_github_client_secret
```

## 3. Restart Server
After updating .env, restart the server:
```bash
node server.js
```

## 4. Test GitHub OAuth
- Go to http://localhost:3000/login
- Click "Continue with GitHub"
- Authorize the application
- Should redirect back to your app logged in!

## Current Status:
✅ Backend server configured for GitHub OAuth
✅ Frontend GitHub login button ready
⏳ Waiting for GitHub OAuth credentials
⏳ Need to update .env file with credentials
