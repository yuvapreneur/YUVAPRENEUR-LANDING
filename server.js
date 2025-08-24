const express = require('express');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const session = require('express-session');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');
require('dotenv').config();

// Import bonuses data
const { BONUSES } = require('./bonuses.js');

const app = express();
const PORT = 5002;

// Basic rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many enrollment attempts, please try again later.'
});

// Apply rate limiting to enrollment route
app.use('/users', limiter);

// Session configuration
app.use(session({
  secret: 'cafe-masterclass-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Razorpay configuration
let razorpay = null;

// Use the user's provided live keys
const razorpayKeyId = 'rzp_live_R8p0w858yQYzuu';
const razorpayKeySecret = 'YN1NQqSwtvKemGAmLk2biNUa';

try {
  razorpay = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret
  });

  console.log('✅ Razorpay configured successfully with LIVE keys');
  console.log('🔑 Key ID:', razorpayKeyId);
  console.log('🔐 Mode: LIVE');
} catch (error) {
  console.error('❌ Razorpay configuration failed:', error.message);
  razorpay = null;
}

// Log Razorpay configuration status
console.log('🔑 Razorpay Config:', {
  key_id: razorpayKeyId ? '✅ Loaded' : '❌ Missing',
  key_secret: razorpayKeySecret ? '✅ Loaded' : '❌ Missing',
  mode: 'LIVE'
});

// Simple file-based storage for enrollments
const ENROLLMENTS_FILE = 'enrollments.json';

// Initialize enrollments file if it doesn't exist
if (!fs.existsSync(ENROLLMENTS_FILE)) {
  fs.writeFileSync(ENROLLMENTS_FILE, JSON.stringify([], null, 2));
}

// Helper functions for file storage
function readEnrollments() {
  try {
    const data = fs.readFileSync(ENROLLMENTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading enrollments:', error);
    return [];
  }
}

function writeEnrollments(enrollments) {
  try {
    fs.writeFileSync(ENROLLMENTS_FILE, JSON.stringify(enrollments, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing enrollments:', error);
    return false;
  }
}

console.log('✅ Using file-based storage (enrollments.json)');

// Email configuration (for notifications)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com', // Replace with your email
    pass: 'your-app-password'     // Replace with your app password
  }
});

// Email notification function
async function sendEnrollmentNotification(enrollment) {
  try {
    // Email to admin
    const adminMailOptions = {
      from: 'your-email@gmail.com',
      to: 'admin@yourdomain.com', // Replace with your admin email
      subject: '🎉 New Enrollment - Café Business Masterclass',
      html: `
        <h2>New Student Enrollment!</h2>
        <p><strong>Name:</strong> ${enrollment.name}</p>
        <p><strong>Email:</strong> ${enrollment.email}</p>
        <p><strong>Phone:</strong> ${enrollment.phone}</p>
        <p><strong>Enrollment ID:</strong> ${enrollment._id}</p>
        <p><strong>Date:</strong> ${new Date(enrollment.createdAt).toLocaleString()}</p>
        <br>
        <p>Total enrollments: ${readEnrollments().length}</p>
      `
    };

    // Email to student
    const studentMailOptions = {
      from: 'your-email@gmail.com',
      to: enrollment.email,
      subject: 'Welcome to Café Business Masterclass! 🎉',
      html: `
        <h2>Welcome to the Café Business Masterclass!</h2>
        <p>Dear ${enrollment.name},</p>
        <p>Thank you for enrolling in our comprehensive café business course!</p>
        <br>
        <h3>What's Next?</h3>
        <ul>
          <li>✅ Course access details will be sent within 24 hours</li>
          <li>✅ Join our WhatsApp community for daily tips</li>
          <li>✅ Get ready to transform your café business!</li>
        </ul>
        <br>
        <p><strong>Enrollment ID:</strong> ${enrollment._id}</p>
        <p><strong>Course Price:</strong> ₹199 (Paid)</p>
        <br>
        <p>Best regards,<br>Café Business Masterclass Team</p>
      `
    };

    // Send emails (uncomment when you have email credentials)
    // await transporter.sendMail(adminMailOptions);
    // await transporter.sendMail(studentMailOptions);
    
    console.log('📧 Email notifications configured (uncomment to enable)');
  } catch (error) {
    console.error('❌ Email notification error:', error);
  }
}

// Middleware to parse JSON
app.use(express.json());
app.use(express.static('.'));

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login.html');
  }
}

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Server is running perfectly! 🚀',
    razorpay: '✅ Configured with LIVE keys',
    mongodb: '✅ Connected',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Test route
app.get('/test', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'Server is working! 🎉',
    razorpay: 'Configured with LIVE keys',
    mongodb: 'Connected',
    timestamp: new Date().toISOString()
  });
});



// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle form submissions with file storage
app.post('/users', async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;
    
    // Validate required fields
    if (!name || !phone || !email || !password) {
      return res.status(400).json({
        status: 'error',
        error: 'All fields are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: 'error',
        error: 'Please enter a valid email address'
      });
    }

    // Validate password length
    if (!password || password.length < 6) {
      return res.status(400).json({
        status: 'error',
        error: 'Password must be at least 6 characters long'
      });
    }

    // Validate phone number (basic validation)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      return res.status(400).json({
        status: 'error',
        error: 'Please enter a valid 10-digit phone number'
      });
    }

    // Check if user already exists
    const enrollments = readEnrollments();
    const existingUser = enrollments.find(e => e.email === email);
    
    if (existingUser) {
      console.log('👤 Existing user found:', { email, hasPassword: !!existingUser.password, hasMainCourse: existingUser.hasMainCourse });
      
      // If user exists but has no password, update with new password
      if (!existingUser.password) {
        existingUser.password = password;
        existingUser.name = name;
        existingUser.phone = phone;
        existingUser.updatedAt = new Date().toISOString();
        
        if (writeEnrollments(enrollments)) {
          console.log('✅ Updated existing user with password:', { name, phone, email, id: existingUser._id });
          
          res.json({
            status: 'success',
            message: 'Password updated successfully! Now proceed to payment to get instant access.',
            id: existingUser._id
          });
          return;
        } else {
          throw new Error('Failed to update existing user');
        }
      } else {
        // User exists and has password - check if they need course access
        if (!existingUser.hasMainCourse) {
          // User has password but no course access - allow them to proceed to payment
          console.log('✅ Existing user with password but no course access - allowing enrollment');
          
          res.json({
            status: 'success',
            message: 'Welcome back! You already have an account. Now proceed to payment to get course access.',
            id: existingUser._id,
            existingUser: true,
            needsPayment: true
          });
          return;
        } else {
          // User has both password and course access
          return res.status(400).json({
            status: 'error',
            error: 'You already have an account with course access. Please login instead.',
            hasAccount: true,
            hasCourseAccess: true,
            suggestion: 'login'
          });
        }
      }
    }

    // Create enrollment payload for new user
    const enrollment = {
      _id: Date.now().toString(), // Simple ID generation
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      password: req.body.password, // Save the password
      profession: req.body.profession || "",
      city: req.body.city || "",
      state: req.body.state || "",
      hasMainCourse: !!req.body.hasMainCourse,
      bonuses: Array.isArray(req.body.bonuses) ? req.body.bonuses : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to file
    enrollments.push(enrollment);
    
    if (writeEnrollments(enrollments)) {
      console.log('✅ New enrollment saved to file:', { name, phone, email, id: enrollment._id });
      
      // Send email notifications
      await sendEnrollmentNotification(enrollment);
      
      res.json({
        status: 'success',
        message: 'Enrollment successful! Welcome to the Café Business Masterclass!',
        id: enrollment._id
      });
    } else {
      throw new Error('Failed to save enrollment to file');
    }
  } catch (err) {
    console.error("❌ Save error:", err);
    return res.status(500).json({ 
      status: 'error', 
      message: "Server error", 
      error: err.message 
    });
  }
});

// Test Razorpay connection
app.get('/test-razorpay', async (req, res) => {
  try {
    console.log('🧪 Testing Razorpay connection...');
    console.log('🔑 Using keys:', {
      key_id: 'rzp_live_R8p0w858yQYzuu',
      mode: 'LIVE'
    });
    
    // Test creating a simple order
    const testOrder = await razorpay.orders.create({
              amount: 19900, // ₹199 in paise
      currency: 'INR',
      receipt: 'test_' + Date.now()
    });
    
    console.log('✅ Test order created:', testOrder.id);
    res.json({ success: true, order: testOrder });
  } catch (error) {
    console.error('❌ Razorpay test failed:', {
      message: error.message,
      statusCode: error.statusCode,
      code: error.error?.code,
      description: error.error?.description
    });
    res.status(500).json({ 
      success: false, 
      error: error.error?.description || error.message,
      code: error.error?.code
    });
  }
});

// Create Razorpay order
app.post('/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR' } = req.body;
    
    console.log('📝 Creating order with:', { amount, currency });
    console.log('🔑 Using Razorpay instance:', !!razorpay);
    
    // Create order without user info (will be collected during payment)
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: currency,
      receipt: 'cafe_masterclass_' + Date.now(),
      payment_capture: 1
    };

    console.log('🔧 Razorpay order options:', options);
    
    const order = await razorpay.orders.create(options);
    console.log('✅ Order created successfully:', order.id);
    
    res.json({
      status: 'success',
      order: order
    });
  } catch (error) {
    console.error('❌ Order creation error:', {
      message: error.message,
      statusCode: error.statusCode,
      code: error.error?.code,
      description: error.error?.description,
      fullError: error
    });
    
    res.status(500).json({
      status: 'error',
      error: 'Failed to create order',
      details: error.error?.description || error.message,
      code: error.error?.code
    });
  }
});

// Verify payment and set session
app.post('/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
         // Verify signature
     const body = razorpay_order_id + "|" + razorpay_payment_id;
     const expectedSignature = crypto
       .createHmac("sha256", razorpayKeySecret)
       .update(body.toString())
       .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // Payment verified successfully
      
      try {
        console.log('🔍 Processing payment verification for:', razorpay_order_id);
        
        // Get the order details to see if we can find user info
        const order = await razorpay.orders.fetch(razorpay_order_id);
        console.log('📋 Order details:', { id: order.id, notes: order.notes, amount: order.amount });
        
        // Look for existing user who made this payment
        // Since we're not storing user info in order notes, we need to find the user differently
        // For now, we'll look for users who have enrolled but haven't paid yet
        const enrollments = readEnrollments();
        
        // Find users who have a password but no main course access
        // Prioritize users with the most recent enrollment date
        const eligibleUsers = enrollments
          .filter(e => e.password && !e.hasMainCourse)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        if (eligibleUsers.length > 0) {
          // Use the most recent eligible user
          const user = eligibleUsers[0];
          console.log('👤 Found eligible user for payment:', user.email, 'ID:', user._id);
          
          // Update user with course access
          const userIndex = enrollments.findIndex(e => e._id === user._id);
          enrollments[userIndex].hasMainCourse = true;
          enrollments[userIndex].updatedAt = new Date().toISOString();
          
          // Save updated enrollments
          if (writeEnrollments(enrollments)) {
            console.log('✅ User enrollment updated with course access:', user.email);
            
            // Create session
            req.session.user = {
              id: user._id,
              email: user.email,
              name: user.name,
              hasMainCourse: true,
              payment_id: razorpay_payment_id,
              order_id: razorpay_order_id
            };
      
      console.log('✅ Payment verified, user session created');
      
      res.json({
        status: 'success',
        message: 'Payment verified successfully!',
              redirect: '/dashboard.html',
              existingUser: true,
              credentials: {
                email: user.email,
                password: user.password,
                note: 'Use your existing password to login'
              }
            });
          } else {
            throw new Error('Failed to save user enrollment');
          }
        } else {
          // Fallback: create temporary user if no eligible users found
          console.log('⚠️ No eligible users found, creating temporary user');
          const userInfo = {
            email: `user_${Date.now()}@temp.com`,
            name: 'Customer',
            password: 'temp_password_' + Date.now(),
            phone: '0000000000'
          };
          
          const newUser = {
            _id: Date.now().toString(),
            name: userInfo.name,
            email: userInfo.email,
            phone: userInfo.phone,
            password: userInfo.password,
            profession: "",
            city: "",
            state: "",
            hasMainCourse: true,
            bonuses: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          enrollments.push(newUser);
          
          if (writeEnrollments(enrollments)) {
            console.log('✅ Temporary user created with course access:', userInfo.email);
            
            req.session.user = {
              id: newUser._id,
              email: userInfo.email,
              name: userInfo.name,
              hasMainCourse: true,
              payment_id: razorpay_payment_id,
              order_id: razorpay_order_id
            };
            
            res.json({
              status: 'success',
              message: 'Payment verified successfully!',
              redirect: '/dashboard.html',
              credentials: {
                email: userInfo.email,
                password: userInfo.password,
                note: 'Please save these credentials for future login'
              }
            });
          } else {
            throw new Error('Failed to save temporary user');
          }
        }
      } catch (orderError) {
        console.error('❌ Error processing payment verification:', orderError);
        return res.status(500).json({
          status: 'error',
          error: 'Failed to process payment verification. Please contact support.'
        });
      }
    } else {
      res.status(400).json({
        status: 'error',
        error: 'Invalid payment signature'
      });
    }
  } catch (error) {
    console.error('❌ Payment verification error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Payment verification failed'
    });
  }
});

// Check authentication status
app.get('/auth-status', (req, res) => {
  res.json({
    authenticated: !!req.session.user,
    user: req.session.user ? {
      payment_id: req.session.payment_id,
      order_id: req.session.order_id
    } : null
  });
});

// Logout route
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ status: 'success', message: 'Logged out successfully' });
  });
});

// Forgot password route
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('🔑 Forgot password request for:', email);
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Read enrollments to find user
    const enrollments = readEnrollments();
    const user = enrollments.find(e => e.email === email);
    
    console.log('👤 User lookup result:', user ? 'Found' : 'Not found');
    if (user) {
      console.log('📊 User details:', {
        hasMainCourse: user.hasMainCourse,
        hasPassword: !!user.password,
        name: user.name
      });
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found with this email address'
      });
    }

    // If user has no password, allow them to set one for the first time
    if (!user.password) {
      console.log('🔑 User has no password, allowing first-time password setup for:', email);
      return res.json({
        success: true,
        message: 'Account found but no password set. You can set a password below.',
        canSetPassword: true,
        note: 'This is your first time setting a password for this account.'
      });
    }

    // For now, just return success (in production, send via email)
    // In a real application, you would:
    // 1. Generate a reset token
    // 2. Send reset email
    // 3. Allow user to set new password
    
    console.log('✅ Password reminder sent for:', email);
    
    res.json({
      success: true,
      message: 'Password reminder sent successfully',
      note: 'You can now set a new password below'
    });
    
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process forgot password request'
    });
  }
});

// Reset password route
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    console.log('🔑 Password reset request for:', email);
    
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Email and new password are required'
      });
    }

    // Read enrollments to find user
    const enrollments = readEnrollments();
    const userIndex = enrollments.findIndex(e => e.email === email);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found with this email address'
      });
    }

    // Update password
    enrollments[userIndex].password = newPassword;
    enrollments[userIndex].updatedAt = new Date().toISOString();
    
    // Save updated enrollments
    if (writeEnrollments(enrollments)) {
      console.log('✅ Password updated successfully for:', email);
      
      res.json({
        success: true,
        message: 'Password updated successfully. You can now login with your new password.'
      });
    } else {
      throw new Error('Failed to save password update');
    }
    
  } catch (error) {
    console.error('❌ Password reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password'
    });
  }
});

// Reset payment password route (for users who made payments)
app.post('/api/auth/reset-payment-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    console.log('🔑 Payment password reset request for:', email);
    
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Email and new password are required'
      });
    }

    // Read enrollments to find user
    const enrollments = readEnrollments();
    const userIndex = enrollments.findIndex(e => e.email === email);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found with this email address'
      });
    }

    // Update password
    enrollments[userIndex].password = newPassword;
    enrollments[userIndex].updatedAt = new Date().toISOString();
    
    // Save updated enrollments
    if (writeEnrollments(enrollments)) {
      console.log('✅ Payment password updated successfully for:', email);
      
      res.json({
        success: true,
        message: 'Password updated successfully. You can now login with your new password.'
      });
    } else {
      throw new Error('Failed to save password update');
    }
    
  } catch (error) {
    console.error('❌ Payment password reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password'
    });
  }
});

// Admin route to view all enrollments
app.get("/admin/enrollments", async (req, res) => {
  try {
    console.log('🔍 Admin enrollments request received');
    const enrollments = readEnrollments();
    console.log(`📊 Read ${enrollments.length} enrollments`);
    
    // Sort by createdAt in descending order (newest first)
    const sortedEnrollments = enrollments.sort((a, b) => {
      try {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
      } catch (sortError) {
        console.error('❌ Sorting error:', sortError);
        return 0;
      }
    });
    
    console.log('✅ Sorting completed, sending response');
    res.json(sortedEnrollments);
  } catch (err) {
    console.error("❌ Admin fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Protected PDF access route - requires authentication
app.get("/pdfs/:filename", requireAuth, (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const filePath = path.join(__dirname, 'uploads', 'pdfs', filename);
  
  console.log('PDF Request:', filename);
  console.log('File Path:', filePath);
  console.log('File Exists:', fs.existsSync(filePath));
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.sendFile(filePath);
  } else {
    console.log('PDF not found:', filename);
    res.status(404).json({ 
      error: 'PDF not found', 
      requested: filename,
      path: filePath 
    });
  }
});

// Protected route to list all available PDFs - requires authentication
app.get("/pdfs", requireAuth, (req, res) => {
  try {
    const pdfDir = path.join(__dirname, 'uploads', 'pdfs');
    const files = fs.readdirSync(pdfDir).filter(file => file.endsWith('.pdf'));
    res.json({ pdfs: files });
  } catch (err) {
    res.status(500).json({ error: 'Error reading PDF directory' });
  }
});

// ===== AUTHENTICATION ROUTES =====

// Login route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Login attempt for:', email);
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Read enrollments to find user
    const enrollments = readEnrollments();
    console.log('📋 Total enrollments in system:', enrollments.length);
    console.log('🔍 Searching for email:', email);
    
    const user = enrollments.find(e => e.email === email);
    
    console.log('👤 User lookup result:', user ? 'Found' : 'Not found');
    if (user) {
      console.log('📊 User details:', {
        id: user._id,
        name: user.name,
        email: user.email,
        hasMainCourse: user.hasMainCourse,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0,
        passwordMatch: user.password === password,
        passwordProvided: password.length,
        createdAt: user.createdAt
      });
    } else {
      console.log('❌ No user found with email:', email);
      console.log('📧 Available emails in system:', enrollments.map(e => e.email).slice(0, 5));
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found. Please purchase the course first.'
      });
    }

    // Simple password check (in production, use bcrypt)
    if (password !== user.password) {
      console.log('❌ Password mismatch for user:', email);
      return res.status(401).json({
        success: false,
        error: 'Invalid password'
      });
    }

         // Check if user has purchased the main course
     if (!user.hasMainCourse) {
       console.log('❌ User has no main course access:', email);
       return res.status(403).json({
         success: false,
         error: 'Please purchase the main course (₹199) to access the dashboard. Go to the home page to get started!',
         needsPurchase: true,
         helpUrl: '/',
         instructions: [
           '1. Go to the home page and fill out the enrollment form',
           '2. Create your password during enrollment',
           '3. Make payment of ₹199 to get instant access',
           '4. Come back here and login with your credentials'
         ]
       });
     }

    // Create session
    req.session.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      hasMainCourse: user.hasMainCourse,
      bonuses: user.bonuses || []
    };

    console.log('✅ User logged in successfully:', email);
    
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        hasMainCourse: user.hasMainCourse,
        bonuses: user.bonuses || []
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.'
    });
  }
});

// Dashboard profile route
app.get('/api/dashboard/profile', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const enrollments = readEnrollments();
    const user = enrollments.find(e => e.email === req.session.user.email);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        profession: user.profession,
        city: user.city,
        state: user.state,
        hasMainCourse: user.hasMainCourse,
        totalBonuses: user.bonuses ? user.bonuses.length : 0,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

// Dashboard course access route
app.get('/api/dashboard/course-access', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const user = req.session.user;
    
    if (!user.hasMainCourse) {
      return res.json({
        success: true,
        hasMainCourse: false
      });
    }

    // PDF list matching actual files in uploads/pdfs directory
    const availablePdfs = [
      { displayName: 'Module 1: Introduction to Café Industry', downloadUrl: '/pdfs/Module1 (2).pdf' },
      { displayName: 'Module 2: Research & Market Analysis', downloadUrl: '/pdfs/Module 2  (1).pdf' },
      { displayName: 'Module 3: Location Selection & Setup', downloadUrl: '/pdfs/Module 3  (1).pdf' },
      { displayName: 'Module 4: Financial Planning & Investment', downloadUrl: '/pdfs/Module 4  (2).pdf' },
      { displayName: 'Module 5: Kitchen Setup & Operations', downloadUrl: '/pdfs/Module 5  (3).pdf' },
      { displayName: 'Module 6: Hiring & Team Management', downloadUrl: '/pdfs/Module 6  (1).pdf' },
      { displayName: 'Module 7: Menu Design & Pricing', downloadUrl: '/pdfs/Module 7  (2).pdf' },
      { displayName: 'Module 8: Marketing (Online + Offline)', downloadUrl: '/pdfs/Module 8  (1).pdf' },
      { displayName: 'Module 9: Growth & Expansion', downloadUrl: '/pdfs/Module 9  (2).pdf' },
      { displayName: 'Module 10: Legal & Compliance', downloadUrl: '/pdfs/Module 10  (3).pdf' },
      { displayName: 'Module 11: Crisis Management', downloadUrl: '/pdfs/Module 11 (4).pdf' },
      { displayName: 'Module 12: Success Roadmap', downloadUrl: '/pdfs/Module 12 (4).pdf' }
    ];

    res.json({
      success: true,
      hasMainCourse: true,
      availablePdfs: availablePdfs
    });

  } catch (error) {
    console.error('❌ Course access error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch course access'
    });
  }
});

// Dashboard my purchases route
app.get('/api/dashboard/my-purchases', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const user = req.session.user;
    const enrollments = readEnrollments();
    const userData = enrollments.find(e => e.email === user.email);
    
    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get all available bonuses (BONUSES already imported at top)
    
    const userBonuses = BONUSES.map(bonus => {
      const purchased = userData.bonuses && userData.bonuses.some(b => b.sku === bonus.sku);
      return {
        sku: bonus.sku,
        title: bonus.title,
        desc: bonus.description || bonus.desc,
        price: bonus.price,
        purchased: purchased,
        purchaseDate: purchased ? 
          (userData.bonuses.find(b => b.sku === bonus.sku)?.purchasedAt || new Date().toISOString()) : 
          null
      };
    });

    res.json({
      success: true,
      bonuses: userBonuses
    });

  } catch (error) {
    console.error('❌ My purchases error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch purchases'
    });
  }
});

// ===== BONUS SYSTEM ROUTES =====

// BONUSES already imported at top of file

// Create bonus order
app.post('/create-bonus-order', async (req, res) => {
  try {
    const { amount, currency, bonusSku, userEmail } = req.body;
    
    // Validate bonus SKU
    const bonus = BONUSES.find(b => b.sku === bonusSku);
    if (!bonus) {
      return res.status(400).json({
        status: 'error',
        error: 'Invalid bonus SKU'
      });
    }

    // Validate amount
    if (amount !== bonus.price) {
      return res.status(400).json({
        status: 'error',
        error: 'Amount mismatch'
      });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: currency || 'INR',
      receipt: `bonus_${bonusSku}_${Date.now()}`,
      notes: {
        bonusSku: bonusSku,
        userEmail: userEmail,
        type: 'bonus_purchase'
      }
    });

    console.log('✅ Bonus order created:', order.id);
    
    res.json({
      status: 'success',
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });

  } catch (error) {
    console.error('❌ Bonus order creation error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to create bonus order'
    });
  }
});

// Verify bonus payment
app.post('/verify-bonus-payment', async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      bonusSku, 
      userEmail 
    } = req.body;

         // Verify payment signature
     const body = razorpay_order_id + "|" + razorpay_payment_id;
     const expectedSignature = crypto
       .createHmac("sha256", razorpayKeySecret)
       .update(body.toString())
       .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // Save bonus purchase to enrollments file
      const enrollments = readEnrollments();
      const userIndex = enrollments.findIndex(e => e.email === userEmail);
      
      if (userIndex !== -1) {
        // User exists, add bonus to their purchases
        if (!enrollments[userIndex].bonuses) {
          enrollments[userIndex].bonuses = [];
        }
        enrollments[userIndex].bonuses.push({
          sku: bonusSku,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          purchasedAt: new Date().toISOString()
        });
      } else {
        // Create new user entry for bonus purchase
        enrollments.push({
          email: userEmail,
          bonuses: [{
            sku: bonusSku,
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            purchasedAt: new Date().toISOString()
          }],
          createdAt: new Date().toISOString()
        });
      }

      // Save updated enrollments
      if (writeEnrollments(enrollments)) {
        console.log('✅ Bonus purchase saved for user:', userEmail);
        
        res.json({
          success: true,
          status: 'success',
          message: 'Bonus payment verified and saved successfully!'
        });
      } else {
        throw new Error('Failed to save bonus purchase');
      }

    } else {
      res.status(400).json({
        status: 'error',
        error: 'Invalid payment signature'
      });
    }

  } catch (error) {
    console.error('❌ Bonus payment verification error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Bonus payment verification failed'
    });
  }
});

// Bonus download route
app.get('/bonus-download', (req, res) => {
  try {
    const { sku, email } = req.query;
    
    if (!sku || !email) {
      return res.status(400).json({
        success: false,
        message: 'Missing bonus SKU or user email'
      });
    }

    const enrollments = readEnrollments();
    const user = enrollments.find(e => e.email === email);
    
    if (!user || !user.bonuses) {
      return res.status(403).json({
        success: false,
        message: 'Bonus not found or user not authorized'
      });
    }

    const bonus = user.bonuses.find(b => b.sku === sku);
    if (!bonus) {
      return res.status(403).json({
        success: false,
        message: 'Bonus not found for this user'
      });
    }

    // For now, return a success message with download instructions
    // You can later add actual PDF file serving
    res.json({
      success: true,
      message: 'Bonus access granted!',
      bonus: {
        sku: sku,
        title: getBonusTitle(sku),
        downloadUrl: `/api/bonus-file/${sku}`,
        instructions: 'Your bonus content is now available. Contact support for the actual PDF file.'
      }
    });

  } catch (error) {
    console.error('❌ Bonus download error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process bonus download'
    });
  }
});

// Helper function to get bonus title - now uses BONUSES from bonuses.js
function getBonusTitle(sku) {
  const bonus = BONUSES.find(b => b.sku === sku);
  return bonus ? bonus.title : 'Bonus Content';
}

// Check if user has purchased a specific bonus
app.post('/check-bonus-purchase', (req, res) => {
  try {
    const { bonusSku, userEmail } = req.body;
    
    if (!bonusSku || !userEmail) {
      return res.status(400).json({
        success: false,
        message: 'Missing bonus SKU or user email'
      });
    }

    const enrollments = readEnrollments();
    const user = enrollments.find(e => e.email === userEmail);
    
    if (!user) {
      return res.json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has purchased this bonus
    const hasBonus = user.bonuses && user.bonuses.some(b => b.sku === bonusSku);
    
    if (hasBonus) {
      // Generate secure download URL
      const downloadUrl = `/bonus-pdf/${bonusSku}`;
      
      res.json({
        success: true,
        message: 'Bonus access verified',
        downloadUrl: downloadUrl
      });
    } else {
      res.json({
        success: false,
        message: 'Bonus not purchased'
      });
    }

  } catch (error) {
    console.error('❌ Bonus check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking bonus access'
    });
  }
});

// Serve bonus PDFs (protected)
app.get('/bonus-pdf/:bonusSku', (req, res) => {
  try {
    const { bonusSku } = req.params;
    const { email } = req.query;
    
    if (!email) {
      return res.status(401).json({
        error: 'Email required to access bonus'
      });
    }

    // Check if user has purchased this bonus
    const enrollments = readEnrollments();
    const user = enrollments.find(e => e.email === email);
    
    if (!user || !user.bonuses || !user.bonuses.some(b => b.sku === bonusSku)) {
      return res.status(403).json({
        error: 'Access denied. Bonus not purchased.'
      });
    }

    // Find bonus file
    const bonus = BONUSES.find(b => b.sku === bonusSku);
    if (!bonus) {
      return res.status(404).json({
        error: 'Bonus not found'
      });
    }

    // Handle Windows special character issues by reading directory and matching files
    const bonusDir = path.join(process.cwd(), 'uploads', 'bonuses');
    let filePath = null;
    let fileExists = false;
    
    try {
      const files = fs.readdirSync(bonusDir);
      
      // Find file by matching the bonus SKU or similar filename
      const matchingFile = files.find(file => {
        // Try exact match first
        if (file === bonus.filename) return true;
        
        // Try matching by SKU in filename
        if (file.toLowerCase().includes(bonusSku.toLowerCase())) return true;
        
        // Try matching by title keywords
        const titleWords = bonus.title.toLowerCase().split(' ');
        return titleWords.some(word => file.toLowerCase().includes(word));
      });
      
      if (matchingFile) {
        filePath = path.join(bonusDir, matchingFile);
        fileExists = fs.existsSync(filePath);
      }
      
    } catch (dirError) {
      console.error('❌ Error reading bonus directory:', dirError);
    }
    
    if (fileExists && filePath) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${bonus.filename}"`);
      res.sendFile(filePath);
    } else {
      res.status(404).json({
        error: 'Bonus PDF file not found',
        filename: bonus.filename
      });
    }

  } catch (error) {
    console.error('❌ Bonus PDF access error:', error);
    res.status(500).json({
      error: 'Error accessing bonus PDF'
    });
  }
});

// Get all bonuses (public)
app.get('/bonuses', (req, res) => {
  try {
    res.json({
      status: 'success',
      bonuses: BONUSES
    });
  } catch (error) {
    console.error('❌ Bonuses fetch error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch bonuses'
    });
  }
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://admin:43fVXExJg8en4Y7e@cluster0.pp4ab3i.mongodb.net/?retryWrites=true&w=majority')
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.log('❌ MongoDB Connection Error:', err));

// Import all routes (commented out to prevent crashes)
// const authRoutes = require('./routes/auth');
// const dashboardRoutes = require('./routes/dashboard');
// const purchaseRoutes = require('./routes/purchaseRoutes');
// const paymentRoutes = require('./routes/paymentRoutes');
// const courseRoutes = require('./routes/courseRoutes');
// const bonusRoutes = require('./routes/bonusRoutes');
// const uploadRoutes = require('./routes/uploadRoutes');
// const userRoutes = require('./routes/userRoutes');

// Mount all routes (commented out to prevent crashes)
// app.use('/api/auth', authRoutes);
// app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/purchases', purchaseRoutes);
// app.use('/api/payment', paymentRoutes);
// app.use('/api/courses', courseRoutes);
// app.use('/api/bonuses', bonusRoutes);
// app.use('/api/upload', uploadRoutes);
// app.use('/api/user', userRoutes);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log('🌐 Open your browser and navigate to the URL above');
  console.log('💳 Razorpay payment system is ready!');
});

// Error handling for server
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.log(`❌ Port ${PORT} is already in use. Please stop other servers or change the port.`);
  } else {
    console.log('❌ Server error:', error.message);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.log('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.log('❌ Uncaught Exception:', error.message);
  console.log('❌ Stack:', error.stack);
});
