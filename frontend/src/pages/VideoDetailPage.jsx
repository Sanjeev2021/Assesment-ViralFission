import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getVideo, generateThumbnails, selectThumbnail } from '../api/client'
import ThumbnailGrid from '../components/ThumbnailGrid'

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function VideoDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [video,   setVideo]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const [generatingThumbs, setGeneratingThumbs] = useState(false)
  const [thumbMsg,         setThumbMsg]         = useState(null)
  const [selectingId,      setSelectingId]      = useState(null)

  async function loadVideo() {
    setLoading(true); setError(null)
    try {
      const { data } = await getVideo(id)
      setVideo(data)
    } catch {
      setError('Video not found.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadVideo() }, [id])

  async function handleGenerateThumbs() {
    setGeneratingThumbs(true); setThumbMsg(null)
    try {
      await generateThumbnails(id)
      const { data } = await getVideo(id)
      setVideo(data)
      setThumbMsg({ type: 'success', text: 'Thumbnails regenerated successfully.' })
    } catch {
      setThumbMsg({ type: 'error', text: 'Failed to generate thumbnails.' })
    } finally {
      setGeneratingThumbs(false)
    }
  }

  async function handleSelectThumbnail(thumbId) {
    if (selectingId) return
    setSelectingId(thumbId)
    try {
      const { data } = await selectThumbnail(id, thumbId)
      setVideo(data)
    } catch { /* non-fatal */ }
    finally { setSelectingId(null) }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="empty-state">
          <span className="spinner spinner-lg" />
          <div style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>Loading video…</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-ghost" onClick={() => navigate('/')}>← Back to Gallery</button>
      </div>
    )
  }

  const tags = video.tags
    ? video.tags.split(',').map(t => t.trim()).filter(Boolean)
    : []

  return (
    <div className="page">
      {/* Back */}
      <button
        className="btn btn-ghost btn-sm"
        style={{ marginBottom: '1.5rem' }}
        onClick={() => navigate('/')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Back to Gallery
      </button>

      <div className="detail-layout">
        {/* Left column */}
        <div>
          {/* Player */}
          <div className="video-player-wrap">
            <video
              controls
              preload="metadata"
              key={video.file_url}
              style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '480px', background: '#000' }}
            >
              <source src={video.file_url} type={
                video.file_name?.endsWith('.webm') ? 'video/webm' :
                video.file_name?.endsWith('.mp4')  ? 'video/mp4'  :
                video.file_name?.endsWith('.ogg')  ? 'video/ogg'  :
                undefined
              } />
              Your browser does not support video playback.
            </video>
          </div>

          {/* Thumbnail section */}
          <div className="panel" style={{ marginTop: '1.5rem' }}>
            <div className="panel-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><path d="m9 9 6 3-6 3V9z" fill="currentColor"/></svg>
              Thumbnails
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginLeft: 'auto' }}
                onClick={handleGenerateThumbs}
                disabled={generatingThumbs}
              >
                {generatingThumbs
                  ? <><span className="spinner" /> Generating…</>
                  : <>↻ Regenerate</>}
              </button>
            </div>

            {thumbMsg && (
              <div className={`alert alert-${thumbMsg.type}`} style={{ marginBottom: '0.75rem' }}>
                {thumbMsg.text}
              </div>
            )}

            {video.thumbnails.length === 0 ? (
              <div style={{ color: 'var(--text-3)', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem' }}>
                No thumbnails yet — click Regenerate to create them.
              </div>
            ) : (
              <>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: '0.85rem' }}>
                  Click a thumbnail to set it as the primary image shown in the gallery.
                </p>
                <ThumbnailGrid
                  thumbnails={video.thumbnails}
                  primaryId={video.primary_thumbnail_id}
                  onSelect={handleSelectThumbnail}
                  loading={!!selectingId}
                />
              </>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="detail-sidebar">
          <div className="panel">
            <h1 className="detail-title">{video.title}</h1>
            <div className="detail-date">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              {formatDate(video.created_at)}
            </div>

            {video.description && (
              <p className="detail-desc" style={{ marginTop: '1rem' }}>{video.description}</p>
            )}

            {tags.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div className="panel-title" style={{ marginBottom: '0.6rem' }}>Tags</div>
                <div className="detail-tags">
                  {tags.map(t => <span key={t} className="tag">{t}</span>)}
                </div>
              </div>
            )}

            <div className="divider" />

            {/* File info */}
            <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0' }}>
                <span>File name</span>
                <span style={{ color: 'var(--text-2)', wordBreak: 'break-all', textAlign: 'right', maxWidth: '60%' }}>
                  {video.file_name}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0' }}>
                <span>Thumbnails</span>
                <span style={{ color: 'var(--text-2)' }}>{video.thumbnails.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
