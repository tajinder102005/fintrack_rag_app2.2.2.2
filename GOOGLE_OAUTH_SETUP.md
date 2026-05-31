# Google Sign-In Setup for FinTrack

Your app already has Google OAuth code. You only need to create credentials in **Google Cloud Console** and add them to `.env`.

---

## What YOU do (Google Cloud Console)

### Step 1 — Open Google Cloud Console

Go to: **https://console.cloud.google.com/**

Sign in with your Google account.

---

### Step 2 — Create a project

1. Top bar → click the project dropdown → **New Project**
2. Name: `FinTrack` (or any name)
3. Click **Create** → select that project

---

### Step 3 — OAuth consent screen

1. Left menu → **APIs & Services** → **OAuth consent screen**
2. User type: **External** → **Create**
3. Fill in:
   - **App name:** FinTrack
   - **User support email:** your email
   - **Developer contact email:** your email
4. Click **Save and Continue**
5. **Scopes** → **Save and Continue** (default is fine)
6. **Test users** → **Add users** → add **your Gmail** (required while app is in "Testing")
7. **Save and Continue** → **Back to Dashboard**

---

### Step 4 — Create OAuth Client ID

1. Left menu → **APIs & Services** → **Credentials**
2. **+ Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `FinTrack Web`

5. **Authorized JavaScript origins** — click **+ Add URI**:
   ```
   http://localhost:3000
   ```

6. **Authorized redirect URIs** — click **+ Add URI** (must match exactly):
   ```
   http://localhost:5000/api/auth/google/callback
   ```

7. Click **Create**

8. Copy **Client ID** and **Client secret** (you need both once)

---

### Step 5 — Add credentials to `.env`

Open `E:/full_stack/fintrack/.env` and add:

```env
GOOGLE_CLIENT_ID=paste_your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=paste_your_client_secret_here
SESSION_SECRET=any_random_long_string_here
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
```

Keep your existing `MONGODB_URI`, `JWT_SECRET`, and `PORT`.

---

### Step 6 — Restart the app

```bash
npm run dev
```

- Frontend: http://localhost:3000  
- Backend: http://localhost:5000  

---

### Step 7 — Test

1. Open http://localhost:3000/login or /register  
2. Click **Continue with Google**  
3. Choose your Google account  
4. You should land on the **Dashboard**

---

## Checklist

| Item | Value |
|------|--------|
| Redirect URI (in Google Console) | `http://localhost:5000/api/auth/google/callback` |
| JavaScript origin | `http://localhost:3000` |
| Env vars | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Test user | Your Gmail added under OAuth consent screen |

---

## Common errors

| Error | Fix |
|-------|-----|
| `redirect_uri_mismatch` | Redirect URI in Google Console must match **exactly** `http://localhost:5000/api/auth/google/callback` |
| `Access blocked: app has not completed verification` | Add your Gmail under **OAuth consent screen → Test users** |
| `invalid_client` | Wrong Client ID/Secret in `.env` — copy again from Credentials |
| Button does nothing | Restart server after editing `.env` |

---

## Production (later)

When you deploy, add your live URLs in Google Console:

- Redirect: `https://yourdomain.com/api/auth/google/callback`
- Origin: `https://yourdomain.com`

Update `.env` with production `FRONTEND_URL` and `BACKEND_URL`.
