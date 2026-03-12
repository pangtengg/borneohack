# Dialect Tools Backend

## Setup

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Copy env:

```powershell
copy .env.example .env
```

Required in `.env`:

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `GOOGLE_APPLICATION_CREDENTIALS`
- `WHISPER_MODEL`
- `GHOST_CONFIDENCE_THRESHOLD`

Run:

```powershell
uvicorn main:app --reload --port 8000
```

Endpoints:

- `GET /health`
- `POST /api/process`
- `GET /api/phrasebank/list`
- `POST /api/phrasebank/upload`
