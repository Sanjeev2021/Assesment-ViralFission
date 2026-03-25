from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import VideoOut, VideoListItem, ThumbnailOut, SelectThumbnailRequest
from app.services import video_service

router = APIRouter(prefix="/videos", tags=["videos"])


# POST /videos — upload a new video
@router.post("", response_model=VideoOut, status_code=201)
async def upload_video(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    from app.schemas import VideoCreate
    meta = VideoCreate(title=title, description=description, tags=tags)
    return await video_service.upload_video(db, file, meta)


# GET /videos — list videos with optional search & tag filter
@router.get("", response_model=List[VideoListItem])
def list_videos(
    search: Optional[str] = None,
    tag: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return video_service.list_videos(db, search=search, tag=tag)


# GET /videos/:id — video detail
@router.get("/{video_id}", response_model=VideoOut)
def get_video(video_id: str, db: Session = Depends(get_db)):
    return video_service.get_video(db, video_id)


# POST /videos/:id/thumbnails/generate
@router.post("/{video_id}/thumbnails/generate", response_model=List[ThumbnailOut])
def generate_thumbnails(video_id: str, db: Session = Depends(get_db)):
    return video_service.create_thumbnails(db, video_id)


# POST /videos/:id/thumbnails/select
@router.post("/{video_id}/thumbnails/select", response_model=VideoOut)
def select_thumbnail(
    video_id: str,
    body: SelectThumbnailRequest,
    db: Session = Depends(get_db),
):
    return video_service.select_thumbnail(db, video_id, body.thumbnail_id)
