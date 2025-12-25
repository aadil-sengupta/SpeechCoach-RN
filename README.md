# SpeechCoach 🎤

<div align="center">

**Your Personal AI-Powered Speech Coach**

A React Native mobile application designed to help users improve their public speaking and presentation skills through self-analysis, AI-powered feedback, and repetitive practice.

[![React Native](https://img.shields.io/badge/React%20Native-0.79.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2053-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Download APK](#-download) • [Features](#-features) • [Getting Started](#-getting-started) • [Documentation](#-documentation)

</div>

---

## 📥 Download

The latest APK is available for download on the [release page](https://github.com/aadil-sengupta/SpeechCoach-RN/releases) of this repo.

**Quick Install:**
1. Download the APK from releases
2. Enable "Install from unknown sources" on your Android device
3. Install and start practicing!

---

## 🎯 About

SpeechCoach is a comprehensive mobile application that helps you master public speaking through:

- **🎥 Video Recording** - Practice with front or rear camera with real-time recording
- **🤖 AI Analysis** - Get instant, detailed feedback powered by Google's Gemini AI
- **📊 Progress Tracking** - Monitor your improvement with session statistics and notes
- **🎭 Multiple Practice Modes** - General speaking, Interviews, Sales pitches, Startup pitches
- **🔄 Self-Analysis Tools** - Review recordings with audio-only, video-only, or combined playback
- **📝 Session Notes** - Document your observations and areas for improvement

### Why SpeechCoach?

Public speaking is one of the most valuable skills, yet it's challenging to practice effectively. SpeechCoach provides:
- **Immediate Feedback** - No need to wait for a coach or mentor
- **Privacy First** - Practice in a safe, judgment-free environment
- **Personalized Insights** - AI analysis tailored to your specific goals
- **Continuous Improvement** - Track progress over time with detailed analytics

---

## ✨ Features

### 🎬 Recording & Practice
- **Dual Camera Support** - Use front-facing camera for self-recording or rear camera for presentation practice
- **Dynamic Practice Prompts** - Rotating prompts to inspire different speaking scenarios
- **Real-time Recording Timer** - Track your session duration as you speak
- **Instant Playback** - Review your performance immediately after recording

### 🤖 AI-Powered Analysis

Choose from specialized analysis modes:

| Mode | Best For | Analysis Focus |
|------|----------|----------------|
| **General** | Overall communication skills | Clarity, structure, delivery, engagement |
| **Interview** | Job interviews | STAR method, confidence, professionalism |
| **Sales** | Sales presentations | Discovery, value proposition, objection handling |
| **Pitch** | Startup pitches | Problem-solution fit, business model, storytelling |

**AI Analysis Provides:**
- 📋 Comprehensive summary of your performance
- 💪 Key strengths identified
- 🎯 Improvement opportunities with actionable advice
- ⏱️ Pacing and timing observations
- 🎪 Delivery style assessment
- 📈 Overall score with detailed breakdown
- 💡 Specific next steps for improvement

### 📊 Session Management
- **Dashboard View** - See all your practice sessions at a glance
- **Thumbnail Previews** - Quickly identify recordings with auto-generated thumbnails
- **Metadata Tracking** - Duration, date, analysis status, and notes for each session
- **Export Capability** - Export your session data and progress
- **Delete Management** - Remove individual sessions or clear all data

### 👤 User Management
- **Authentication System** - Secure login and signup
- **Profile Management** - Track your personal information and progress
- **Session History** - Access your complete practice history

---

## 🛠️ Technical Stack

### Core Technologies
- **[React Native](https://reactnative.dev/)** `0.79.5` - Cross-platform mobile framework
- **[Expo](https://expo.dev/)** `SDK 53` - Development platform and tooling
- **[TypeScript](https://www.typescriptlang.org/)** `5.8.3` - Type-safe JavaScript
- **[Expo Router](https://docs.expo.dev/router/introduction/)** `5.1.4` - File-based navigation

### Key Libraries
- **[expo-camera](https://docs.expo.dev/versions/latest/sdk/camera/)** `16.1.11` - Video recording
- **[expo-av](https://docs.expo.dev/versions/latest/sdk/av/)** `15.1.7` - Video playback
- **[AsyncStorage](https://react-native-async-storage.github.io/async-storage/)** `2.2.0` - Local data persistence
- **[React Navigation](https://reactnavigation.org/)** `7.x` - Navigation management
- **[Expo Linear Gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/)** - Beautiful UI gradients
- **[Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/)** - Tactile feedback

### AI Integration
- **Google Gemini AI** - Advanced speech analysis
- Backend API integration for video processing
- Fallback mock analysis for offline development

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **[Node.js](https://nodejs.org/)** v16 or higher
- **[npm](https://www.npmjs.com/)** or **[yarn](https://yarnpkg.com/)**
- **[Expo CLI](https://docs.expo.dev/get-started/installation/)** (installed globally recommended)
- **[Android Studio](https://developer.android.com/studio)** (for Android development)
- **[Xcode](https://developer.apple.com/xcode/)** (for iOS development, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/aadil-sengupta/SpeechCoach-RN.git
   cd SpeechCoach-RN
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (Optional for AI features)
   
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_API_URL=https://your-backend-api.com
   EXPO_PUBLIC_GOOGLE_API_KEY=your_google_api_key
   ```

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on your device**
   
   Choose one of the following options:
   
   - **📱 Physical Device**: Scan the QR code with [Expo Go](https://expo.dev/go) app
   - **🤖 Android Emulator**: Press `a` in the terminal or run `npm run android`
   - **🍎 iOS Simulator**: Press `i` in the terminal or run `npm run ios` (macOS only)
   - **🌐 Web**: Press `w` in the terminal or run `npm run web`

---

## 📁 Project Structure

```
SpeechCoach-RN/
├── app/                          # Application screens (file-based routing)
│   ├── (tabs)/                   # Tab navigation screens
│   │   ├── dashboard.tsx         # Main dashboard with recordings
│   │   └── profile.tsx           # User profile and settings
│   ├── _layout.tsx               # Root layout with auth
│   ├── camera-practice.tsx       # Video recording screen
│   ├── self-analysis.tsx         # Recording playback and analysis
│   ├── login.tsx                 # User login
│   ├── signup.tsx                # User registration
│   └── index.tsx                 # Landing screen
│
├── components/                   # Reusable UI components
│   ├── AuthNavigator.tsx         # Authentication flow navigation
│   ├── CustomTabBar.tsx          # Custom bottom tab bar
│   ├── VideoPlayerModal.tsx      # Video playback modal
│   └── ui/                       # UI-specific components
│
├── contexts/                     # React Context providers
│   └── AuthContext.tsx           # Authentication context
│
├── utils/                        # Utility functions and services
│   ├── apiService.ts             # Backend API integration
│   ├── recordingUtils.ts         # Recording management utilities
│   └── speechAnalysis.ts         # AI analysis integration
│
├── hooks/                        # Custom React hooks
│   ├── useColorScheme.ts         # Theme detection
│   └── useThemeColor.ts          # Theme color utilities
│
├── constants/                    # App-wide constants
│   └── Colors.ts                 # Color palette
│
├── assets/                       # Static assets
│   ├── images/                   # App images and icons
│   └── fonts/                    # Custom fonts
│
├── android/                      # Android native code
├── build/                        # Build artifacts
├── scripts/                      # Development scripts
├── app.json                      # Expo configuration
├── eas.json                      # EAS Build configuration
├── package.json                  # Dependencies
└── tsconfig.json                 # TypeScript configuration
```

---

## 🎨 Key Features Breakdown

### Camera Practice Screen (`app/camera-practice.tsx`)
- Real-time video recording with camera switching
- Dynamic practice prompts that rotate every 5 seconds
- Recording duration tracking
- Automatic save to device media library
- Direct navigation to analysis after recording
- AI analysis mode selection (General, Interview, Sales, Pitch)

### Dashboard Screen (`app/(tabs)/dashboard.tsx`)
- Grid view of all recorded sessions
- Video thumbnails for easy identification
- Session metadata display (duration, date, analysis status)
- Quick access to recordings
- Export and delete functionality
- Statistics summary

### Analysis Screen (`app/self-analysis.tsx`)
- Full video playback with controls
- AI analysis results display
- Manual note-taking capability
- Multiple playback modes (video + audio, audio only, video only)
- Session statistics
- Share and delete options

### Profile Screen (`app/(tabs)/profile.tsx`)
- User information display
- Session statistics
- Account management
- App settings
- Logout functionality

---

## 🔧 Development

### Available Scripts

```bash
# Start Expo development server
npm start

# Run on Android device/emulator
npm run android

# Run on iOS simulator (macOS only)
npm run ios

# Run in web browser
npm run web

# Run linter
npm run lint

# Reset project (clean install)
npm run reset-project
```

### API Integration

The app integrates with a backend API for AI analysis. Expected API structure:

**Endpoint:** `POST /api/analyze`

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `video`: Video file (mp4)
  - `mode`: Analysis mode string (`general`, `interview`, `sales`, `pitch`)

**Response:**
```json
{
  "analysis": {
    "summary": "Overall performance summary",
    "strengths": ["Strength 1", "Strength 2"],
    "opportunities": ["Opportunity 1", "Opportunity 2"],
    "pacingObservations": "Pacing analysis",
    "deliveryStyle": "Delivery assessment",
    "overallScore": 85,
    "specificFeedback": ["Feedback 1", "Feedback 2"],
    "nextSteps": ["Action 1", "Action 2"]
  },
  "timestamp": "2025-12-25T10:00:00Z",
  "processingTime": 5.2
}
```

### Mock Analysis for Development

The app includes comprehensive mock analysis for development without a backend:

```typescript
import { mockAnalyzeSpeechVideo } from '@/utils/speechAnalysis';

const mockResult = await mockAnalyzeSpeechVideo(videoUri, 'interview');
```

---

## 📦 Building for Production

### Android

#### Using EAS Build (Recommended)
```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo account
eas login

# Configure the project
eas build:configure

# Build APK
eas build --platform android --profile preview

# Build AAB for Google Play
eas build --platform android --profile production
```

#### Local Build
```bash
# Generate Android build
npx expo run:android --variant release

# Generate APK
cd android
./gradlew assembleRelease

# APK location: android/app/build/outputs/apk/release/app-release.apk
```

### iOS

```bash
# Using EAS Build
eas build --platform ios --profile production

# Local build (macOS only)
npx expo run:ios --configuration Release
```

---

## 🌐 Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| Android | ✅ Fully Supported | Primary development platform |
| iOS | ✅ Fully Supported | All features available |
| Web | ⚠️ Limited | Camera features not available |

### Permissions Required

**Android:**
- `CAMERA` - Video recording
- `RECORD_AUDIO` - Audio capture
- `READ_EXTERNAL_STORAGE` - Access recordings
- `WRITE_EXTERNAL_STORAGE` - Save recordings
- `ACCESS_MEDIA_LOCATION` - Media metadata

**iOS:**
- `NSCameraUsageDescription` - Camera access
- `NSMicrophoneUsageDescription` - Microphone access
- `NSPhotoLibraryUsageDescription` - Photo library access

---

## 📚 Documentation

Additional documentation available in the repository:

- **[AI_SPEECH_ANALYSIS_IMPLEMENTATION.md](AI_SPEECH_ANALYSIS_IMPLEMENTATION.md)** - Detailed AI integration guide
- **[SPEECH_ANALYSIS_SETUP.md](SPEECH_ANALYSIS_SETUP.md)** - Setup instructions for speech analysis
- **[AI_ANALYSIS_MODAL_IMPLEMENTATION.md](AI_ANALYSIS_MODAL_IMPLEMENTATION.md)** - Modal implementation details
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Overall implementation summary

---

## 🗺️ Roadmap

### Coming Soon
- [ ] **Friends & Social Features** - Connect with friends for feedback and motivation
- [ ] **Custom Learning Roadmap** - Personalized improvement paths based on your goals
- [ ] **Detailed Skills Analytics** - In-depth insights into your speaking abilities
- [ ] **Progress Visualization** - Charts and graphs showing improvement over time
- [ ] **Smart Notifications** - Gentle reminders to maintain consistent practice
- [ ] **Cloud Sync** - Backup and sync recordings across devices
- [ ] **Offline AI Analysis** - On-device analysis for privacy and speed
- [ ] **Voice-only Mode** - Audio-only recording and analysis
- [ ] **Comparative Analysis** - Compare multiple recordings side-by-side
- [ ] **Custom Prompts** - Create your own practice scenarios
- [ ] **Batch Analysis** - Analyze multiple recordings simultaneously
- [ ] **Export Reports** - Generate PDF reports of your progress

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
   ```bash
   git fork https://github.com/aadil-sengupta/SpeechCoach-RN.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Write clean, documented code
   - Follow the existing code style
   - Test thoroughly on both platforms

4. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```

5. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Provide a clear description of changes
   - Reference any related issues
   - Add screenshots for UI changes

### Development Guidelines

- Use TypeScript for all new code
- Follow React hooks best practices
- Write meaningful commit messages
- Update documentation for new features
- Test on both Android and iOS when possible

---

## 🐛 Troubleshooting

### Common Issues

**Camera not working:**
```bash
# Clear cache and restart
npx expo start -c
```

**Build failures:**
```bash
# Clean install
rm -rf node_modules
npm install
npx expo start -c
```

**Android build issues:**
```bash
# Clean Android build
cd android
./gradlew clean
cd ..
npx expo run:android
```

**Permission errors:**
- Ensure all permissions are granted in device settings
- Check app.json for correct permission declarations

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors & Contributors

**Aadil Sengupta** - *Initial work and maintenance*
- GitHub: [@aadil-sengupta](https://github.com/aadil-sengupta)

See also the list of [contributors](https://github.com/aadil-sengupta/SpeechCoach-RN/contributors) who participated in this project.

---

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/aadil-sengupta/SpeechCoach-RN/issues)
- **Discussions**: [GitHub Discussions](https://github.com/aadil-sengupta/SpeechCoach-RN/discussions)
- **Project Link**: [https://github.com/aadil-sengupta/SpeechCoach-RN](https://github.com/aadil-sengupta/SpeechCoach-RN)

---

## 🙏 Acknowledgments

- **Expo Team** - For the incredible development platform
- **React Native Community** - For the robust ecosystem
- **Google Gemini AI** - For powering our speech analysis
- **All Contributors** - For making this project better

---

## ⭐ Star History



It helps the project gain visibility and encourages continued development.

---

<div align="center">

**Made with ❤️ for better communication**

[⬆ Back to Top](#speechcoach-)

</div>
