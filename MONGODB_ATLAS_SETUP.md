# MongoDB Atlas Setup for FinTrack

This project uses **one environment variable** to connect to MongoDB:

```env
MONGODB_URI=...
```

There is no separate password file or config path. Everything goes in the root `.env` file.

---

## Step 1 — Create a new Atlas cluster

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Sign in (or create a free account)
3. **Create** → **Deployment** → **Database** → choose **M0 Free**
4. Pick a cloud provider/region and create the cluster

---

## Step 2 — Create a database user

1. In Atlas: **Database Access** → **Add New Database User**
2. Choose **Password** authentication
3. Set a **username** (e.g. `fintrack_user`)
4. Set a **password** (save it — Atlas shows it only once)
5. Role: **Atlas admin** (for dev) or **Read and write to any database**
6. Click **Add User**

---

## Step 3 — Allow network access

1. In Atlas: **Network Access** → **Add IP Address**
2. For local development, click **Allow Access from Anywhere** (`0.0.0.0/0`)
3. For production, restrict to your server IP only

---

## Step 4 — Get the connection string

1. In Atlas: **Database** → **Connect** on your cluster
2. Choose **Drivers**
3. Driver: **Node.js**, version 5.5 or later
4. Copy the connection string. It looks like:

```
mongodb+srv://fintrack_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

5. Replace `<password>` with your real password
6. Add your database name before the `?`:

```
mongodb+srv://fintrack_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/fintrackDB?retryWrites=true&w=majority
```

---

## Step 5 — URL-encode the password

If your password contains special characters, encode them in the URI:

| Character | Encoded |
|-----------|---------|
| `@`       | `%40`   |
| `#`       | `%23`   |
| `$`       | `%24`   |
| `%`       | `%25`   |
| `/`       | `%2F`   |
| `:`       | `%3A`   |

Example: password `Singh@123` → `Singh%40123`

---

## Step 6 — Update `.env`

Open `E:/full_stack/fintrack/.env` and set:

```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_ENCODED_PASSWORD@YOUR_CLUSTER.mongodb.net/fintrackDB?retryWrites=true&w=majority
JWT_SECRET=fintrack_jwt_secret_key_2024_secure
PORT=5000
NODE_ENV=development
```

Only `MONGODB_URI` is required for the database. Collections are created automatically when the app runs.

---

## Step 7 — Test the connection

```bash
node test-connection.js
```

Expected output:

```
OK — connected. Database: fintrackDB
```

---

## Step 8 — Start the app

```bash
npm run dev
```

Expected server logs:

```
Connected. Database: fintrackDB
Server is running on port 5000
Demo user created: demo@fintrack.com / demo123
```

---

## What this project stores in MongoDB

| Collection       | Purpose                    |
|------------------|----------------------------|
| `users`          | Login / register accounts  |
| `transactions`   | Income & expenses          |
| `budgets`        | Monthly budgets            |
| `notifications`  | Alerts                     |

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Authentication failed` | Wrong username/password; check URL encoding |
| `querySrv ENOTFOUND` | Cluster deleted or wrong hostname in URI |
| `IP not whitelisted` | Add your IP in Atlas → Network Access |
| `ECONNREFUSED` (local) | Local MongoDB not running; use Atlas URI instead |

---

## Security notes

- Never commit `.env` to git (it is already in `.gitignore`)
- Rotate credentials if an old cluster/password was shared or exposed
- Use a strong JWT_SECRET in production
