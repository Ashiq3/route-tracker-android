# Android TWA Setup Guide

## Prerequisites
1. Node.js installed
2. Android Studio installed
3. Your app deployed to Render (get the URL first)

## Step 1: Install Bubblewrap CLI
```bash
npm install -g @bubblewrap/cli
```

## Step 2: Create TWA Project
Replace `YOUR_RENDER_URL` with your actual Render URL:

```bash
bubblewrap init \
  --manifest https://YOUR_RENDER_URL/static/manifest.json \
  --applicationId com.routetracker.app \
  --name "Route Tracker" \
  --launcherName "Route Tracker" \
  --themeColor "#007bff" \
  --navigationColor "#007bff" \
  --backgroundColor "#ffffff" \
  --enableNotifications true \
  --startUrl "/" \
  --iconUrl https://YOUR_RENDER_URL/static/icons/icon-512.png \
  --maskableIconUrl https://YOUR_RENDER_URL/static/icons/icon-512.png
```

## Step 3: Generate Android Project
```bash
bubblewrap generate
```

## Step 4: Open in Android Studio
1. Open Android Studio
2. Open the generated `twa/` folder
3. Wait for Gradle sync to complete

## Step 5: Test on Emulator
1. Create an Android Virtual Device (AVD)
2. Run the app on emulator
3. Test all functionality

## Step 6: Build APK
1. Build → Generate Signed Bundle/APK
2. Choose APK
3. Create new keystore:
   - **Keystore path**: Choose location
   - **Password**: Create strong password
   - **Alias**: routetracker
   - **Validity**: 25 years
4. Build APK

## Step 7: Install on Phone
```bash
adb install app-release.apk
```

## Configuration Files

### twa-manifest.json (will be generated)
```json
{
  "packageId": "com.routetracker.app",
  "host": "YOUR_RENDER_URL",
  "name": "Route Tracker",
  "launcherName": "Route Tracker",
  "display": "standalone",
  "themeColor": "#007bff",
  "navigationColor": "#007bff",
  "backgroundColor": "#ffffff",
  "enableNotifications": true,
  "startUrl": "/",
  "iconUrl": "https://YOUR_RENDER_URL/static/icons/icon-512.png",
  "maskableIconUrl": "https://YOUR_RENDER_URL/static/icons/icon-512.png",
  "monochromeIconUrl": "https://YOUR_RENDER_URL/static/icons/icon-512.png",
  "includeNotification": false,
  "splashScreenFadeOutDuration": 300,
  "signingKey": {
    "path": "./android.keystore",
    "alias": "routetracker"
  },
  "appVersionName": "1.0.0",
  "appVersionCode": 1,
  "shortcuts": [],
  "generatorApp": "bubblewrap-cli",
  "webManifestUrl": "https://YOUR_RENDER_URL/static/manifest.json",
  "fallbackType": "customtabs",
  "features": {
    "locationDelegation": {
      "enabled": true
    },
    "playBilling": {
      "enabled": false
    }
  },
  "alphaDependencies": {
    "enabled": false
  },
  "enableSiteSettingsShortcut": true,
  "isChromeOSOnly": false,
  "isMetaQuest": false,
  "minSdkVersion": 19,
  "targetSdkVersion": 34
}
```

## Troubleshooting

### Common Issues:
1. **Manifest not found**: Ensure your Render app is deployed and accessible
2. **Icons not loading**: Check icon URLs are accessible
3. **Build fails**: Check Android SDK is properly installed
4. **App crashes**: Check logs with `adb logcat`

### Testing Checklist:
- [ ] App launches successfully
- [ ] All pages load correctly
- [ ] Location tracking works
- [ ] Offline functionality works
- [ ] Icons display properly
- [ ] App feels native (no browser UI)

Your Android APK is ready! 🎉
