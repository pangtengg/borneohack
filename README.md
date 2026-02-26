# 🌏 Disaster Voice Bridge — ASEAN Emergency Communication System

Real-time multilingual voice communication for disaster survivors and responders.
Built for the Disaster Resilience AI

---

## Architecture

```
Browser (React + TypeScript)
  ├── Web Speech API          → Speech-to-Text (browser-native, free)
  ├── Claude API              → Language detect + Translate + Tone rewrite
  ├── ElevenLabs Multilingual → Calm-authority TTS broadcast
  └── Geolocation API         → Auto language detection by GPS

Optional Backend (Node/Express)
  ├── POST /api/translate     → Proxies Claude API (keeps keys server-side)
  ├── POST /api/tts           → Proxies ElevenLabs API
  └── GET  /api/logs          → Emergency communication log
```

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Edit .env and add your Anthropic API key
# ElevenLabs key is pre-filled
```

### 3. Run frontend only (hackathon demo mode)
```bash
npm run dev
# Open http://localhost:5173
```

### 4. Run with backend (production mode)
```bash
npm run dev:full
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

---

## Features

### Implementation
- **Location-aware auto language detection** — GPS → ASEAN country → pre-loads language
- **Voice input** — Hold-to-speak via Web Speech API
- **AI translation pipeline** — Claude Sonnet detects language, translates, rewrites panicked tone
- **Calm-authority TTS** — ElevenLabs Multilingual V2 with stability=0.88
- **Bidirectional bridge** — Survivor ↔ Responder, swap button
- **Emergency phrase bank** — 12 one-tap phrases by category (medical/rescue/needs/location)
- **Panic detection** — Automatic flag + tone normalization
- **Dispatch-style UI** — Dual-pane chat + right-panel system log
- **Text fallback** — Type when voice unavailable
- **Session logging** — All messages logged with panic/emergency flags

### 🔧 ASEAN Languages Supported
🇵🇭 Filipino · 🇮🇩 Indonesian · 🇻🇳 Vietnamese · 🇹🇭 Thai  
🇲🇾 Malay · 🇲🇲 Burmese · 🇰🇭 Khmer · 🇱🇦 Lao · 🇨🇳 Mandarin

### 🗺️ Auto-Detected Regions
Philippines, Indonesia, Vietnam, Thailand, Malaysia, Myanmar, Cambodia, Laos, Singapore, Brunei

---

## Disaster Scenarios
- 🌊 **Floods** — Malaysia, Indonesia, Thailand
- 🌏 **Earthquakes** — Indonesia, Philippines
- 🌀 **Typhoons** — Philippines, Vietnam
- 🏨 **Cross-border tourism emergencies**
- 🏕️ **Evacuation centers**


