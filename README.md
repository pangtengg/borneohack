# VoiceBridge 🌏

> **Real-Time Multilingual Voice Bridge for Disaster Response in Southeast Asia**
> Built for BorneoHack — SDG 11 · SDG 10 · SDG 17
- Report Goodle Drive: 
- Demo Video:
- Github: https://github.com/pangtengg/borneohack
  
---

## Why VoiceBridge?

**ASEAN faces 600+ languages and dialects.** When disaster strikes—floods, earthquakes, typhoons—a survivor in Borneo speaking Murut or Bajau cannot tell a Thai or Indonesian rescuer *"I need medical help"* or *"My children are trapped."* Every second of miscommunication costs lives.

VoiceBridge breaks the language barrier: speak in your language → hear the rescuer’s reply in theirs. Zero setup. Works in panic mode.

---

## Core Features (Hackathon Highlights)

| Feature | What it does |
|--------|---------------|
| **🗣️ Real-time voice translation** | Speak → Groq STT → Google Translate → ElevenLabs TTS. Survivor hears a **calm, authoritative voice** even if they’re panicking—tone drives compliance. |
| **🌍 14 SE Asian languages** | Malay, Indonesian, Thai, Vietnamese, Filipino, Burmese, Khmer, Lao, and more. GPS auto-detects local language—no menu in a crisis. |
| **📋 AI-guided Report** | Chat with Groq LLM: one question at a time (location, disaster type, severity, injuries, needs). Submits structured report to authorities. |
| **🔊 Quick phrases** | Tap pre-translated phrases: “I am trapped,” “I need medical help,” “Where is the evacuation point?” Instant playback. |
| **📡 Broadcasts** | Authorities create alerts; survivors see them in Broadcast. Stored in Supabase, managed from Authority dashboard. |
| **💬 Convo** | WhatsApp-style messaging between survivor and authority. Supabase Realtime. |
| **👤 Survivor Profile** | Collects personal info at signup: name, phone, age, gender, nationality, address, medical conditions, emergency contacts. Auto-attached to every report so authorities have full context. |
| **🌐 Live UI translation** | Change preferred language → entire survivor UI translates instantly via Google Translate. Same language drives STT, TTS, and AI report chat. |
| **📱 Role-based** | Survivor (sign up) vs Authority (login). Three-table schema: `profiles` (parent), `survivor_profiles`, `authority_profiles`. |

---

## How It Improves ASEAN Disaster Resilience

- **Overcomes language barriers** — Migrant workers, ethnic minorities, and tourists can communicate with local rescuers.
- **Location-aware** — GPS picks the dominant local language; no setup during panic.
- **Stress-adaptive voice** — Panicked speech → calm output. Rescuers get clear instructions.
- **Cross-border ready** — Works across ASEAN: Malaysian floods, Thai earthquakes, Philippine typhoons.
- **Structured reports** — AI guides survivors to provide location, severity, injuries, needs. Survivor profile (age, medical, contacts) auto-attached. Authorities get actionable data.
- **Language-adaptive UI** — Set preferred language once; the entire app, AI chat, STT, and TTS all adapt. ElevenLabs selects the best voice per language.

---

## Architecture

```
[Expo App] ──► POST /api/translate ──► [Groq STT] ──► [Google Translate] ──► [ElevenLabs TTS]
    │                                                                                   │
    │── GPS coords ──► SE Asia language map (offline)                                   │
    └─────────────────────────────── base64 MP3 audio ◄─────────────────────────────────┘

[UI i18n]  ──► POST /api/translate-text ──► [Google Translate] ──► cached translated UI strings
[Report]   ──► POST /api/report-chat ──► [Groq LLM] + survivor_info auto-attached on submit
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
| Translation | Google Cloud Translate v2 (voice + UI i18n) |
| Text-to-Speech | ElevenLabs Multilingual v2 (voice auto-selected per language) |
| Report Chat | Groq (Llama) |
| Location | `expo-location` (GPS) |

---

## Setup (Quick Start)

**Order:** 1) Supabase ✓ → 2) Backend server → 3) App → 4) Server URL

### Setup now (Supabase already done)

1. **Backend:** `cd server` → `npm install` → `cp .env.example .env` → fill API keys → `npm run dev`
2. **App:** `npm install` → `npx expo start` → press `a` or `i`
3. **Server URL:** For Wi‑Fi, add `EXPO_PUBLIC_SERVER_URL=http://YOUR_LAPTOP_IP:3001` to root `.env`

### 1. Supabase (if not done)

1. Create project at [supabase.com](https://supabase.com)
2. Run **Profiles SQL**, **Survivor profiles SQL**, and **Authority profiles SQL** (see below)
3. Run migrations 001–007 in order (SQL Editor)
4. Set `supabaseUrl` and `supabaseAnonKey` in `app.json` → `extra`
5. Authority users: create in Auth, add row to `authority_profiles`

**Profiles (parent table — stores role + shared fields):**
```sql
create table public.profiles (
  id uuid not null,
  role text not null,
  preferred_language text not null default 'en',
  created_at timestamptz null default now(),
  updated_at timestamptz null default now(),
  legal_name text null,
  nationality text null,
  ic_passport text null,
  age integer null,
  gender text null,
  race text null,
  religion text null,
  address text null,
  medical_conditions text null,
  emergency_contacts jsonb null,
  phone_number text null,
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign key (id) references auth.users (id) on delete cascade,
  constraint profiles_role_check check (role = any (array['survivor','authority']))
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

**Survivor profiles (extends profiles for survivors):**
```sql
create table public.survivor_profiles (
  id uuid not null,
  display_name text not null,
  created_at timestamptz null default now(),
  preferred_language text null default 'en',
  constraint survivor_profiles_pkey primary key (id),
  constraint survivor_profiles_id_fkey foreign key (id) references public.profiles (id) on delete cascade
);
alter table public.survivor_profiles enable row level security;
create policy "Survivors read own" on public.survivor_profiles for select using (auth.uid() = id);
create policy "Survivors update own" on public.survivor_profiles for update using (auth.uid() = id);
create policy "Survivors insert own" on public.survivor_profiles for insert with check (auth.uid() = id);
create or replace function public.handle_new_survivor() returns trigger as $$
begin
  if not exists (select 1 from public.authority_profiles where id = new.id) then
    insert into public.survivor_profiles (id, display_name, preferred_language) values (new.id, 'Survivor', 'en')
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;
create trigger on_profile_created after insert on public.profiles for each row execute procedure public.handle_new_survivor();
```

**Authority profiles (extends profiles for authorities):**
```sql
create table public.authority_profiles (
  id uuid not null,
  full_name text not null,
  service_name text not null,
  rank text null,
  office_location text null,
  superior_name text null,
  superior_contact text null,
  office_number text null,
  working_hours text null,
  staff_id text null,
  created_at timestamptz null default now(),
  constraint authority_profiles_pkey primary key (id),
  constraint authority_profiles_staff_id_key unique (staff_id),
  constraint authority_profiles_id_fkey foreign key (id) references public.profiles (id) on delete cascade
);
alter table public.authority_profiles enable row level security;
create policy "Authority read own" on public.authority_profiles for select using (auth.uid() = id);
create policy "Authority update own" on public.authority_profiles for update using (auth.uid() = id);
create policy "Authority insert own" on public.authority_profiles for insert with check (auth.uid() = id);
```

**Migrations (run in order):** 001 → 002 → 003 → 004 → 005 → 006 → 007 → 008

### 2. Backend (Node server)

```bash
cd server
npm install
cp .env.example .env
# Edit .env: GROQ_API_KEY, GOOGLE_TRANSLATE_API_KEY, ELEVENLABS_API_KEY, PORT=3001
# ELEVENLABS_VOICE_ID is optional (fallback); voices are auto-selected per language
npm run dev
```

### 3. Mobile app

```bash
npm install
npx expo start
```

Press `a` (Android) or `i` (iOS).

### 4. Server URL

- **USB:** `adb reverse tcp:3001 tcp:3001` → use `http://localhost:3001` (in `app.json` extra)
- **Wi‑Fi:** Add `EXPO_PUBLIC_SERVER_URL=http://YOUR_LAPTOP_IP:3001` to root `.env`

### Backend env (server/.env)

```env
GROQ_API_KEY=gsk-...
GOOGLE_TRANSLATE_API_KEY=AIza...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
PORT=3001
```

---

## Optional: Dialect Tools Backend (Python)

The `backend/` folder is a **separate Python service** for dialect/ghost phrase processing. The main app uses the Node `server/` for translate, Report chat, and TTS. Use this only if you need `/api/process` and `/api/phrasebank/*`.

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# Required: SUPABASE_URL, SUPABASE_KEY, GOOGLE_APPLICATION_CREDENTIALS, WHISPER_MODEL, GHOST_CONFIDENCE_THRESHOLD
uvicorn main:app --reload --port 8000
```

Endpoints: `GET /health`, `POST /api/process`, `GET /api/phrasebank/list`, `POST /api/phrasebank/upload`.

---

## Project Structure

```
borneohack/
├── app/                    # Expo Router app
│   ├── (survivor)/         # Report, Convo, Broadcast, Profile, Settings
│   └── (authority)/        # Dashboard (reports, broadcast management)
├── server/                 # Node.js backend (translate, report-chat, tts, phrase, translate-text)
├── backend/                # Optional Python dialect tools
├── lib/                    # supabase, api, auth, store, i18n
└── constants/              # colors, languages, phrases
```

---

## SDG Impact

| Goal | Impact |
|------|--------|
| **SDG 11** | Improves disaster resilience for SE Asian cities |
| **SDG 10** | Removes language barriers for migrants and minorities |
| **SDG 17** | Enables cross-border ASEAN disaster relief |

---

## How to Demo (for Judges)

1. **Sign up** as Survivor → fill in personal info (name, phone, age, gender, nationality, address, medical conditions, emergency contact) and set preferred language
2. **Profile** → change **preferred language** → watch the entire UI translate live (e.g. switch to Malay and all labels change)
3. **Report** → AI greets you in your preferred language; chat with AI, use mic for voice input (STT), answer location/disaster/severity, submit → your personal info is auto-attached for authorities
4. **Report inbox** → see past reports in email-inbox style with AI-generated titles and dates
5. **TTS** → tap speaker icon on any AI message → hear it spoken in your language (voice auto-selected per language by ElevenLabs)
6. **Broadcast** → view alerts (authorities create from dashboard)
7. **Convo** → message with authority (if available)

---

## AI Disclosure

- **Groq (Llama 3.3 70B)** — AI-guided Report chat (structured emergency Q&A)
- **Groq (Whisper)** — Speech-to-Text for voice translation
- **Google Cloud Translate v2** — Text translation (voice pipeline) + dynamic UI i18n (entire survivor UI translates when reading language changes)
- **ElevenLabs Multilingual v2** — Text-to-Speech with voice auto-selected per language (10 voices mapped to 10 ASEAN languages)
- **GPS + preferred language** — Inform language selection; single preferred language drives UI, STT, TTS, and AI chat

---

*Built for BorneoHack. Disaster resilience is everyone's responsibility.*
