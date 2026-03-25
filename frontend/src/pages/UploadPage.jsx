import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadVideo, generateThumbnails, selectThumbnail } from '../api/client'
import ThumbnailGrid from '../components/ThumbnailGrid'

// step: 'form' | 'uploading' | 'thumbnails' | 'done'

function StepIndicator({ step }) {
  const steps = [
    { id: 'form',       label: 'Details' },
    { id: 'uploading',  label: 'Upload' },
    { id: 'thumbnails', label: 'Thumbnail' },
  ]
  const idx = steps.findIndex(s => s.id === step)
  return (
    <div className="step-row">
      {steps.map((s, i) => (
        <div key={s.id} className={`step ${i === idx ? 'active' : ''} ${i < idx ? 'done' : ''}`}>
          <div className="step-dot">
            {i < idx ? '✓' : i + 1}
          </div>
          <span className="step-label">{s.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function UploadPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef()

  const [step, setStep] = useState('form')

  // form fields
  const [file,        setFile]        = useState(null)
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [tags,        setTags]        = useState('')
  const [dragging,    setDragging]    = useState(false)

  // upload state
  const [progress, setProgress] = useState(0)
  const [error,    setError]    = useState(null)

  // post-upload
  const [videoId,    setVideoId]    = useState(null)
  const [thumbnails, setThumbnails] = useState([])
  const [primaryId,  setPrimaryId]  = useState(null)
  const [selectingId, setSelectingId] = useState(null)
  const [thumbError,  setThumbError]  = useState(null)

  function handleFilePick(e) {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }
  function handleDrop(e) {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer?.files?.[0]
    if (f) setFile(f)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file)         { setError('Please select a video file.'); return }
    if (!title.trim()) { setError('Title is required.'); return }
    setError(null)
    setStep('uploading')
    setProgress(0)

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', title.trim())
      if (description.trim()) fd.append('description', description.trim())
      if (tags.trim())        fd.append('tags', tags.trim())

      const { data: video } = await uploadVideo(fd, setProgress)
      setVideoId(video.id)
      setStep('thumbnails')

      // auto-generate
      try {
        const { data: thumbs } = await generateThumbnails(video.id)
        setThumbnails(thumbs)
        if (thumbs.length) setPrimaryId(thumbs[0].id)
      } catch {
        setThumbError('Thumbnail generation failed — you can retry from the detail page.')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.')
      setStep('form')
    }
  }

  async function handleSelectThumbnail(thumbId) {
    if (selectingId) return
    setSelectingId(thumbId)
    try {
      await selectThumbnail(videoId, thumbId)
      setPrimaryId(thumbId)
    } catch { /* non-fatal */ }
    finally { setSelectingId(null) }
  }

  // ---- Render: uploading ----
  if (step === 'uploading') {
    return (
      <div className="page" style={{ maxWidth: 540 }}>
        <StepIndicator step="uploading" />
        <div className="panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <span className="spinner spinner-lg" />
          </div>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>
            Uploading…
          </div>
          <div style={{ color: 'var(--text-2)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {file?.name}
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '0.5rem' }}>{progress}%</div>
        </div>
      </div>
    )
  }

  // ---- Render: thumbnails ----
  if (step === 'thumbnails') {
    const isLoading = thumbnails.length === 0 && !thumbError

    return (
      <div className="page" style={{ maxWidth: 700 }}>
        <StepIndicator step="thumbnails" />

        <div style={{ marginBottom: '1.5rem' }}>
          <h1 className="page-title">Choose a Thumbnail</h1>
          <p className="page-subtitle">Click a thumbnail to set it as the primary image for the gallery.</p>
        </div>

        {thumbError && (
          <div className="alert alert-warning">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {thumbError}
          </div>
        )}

        {isLoading ? (
          <div className="panel" style={{ textAlign: 'center', padding: '3rem' }}>
            <span className="spinner spinner-lg" style={{ marginBottom: '1rem' }} />
            <div style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>Generating thumbnails…</div>
          </div>
        ) : (
          <div className="panel">
            <ThumbnailGrid
              thumbnails={thumbnails}
              primaryId={primaryId}
              onSelect={handleSelectThumbnail}
              loading={!!selectingId}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate(`/videos/${videoId}`)}>
            View Video
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/')}>
            Back to Gallery
          </button>
        </div>
      </div>
    )
  }

  // ---- Render: form ----
  return (
    <div className="page" style={{ maxWidth: 560 }}>
      <StepIndicator step="form" />

      <div className="page-header">
        <h1 className="page-title">Upload a Video</h1>
        <p className="page-subtitle">Fill in the details and choose a file to upload.</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Drop zone */}
        <div className="form-group">
          <label className="form-label">Video File</label>
          <div
            className={`drop-zone ${dragging ? 'over' : ''} ${file ? 'has-file' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            {file ? (
              <>
                <span className="drop-zone-icon">✅</span>
                <div className="drop-zone-text">{file.name}</div>
                <div className="drop-zone-sub">{(file.size / 1024 / 1024).toFixed(1)} MB · Click to change</div>
              </>
            ) : (
              <>
                <span className="drop-zone-icon">📁</span>
                <div className="drop-zone-text">Click or drag & drop your video</div>
                <div className="drop-zone-sub">MP4, WebM, MOV, AVI, MKV — up to 500 MB</div>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              style={{ display: 'none' }}
              onChange={handleFilePick}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Title <span style={{ color: 'var(--red)' }}>*</span></label>
          <input
            className="form-input"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Give your video a title"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-textarea"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What's this video about? (optional)"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Tags</label>
          <input
            className="form-input"
            type="text"
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="e.g. nature, timelapse, 4k"
          />
          <span className="form-hint">Separate tags with commas</span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={!file || !title.trim()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Upload Video
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
