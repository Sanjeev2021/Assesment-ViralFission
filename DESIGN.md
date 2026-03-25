# Design Note — Thumbnail Generator & Video Gallery

## Overall Architecture

The app follows a classic **client–server** split with no shared code between layers:

```
Browser (React SPA)
    │  HTTP (proxied by Vite in dev)
    ▼
FastAPI (Python) — port 8000
    │  SQLAlchemy ORM
    ▼
SQLite (gallery.db)
    + Local disk storage (uploads/ + thumbnails/)
```

**Backend layers** mirror MVC without the V:

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Routes | `app/routes/videos.py` | HTTP interface, request parsing, status codes |
| Services | `app/services/video_service.py` | Business logic, DB queries, file I/O |
| Thumbnail | `app/services/thumbnail_service.py` | Frame extraction / mock generation |
| Models | `app/models.py` | ORM table definitions |
| Schemas | `app/schemas.py` | Pydantic validation & serialisation |

**Frontend layers:**

| Layer | Location | Responsibility |
|-------|----------|----------------|
| API client | `src/api/client.js` | All Axios calls, single source of truth for endpoints |
| Pages | `src/pages/` | Route-level components with local state |
| Components | `src/components/` | Reusable presentational pieces |

---

## Database Schema

```
videos
──────────────────────────────────────────────────
id                  TEXT  PK (UUID v4)
title               TEXT  NOT NULL
description         TEXT  nullable
tags                TEXT  nullable  -- comma-separated string
file_url            TEXT  NOT NULL  -- e.g. /uploads/abc.mp4
file_name           TEXT  NOT NULL  -- original filename
primary_thumbnail_id TEXT  FK → thumbnails.id  nullable
created_at          DATETIME

thumbnails
──────────────────────────────────────────────────
id                  TEXT  PK (UUID v4)
video_id            TEXT  FK → videos.id  NOT NULL
url                 TEXT  NOT NULL  -- e.g. /thumbnails/xyz.jpg
timestamp_seconds   REAL  nullable  -- frame position in video
created_at          DATETIME
```

Relationships:
- One video → many thumbnails (cascade delete)
- `primary_thumbnail_id` uses `post_update=True` to avoid circular FK insert ordering

Tags are stored as a plain comma-separated string rather than a join table; this is sufficient for the filtering requirement and avoids schema complexity for a small project.

---

## Thumbnail Generation

### Strategy (real extraction first, mock fallback)

1. **OpenCV** (`opencv-python-headless`) — primary extractor. Opens the video file via the bundled FFmpeg backend, seeks to N evenly-spaced timestamps (default 4, spread across 20–80% of duration to skip black frames at start/end), converts BGR→RGB, resizes to 320×180, and saves as JPEG.

2. **imageio + imageio-ffmpeg** — secondary fallback. If OpenCV cannot decode the file (e.g. certain WebM VP9 variants), imageio tries the same seek-and-extract approach using its own statically-linked FFmpeg binary.

3. **Pillow mock** — final fallback. If neither video library can read the file (e.g. audio-only upload, corrupt file), the service generates placeholder images: a dark background with a play-button triangle and the video title. This ensures the UI always has thumbnails to display.

The three-path design means the app is fully functional regardless of whether the uploaded file contains a decodable video stream.

---

## Search & Filtering

Filtering is implemented **server-side** via SQLAlchemy `.ilike()` query parameters (`?search=title&tag=value`). This scales naturally to larger datasets and avoids shipping the full video list to the client. The frontend submits a form, which triggers a fresh API call with the current filter values.

---

## Trade-offs & Shortcuts

| Decision | Reason |
|----------|--------|
| SQLite instead of Postgres | Zero-setup for local development; easily swapped via `DATABASE_URL` |
| Tags as comma string | No many-to-many join table needed; simpler schema for the scope |
| Local disk storage | Avoids S3/GCS credentials; swap `UPLOAD_DIR` and `THUMBNAIL_DIR` to object storage URLs |
| No authentication | Not required per spec; a middleware stub is straightforward to add |
| OpenCV headless + imageio-ffmpeg | Two independent FFmpeg-backed extractors maximise codec coverage; no system FFmpeg install required |
| Vite proxy for dev CORS | Avoids configuring separate CORS headers during development; production would serve both from the same origin or configure CORS explicitly |
| Auto-select first thumbnail | Improves UX so gallery cards always show an image immediately after upload |
