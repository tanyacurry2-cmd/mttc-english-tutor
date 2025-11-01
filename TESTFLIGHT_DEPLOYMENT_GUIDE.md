# 🚀 TestFlight Deployment Guide for MTTC English Tutor

## ✅ Pre-Export Checklist (Complete!)

- ✅ Apple Developer Account ($99/year) - PAID
- ✅ 544 questions in MongoDB database
- ✅ Backend API running on Emergent
- ✅ Firebase Auth configured
- ✅ App.json configured with bundle identifier
- ✅ EAS.json created for builds
- ✅ All features working (confetti, mastery tracking, etc.)

## 📦 Step 1: Export from Emergent

1. **Save to GitHub** (from Emergent dashboard)
   - Click "Save to GitHub" 
   - Create new repository: `mttc-english-tutor`
   - Wait for export to complete

## 💻 Step 2: Local Setup

### Install Required Tools
```bash
# Install Node.js (if not already installed)
# Download from: https://nodejs.org/

# Install Expo CLI and EAS CLI
npm install -g @expo/cli eas-cli

# Verify installations
expo --version
eas --version
```

### Clone Your Repository
```bash
git clone https://github.com/YOUR_USERNAME/mttc-english-tutor.git
cd mttc-english-tutor/frontend
```

### Install Dependencies
```bash
yarn install
# or
npm install
```

## 🔧 Step 3: Configure for Production

### Update Backend URL

**IMPORTANT**: Your backend will stay on Emergent. You need the production URL.

1. Find your Emergent backend URL (format: `https://your-app-xxx.emergent.sh`)

2. Update `/frontend/.env`:
```env
EXPO_BACKEND_URL=https://your-actual-emergent-backend-url.emergent.sh
```

### Update eas.json

Replace placeholders in `/frontend/eas.json`:
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "FIND_IN_APP_STORE_CONNECT",
        "appleTeamId": "FIND_IN_APPLE_DEVELOPER"
      }
    }
  }
}
```

**Where to find these:**
- `appleId`: Your Apple ID email
- `ascAppId`: App Store Connect → Apps → Your App → App Information
- `appleTeamId`: developer.apple.com → Membership → Team ID

## 🏗️ Step 4: Build for TestFlight

### Login to EAS
```bash
eas login
```

### Configure EAS (First Time)
```bash
eas build:configure
```

### Create iOS Build
```bash
eas build --platform ios --profile production
```

**This will:**
- ✅ Ask for Apple credentials (use your developer account)
- ✅ Generate iOS certificates automatically
- ✅ Build your app in the cloud (~15-20 minutes)
- ✅ Upload directly to App Store Connect

**Wait for build to complete** - You'll get a link to track progress

## 📱 Step 5: Configure TestFlight

1. **Go to App Store Connect** (appstoreconnect.apple.com)
2. **Navigate to**: My Apps → Your App → TestFlight
3. **Wait for Processing** (~10-30 minutes after build)
4. **Add Testers**:
   - Click "Internal Testing" or "External Testing"
   - Add beta testers by email
5. **Submit for Beta Review** (if using external testing)

## 👥 Step 6: Invite Beta Testers

**For Internal Testing** (up to 100 people):
- No review needed
- Instant access
- Must have developer account access

**For External Testing** (up to 10,000 people):
- Requires beta app review (~24-48 hours)
- Anyone with email can test
- Recommended for wider audience

### How Testers Install:
1. Testers receive email invitation
2. Install TestFlight app from App Store
3. Accept invitation
4. Download your app!

## 🔄 Updating Your App

### For Content Updates (Questions):
**NO REBUILD NEEDED!** 🎉
- Update MongoDB directly on Emergent
- Users get new questions automatically
- This is why we moved to backend API!

### For Code/Feature Updates:
```bash
# Update version in app.json
"version": "1.0.1",  # Increment version
"buildNumber": "2"   # Increment build

# Build new version
eas build --platform ios --profile production

# Will auto-upload to TestFlight
```

## 🐛 Testing Checklist

Before inviting testers:
- [ ] Test on your own device first
- [ ] Verify backend connection works
- [ ] Check all 4 study modes work
- [ ] Test confetti animations
- [ ] Verify mastery tracking saves
- [ ] Test assessment mode
- [ ] Check progress tracking

## 📊 Monitoring

**Backend (Emergent)**:
- Monitor API calls
- Check MongoDB for issues
- View logs in Emergent dashboard

**App (App Store Connect)**:
- View crash reports
- See adoption metrics
- Read tester feedback

## 🆘 Troubleshooting

### Build Fails
- Check eas.json configuration
- Verify Apple credentials
- Run `eas build:configure` again

### Backend Not Connecting
- Verify EXPO_BACKEND_URL in .env
- Check backend is running on Emergent
- Test API endpoint manually: `curl https://your-backend.emergent.sh/api/questions/stats`

### TestFlight Processing Stuck
- Usually takes 10-30 minutes
- Check App Store Connect for errors
- Ensure bundle ID matches developer account

## 💰 Costs Summary

- **Apple Developer**: $99/year (PAID ✅)
- **EAS Build**: Free tier (60 builds/month) or $29/month for priority
- **Emergent Backend**: Your current plan (stays the same)

## 📞 Support Resources

- **Expo Documentation**: docs.expo.dev
- **EAS Build Docs**: docs.expo.dev/build/introduction
- **Apple TestFlight**: developer.apple.com/testflight
- **Emergent Support**: support@emergent.sh

## 🎉 Success Checklist

- [ ] Code exported from Emergent
- [ ] Local build setup complete
- [ ] EAS build successful
- [ ] App in App Store Connect
- [ ] TestFlight configured
- [ ] First tester invited
- [ ] First tester successfully installed app

---

## Next Steps After Export

1. **Save this guide** for reference
2. **Export code** from Emergent
3. **Follow steps 2-6** above
4. **Celebrate** when first tester installs! 🎊

**Estimated Time**: 2-3 hours (first time)

Good luck! 🚀
