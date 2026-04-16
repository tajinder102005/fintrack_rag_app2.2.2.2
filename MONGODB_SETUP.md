# MongoDB Setup Instructions

## Prerequisites
1. **MongoDB Installation**: Make sure MongoDB is installed and running on your system
   - **Windows**: Download and install MongoDB from https://www.mongodb.com/try/download/community
   - **Mac**: `brew install mongodb-community`
   - **Linux**: Follow instructions at https://docs.mongodb.com/manual/administration/install-on-linux/

2. **Start MongoDB Service**:
   - **Windows**: Start MongoDB service from Services or run `mongod`
   - **Mac**: `brew services start mongodb-community`
   - **Linux**: `sudo systemctl start mongod`

## Environment Setup

1. **Create .env file**:
   ```bash
   cp .env.example .env
   ```

2. **Edit .env file** with your configuration:
   ```
   MONGODB_URI=mongodb://localhost:27017/fintrack
   JWT_SECRET=your_secure_jwt_secret_key_here_change_this_in_production
   PORT=5000
   NODE_ENV=development
   ```

## Running the Application

### Development Mode (Both Frontend and Backend)
```bash
npm run dev
```
This will start:
- Backend server on http://localhost:5000
- Frontend development server on http://localhost:3000

### Backend Only
```bash
npm run server
```

### Frontend Only
```bash
npm start
```

## API Endpoints

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Budgets
- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create new budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

### Notifications
- `GET /api/notifications` - Get all notifications
- `POST /api/notifications` - Create new notification
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `DELETE /api/notifications/:id` - Delete notification

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

## Database Schema

### Transaction
```javascript
{
  type: 'income' | 'expense',
  amount: Number,
  category: String,
  description: String,
  date: String,
  createdAt: Date
}
```

### Budget
```javascript
{
  category: String,
  amount: Number,
  spent: Number,
  month: Number,
  year: Number
}
```

### Notification
```javascript
{
  type: 'info' | 'warning' | 'error' | 'success',
  title: String,
  message: String,
  category: String,
  read: Boolean,
  createdAt: Date
}
```

### User
```javascript
{
  name: String,
  email: String,
  password: String (hashed),
  avatar: String
}
```

## MongoDB Atlas (Cloud Option)

If you prefer using MongoDB Atlas (cloud database):

1. Create a free account at https://www.mongodb.com/atlas
2. Create a new cluster
3. Get your connection string
4. Update your .env file:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fintrack
   ```

## Troubleshooting

### Common Issues:
1. **MongoDB connection failed**: Make sure MongoDB is running and the connection string is correct
2. **Port already in use**: Change the PORT in .env file or kill the process using the port
3. **CORS errors**: The backend is configured to allow CORS, but if you change ports, update the CORS configuration

### Reset Database:
```bash
# Connect to MongoDB shell
mongo

# Switch to fintrack database
use fintrack

# Drop all collections
db.transactions.drop()
db.budgets.drop()
db.notifications.drop()
db.users.drop()
```
