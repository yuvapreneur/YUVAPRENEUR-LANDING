import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

export async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function getUserSchema() {
  return {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    profession: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    password: { type: String, required: true },
    status: { type: String, default: 'pending_payment' }, // pending_payment, enrolled, payment_failed
    paymentId: { type: String },
    paymentDate: { type: Date },
    courseAccess: { type: String, default: 'none' }, // none, full
    hasPurchasedCourse: { type: Boolean, default: false },
    enrolledAt: { type: Date, default: Date.now },
    manualAccessGranted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  };
}
