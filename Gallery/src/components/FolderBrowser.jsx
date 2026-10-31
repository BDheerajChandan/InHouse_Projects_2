import { useMemo, useState } from 'react'
import GalleryCard from './GalleryCard.jsx'
import MediaCard from './MediaCard.jsx'
import { EmptyState } from './States.jsx'
import { gallery } from '../services/galleryService'
import { GALLERY_CONFIG } from '../config/galleryConfig'
import { describeTotal, naturalCompare, prettyName, sumSizes } from '../utils/mediaHelpers'

const PAGE = GALLERY_CONFIG.pageSize

export default function FolderBrowser({
  node,
  query,
  info,
  onClearQuery,
  onOpenFolder,
  onPreview,
  onDownloadFile,
  onDownloadFolder,
}) {
  const [typeFilter, setTypeFilter] = useState('all')
  const [extFilter, setExtFilter] = useState('all')
  const [sort, setSort] = useState(GALLERY_CONFIG.defaultSort)
  const [view, setView] = useState('grid')
  const [page, setPage] = useState({ key: '', n: PAGE })

  const q = query.trim().toLowerCase()
  const isRoot = node.path === ''
  const scope = q ? node.all : node.files
  const exts = useMemo(() => [...new Set(scope.map((f) => f.ext))].sort(), [scope])
  const ext = exts.includes(extFilter) ? extFilter : 'all'
  const hasDates = scope.some((f) => info[f.url]?.modified)
  const effectiveSort = !hasDates && sort.startsWith('date') ? 'name-asc' : sort

  const files = useMemo(() => {
    const num = (f, k) => info[f.url]?.[k] ?? -1
    const sorters = {
      'name-asc': (a, b) => naturalCompare(a.name, b.name),
      'name-desc': (a, b) => naturalCompare(b.name, a.name),
      'size-asc': (a, b) => num(a, 'size') - num(b, 'size'),
      'size-desc': (a, b) => num(b, 'size') - num(a, 'size'),
      type: (a, b) => a.ext.localeCompare(b.ext) || naturalCompare(a.name, b.name),
      'date-asc': (a, b) => num(a, 'modified') - num(b, 'modified'),
      'date-desc': (a, b) => num(b, 'modified') - num(a, 'modified'),
    }
    return scope
      .filter(
        (f) =>
          (typeFilter === 'all' || f.type === typeFilter) &&
          (ext === 'all' || f.ext === ext) &&
          (!q || `${f.path} ${f.ext}`.toLowerCase().includes(q)),
      )
      .sort(sorters[effectiveSort])
  }, [scope, q, typeFilter, ext, effectiveSort, info])

  const folders = useMemo(() => {
    const base = q
      ? [...gallery.index.values()].filter(
          (f) =>
            f.path &&
            f.path !== node.path &&
            (isRoot || f.path.startsWith(`${node.path}/`)) &&
            f.path.toLowerCase().includes(q),
        )
      : node.folders
    const dir = effectiveSort === 'name-desc' ? -1 : 1
    return base
      .filter((f) => typeFilter === 'all' || (typeFilter === 'image' ? f.imageCount : f.videoCount) > 0)
      .sort((a, b) => naturalCompare(a.name, b.name) * dir)
  }, [q, node, isRoot, typeFilter, effectiveSort])

  const key = [node.path, q, typeFilter, ext, effectiveSort].join('|')
  const limit = page.key === key ? page.n : PAGE
  const filtersActive = typeFilter !== 'all' || ext !== 'all' || sort !== GALLERY_CONFIG.defaultSort || q

  const clearAll = () => {
    setTypeFilter('all')
    setExtFilter('all')
    setSort(GALLERY_CONFIG.defaultSort)
    onClearQuery()
  }

  const parentPath = node.path.split('/').slice(0, -1).join('/')
  const nothing = folders.length === 0 && files.length === 0

  return (
    <section className="browser">
      <div className="hero">
        <div className="hero__text">
          {!isRoot && (
            <button type="button" className="btn hero__back" onClick={() => onOpenFolder(parentPath)}>
              ← {parentPath ? 'Back' : 'Back to Galleries'}
            </button>
          )}
          <h2>{isRoot ? '📸 My Galleries' : prettyName(node.name)}</h2>
          {isRoot && <p className="hero__sub">Pick a collection to explore your memories.</p>}
          <ul className="chips">
            {node.imageCount > 0 && <li className="chip chip--pink">🖼️ {node.imageCount} images</li>}
            {node.videoCount > 0 && <li className="chip chip--blue">🎬 {node.videoCount} videos</li>}
            <li className="chip chip--yellow">📦 {node.all.length} media</li>
            <li className="chip chip--green">💾 {describeTotal(sumSizes(node.all, info))}</li>
          </ul>
        </div>
        {!isRoot && node.all.length > 0 && (
          <button type="button" className="btn btn--primary" onClick={() => onDownloadFolder(node)}>
            ⬇ Download All
          </button>
        )}
      </div>

      {node.all.length > 0 && (
        <div className="toolbar">
          <select aria-label="Filter by media type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All media</option>
            <option value="image">Images only</option>
            <option value="video">Videos only</option>
          </select>
          <select aria-label="Filter by extension" value={ext} onChange={(e) => setExtFilter(e.target.value)}>
            <option value="all">All extensions</option>
            {exts.map((x) => (
              <option key={x} value={x}>.{x}</option>
            ))}
          </select>
          <select aria-label="Sort" value={effectiveSort} onChange={(e) => setSort(e.target.value)}>
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="size-asc">Size ↑</option>
            <option value="size-desc">Size ↓</option>
            <option value="type">File type</option>
            {hasDates && <option value="date-desc">Newest first</option>}
            {hasDates && <option value="date-asc">Oldest first</option>}
          </select>
          <div className="toolbar__views" role="group" aria-label="View mode">
            <button type="button" className="btn btn--ghost" aria-pressed={view === 'grid'} onClick={() => setView('grid')}>Grid</button>
            <button type="button" className="btn btn--ghost" aria-pressed={view === 'list'} onClick={() => setView('list')}>List</button>
          </div>
          {filtersActive && (
            <button type="button" className="btn btn--ghost" onClick={clearAll}>Clear filters</button>
          )}
        </div>
      )}

      {q && (
        <p className="muted" role="status">
          {folders.length} folders · {files.length} files match “{query.trim()}”
        </p>
      )}

      {folders.length > 0 && (
        <>
          <h3 className="section-title">
            {isRoot && !q ? 'Collections' : 'Folders'} <span className="count">{folders.length}</span>
          </h3>
          <div className="grid-cards">
            {folders.map((f) => (
              <GalleryCard key={f.path} node={f} info={info} onOpen={onOpenFolder} onDownload={onDownloadFolder} />
            ))}
          </div>
        </>
      )}

      {files.length > 0 && (
        <>
          <h3 className="section-title">
            Media <span className="count">{files.length}</span>
          </h3>
          <div className={`media-grid media-grid--${view}`}>
            {files.slice(0, limit).map((f, i) => (
              <MediaCard
                key={f.id}
                file={f}
                info={info[f.url]}
                view={view}
                onPreview={() => onPreview(files, i)}
                onDownload={onDownloadFile}
              />
            ))}
          </div>
          {files.length > limit && (
            <button type="button" className="btn load-more" onClick={() => setPage({ key, n: limit + PAGE })}>
              Show more ({files.length - limit} remaining)
            </button>
          )}
        </>
      )}

      {nothing &&
        (node.all.length === 0 && !q ? (
          <EmptyState
            title={isRoot ? 'No galleries found' : 'This folder is empty'}
            text="Add folders and supported images or videos under src/assets/gallery/."
          />
        ) : (
          <EmptyState
            icon="🔍"
            title="No matching results"
            text="Try a different search or clear the filters."
            action={<button type="button" className="btn" onClick={clearAll}>Clear filters</button>}
          />
        ))}
    </section>
  )
}