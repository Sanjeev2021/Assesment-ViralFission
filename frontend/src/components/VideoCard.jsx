import { useNavigate } from 'react-router-dom'

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)   return 'just now'
  if (mins  < 60)  return `${mins}m ago`
  if (hours < 24)  return `${hours}h ago`
  if (days  < 30)  return `${days}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function VideoCard({ video }) {
  const navigate = useNavigate()
  const tags = video.tags ? video.tags.split(',').map(t => t.trim()).filter(Boolean) : []

  return (
    <div className="video-card" onClick={() => navigate(`/videos/${video.id}`)}>
      <div className="video-card-thumb">
        {video.primary_thumbnail
          ? <img src={video.primary_thumbnail.url} alt={video.title} loading="lazy" />
          : (
            <div className="video-card-thumb-placeholder">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" opacity="0.4">
                <path d="M5 3l14 9-14 9V3z" fill="currentColor" />
              </svg>
            </div>
          )
        }
        <div className="video-card-play-overlay">
          <div className="play-btn-circle">▶</div>
        </div>
      </div>

      <div className="video-card-body">
        <div className="video-card-title" title={video.title}>{video.title}</div>
        <div className="video-card-date">{timeAgo(video.created_at)}</div>
        {tags.length > 0 && (
          <div className="video-card-tags">
            {tags.slice(0, 3).map(tag => <span key={tag} className="tag">{tag}</span>)}
            {tags.length > 3 && <span className="tag" style={{ opacity: 0.6 }}>+{tags.length - 3}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
