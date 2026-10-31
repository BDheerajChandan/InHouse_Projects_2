import Breadcrumbs from './Breadcrumbs.jsx'
import { GALLERY_CONFIG } from '../config/galleryConfig'

export default function GalleryHeader({ query, onQuery, crumbs, onNavigate }) {
  return (
    <header className="header">
      <div className="container header__inner">
        <div className="header__row">
          <button type="button" className="brand" onClick={() => onNavigate('')} aria-label="Home">
            <span aria-hidden="true">🖼️</span>
            <span className="brand__title">{GALLERY_CONFIG.title}</span>
          </button>
          <div className="search">
            <label className="sr-only" htmlFor="search">Search gallery</label>
            <input
              id="search"
              type="search"
              value={query}
              placeholder="Search folders, files, extensions…"
              onChange={(e) => onQuery(e.target.value)}
            />
          </div>
        </div>
        <Breadcrumbs crumbs={crumbs} onNavigate={onNavigate} />
      </div>
    </header>
  )
}