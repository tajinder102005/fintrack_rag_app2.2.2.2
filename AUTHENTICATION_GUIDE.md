# MongoDB Authentication Setup Guide

## Overview
Your FinTrack application now uses MongoDB for complete authentication including:
- User registration and login
- JWT token-based authentication  
- Protected API routes
- Secure password hashing

## Authentication Flow

### 1. User Registration
```
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com", 
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": ""
  }
}
```

### 2. User Login
```
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "name": "John Doe", 
    "email": "john@example.com",
    "avatar": ""
  }
}
```

### 3. Protected API Requests
All API requests (except auth) require JWT token in Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Security Features

### Password Hashing
- Uses bcryptjs with salt rounds (10)
- Passwords are never stored in plain text
- Automatic hashing before database save

### JWT Tokens
- 24-hour expiration
- Signed with secret key from environment
- Automatically validates on each request

### Protected Routes
All data routes are protected:
- `GET/POST/PUT/DELETE /api/transactions`
- `GET/POST/PUT/DELETE /api/budgets` 
- `GET/POST/PATCH/DELETE /api/notifications`

### Token Management
- Tokens stored in localStorage
- Auto-logout on token expiration
- Redirect to login on 401 errors

## Frontend Authentication

### AuthContext Hook
```javascript
const { login, register, logout, user, isAuthenticated, loading } = useAuth();
```

### Login Example
```javascript
const result = await login(email, password);
if (!result.success) {
  setError(result.message);
}
```

### Register Example  
```javascript
const result = await register(name, email, password);
if (!result.success) {
  setError(result.message);
}
```

## Backend Models

### User Schema
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  avatar: String (optional)
}
```

## Environment Variables

Required in your `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/fintrack
JWT_SECRET=your_secure_jwt_secret_key_here_change_this_in_production
PORT=5000
NODE_ENV=development
```

## Testing Authentication

### 1. Register a New User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 3. Access Protected Route
```bash
curl -X GET http://localhost:5000/api/transactions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Database Collections

### Users Collection
```javascript
{
  "_id": ObjectId("..."),
  "name": "John Doe",
  "email": "john@example.com", 
  "password": "$2b$10$...", // bcrypt hash
  "avatar": "",
  "__v": 0
}
```

## Security Best Practices

1. **JWT Secret**: Use a strong, random secret in production
2. **Password Requirements**: Enforce minimum password length
3. **HTTPS**: Use HTTPS in production to protect tokens
4. **Token Expiration**: Consider shorter expiration for sensitive apps
5. **Input Validation**: Validate all user inputs
6. **Rate Limiting**: Implement rate limiting on auth endpoints

## Troubleshooting

### Common Issues:
1. **"Token expired"**: User needs to login again
2. **"Invalid token"**: Token is malformed or tampered
3. **"Access denied"**: No token provided in headers
4. **"User already exists"**: Email already registered
5. **"Invalid credentials"**: Wrong email/password

### Debug Steps:
1. Check MongoDB connection
2. Verify JWT_SECRET is set
3. Check browser localStorage for token
4. Verify Authorization header format
5. Check server logs for errors

## Next Steps

Your FinTrack app now has:
✅ Complete MongoDB authentication system
✅ Secure user registration and login
✅ JWT token-based API protection
✅ Automatic token management
✅ Error handling and validation

The authentication is fully functional and ready for production use!
