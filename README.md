# VoiceBridge 🌏

> **Real-Time Multilingual Voice Bridge for Disaster Response in Southeast Asia**
> Built for BorneoHack — SDG 11 · SDG 10 · SDG 17

---

## What It Does

VoiceBridge is a stress-adaptive, location-aware emergency communication app that bridges language barriers between disaster survivors and rescuers across Southeast Asia.

**The problem:** In a disaster, a survivor speaking a specific local dialect cannot communicate with a rescuer from a different region. Every second of miscommunication costs lives.

**The solution:** VoiceBridge auto-detects your GPS location, pre-loads the dominant local language with zero setup, translates your speech in real-time, and outputs a **calm, authoritative voice** regardless of how panicked the speaker sounds — because tone drives compliance in emergencies.

---

## Project Structure

```
borneohack/
├── app/
│   ├── _layout.tsx              # Root layout
│   └── (tabs)/
│       ├── _layout.tsx          # Tab navigator
│       ├── index.tsx            # Home — mode selection & location
│       ├── bridge.tsx           # Voice Bridge — core PTT screen
│       ├── dialect.tsx          # Dialect selection & configuration
│       ├── phrases.tsx          # Emergency Phrase Bank
│       └── settings.tsx         # App settings & server configuration
├── components/
│   ├── CountryPickerModal.tsx   # Regional selection UI
│   ├── CountryPill.tsx          # Selected region indicator
│   ├── DialectBadge.tsx         # Active dialect indicator
│   ├── GhostCard.tsx            # Ghost matching UI component
│   ├── LanguageBadge.tsx        # Language indicator pill
│   ├── ManualFallbackModal.tsx  # Manual override for auto-detect
│   ├── PanicToggle.tsx          # Emergency mode toggle
│   ├── PatchedCard.tsx          # Glossary patch UI component
│   ├── PhraseBankGrid.tsx       # Grid layout for emergency phrases
│   ├── PhraseCard.tsx           # Individual phrase button
│   ├── PushToTalk.tsx           # Animated hold-to-record button
│   └── WaveformIndicator.tsx    # Recording animation
├── lib/
│   ├── api.ts                   # Backend API client
│   ├── audioPlayer.ts           # expo-av playback
│   ├── audioRecorder.ts         # expo-av recording
│   ├── countryDetect.ts         # GPS-based country resolution
│   ├── dialectStorage.ts        # Local storage for dialect preferences
│   ├── languageMap.ts           # Core language mappings
│   ├── store.ts                 # Zustand global state
│   ├── data/demoPacks.ts        # Pre-loaded demo configurations
│   ├── types/dialect.ts         # TypeScript definitions for dialects
│   └── utils/
│       ├── dialectDetect.ts     # Dialect parsing logic
│       ├── ghostMatch.ts        # Text/Audio ghost matching utilities
│       └── glossaryPatch.ts     # Regional vocabulary substitutions
├── constants/
│   ├── colors.ts                # Design tokens
│   ├── languages.ts             # Supported language list
│   └── phrases.ts               # Emergency phrase bank data
└── server/
    ├── src/
    │   ├── index.ts             # Express server entry
    │   ├── routes/
    │   │   ├── translate.ts     # POST /api/translate
    │   │   └── phrases.ts       # POST /api/phrase
    │   ├── services/
    │   │   ├── whisper.ts       # OpenAI Whisper wrapper
    │   │   ├── translate.ts     # Google Translate wrapper
    │   │   └── elevenlabs.ts    # ElevenLabs TTS wrapper
    │   └── utils/
    │       └── languageMap.ts   # Backend coordinate resolver
    └── package.json
```

---

## Key Features

### Zero-Friction Setup
- GPS auto-detects the dominant local language and dialect on launch, no language menu to navigate in a panic. (e.g., distinguishing between standard Malay and specific Bornean dialects).
- Includes manual fallback modals if GPS fails.
- Covers 14 SE Asian language regions: Malay, Indonesian, Thai, Vietnamese, Filipino, Burmese, Khmer, Lao, and more

### Stress-Adaptive Voice Output
- ElevenLabs Multilingual v2 synthesizes all output using a single pre-configured **calm, authoritative "relief coordinator" voice**
- Strips panic from the output tone — a panicking survivor's voice becomes a clear, calm command for rescuers

### Glossary Patching & Ghost Matching
- Translates not just standard languages, but patches specific regional vocabularies using custom glossary maps.
- Ensures highly accurate local context is maintained during translations.

### Three Operating Modes
| Mode | Who uses it | How it works |
|------|-------------|--------------|
| **Survivor** | Person in distress | Hold-to-speak, translated to local language and played aloud |
| **Rescuer** | Emergency responder | Split-screen bidirectional — rescuer speaks top, survivor speaks bottom |
| **Relay Volunteer** | Multilingual coordinator | Routes translation across an entire evacuation zone |

### One-Tap Emergency Phrase Bank
Pre-translated critical phrases with instant ElevenLabs playback — no speech required:
- "I am trapped under rubble"
- "I need medical help"
- "I have children with me"
- "Where is the evacuation point?"
- 12 more phrases across Medical, Rescue, Evacuation, and Vulnerable Person categories

---

## Architecture

```
[Expo App] ──► POST /api/translate ──► [Whisper STT] ──► [Google Translate] ──► [ElevenLabs TTS]
    │                                                                                   │
    │── GPS coords ──► SE Asia language map (offline)                                   │
    └─────────────────────────────── base64 MP3 audio ◄─────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile App | React Native (Expo SDK 55, Expo Router) |
| State Management | Zustand |
| Backend | Node.js + Express (TypeScript) |
| Speech-to-Text | Groq |
| Translation | Google Cloud Translate v2 |
| Text-to-Speech | ElevenLabs Multilingual v2 |
| Location | `expo-location` (GPS) |
| Audio I/O | `expo-av` |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Expo Account, Expo Application Services (EAS) CLI
- API keys for: Groq, Google Cloud Translate, ElevenLabs

### 1. Mobile App

```bash
# From repo root, this also downloads the Expo CLI (NOT the same as EAS CLI)
npm install

# Install the EAS CLI if not installed
npm install -g eas-cli

# Login to Expo Account
eas login
```

**In app.json file in root, under 'extra' field, if there is an 'eas' field, delete it. Then only someone new can build the APK.**

```bash
# Register a new EAS Project ID under your Expo Account
npx eas-cli init

# Build the APK development build and then download to mobile
eas build -p android --profile development

# Then run the APK
npx expo start
```

Scan the QR code with **Expo Go** on your iOS or Android device.

### 2. Backend Server

```bash
cd server
npm install

# Copy and fill in your API keys
cp .env.example .env

# Edit .env with your keys
npm run dev
```

Server runs at `http://localhost:3001`.

### 3. Connect App to Backend

In the app's **Settings** tab, set the Backend Server URL to your machine's local IP address (not `localhost` — your phone needs to reach your computer on the same WiFi):

```
http://192.168.x.x:3001
```

---

## Environment Variables (server/.env)

```env
GROQ_API_KEY=gsk-...
GOOGLE_TRANSLATE_API_KEY=AIza...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...        # ID of your pre-cloned calm voice
PORT=3001
```

### Setting Up the ElevenLabs Calm Voice

1. Go to [ElevenLabs Voice Lab](https://elevenlabs.io/voice-lab)
2. Use **Voice Design** to create a calm, authoritative male/female voice
3. Copy the Voice ID and set it as `ELEVENLABS_VOICE_ID`

---

## API Reference

### `POST /api/translate`
Transcribes audio, translates, and returns synthesized speech.

**Request:**
```json
{
  "audioBase64": "<base64 encoded audio>",
  "latitude": 3.14,
  "longitude": 101.68,
  "myLanguage": "en",
  "targetLanguage": "ms"
}
```

**Response:**
```json
{
  "sourceText": "I need help",
  "sourceLang": "en",
  "translatedText": "Saya memerlukan bantuan",
  "targetLang": "ms",
  "audioBase64": "<base64 MP3>"
}
```

### `POST /api/phrase`
Translates a preset phrase and returns synthesized speech (cached after first call).

**Request:**
```json
{
  "phraseKey": "trapped",
  "phraseText": "I am trapped under rubble",
  "targetLang": "th"
}
```

---

## SDG Impact

| Goal | Impact |
|------|--------|
| **SDG 11** — Sustainable Cities | Directly improves disaster resilience infrastructure for SE Asian cities prone to floods, earthquakes, and typhoons |
| **SDG 10** — Reduced Inequalities | Removes language barriers for migrant workers and ethnic minorities during disasters using localized dialects |
| **SDG 17** — Partnerships | Enables cross-border ASEAN disaster relief coordination |

---

## Target Users

---

## How to interact with prototype
> step by step guide for judges
> test cases if applicable

---

## AI disclosure

---

*Made with purpose for BorneoHack. Disaster resilience is everyone's responsibility.*
