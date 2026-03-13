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
│   ├── _layout.tsx              # Root layout + AuthProvider
│   ├── index.tsx                # Auth gate — redirects by session & role
│   ├── auth.tsx                 # Login/Signup (Survivor or Authority)
│   ├── (survivor)/
│   │   ├── _layout.tsx          # Stack: tabs + Report, Convo, Broadcast, Phrases
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx      # Tabs: Home, Profile, Settings
│   │   │   ├── index.tsx        # Home — 3 buttons: Report, Convo, Broadcast
│   │   │   ├── profile.tsx      # Survivor profile form (cloud DB)
│   │   │   └── settings.tsx     # Backend URL, Dialect config
│   │   ├── report.tsx           # Make report (AI flow placeholder)
│   │   ├── convo.tsx            # Voice bridge — STT/TTS, dialect, phrases
│   │   ├── broadcast.tsx        # Location-based broadcasts (placeholder)
│   │   └── phrases.tsx          # Full phrase bank by category
│   └── (authority)/
│       ├── _layout.tsx          # Authority layout
│       └── index.tsx            # Authority dashboard (incoming reports)
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
│   ├── supabase.ts              # Supabase client (AsyncStorage persistence)
│   ├── auth/
│   │   ├── AuthContext.tsx      # Session provider (signIn, signUp, signOut)
│   │   └── useProfile.ts        # Profile fetch for role-based routing
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

## Objectives

- **Bridge Language Barriers**: Neutralize communication gaps in Southeast Asia's linguistically diverse regions during critical disaster windows.
- **Ensure Psychological Stability**: Use stress-adaptive, calm, and authoritative voice synthesis to reduce panic and drive compliance during rescue operations.
- **Data-Driven Triage**: Provide authorities with instant access to survivor medical data, demographics, and real-time location for optimized response.
- **Zero-Config Accessibility**: Automate language and dialect detection via GPS to ensure the app is usable the moment it is opened, with zero setup required during stress.

---

## Key Features

### 🚀 Zero-Friction Setup
- **GPS-Authored Context**: Auto-detects the dominant local language and dialect (e.g., distinguishing standard Malay from Bornean dialects) on launch.
- **Manual Overrides**: Robust manual fallback modals for areas with poor GPS signaling.
- **Broad Coverage**: Support for 14 Southeast Asian regions including Malay, Indonesian, Thai, Vietnamese, Filipino, Burmese, Khmer, Lao, and more.

### 🎙️ Stress-Adaptive Voice Output
- **Calm Authority**: ElevenLabs Multilingual v2 synthesizes all output using a pre-configured, steady "relief coordinator" voice.
- **Tone Neutralization**: Automatically strips panic from survivor inputs — a frantic cry for help is delivered to responders as a clear, actionable instruction.

### 🧩 Glossary Patching & Ghost Matching
- **Localized Accuracy**: Translates not just standard languages, but patches specific regional vocabularies using custom glossary maps.
- **Contextual Integrity**: Ensures that local names for locations or specific emergency terms are preserved and accurately translated.

### 👮 Authority Dashboard (New UI)
- **Real-Time Command Center**: A centralized feed for emergency responders to view incoming reports, status updates, and survivor details.
- **Integrated Identity**: Instant lookups of survivor profiles including legal name, age, gender, and critical medical conditions directly on each report.
- **Visual Status Tracking**: Color-coded prioritization (🔴 Pending, 🟡 Responding, 🟢 Resolved) for efficient resource allocation.
- **Precision Dispatch**: Integrated "View on Map" functionality to open precise survivor GPS coordinates in navigation apps.
- **Bilingual Review**: Responders can view both the original source description and the AI-translated text for maximum context.

### 👤 Role-Based Access
| Role | Who uses it | How it works |
|------|-------------|---------------|
| **Survivor** | Person in distress | Sign up before disaster. Three actions: **Report** (AI voice flow), **Convo** (voice/text with officers), **Broadcast** (alerts). |
| **Authority** | Emergency responder | Dashboard access. View, triage, and manage reports with integrated survivor medical data. |

### ⚡ Quick Phrases
Pre-translated critical phrases with instant playback for high-stress situations:
- "I am trapped under rubble"
- "I need medical help"
- "I have children with me"
- "Where is the evacuation point?"
- 12+ more across Medical, Rescue, Evacuation, and Vulnerable Person categories.

---

## Architecture

```
[Expo App] ──► POST /api/translate ──► [Groq STT] ──► [Google Translate] ──► [ElevenLabs TTS]
    │                                                                                   │
    │── GPS coords ──► SE Asia language map (offline)                                   │
    └─────────────────────────────── base64 MP3 audio ◄─────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile App | React Native (Expo SDK 55, Expo Router) |
| Auth & Profiles | Supabase |
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
- Supabase project (for Auth and profiles)

### Supabase Setup
1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL to create `profiles` table with RLS and `handle_new_user` trigger (see migration plan or README section below)
3. In `app.json` under `extra`, set `supabaseUrl` and `supabaseAnonKey` to your project values
4. Authority users: create via Supabase dashboard, then set `role = 'authority'` in `profiles` for that user

**Profiles SQL (run in Supabase SQL Editor):**
```sql
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null check (role in ('survivor', 'authority')),
  lang_reading text, lang_speaking text, lang_listening text,
  legal_name text, nationality text, ic_passport text, age int, gender text,
  race text, religion text, address text, medical_conditions text, emergency_contacts jsonb,
  service_name text, location text, rank text, superior text, office_number text, working_hours text
);
alter table public.profiles enable row level security;
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create or replace function public.handle_new_user() returns trigger as $$
begin insert into public.profiles (id, role) values (new.id, 'survivor'); return new; end;
$$ language plpgsql security definer;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
```

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

# Scan QR code shown in terminal using mobile camera, then follow instructions in mobile to open the app in mobile

# Then run the app in pc terminal
npx expo start --dev-client
```

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
