import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


def _uuid():
    return str(uuid.uuid4())


class Video(Base):
    __tablename__ = "videos"

    id = Column(String, primary_key=True, default=_uuid)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    tags = Column(Text, nullable=True)          # comma-separated string
    file_url = Column(String, nullable=False)   # relative URL served by static
    file_name = Column(String, nullable=False)  # original filename
    primary_thumbnail_id = Column(String, ForeignKey("thumbnails.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    thumbnails = relationship(
        "Thumbnail",
        back_populates="video",
        foreign_keys="Thumbnail.video_id",
        cascade="all, delete-orphan",
    )
    primary_thumbnail = relationship(
        "Thumbnail",
        foreign_keys=[primary_thumbnail_id],
        post_update=True,
    )


class Thumbnail(Base):
    __tablename__ = "thumbnails"

    id = Column(String, primary_key=True, default=_uuid)
    video_id = Column(String, ForeignKey("videos.id"), nullable=False)
    url = Column(String, nullable=False)                # relative URL
    timestamp_seconds = Column(Float, nullable=True)    # source frame position
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    video = relationship("Video", back_populates="thumbnails", foreign_keys=[video_id])
