# 🚀 Quick GitHub Hosting Setup

## 📋 **Steps to Host on GitHub:**

### 1. **Create GitHub Repository**
   ```bash
# Create new repo on GitHub.com named: yuvapreneur-landing
# Make it PUBLIC (required for GitHub Pages)
   ```

### 2. **Push Your Code**
   ```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/yuvapreneur-landing.git
git push -u origin main
```

### 3. **Enable GitHub Pages**
- Go to repo Settings → Pages
- Source: Deploy from branch
- Branch: main
- Folder: / (root)
- Save

### 4. **Connect GoDaddy Domain**
- In GoDaddy DNS settings, add:
  - Type: CNAME
  - Name: www
  - Value: YOUR_USERNAME.github.io
  - TTL: 600

### 5. **Wait 5-10 minutes**
Your site will be live at: `www.yuvapreneur.in`

## ⚠️ **Important Notes:**
- GitHub Pages only supports static sites
- Your Node.js backend won't work here
- For full functionality, use Vercel/Railway instead
- This setup is for static landing page only

## 🔧 **Alternative: Full Hosting with Vercel**
For complete functionality (payments, login, etc.):
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Deploy automatically
4. Add custom domain: `www.yuvapreneur.in`

---
**Need help?** Contact: support@www.yuvapreneur.in
