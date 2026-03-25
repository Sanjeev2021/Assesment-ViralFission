import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

UPLOAD_DIR = BASE_DIR / "uploads"
THUMBNAIL_DIR = BASE_DIR / "thumbnails"
DATABASE_URL = f"sqlite:///{BASE_DIR}/gallery.db"

UPLOAD_DIR.mkdir(exist_ok=True)
THUMBNAIL_DIR.mkdir(exist_ok=True)

ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv"}
MAX_UPLOAD_SIZE_MB = 500

THUMBNAIL_COUNT = 4          # number of thumbnails to generate per video
THUMBNAIL_WIDTH = 320
THUMBNAIL_HEIGHT = 180
