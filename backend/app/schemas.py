from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


# ---------- Thumbnail ----------

class ThumbnailOut(BaseModel):
    id: str
    video_id: str
    url: str
    timestamp_seconds: Optional[float] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------- Video ----------

class VideoCreate(BaseModel):
    title: str
    description: Optional[str] = None
    tags: Optional[str] = None          # comma-separated


class VideoOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    tags: Optional[str] = None
    file_url: str
    file_name: str
    primary_thumbnail_id: Optional[str] = None
    created_at: datetime
    thumbnails: List[ThumbnailOut] = []
    primary_thumbnail: Optional[ThumbnailOut] = None

    model_config = {"from_attributes": True}


class VideoListItem(BaseModel):
    id: str
    title: str
    tags: Optional[str] = None
    file_url: str
    created_at: datetime
    primary_thumbnail: Optional[ThumbnailOut] = None

    model_config = {"from_attributes": True}


# ---------- Select thumbnail ----------

class SelectThumbnailRequest(BaseModel):
    thumbnail_id: str
