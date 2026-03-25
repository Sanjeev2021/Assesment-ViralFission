import uuid
import logging
from pathlib import Path
from typing import List, Optional

from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session

from app.config import UPLOAD_DIR, ALLOWED_VIDEO_EXTENSIONS
from app.models import Video, Thumbnail
from app.schemas import VideoCreate
from app.services.thumbnail_service import generate_thumbnails

log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _video_or_404(db: Session, video_id: str) -> Video:
    video = db.get(Video, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return video


# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------

async def upload_video(db: Session, file: UploadFile, meta: VideoCreate) -> Video:
    suffix = Path(file.filename or "video.mp4").suffix.lower()
    if suffix not in ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported file type '{suffix}'. Allowed: {', '.join(ALLOWED_VIDEO_EXTENSIONS)}",
        )

    video_id = str(uuid.uuid4())
    filename = f"{video_id}{suffix}"
    dest = UPLOAD_DIR / filename

    content = await file.read()
    dest.write_bytes(content)

    video = Video(
        id=video_id,
        title=meta.title,
        description=meta.description,
        tags=meta.tags,
        file_url=f"/uploads/{filename}",
        file_name=file.filename or filename,
    )
    db.add(video)
    db.commit()
    db.refresh(video)
    log.info("Uploaded video id=%s title='%s'", video_id, meta.title)
    return video


# ---------------------------------------------------------------------------
# List / Get
# ---------------------------------------------------------------------------

def list_videos(
    db: Session,
    search: Optional[str] = None,
    tag: Optional[str] = None,
) -> List[Video]:
    query = db.query(Video)
    if search:
        query = query.filter(Video.title.ilike(f"%{search}%"))
    if tag:
        query = query.filter(Video.tags.ilike(f"%{tag}%"))
    return query.order_by(Video.created_at.desc()).all()


def get_video(db: Session, video_id: str) -> Video:
    return _video_or_404(db, video_id)


# ---------------------------------------------------------------------------
# Thumbnail generation
# ---------------------------------------------------------------------------

def create_thumbnails(db: Session, video_id: str) -> List[Thumbnail]:
    video = _video_or_404(db, video_id)
    video_path = UPLOAD_DIR / Path(video.file_url).name

    pairs = generate_thumbnails(video_path, video.title)

    thumbnails: List[Thumbnail] = []
    for url, ts in pairs:
        thumb = Thumbnail(video_id=video_id, url=url, timestamp_seconds=ts)
        db.add(thumb)
        thumbnails.append(thumb)

    db.commit()
    for t in thumbnails:
        db.refresh(t)

    # Auto-select first thumbnail as primary if none set yet
    if not video.primary_thumbnail_id and thumbnails:
        video.primary_thumbnail_id = thumbnails[0].id
        db.commit()

    log.info("Created %d thumbnails for video id=%s", len(thumbnails), video_id)
    return thumbnails


# ---------------------------------------------------------------------------
# Thumbnail selection
# ---------------------------------------------------------------------------

def select_thumbnail(db: Session, video_id: str, thumbnail_id: str) -> Video:
    video = _video_or_404(db, video_id)

    thumb = db.get(Thumbnail, thumbnail_id)
    if not thumb or thumb.video_id != video_id:
        raise HTTPException(status_code=404, detail="Thumbnail not found for this video")

    video.primary_thumbnail_id = thumbnail_id
    db.commit()
    db.refresh(video)
    log.info("Selected thumbnail id=%s for video id=%s", thumbnail_id, video_id)
    return video
