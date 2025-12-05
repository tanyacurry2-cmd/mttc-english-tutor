# Build #10 - Premium Paywall & IAP Implementation

## Overview
This build re-enables the premium paywall system with Apple In-App Purchase integration and removes authentication requirements.

## Premium Model

### Free Tier (No Purchase Required)
- ✅ First 5 flashcards
- ✅ First 5 drill questions  
- ✅ 1 assessment attempt
- ✅ Progress tracking (limited)
- ❌ Writing Lab (locked)

### Premium ($29.99 one-time purchase)
- ✅ All 291 flashcards
- ✅ All 302 drill questions
- ✅ Unlimited assessments
- ✅ AI Writing Lab access
- ✅ Full progress tracking

## Apple IAP Configuration

**Product ID**: `com.tanyacode.mttcenglish.premium`
**Type**: Non-consumable (lifetime)
**Price**: $29.99 USD

### Testing in TestFlight
1. IAP products must be configured in App Store Connect
2. Use TestFlight sandbox account for testing purchases
3. Test both purchase and restore flows

## Technical Changes

### Modified Files

1. **lib/store.ts**
   - Removed auth-related state (`user`, `email`, `uid`, `trialStart`, `trialEnd`)
   - Added premium state: `isPaid`, `purchaseType`, `assessmentsCompleted`
   - Added access control methods:
     - `canAccessPremium()` - Check if user has premium
     - `canAccessFlashcard(index)` - Check if flashcard is accessible
     - `canAccessDrillQuestion(index)` - Check if drill question is accessible
     - `canTakeAssessment()` - Check if user can take another assessment
   - Added `incrementAssessments()` to track completed assessments
   - Removed `initializeTrial()`, `setUser()`, `checkTrialStatus()`, `logout()`
   - Added `resetToFree()` for debugging

2. **lib/iap.ts** (Complete rewrite)
   - Implemented real Apple IAP using `expo-in-app-purchases`
   - Methods:
     - `initialize()` - Connect to IAP service
     - `getProducts()` - Fetch product details from App Store
     - `purchaseProduct(productId)` - Initiate purchase flow
     - `restorePurchases()` - Restore previous purchases
     - `finishTransaction(purchase)` - Complete transaction (iOS requirement)
     - `disconnect()` - Clean up IAP connection
   - Uses `IAP_PRODUCT_ID` constant for the premium product

3. **app/paywall.tsx**
   - Updated to use new IAP manager
   - Simplified to single premium option ($29.99 lifetime)
   - Added proper transaction finishing for iOS
   - Improved error handling and user feedback
   - Shows dynamic price from App Store product

4. **app/_layout.tsx**
   - Removed `login` and `signup` routes
   - App now launches directly to welcome/home

5. **app/login.tsx** (DELETED)
6. **app/signup.tsx** (DELETED)

7. **app.json**
   - Incremented `ios.buildNumber` to "10"
   - Incremented `android.versionCode` to 10

## Implementation Notes

### No Authentication Required
- App launches directly to content
- No user accounts or login flow
- Users identified by device only
- Premium status stored locally with AsyncStorage

### Paywall Triggers
Screens should check premium status and show paywall when:
- User tries to access flashcard index >= 5 (free tier exhausted)
- User tries to access drill question index >= 5
- User tries to start 2nd assessment (assessmentsCompleted >= 1)
- User tries to access Writing Lab

### State Persistence
- Premium status persists across app restarts
- Assessment count persists locally
- Progress data persists as before

## TODO for Screen Updates

The following screens need to be updated to enforce premium limits:

1. **app/(tabs)/learn.tsx**
   - Add check: `canAccessFlashcard(currentIndex)`
   - Show paywall when limit reached

2. **app/(tabs)/drill.tsx**
   - Add check: `canAccessDrillQuestion(currentIndex)`
   - Show paywall when limit reached

3. **app/(tabs)/assessment.tsx**
   - Add check: `canTakeAssessment()` before starting
   - Call `incrementAssessments()` when assessment completes
   - Show paywall if limit reached

4. **app/writing-lab.tsx**
   - Add check: `canAccessPremium()` on mount
   - Redirect to paywall if not premium

## Google Play Implementation (Later)

When Google Play product ID is available:
1. Update `lib/iap.ts` to support multiple product IDs
2. Add platform detection for iOS vs Android product IDs
3. Test IAP flow on Android device
4. Update paywall screen if pricing differs

## Testing Checklist

- [ ] App launches to welcome screen (no login)
- [ ] Free user can access first 5 flashcards
- [ ] Free user can access first 5 drill questions
- [ ] Free user can take 1 assessment
- [ ] Paywall shows when limits reached
- [ ] Purchase flow completes successfully in TestFlight
- [ ] Premium status persists after app restart
- [ ] Restore purchases works correctly
- [ ] Writing Lab requires premium
- [ ] All screens work correctly for premium users

## Build Commands

```bash
# iOS Build #10
cd frontend
eas build --platform ios --profile production

# Android Build #10 (when Google Play ID ready)
eas build --platform android --profile production
```

## App Store Connect Setup Required

Before building:
1. Create In-App Purchase product in App Store Connect
2. Product ID: `com.tanyacode.mttcenglish.premium`
3. Type: Non-Consumable
4. Price: $29.99 USD (Tier 30)
5. Add localized descriptions
6. Submit for review (can test in TestFlight before approval)
