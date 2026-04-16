const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');
const session = require('express-session');
const passport = require('./server/config/passport');
const cookieParser = require('cookie-parser');

// Load environment variables
dotenv.config();

// Use reliable public DNS so Node.js can resolve MongoDB Atlas SRV records
// (local router DNS sometimes drops TCP DNS queries required for SRV lookups)
dns.setServers(['8.8.8.8', '1.1.1.1']);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // In production, replace with your frontend URL
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_user_room', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their private room.`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Pass io to routes via middleware
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Express Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'fintrack_session_secret_key_2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from React app
app.use(express.static(path.join(__dirname, 'build')));

// Import routes
const transactionRoutes = require('./server/routes/transactions');
const budgetRoutes = require('./server/routes/budgets');
const notificationRoutes = require('./server/routes/notifications');
const authRoutes = require('./server/routes/auth');

// Routes
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/auth', authRoutes);

// Handle React Router reloads by serving index.html for non-API GET requests
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.url.startsWith('/api') && !req.url.includes('.')) {
    return res.sendFile(path.join(__dirname, 'build', 'index.html'));
  }
  next();
});

// MongoDB — set MONGODB_URI in .env (Atlas: URL-encode @ in password as %40)
const connectionString =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fintrackDB';

if (!process.env.MONGODB_URI) {
  console.warn(
    'MONGODB_URI not set; using local MongoDB. For Atlas, copy .env.example to .env and set MONGODB_URI.'
  );
}

const redactedUri = connectionString.replace(
  /(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@)/,
  '$1***$3'
);
console.log('Connecting to MongoDB:', redactedUri);

mongoose
  .connect(connectionString)
  .then(() => {
    console.log('Connected. Database:', mongoose.connection.db?.databaseName);
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    console.log('Check: Atlas cluster / Network Access IP allowlist / credentials / DB name in the URI.');
  });

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
