from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.phrasebank import router as phrasebank_router
from routers.process import router as process_router

app = FastAPI(title="Dialect Tools API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(process_router)
app.include_router(phrasebank_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
