// Razorpay configuration
export const RAZORPAY_CONFIG = {
  keyId: process.env.RAZORPAY_KEY_ID || 'rzp_live_RAD4Q0Jypcn82a',
  keySecret: process.env.RAZORPAY_KEY_SECRET || 'zjOdjWDRhxv45thjpI8H0i73'
};

// Default payment options
export const getDefaultPaymentOptions = (userData) => ({
  key: RAZORPAY_CONFIG.keyId,
  amount: 100, // ₹1 in paise
  currency: 'INR',
  name: 'Café Business Masterclass',
  description: 'Complete Course + 4 Bonuses - Full Access',
  image: 'https://your-logo-url.com/logo.png',
  prefill: {
    name: userData.name,
    email: userData.email,
    contact: userData.phone
  },
  notes: {
    course: 'Café Business Masterclass',
    type: 'main_course_enrollment'
  },
  theme: {
    color: '#8B5CF6'
  }
});

// Bonus payment options
export const getBonusPaymentOptions = (userData, bonus) => ({
  key: RAZORPAY_CONFIG.keyId,
  amount: bonus.price * 100,
  currency: 'INR',
  name: 'Café Business Masterclass',
  description: `Bonus: ${bonus.title}`,
  image: 'https://your-logo-url.com/logo.png',
  prefill: {
    name: userData.name || 'Customer',
    email: userData.email || 'yuvapreneur@gmail.com',
    contact: userData.phone || '9999999999'
  },
  notes: {
    course: 'Café Business Masterclass',
    type: 'bonus_purchase',
    bonus_sku: bonus.sku
  },
  theme: {
    color: '#8B5CF6'
  }
});
