# MTTC English Tutor - Diagnostic Feature Implementation

## Overview
Implemented a complete diagnostic assessment feature with local JSON storage and AsyncStorage for session tracking. No backend required.

## Features Implemented

### 1. **Diagnostic Assessment Screen** (`/app/(tabs)/assessment.tsx`)
- **20-Question Balanced Quiz**: Automatically selects 5 questions from each of the 4 subareas (SA-1 through SA-4)
- **Shuffle Logic**: Questions are randomly shuffled every time for a fresh experience
- **20-Minute Timer**: Countdown timer that auto-submits when time expires
- **Clean UI**: Modern card-based interface with selected state highlighting
- **Progress Tracking**: Shows current question number (e.g., "Question 5 / 20")

### 2. **Results Screen** (`/app/diagnostic-results.tsx`)
- **Score Display**: Shows percentage and fraction (e.g., "85% (17/20)")
- **Readiness Metric**: Displays local readiness score based on EMA calculation
- **Wrong Questions Review**: Lists all incorrectly answered question IDs
- **Navigation**: Easy access to Progress tab and Home screen

### 3. **Progress Tab Integration** (`/app/(tabs)/progress.tsx`)
- **Diagnostic Readiness Display**: Shows EMA-based readiness percentage
- **Session History**: Lists recent diagnostic attempts with:
  - Date and time
  - Score percentage
  - Correct/total questions
- **Color-coded Performance**: Green (80%+), Blue (60-79%), Red (<60%)

### 4. **Utility Functions** (`/utils/selection.ts`)
- **Fisher-Yates Shuffle**: Randomizes question order
- **Balanced Selection**: Ensures equal representation from all subareas
- **Question Type Definition**: Typed interface for questions

### 5. **Session Storage** (`/storage/sessions.ts`)
- **AsyncStorage Integration**: Persists data locally on device
- **Session Management**: Stores up to 50 recent diagnostic sessions
- **EMA Calculation**: Exponential Moving Average (α=0.25) for readiness tracking
- **Session Schema**:
  ```typescript
  {
    id: string,
    date: ISO string,
    score01: number (0-1),
    total: number,
    wrongIds: string[]
  }
  ```

### 6. **Countdown Timer Component** (`/components/Countdown.tsx`)
- **Real-time Display**: MM:SS format
- **Auto-expire**: Triggers callback when time runs out
- **Clean Implementation**: Uses React hooks for timer management

### 7. **Data Transformation** (`/data/questions.json`)
- **Converted MCQ Data**: Transformed existing MCQ format to diagnostic-compatible structure
- **Subarea Mapping**: 
  - "Meaning & Communication" → SA-1
  - "Literature & Understanding" → SA-2
  - "Genre & Craft" → SA-3
  - "Skills & Processes" → SA-4
- **Difficulty Levels**: Easy, Medium, Hard (mapped from numeric values)

## Technical Stack
- **State Management**: React useState, useEffect, useMemo
- **Navigation**: Expo Router with typed params
- **Storage**: @react-native-async-storage/async-storage
- **UUID Generation**: uuid v13.0.0
- **Styling**: React Native StyleSheet with theme integration

## Data Flow
1. User taps "Assessment" tab
2. System loads questions.json and filters for MCQs
3. `balancedPickBySubarea()` selects 5 questions per subarea
4. Questions are shuffled and displayed one-by-one
5. User selects answers and submits
6. Session is saved to AsyncStorage
7. EMA readiness is calculated and updated
8. Results screen shows score and readiness
9. Progress tab reflects updated diagnostic history

## Testing Checklist
- [ ] Assessment tab loads with 20 questions
- [ ] Timer counts down from 20:00
- [ ] Questions are shuffled on each attempt
- [ ] Selected options are highlighted
- [ ] Submit/Next button works correctly
- [ ] Time expiry triggers auto-submit
- [ ] Results screen shows correct score
- [ ] Progress tab displays diagnostic readiness
- [ ] Session history persists across app restarts
- [ ] Navigation between screens works smoothly

## Future Enhancements
- Add Firestore sync for cross-device persistence
- Implement question review feature (tap wrong question IDs to see details)
- Add subarea-specific diagnostic modes
- Include detailed explanations on results screen
- Add retry/retake functionality with progress tracking
- Export diagnostic history as PDF/CSV

## Dependencies Added
```json
{
  "@react-native-async-storage/async-storage": "^2.2.0",
  "uuid": "^13.0.0",
  "@types/uuid": "^11.0.0"
}
```

## Files Created/Modified

### Created:
- `/utils/selection.ts`
- `/storage/sessions.ts`
- `/components/Countdown.tsx`
- `/data/questions.json`
- `/app/diagnostic-results.tsx`

### Modified:
- `/app/(tabs)/assessment.tsx` (replaced placeholder with full implementation)
- `/app/(tabs)/progress.tsx` (added diagnostic readiness and history)
- `/package.json` (added AsyncStorage and uuid)

## Notes
- All data is stored locally (no backend required for MVP)
- Diagnostic readiness uses EMA for smooth score transitions
- Questions are balanced across all four subareas
- Timer is non-intrusive but visible at all times
- Clean, professional UI matching app theme
