# Route Tracker - Deployment Guide

## Phase 1: Deploy to Render.com (FREE)

### Step 1: Prepare Your Repository
1. Create a new GitHub repository
2. Upload all files from this `android-route-tracker` folder to your GitHub repo

### Step 2: Deploy to Render
1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `route-tracker`
   - **Environment**: `Python 3`
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn main:app`
   - **Plan**: `Free`

### Step 3: Add PostgreSQL Database
1. In Render dashboard, click "New +" → "PostgreSQL"
2. Configure:
   - **Name**: `route-tracker-db`
   - **Plan**: `Free`
3. After creation, copy the "External Database URL"
4. Go to your web service → "Environment"
5. Add environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: [paste the database URL]

### Step 4: Deploy
1. Click "Deploy Latest Commit"
2. Wait for deployment to complete
3. Your app will be available at: `https://route-tracker-[random].onrender.com`

## Phase 2: Test Your PWA

### Step 1: Test PWA Features
1. Visit your Render URL
2. Open Chrome DevTools → Application → Manifest
3. Verify icons and installability
4. Test offline functionality

### Step 2: Test on Mobile
1. Open your Render URL on your phone
2. Chrome will show "Add to Home Screen" option
3. Install and test the PWA

## Phase 3: Create Android APK

### Step 1: Install Bubblewrap
```bash
npm install -g @bubblewrap/cli
```

### Step 2: Initialize TWA Project
```bash
bubblewrap init --manifest https://your-render-url.onrender.com/static/manifest.json
```

### Step 3: Generate Android Project
```bash
bubblewrap generate
```

### Step 4: Build APK
1. Open the generated `twa/` folder in Android Studio
2. Build → Generate Signed Bundle/APK
3. Create keystore and build APK

## Troubleshooting

### Common Issues:
1. **Build fails**: Check build logs in Render dashboard
2. **Database connection**: Verify DATABASE_URL environment variable
3. **Icons not loading**: Ensure icons exist in static/icons/
4. **PWA not installable**: Check manifest.json and HTTPS

### Support:
- Render docs: https://render.com/docs
- Bubblewrap docs: https://github.com/GoogleChromeLabs/bubblewrap

## Success Criteria:
✅ App deployed to Render with HTTPS  
✅ PWA installable on mobile  
✅ Database working with PostgreSQL  
✅ Android APK generated  
✅ App works offline  

Your Route Tracker is now ready for the Play Store! 🚀
