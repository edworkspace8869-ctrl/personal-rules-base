# Deployment Guide

## Quick Start - GitHub Pages (Recommended)

### Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon → "New repository"
3. Repository name: `personal-rules-base`
4. Make it **Public** (required for free GitHub Pages)
5. Don't initialize with README (we already have one)
6. Click "Create repository"

### Step 2: Upload Files

**Option A: Upload via Web Interface**

1. On your new repo page, click "uploading an existing file"
2. Drag and drop all files from the `personal-rules-base` folder:
   - index.html
   - app.js
   - db.js
   - service-worker.js
   - manifest.json
   - README.md
   - emblem.svg (or your custom emblem.png)
3. Click "Commit changes"

**Option B: Upload via Git Command Line**

```bash
cd personal-rules-base
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/personal-rules-base.git
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click "Settings" tab
3. Click "Pages" in the left sidebar
4. Under "Source":
   - Branch: `main`
   - Folder: `/ (root)`
5. Click "Save"

### Step 4: Access Your App

1. Wait 1-2 minutes for GitHub to build your site
2. Your app will be live at: `https://YOUR_USERNAME.github.io/personal-rules-base/`
3. Visit the URL - your Personal Rules PWA is live! 🎉

## Adding Your Personal Emblem

### Option 1: Use the Default SVG
The repository includes a simple `emblem.svg` placeholder. No action needed!

### Option 2: Use Your Own Image

1. Create or find a square image (recommended: 512x512px)
2. Save it as `emblem.png`
3. Upload to your repository (replace emblem.svg)
4. Edit `index.html` line ~592:
   ```html
   <!-- Change this: -->
   <!-- <img src="emblem.png" alt="Personal Emblem"> -->
   
   <!-- To this: -->
   <img src="emblem.png" alt="Personal Emblem">
   ```
5. Commit and push changes

## Installing as PWA on Mobile

### iOS (iPhone/iPad)

1. Open your deployed site in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Name it "Personal Rules"
5. Tap "Add"
6. Your PWA is now on your home screen!

### Android

1. Open your deployed site in Chrome
2. Tap the three dots menu
3. Tap "Add to Home screen"
4. Tap "Add"
5. Your PWA is now on your home screen!

## Testing Locally Before Deployment

### Using Python
```bash
cd personal-rules-base
python -m http.server 8000
# Open: http://localhost:8000
```

### Using Node.js
```bash
cd personal-rules-base
npx http-server
# Open: http://localhost:8080
```

### Using VS Code Live Server
1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"

## Troubleshooting

### "Page Not Found" on GitHub Pages
- Wait 2-5 minutes after enabling Pages
- Check Settings → Pages shows green checkmark
- Verify branch is set to `main`

### App Not Loading
- Open browser console (F12)
- Check for JavaScript errors
- Ensure all files uploaded correctly

### Dark Theme Not Showing
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Clear browser cache

### Data Lost
- IndexedDB data is browser-specific
- Export backups regularly (see README)
- Don't clear browser data

## Custom Domain (Optional)

1. Buy a domain (e.g., from Namecheap, Google Domains)
2. In GitHub repo settings → Pages:
   - Add your custom domain
   - Wait for DNS check to pass
3. Update your domain's DNS:
   - Add CNAME record pointing to: `YOUR_USERNAME.github.io`
4. Wait 24-48 hours for DNS propagation

## Next Steps

1. ✅ Deploy to GitHub Pages
2. ✅ Install as PWA on phone
3. ✅ Create your first rule
4. ✅ Set up regular backups
5. 🎯 Start governing yourself like a boss!

---

**Need help?** Open an issue on the GitHub repository!
