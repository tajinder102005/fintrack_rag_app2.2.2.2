# MongoDB Atlas Connection Troubleshooting

See **MONGODB_ATLAS_SETUP.md** for full setup steps.

## Quick checks

1. **Connection string** — Copy a fresh URI from Atlas → Database → Connect → Drivers
2. **Password encoding** — Encode `@`, `#`, `$`, `%` in the password (e.g. `@` → `%40`)
3. **Network Access** — Atlas → Network Access → add your IP or `0.0.0.0/0` for dev
4. **Cluster running** — Atlas → Database → cluster status should be Active
5. **Database name** — Use `fintrackDB` in the URI path before `?`

## Test connection

```bash
node test-connection.js
```

## Common errors

| Error | Likely cause |
|-------|----------------|
| `Authentication failed` | Wrong username/password or bad URL encoding |
| `querySrv ENOTFOUND` | Old/deleted cluster hostname in `.env` |
| `IP not whitelisted` | Add IP in Atlas Network Access |
| `ECONNREFUSED` | Using local URI but MongoDB is not installed/running |

## Direct connection (if SRV fails)

In Atlas Connect dialog, choose **Connect your application** or enable **Direct connection** and use the non-SRV string Atlas provides.
