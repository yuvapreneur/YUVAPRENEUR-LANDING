# Café Business Masterclass - Vercel Deployment

## 🚀 Full-Stack Setup with MongoDB

This project has been migrated from GitHub Pages to Vercel with MongoDB integration for proper user authentication and data storage.

## 📋 Features

- ✅ **MongoDB Integration** - Real database storage
- ✅ **bcrypt Password Hashing** - Secure password storage
- ✅ **JWT Authentication** - Secure login sessions
- ✅ **Razorpay Payment Integration** - Real payment processing
- ✅ **API Routes** - RESTful backend endpoints
- ✅ **User Management** - Complete user lifecycle

## 🛠️ Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env.local` file with:
```
MONGODB_URI=mongodb+srv://admin:hGw0wSOgM7PJ8VUe@cluster0.pp4ab3i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345
RAZORPAY_KEY_ID=rzp_live_RAD4Q0Jypcn82a
RAZORPAY_KEY_SECRET=zjOdjWDRhxv45thjpI8H0i73
```

### 3. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

## 📁 Project Structure

```
├── api/                    # API routes
│   ├── auth/
│   │   ├── register.js     # User registration
│   │   └── login.js        # User login
│   ├── payment/
│   │   └── success.js      # Payment success handler
│   └── user/
│       └── profile.js      # User profile (protected)
├── lib/                    # Utilities
│   ├── mongodb.js          # Database connection
│   ├── auth.js             # Auth utilities
│   └── middleware.js       # JWT middleware
├── *.html                  # Frontend pages
├── package.json            # Dependencies
└── vercel.json             # Vercel configuration
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/user/profile` - Get user profile (protected)

### Payment
- `POST /api/payment/success` - Update payment status

## 🔐 Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: 7-day expiration
- **Input Validation**: Email format, password length
- **CORS Protection**: Configured for production
- **Error Handling**: Comprehensive error responses

## 🚀 Deployment

1. **Connect to Vercel**:
   - Import your GitHub repository
   - Vercel will auto-detect the configuration

2. **Set Environment Variables**:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secure random string
   - `RAZORPAY_KEY_ID`: Your Razorpay Key ID
   - `RAZORPAY_KEY_SECRET`: Your Razorpay Key Secret

3. **Deploy**:
   - Vercel will automatically deploy on every push

## 📱 Frontend Updates

The frontend has been updated to:
- Use API endpoints instead of localStorage
- Handle async operations properly
- Show proper error messages
- Maintain session state

## 🎯 User Flow

1. **Registration**: User fills form → API creates account → Razorpay payment
2. **Payment Success**: Razorpay callback → API updates user status → Dashboard redirect
3. **Login**: User enters credentials → API validates → JWT token → Dashboard access
4. **Dashboard**: Protected route with user data from API

## 🔍 Testing

Test the complete flow:
1. Register a new user
2. Complete payment
3. Login with credentials
4. Access dashboard

## 📞 Support

For issues or questions, contact: yuvapreneur@gmail.com
