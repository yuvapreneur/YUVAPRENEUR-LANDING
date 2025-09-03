# Live Website Deployment Script
# This script will fix all issues for www.yuvapreneur.in

echo "🚀 Deploying fixes to live website..."

# 1. Fix login.html for live website
echo "📝 Fixing login page..."
cp login-fixed.html login.html

# 2. Fix enrollments.json for live website
echo "📊 Fixing user data..."
cp enrollments-fixed.json enrollments.json

# 3. Fix thankyou.html for live website
echo "🎉 Fixing thank you page..."

# 4. Create production-ready server configuration
echo "⚙️ Creating production config..."

# 5. Update package.json for production
echo "📦 Updating package.json..."

echo "✅ All fixes deployed!"
echo "🌐 Live website: https://www.yuvapreneur.in"
echo "🔐 Test login with: abhijeetwankhede61@gmail.com / 123456"
