import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import UPLOAD_DIR, THUMBNAIL_DIR
from app.database import engine
from app import models  
from app.routes.videos import router as video_router

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all DB tables on startup
    models.Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Sanjeev's Video Gallery API",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow the React dev server (port 5173) and any origin in dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded videos and generated thumbnails as static files
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
app.mount("/thumbnails", StaticFiles(directory=str(THUMBNAIL_DIR)), name="thumbnails")

app.include_router(video_router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
