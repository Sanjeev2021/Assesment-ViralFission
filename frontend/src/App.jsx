import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import GalleryPage from './pages/GalleryPage'
import UploadPage from './pages/UploadPage'
import VideoDetailPage from './pages/VideoDetailPage'

function NavBar() {
  return (
    <nav className="navbar">
      <span className="navbar-brand">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="6" fill="url(#lg)" />
          <polygon points="10,8 10,16 17,12" fill="white" />
          <defs>
            <linearGradient id="lg" x1="0" y1="0" x2="24" y2="24">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
        VideoGallery
      </span>
      <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
        Gallery
      </NavLink>
      <NavLink to="/upload" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
        Upload
      </NavLink>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/"           element={<GalleryPage />} />
        <Route path="/upload"     element={<UploadPage />} />
        <Route path="/videos/:id" element={<VideoDetailPage />} />
      </Routes>
    </BrowserRouter>
  )
}
