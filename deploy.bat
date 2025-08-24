@echo off
echo 🚀 Quick GitHub Deployment
echo.

echo 📁 Initializing Git...
git init

echo 📤 Adding files...
git add .

echo 💾 Committing changes...
git commit -m "Deploy to GitHub Pages"

echo 🌿 Setting main branch...
git branch -M main

echo 🔗 Adding remote origin...
git remote add origin https://github.com/YOUR_USERNAME/yuvapreneur-landing.git

echo 🚀 Pushing to GitHub...
git push -u origin main

echo.
echo ✅ Done! Now:
echo 1. Go to your GitHub repo
echo 2. Settings → Pages
echo 3. Source: Deploy from branch
echo 4. Branch: main
echo 5. Save
echo.
echo 🌐 Your site will be live in 5-10 minutes!
pause
