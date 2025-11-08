# MTTC English Tutor - TestFlight Deployment Guide

**Complete Step-by-Step Guide for Deploying to TestFlight**

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Configuration Summary](#configuration-summary)
3. [Deployment Steps](#deployment-steps)
4. [Troubleshooting](#troubleshooting)
5. [Post-Deployment](#post-deployment)
6. [FAQ](#faq)

---

## Prerequisites

### What You Need Before Starting:
- ✅ Apple Developer Account (paid, $99/year) - **You have this**
- ✅ App Store Connect Record Created - **Done (ID: 6755059122)**
- ✅ Bundle ID: `com.curryapps.mttcenglishtutor`
- ✅ Team ID: `8H7KMKH7AN`
- ✅ Apple ID Email: `tanyacurry2@icloud.com`
- ✅ App configured and tested locally

### Tools Required:
- Node.js (already installed)
- Expo CLI
- EAS CLI (Expo Application Services)
- Terminal/Command Line access

---

## Configuration Summary

**Your app is already configured with:**

**File: `/app/frontend/app.json`**
```json
{
  "name": "MTTC English Tutor",
  "bundleIdentifier": "com.curryapps.mttcenglishtutor",
  "version": "1.0.0",
  "buildNumber": "1"
}
```

**File: `/app/frontend/eas.json`**
```json
{
  "build": {
    "production": {
      "distribution": "store",
      "ios": {
        "simulator": false
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "tanyacurry2@icloud.com",
        "ascAppId": "6755059122",
        "appleTeamId": "8H7KMKH7AN"
      }
    }
  }
}
```

---

## Deployment Steps

### Step 1: Install EAS CLI

**Open your terminal and run:**
```bash
npm install -g eas-cli
```

**Verify installation:**
```bash
eas --version
```
You should see a version number like `14.0.0` or similar.

**What this does:**
- Installs the Expo Application Services command-line tool
- This tool manages builds, credentials, and submissions to app stores

---

### Step 2: Login to Expo/EAS

**Navigate to your project:**
```bash
cd /app/frontend
```

**Login to EAS:**
```bash
eas login
```

**You'll be prompted for:**
- **Email/Username**: Your Expo account credentials
- **Password**: Your Expo password

**Don't have an Expo account?**
- Create one at: https://expo.dev/signup
- It's free and takes 2 minutes

**What this does:**
- Authenticates you with Expo's build servers
- Links your local project to your Expo account
- Required for building and submitting apps

---

### Step 3: Configure Apple Credentials

**Run the credentials command:**
```bash
eas credentials
```

**Follow these prompts:**

1. **Select platform:** Choose `iOS`
2. **Select build profile:** Choose `production`
3. **What do you want to do?** Choose `Set up credentials from scratch`

**You'll be asked to provide:**
- **Apple ID**: `tanyacurry2@icloud.com`
- **Apple ID Password**: Your Apple Developer account password
- **Two-Factor Authentication Code**: Enter the code sent to your device

**What EAS will do automatically:**
1. Generate a Distribution Certificate
2. Create a Provisioning Profile
3. Register your Bundle ID with Apple
4. Store credentials securely in Expo's servers

**This process takes 2-5 minutes.**

**Troubleshooting credentials:**
- If you get "unauthorized" errors, double-check your Apple ID password
- Make sure your Apple Developer account is active and paid
- If using 2FA, have your device ready for codes

---

### Step 4: Start the Build

**Run the build command:**
```bash
eas build --platform ios --profile production
```

**What happens next:**

1. **EAS analyzes your project** (~30 seconds)
   - Validates configuration
   - Checks for errors
   - Prepares build environment

2. **You'll see output like:**
   ```
   ✔ Project analyzed
   ✔ Credentials validated
   ✔ Starting build...
   
   Build URL: https://expo.dev/accounts/[username]/projects/mttc-english-tutor/builds/[build-id]
   ```

3. **Build process** (~15-20 minutes)
   - Compiles React Native code
   - Bundles assets (images, sounds, etc.)
   - Creates iOS binary (IPA file)
   - Signs the app with your certificates

4. **Monitor progress:**
   - Click the Build URL to watch live logs
   - You'll see detailed progress updates
   - The page updates automatically

**Build stages you'll see:**
- 📦 **Prepare build environment** (2 min)
- 🔧 **Install dependencies** (5 min)
- ⚙️ **Compile native code** (5 min)
- 📱 **Build iOS binary** (5 min)
- ✅ **Finalize build** (2 min)

**Expected completion time: 15-20 minutes**

---

### Step 5: Wait for Build Completion

**While the build is running:**

✅ **DO:**
- Keep the Build URL open to monitor progress
- Leave your terminal window open
- Check email for notifications from Expo

❌ **DON'T:**
- Close the terminal (build will continue, but you won't see updates)
- Run other EAS commands in the same directory
- Worry if it takes longer than 20 minutes (first builds can take up to 30 min)

**Build succeeded?**
You'll see:
```
✔ Build completed!
IPA: https://expo.dev/artifacts/[artifact-id]
```

**Build failed?**
- Check the build logs for error messages
- See [Troubleshooting](#troubleshooting) section below
- Contact me with the error message for help

---

### Step 6: Submit to TestFlight

**Once the build succeeds, submit to TestFlight:**
```bash
eas submit --platform ios --latest
```

**This command:**
1. Takes your latest successful build
2. Uploads it to App Store Connect
3. Submits it for TestFlight review

**You'll see:**
```
✔ Submitting to App Store Connect...
✔ Upload completed
✔ Submission successful!

Your build will appear in TestFlight within 1-3 hours after Apple's processing.
```

**What happens now:**
1. **Apple processes your build** (10 minutes - 3 hours)
   - Scans for malware
   - Validates app structure
   - Generates TestFlight metadata

2. **Email notification**
   - You'll receive an email when processing is complete
   - Subject: "Your app is ready for external testing"

3. **TestFlight availability**
   - Build appears in App Store Connect > TestFlight
   - You can add beta testers
   - Share TestFlight link

---

### Step 7: Configure TestFlight in App Store Connect

**Go to:** https://appstoreconnect.apple.com

**Navigate to:**
1. **My Apps** → **MTTC English Tutor**
2. **TestFlight** tab (top menu)

**You should see:**
- Your build listed under "iOS Builds"
- Status: "Ready to Submit" or "Processing"

**Wait for status to change to: "Ready to Test"**

---

### Step 8: Add Beta Testers

**In TestFlight section:**

1. Click **"Internal Testing"** (left sidebar)
   - Add up to 100 internal testers (free)
   - Internal testers = Anyone with Admin/Developer role in App Store Connect

2. Click **"External Testing"** (for your 5-10 testers)
   - Create a new test group
   - Name it: "Beta Testers" or "Initial Test Group"
   - Add up to 10,000 external testers

**To add external testers:**
1. Click **"Add Testers"** or **"+"**
2. Enter their email addresses (one per line)
3. Click **"Add"**

**Apple's external testing review:**
- First external build must be reviewed by Apple (~24-48 hours)
- Subsequent builds for the same group don't need review
- Internal testing has no review requirement

---

### Step 9: Distribute TestFlight Link

**Once build is "Ready to Test":**

**Option 1: Public Link (Recommended)**
1. In TestFlight, click your test group
2. Enable **"Public Link"**
3. Copy the link (looks like: `https://testflight.apple.com/join/ABCD1234`)
4. Share this link with your testers

**Option 2: Email Invites**
1. Testers will receive an email from Apple
2. Email includes instructions and TestFlight link
3. Testers click link to install TestFlight app
4. TestFlight app shows your MTTC English Tutor app to install

**Testers need to:**
1. Install **TestFlight app** from App Store (free)
2. Open your invitation link
3. Accept invitation in TestFlight app
4. Install **MTTC English Tutor**
5. Provide feedback through TestFlight

---

## Troubleshooting

### Common Errors & Solutions

#### Error: "Failed to authenticate with Apple"
**Cause:** Apple ID credentials incorrect or 2FA issue

**Solution:**
1. Verify your Apple ID: `tanyacurry2@icloud.com`
2. Check your password is correct
3. Ensure your Apple Developer account is active
4. Try logging in at https://developer.apple.com to verify
5. Run `eas credentials` again

---

#### Error: "Bundle identifier is already in use"
**Cause:** Another app is using `com.curryapps.mttcenglishtutor`

**Solution:**
1. Check https://developer.apple.com/account/resources/identifiers/list
2. If you see the Bundle ID, it's registered to your account (good!)
3. If it's registered to a different account, you'll need a new Bundle ID
4. Contact me to help change the Bundle ID if needed

---

#### Error: "Provisioning profile doesn't include signing certificate"
**Cause:** Certificate/profile mismatch

**Solution:**
1. Run: `eas credentials`
2. Select: `iOS` → `production`
3. Choose: `Remove all credentials`
4. Run: `eas credentials` again
5. Choose: `Set up credentials from scratch`
6. This regenerates everything cleanly

---

#### Error: "Build failed: Pod install failed"
**Cause:** Dependency resolution issue

**Solution:**
1. Check build logs for specific pod errors
2. Usually auto-resolves on retry
3. Run build command again: `eas build --platform ios --profile production`
4. If persists, contact me with the full error log

---

#### Error: "Timeout waiting for build"
**Cause:** High server load or network issues

**Solution:**
1. Build continues in background
2. Check Build URL in browser for updates
3. Wait 30-40 minutes total
4. If still not complete, check Expo status: https://status.expo.dev

---

#### Error: "App Store Connect submission failed"
**Cause:** Various reasons (credentials, app info incomplete, etc.)

**Solution:**
1. Check exact error message in terminal
2. Verify app record in App Store Connect is complete
3. Ensure Bundle ID matches exactly
4. Try manual upload:
   - Download IPA from Build URL
   - Use Transporter app (Mac App Store)
   - Upload manually to App Store Connect

---

### Build Taking Too Long?

**Normal times:**
- First build: 15-30 minutes
- Subsequent builds: 10-20 minutes

**If over 30 minutes:**
1. Check Build URL for stuck processes
2. Check Expo status page for incidents
3. Cancel and restart:
   ```bash
   eas build:cancel --platform ios
   eas build --platform ios --profile production
   ```

---

### App Crashes on TestFlight?

**If testers report crashes:**

1. **Check crash logs:**
   - App Store Connect → TestFlight → Build → Crashes
   - Shows detailed crash reports

2. **Common causes:**
   - API endpoint issues (backend down?)
   - Missing permissions (notifications, etc.)
   - Firebase configuration errors
   - Network connectivity issues

3. **Test locally first:**
   - Run app in development mode
   - Test all features thoroughly
   - Check console for errors

4. **Contact me with:**
   - Crash log from App Store Connect
   - Steps to reproduce
   - Which screen/feature crashes

---

## Post-Deployment

### What Happens After TestFlight Launch?

**Immediate (0-24 hours):**
- ✅ Build appears in TestFlight
- ✅ Testers can install app
- ✅ You can see install/session analytics
- ⏳ First external build pending Apple review (24-48 hrs)

**Testing Phase (1-2 weeks):**
- 👥 5-10 testers use the app
- 📊 Collect feedback through TestFlight
- 🐛 Identify bugs and issues
- 🔄 Push updates as needed (no review for same test group)

**Before App Store Submission:**
- ✅ All major bugs fixed
- ✅ Screenshots prepared (required for App Store)
- ✅ App description written
- ✅ Privacy Policy hosted publicly
- ✅ Keywords and categories selected
- ✅ Pricing decided (free vs. paid, IAP pricing)

---

### Updating Your TestFlight Build

**When you need to fix bugs or add features:**

1. **Make code changes locally**
2. **Test changes thoroughly**
3. **Build new version:**
   ```bash
   cd /app/frontend
   eas build --platform ios --profile production
   ```
4. **Submit to TestFlight:**
   ```bash
   eas submit --platform ios --latest
   ```
5. **Update is automatic for testers** (they get notification)

**Version management:**
- Update `version` in `app.json` for feature updates (1.0.0 → 1.1.0)
- Update `buildNumber` for bug fixes (1 → 2, 3, 4...)

---

### TestFlight Limitations

**Limits to be aware of:**
- ✅ **100 internal testers** (App Store Connect members)
- ✅ **10,000 external testers** (general public)
- ✅ **90-day build expiration** (builds auto-expire, push new build before then)
- ✅ **100 groups** (can segment testers)
- ✅ **Unlimited builds** (push as many updates as you want)

---

### Getting Feedback

**Built-in TestFlight feedback:**
- Testers can screenshot and send feedback
- Feedback appears in App Store Connect
- Includes device info, OS version, screenshot

**Best practices:**
1. Ask specific questions (e.g., "Is the Writing Lab easy to use?")
2. Create a feedback form (Google Forms, Typeform)
3. Schedule check-ins with key testers
4. Monitor crash reports daily
5. Respond quickly to critical issues

---

## FAQ

### Q: How much does TestFlight cost?
**A:** Free! Included with your $99/year Apple Developer account.

---

### Q: Do I need a Mac for TestFlight deployment?
**A:** No! EAS builds in the cloud, works from Windows/Linux/Mac. But you'll need a Mac later for final App Store submission with screenshots (or use a service like AppLaunchpad).

---

### Q: Can I test on my own iPhone before sharing with others?
**A:** Yes! Add yourself as an internal tester with your `tanyacurry2@icloud.com` email. You'll get the TestFlight link immediately.

---

### Q: How long does Apple's review take for external testing?
**A:** First external build: 24-48 hours. Subsequent builds to same test group: Instant (no review).

---

### Q: What if I find a bug after deploying?
**A:** Push a new build! Follow the same build → submit process. Testers get notified of updates automatically.

---

### Q: Can I have multiple TestFlight builds active?
**A:** Yes! Each build stays active for 90 days. Testers can choose which version to test.

---

### Q: What's the difference between internal and external testing?
- **Internal:** Up to 100 testers, anyone with App Store Connect access, instant (no Apple review), good for team testing
- **External:** Up to 10,000 testers, general public, first build needs Apple review (~48 hrs), good for beta testing

---

### Q: Do testers need to pay for my app on TestFlight?
**A:** No! TestFlight is always free for testers, even if your app will be paid in the App Store.

---

### Q: Can I see how many people installed from TestFlight?
**A:** Yes! App Store Connect → TestFlight → Metrics shows:
- Installs
- Sessions
- Crashes
- Feedback
- Per build and per tester

---

### Q: What happens when I'm ready for the App Store?
**A:** Different process:
1. Complete app metadata (description, screenshots, keywords)
2. Build for "production" (same process)
3. Submit for App Review (not TestFlight)
4. Apple reviews (~24-48 hours)
5. App goes live on App Store

---

### Q: Can I skip TestFlight and go straight to App Store?
**A:** Yes, technically. But NOT recommended! TestFlight lets you:
- Catch bugs before public launch
- Get real user feedback
- Test on different devices/iOS versions
- Build confidence before official release

---

### Q: What data can I see about my TestFlight testers?
**A:** Limited:
- ✅ Install count
- ✅ Session count
- ✅ Crashes per tester
- ✅ Feedback they submit
- ❌ Personal info (unless they provide it via feedback)

---

## Need Help?

**If you encounter any issues:**

1. **Check this guide's Troubleshooting section first**
2. **Check build logs** (Build URL in browser)
3. **Contact me with:**
   - Exact error message
   - What step you're on
   - Screenshots if applicable
   - Build URL if available

**Useful resources:**
- Expo docs: https://docs.expo.dev/build/introduction/
- Apple TestFlight guide: https://developer.apple.com/testflight/
- App Store Connect: https://appstoreconnect.apple.com

---

## Summary Checklist

**Before starting:**
- [ ] Apple Developer account active ($99/year paid)
- [ ] App Store Connect record created (ID: 6755059122)
- [ ] Bundle ID configured: com.curryapps.mttcenglishtutor
- [ ] App tested locally and working

**Deployment steps:**
- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Login: `eas login`
- [ ] Configure credentials: `eas credentials`
- [ ] Build: `eas build --platform ios --profile production`
- [ ] Submit: `eas submit --platform ios --latest`
- [ ] Wait for Apple processing (1-3 hours)
- [ ] Configure TestFlight in App Store Connect
- [ ] Add beta testers
- [ ] Share TestFlight link
- [ ] Monitor feedback and crashes

**Success indicators:**
- ✅ Build completes without errors
- ✅ IPA uploads to App Store Connect
- ✅ Build appears in TestFlight
- ✅ Testers can install and run app
- ✅ No critical crashes reported

---

**Good luck with your TestFlight deployment! 🚀**

**Your MTTC English Tutor app is ready to help teacher candidates succeed!**
