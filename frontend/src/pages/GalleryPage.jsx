import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { listVideos } from '../api/client'
import VideoCard from '../components/VideoCard'

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-thumb" />
      <div className="skeleton-body">
        <div className="skeleton skeleton-line" style={{ width: '80%' }} />
        <div className="skeleton skeleton-line-sm" />
        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
          <div className="skeleton skeleton-line" style={{ width: 44, height: 18, borderRadius: 99 }} />
          <div className="skeleton skeleton-line" style={{ width: 52, height: 18, borderRadius: 99 }} />
        </div>
      </div>
    </div>
  )
}

export default function GalleryPage() {
  const navigate = useNavigate()
  const [videos,   setVideos]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const [searchInput, setSearchInput] = useState('')
  const [tagInput,    setTagInput]    = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [appliedTag,    setAppliedTag]    = useState('')

  const searchRef = useRef()

  const fetchVideos = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = {}
      if (appliedSearch) params.search = appliedSearch
      if (appliedTag)    params.tag    = appliedTag
      const { data } = await listVideos(params)
      setVideos(data)
    } catch {
      setError('Failed to load videos. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }, [appliedSearch, appliedTag])

  useEffect(() => { fetchVideos() }, [fetchVideos])

  function handleSearch(e) {
    e.preventDefault()
    setAppliedSearch(searchInput.trim())
    setAppliedTag(tagInput.trim())
  }

  function clearFilters() {
    setSearchInput(''); setTagInput('')
    setAppliedSearch(''); setAppliedTag('')
  }

  const hasFilter = appliedSearch || appliedTag
  const isFiltering = searchInput || tagInput

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">Video Gallery</h1>
          {!loading && (
            <p className="page-subtitle">
              {hasFilter
                ? `${videos.length} result${videos.length !== 1 ? 's' : ''} for "${appliedSearch || appliedTag}"`
                : `${videos.length} video${videos.length !== 1 ? 's' : ''}`}
            </p>
          )}
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/upload')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
          Upload Video
        </button>
      </div>

      {/* Search bar */}
      <form className="search-bar" onSubmit={handleSearch}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, color: 'var(--text-3)', alignSelf: 'center' }}>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
          <path d="m16.5 16.5 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <input
          ref={searchRef}
          className="form-input"
          style={{ flex: 2 }}
          type="text"
          placeholder="Search by title…"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
        />
        <div className="search-divider" />
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, color: 'var(--text-3)', alignSelf: 'center' }}>
          <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <input
          className="form-input"
          style={{ flex: 1 }}
          type="text"
          placeholder="Filter by tag…"
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={!isFiltering && !hasFilter}>
          Search
        </button>
        {hasFilter && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>
            ✕ Clear
          </button>
        )}
      </form>

      {/* Error */}
      {error && (
        <div className="alert alert-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          {error}
        </div>
      )}

      {/* Skeletons while loading */}
      {loading && (
        <div className="gallery-grid">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && videos.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🎬</div>
          <div className="empty-state-title">
            {hasFilter ? 'No videos match your search' : 'No videos yet'}
          </div>
          <div className="empty-state-sub">
            {hasFilter
              ? 'Try a different title or tag.'
              : 'Upload your first video to get started.'}
          </div>
          {!hasFilter && (
            <button className="btn btn-primary" style={{ marginTop: '0.5rem' }} onClick={() => navigate('/upload')}>
              Upload Video
            </button>
          )}
          {hasFilter && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear filters</button>
          )}
        </div>
      )}

      {/* Grid */}
      {!loading && !error && videos.length > 0 && (
        <div className="gallery-grid">
          {videos.map(v => <VideoCard key={v.id} video={v} />)}
        </div>
      )}
    </div>
  )
}
