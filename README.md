# Thumbnail Generator & Video Gallery

A full-stack web app for uploading videos, generating/selecting thumbnails, and browsing a searchable gallery.

---

## Tech Stack

| Layer     | Technology |
|-----------|-----------|
| Backend   | Python 3.13 + FastAPI + Uvicorn |
| Database  | SQLite (via SQLAlchemy ORM) |
| Thumbnail | OpenCV (`opencv-python-headless`) + imageio-ffmpeg + Pillow mock fallback |
| Frontend  | React 19 + Vite 6 + React Router + Axios |

---

## Project Structure

```
Assesment/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, static mounts
│   │   ├── config.py        # Paths, constants
│   │   ├── database.py      # SQLAlchemy engine + session
│   │   ├── models.py        # ORM models (Video, Thumbnail)
│   │   ├── schemas.py       # Pydantic request/response schemas
│   │   ├── routes/
│   │   │   └── videos.py    # All API endpoints
│   │   └── services/
│   │       ├── video_service.py       # Upload, list, get, select logic
│   │       └── thumbnail_service.py  # OpenCV/Pillow generation
│   ├── uploads/             # Stored video files (auto-created)
│   ├── thumbnails/          # Generated thumbnail images (auto-created)
│   ├── venv/                # Python virtual environment
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/client.js    # Axios API calls
│   │   ├── components/
│   │   │   ├── VideoCard.jsx
│   │   │   └── ThumbnailGrid.jsx
│   │   ├── pages/
│   │   │   ├── GalleryPage.jsx
│   │   │   ├── UploadPage.jsx
│   │   │   └── VideoDetailPage.jsx
│   │   ├── App.jsx
│   │   └── index.css
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## How to Run

### 1. Backend

```bash
# From the project root (d:\Assesment)
cd backend
venv\Scripts\activate          # Windows — activates the Python venv
uvicorn app.main:app --reload --port 8000
```

The API will be live at **http://localhost:8000**
Interactive docs: **http://localhost:8000/docs**

### 2. Frontend

```bash
# In a separate terminal, from the project root
cd frontend
npm install          # only needed once
npm run dev
```

The UI will be live at **http://localhost:5173**

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/videos` | Upload video + metadata (multipart) |
| `GET`  | `/api/videos` | List videos (`?search=&tag=`) |
| `GET`  | `/api/videos/:id` | Get video detail with thumbnails |
| `POST` | `/api/videos/:id/thumbnails/generate` | Generate 4 thumbnails |
| `POST` | `/api/videos/:id/thumbnails/select` | Set primary thumbnail |
| `GET`  | `/uploads/<filename>` | Serve video file |
| `GET`  | `/thumbnails/<filename>` | Serve thumbnail image |

---

## Environment Variables

No `.env` file is required.
All paths default to the `backend/` directory.

To customise, edit `backend/app/config.py`:

```python
UPLOAD_DIR      # where video files are saved
THUMBNAIL_DIR   # where thumbnail JPEGs are saved
DATABASE_URL    # SQLite path (default: backend/gallery.db)
THUMBNAIL_COUNT # thumbnails generated per video (default: 4)
```

---

## Design Note

See **[DESIGN.md](DESIGN.md)** for architecture, schema, thumbnail approach, and trade-offs.
