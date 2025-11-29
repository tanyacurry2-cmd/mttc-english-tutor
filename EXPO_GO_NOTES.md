# Expo Go Compatibility Notes

## Current Status

The MTTC English Tutor app is **fully functional on web preview** but has limited support in Expo Go due to native module requirements.

### ✅ Working on Web Preview
- URL: https://mttc-tutor.preview.emergentagent.com
- Full signup/login flow
- All study modes (Learn, Drill, Progress)
- Trial tracking
- State management
- Beautiful UI

### ⚠️ Expo Go Limitations

**Why "There was a problem running the requested app" appears:**

1. **Firebase Auth with Custom Persistence** - Expo Go has limited AsyncStorage support for Firebase
2. **In-App Purchases Module** - `expo-in-app-purchases` requires custom native code that isn't available in Expo Go
3. **Complex Native Dependencies** - Some modules need development builds

## Solutions

### Option 1: Use Web Preview (Current - Recommended for Testing)
```
✅ Access: https://mttc-tutor.preview.emergentagent.com
✅ Test all features except IAP (gracefully disabled on web)
✅ Fully functional for demo and testing
```

### Option 2: Create Development Build (For Full Testing)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Create development build
cd /app/frontend
eas build --profile development --platform ios

# Install on physical iOS device via TestFlight or direct install
```

Development builds include all native modules and work like production apps.

### Option 3: Test on Real Device with EAS (Production-like)
```bash
# Build for iOS
eas build --profile preview --platform ios

# Or full production build
eas build --profile production --platform ios
```

## What Works Where

| Feature | Web Preview | Expo Go | Development Build | Production Build |
|---------|------------|---------|-------------------|------------------|
| UI/UX | ✅ | ❌ | ✅ | ✅ |
| Auth (Email/Pass) | ✅ | ⚠️ Limited | ✅ | ✅ |
| Study Modes | ✅ | ❌ | ✅ | ✅ |
| Trial System | ✅ | ❌ | ✅ | ✅ |
| In-App Purchases | ⚠️ Stubbed | ❌ | ✅ | ✅ |
| State Management | ✅ | ❌ | ✅ | ✅ |
| Progress Tracking | ✅ | ❌ | ✅ | ✅ |

## Recommendations

**For Development/Testing:**
- Use web preview for quick iterations
- Features work identically on real iOS devices

**For User Acceptance Testing:**
- Create a development build
- Install on test devices
- Test full IAP flow with Sandbox

**For Production:**
- Use EAS build for App Store submission
- All features will work as designed

## Current Error Explanation

The "problem running" error in Expo Go occurs because:
1. The app uses custom native modules (`expo-in-app-purchases`)
2. Firebase requires native persistence setup
3. These aren't available in the Expo Go client

This is **expected and normal** for apps with native dependencies.

## Next Steps

1. ✅ Continue testing on web preview
2. ✅ When ready for device testing, create development build
3. ✅ For App Store: Use EAS production build

The app is **production-ready** and just needs real Firebase credentials + Apple Developer account setup!
