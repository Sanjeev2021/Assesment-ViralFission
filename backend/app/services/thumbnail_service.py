"""
Thumbnail generation service.

Strategy (in order):
  1. OpenCV (cv2) — installed via opencv-python-headless; supports MP4, WebM,
     AVI, MOV and most formats backed by the bundled FFmpeg.
  2. imageio + imageio-ffmpeg — fallback if cv2 is unavailable.
  3. Pillow mock fallback — if the video is unreadable for any reason, generate
     branded placeholder images so the UI always has something to display.
"""

import uuid
import logging
from pathlib import Path
from typing import List, Tuple

import numpy as np
from PIL import Image, ImageDraw, ImageFont

from app.config import THUMBNAIL_DIR, THUMBNAIL_COUNT, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT

log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _save_path(filename: str) -> Path:
    return THUMBNAIL_DIR / filename


def _relative_url(filename: str) -> str:
    return f"/thumbnails/{filename}"


def _ndarray_to_jpeg(frame: np.ndarray) -> str:
    """Resize a NumPy RGB frame and save as JPEG; return its relative URL."""
    img = Image.fromarray(frame, "RGB")
    img = img.resize((THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT), Image.LANCZOS)
    filename = f"{uuid.uuid4().hex}.jpg"
    img.save(str(_save_path(filename)), "JPEG", quality=87)
    return _relative_url(filename)


# ---------------------------------------------------------------------------
# Primary extractor: OpenCV
# ---------------------------------------------------------------------------

def _extract_with_opencv(video_path: Path, count: int) -> List[Tuple[str, float]]:
    """
    Extract `count` evenly-spaced frames using OpenCV (cv2).
    Returns [(relative_url, timestamp_seconds), ...] or raises on failure.
    """
    import cv2  # opencv-python-headless

    cap = cv2.VideoCapture(str(video_path))
    try:
        if not cap.isOpened():
            raise RuntimeError(f"cv2 could not open: {video_path.name}")

        fps         = cap.get(cv2.CAP_PROP_FPS) or 25.0
        frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
        duration    = frame_count / fps if fps > 0 else 0.0

        if duration <= 0 or frame_count <= 0:
            raise RuntimeError("Could not determine video duration / frame count")

        results: List[Tuple[str, float]] = []
        for i in range(count):
            fraction = (i + 1) / (count + 1)   # evenly spaced, skip very start/end
            ts       = duration * fraction
            frame_no = min(int(fps * ts), int(frame_count) - 1)

            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_no)
            ret, frame = cap.read()
            if not ret:
                raise RuntimeError(f"Could not read frame {frame_no}")

            # cv2 returns BGR — convert to RGB for PIL
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            url = _ndarray_to_jpeg(frame_rgb)
            results.append((url, round(ts, 2)))

        return results
    finally:
        cap.release()


# ---------------------------------------------------------------------------
# Secondary extractor: imageio (ffmpeg plugin)
# ---------------------------------------------------------------------------

def _extract_with_imageio(video_path: Path, count: int) -> List[Tuple[str, float]]:
    """
    Extract `count` evenly-spaced frames using imageio's bundled FFmpeg.
    Returns [(relative_url, timestamp_seconds), ...] or raises on failure.
    """
    import imageio

    reader = imageio.get_reader(str(video_path), "ffmpeg")
    try:
        meta     = reader.get_meta_data()
        fps      = float(meta.get("fps") or 25)
        duration = float(meta.get("duration") or 0)
        nframes  = meta.get("nframes")

        if not nframes or nframes < 1:
            nframes = int(fps * duration) if duration > 0 else 0

        if nframes <= 0 or duration <= 0:
            raise RuntimeError("Could not determine video duration / frame count")

        results: List[Tuple[str, float]] = []
        for i in range(count):
            fraction = (i + 1) / (count + 1)
            ts       = duration * fraction
            frame_no = min(int(fps * ts), nframes - 1)

            try:
                frame = reader.get_data(frame_no)
            except Exception:
                frame = reader.get_data(max(0, frame_no - 1))

            if frame.ndim == 3 and frame.shape[2] == 4:
                frame = frame[:, :, :3]

            url = _ndarray_to_jpeg(frame)
            results.append((url, round(ts, 2)))

        return results
    finally:
        reader.close()


# ---------------------------------------------------------------------------
# Fallback: Pillow mock thumbnails
# ---------------------------------------------------------------------------

_MOCK_PALETTE = [
    (30, 41, 82),
    (22, 30, 60),
    (36, 18, 72),
    (18, 40, 76),
]


def _generate_mock(video_title: str, count: int) -> List[Tuple[str, float]]:
    """Generate branded placeholder images when real extraction is impossible."""
    results: List[Tuple[str, float]] = []
    for i in range(count):
        img  = Image.new("RGB", (THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT), color=_MOCK_PALETTE[i % len(_MOCK_PALETTE)])
        draw = ImageDraw.Draw(img)

        # subtle gradient darkening toward bottom
        overlay = Image.new("RGBA", (THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT), (0, 0, 0, 0))
        grad    = ImageDraw.Draw(overlay)
        for y in range(THUMBNAIL_HEIGHT):
            a = int(80 * y / THUMBNAIL_HEIGHT)
            grad.line([(0, y), (THUMBNAIL_WIDTH, y)], fill=(0, 0, 0, a))
        img.paste(Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB"))

        draw = ImageDraw.Draw(img)
        draw.rectangle([3, 3, THUMBNAIL_WIDTH - 4, THUMBNAIL_HEIGHT - 4],
                       outline=(255, 255, 255, 25), width=1)

        # play triangle
        cx, cy, r = THUMBNAIL_WIDTH // 2, THUMBNAIL_HEIGHT // 2, 20
        draw.polygon([(cx - r, cy - r), (cx - r, cy + r), (cx + r, cy)],
                     fill=(255, 255, 255))

        try:
            font = ImageFont.truetype("arial.ttf", 11)
        except Exception:
            font = ImageFont.load_default()

        draw.text((8, THUMBNAIL_HEIGHT - 20),
                  (video_title or "Video")[:24], fill=(200, 200, 200), font=font)

        filename = f"{uuid.uuid4().hex}.jpg"
        img.save(str(_save_path(filename)), "JPEG", quality=87)
        results.append((_relative_url(filename), round((i + 1) * 10.0, 2)))

    return results


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def generate_thumbnails(
    video_path: Path,
    video_title: str,
    count: int = THUMBNAIL_COUNT,
) -> List[Tuple[str, float]]:
    """
    Generate `count` thumbnails for the given video file.
    Returns [(relative_url, timestamp_seconds), ...].
    """
    # 1. Try OpenCV (preferred — installed via opencv-python-headless)
    try:
        results = _extract_with_opencv(video_path, count)
        if results:
            log.info("Generated %d real thumbnails (OpenCV) for '%s'",
                     len(results), video_title)
            return results
        log.warning("OpenCV returned no frames for '%s'.", video_path.name)
    except Exception as exc:
        log.warning("OpenCV extraction failed for '%s' (%s).", video_path.name, exc)

    # 2. Try imageio / FFmpeg
    try:
        results = _extract_with_imageio(video_path, count)
        if results:
            log.info("Generated %d real thumbnails (imageio/FFmpeg) for '%s'",
                     len(results), video_title)
            return results
        log.warning("imageio returned no frames for '%s'.", video_path.name)
    except Exception as exc:
        log.warning("imageio extraction failed for '%s' (%s).", video_path.name, exc)

    # 3. Mock fallback
    results = _generate_mock(video_title, count)
    log.info("Generated %d mock thumbnails for '%s'", len(results), video_title)
    return results
