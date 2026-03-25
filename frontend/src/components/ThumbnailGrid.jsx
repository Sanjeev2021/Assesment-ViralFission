export default function ThumbnailGrid({ thumbnails, primaryId, onSelect, loading }) {
  if (!thumbnails || thumbnails.length === 0) return null

  return (
    <div className="thumb-grid">
      {thumbnails.map(thumb => {
        const isPrimary  = thumb.id === primaryId
        return (
          <div
            key={thumb.id}
            className={`thumb-item ${isPrimary ? 'is-primary' : ''}`}
            onClick={() => !loading && onSelect(thumb.id)}
            title={isPrimary ? 'Primary thumbnail' : 'Click to set as primary'}
          >
            <img src={thumb.url} alt="thumbnail" loading="lazy" />

            {thumb.timestamp_seconds != null && (
              <span className="thumb-badge">{thumb.timestamp_seconds}s</span>
            )}
            {isPrimary && <span className="thumb-primary-badge">✓ Primary</span>}

            {!isPrimary && (
              <div className="thumb-click-overlay">Set primary</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
