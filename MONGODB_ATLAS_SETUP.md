# MongoDB Atlas Setup Instructions

## Your MongoDB Atlas Configuration

Your FinTrack application is now configured to use MongoDB Atlas with your connection string:

**Connection String:**
```
mongodb+srv://tajindertiger_db_user:Singh@123@fintrackcluster.gy6se5u.mongodb.net/fintrack
```

## Setup Steps

### 1. Create Environment File
Since .env is in .gitignore, you need to create it manually:

```bash
# Create the .env file
echo "MONGODB_URI=mongodb+srv://tajindertiger_db_user:Singh@123@fintrackcluster.gy6se5u.mongodb.net/fintrack" > .env
echo "JWT_SECRET=your_secure_jwt_secret_key_here_change_this_in_production" >> .env
echo "PORT=5000" >> .env
echo "NODE_ENV=development" >> .env
```

### 2. Or Create .env Manually
Create a file named `.env` in the root directory with:

```env
MONGODB_URI=mongodb+srv://tajindertiger_db_user:Singh@123@fintrackcluster.gy6se5u.mongodb.net/fintrack
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
PORT=5000
NODE_ENV=development
```

### 3. MongoDB Atlas Network Access
Make sure your MongoDB Atlas cluster allows connections from your IP address:

1. Go to MongoDB Atlas Dashboard
2. Navigate to Network Access
3. Add your current IP address if not already added
4. Ensure IP address is `0.0.0.0/0` (allows access from anywhere) for development

### 4. Start the Application
```bash
npm run dev
```

## Benefits of MongoDB Atlas

✅ **Cloud-based** - No local MongoDB installation needed
✅ **Automatic backups** - Data is automatically backed up
✅ **Scalable** - Easy to scale as your app grows
✅ **Global access** - Access your database from anywhere
✅ **Security** - Built-in security features
✅ **Monitoring** - Built-in performance monitoring

## Database Collections

Your Atlas database will have these collections:
- `users` - User authentication data
- `transactions` - Financial transactions
- `budgets` - Budget tracking
- `notifications` - User notifications

## Connection Verification

When you start the server, you should see:
```
Connected to MongoDB
Server is running on port 5000
```

If there are connection issues, check:
1. MongoDB Atlas cluster is running
2. IP address is whitelisted in Atlas
3. Username and password are correct
4. Database name "fintrack" exists

## Production Considerations

For production deployment:
1. **Change JWT Secret** - Use a strong, random secret
2. **Environment Variables** - Set proper NODE_ENV=production
3. **Security** - Restrict IP access in Atlas
4. **Backup Strategy** - Enable Atlas backups
5. **Monitoring** - Set up Atlas monitoring alerts

## Troubleshooting

### Common Issues:
1. **Authentication failed**: Check username/password in connection string
2. **IP not whitelisted**: Add your IP to Atlas Network Access
3. **Cluster not running**: Start your Atlas cluster
4. **Connection timeout**: Check network connectivity

### Test Connection:
```bash
# Test MongoDB connection
node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://tajindertiger_db_user:Singh@123@fintrackcluster.gy6se5u.mongodb.net/fintrack')
.then(() => console.log('✅ Atlas connection successful'))
.catch(err => console.error('❌ Connection failed:', err.message));
"
```

Your FinTrack application is now ready to use MongoDB Atlas for cloud-based data storage!
