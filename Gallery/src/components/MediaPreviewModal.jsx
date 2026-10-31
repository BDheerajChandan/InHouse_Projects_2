import { useEffect, useRef, useState } from 'react'
import Watermark from './Watermark.jsx'
import { ErrorState } from './States.jsx'
import { formatDuration, formatSize } from '../utils/mediaHelpers'

function Stage({ file, onMeta }) {
  const [failed, setFailed] = useState(false)
  const [zoom, setZoom] = useState(false)
  const videoRef = useRef(null)

  useEffect(
    () => () => {
      const v = videoRef.current
      if (v) {
        v.pause()
        v.removeAttribute('src')
        v.load()
      }
    },
    [],
  )

  if (failed) {
    return <ErrorState title="Preview unavailable" text="This file could not be loaded or the format is not supported by your browser." />
  }

  return file.type === 'image' ? (
    <img
      className={zoom ? 'is-zoomed' : ''}
      src={file.url}
      alt={file.name}
      onClick={() => setZoom((z) => !z)}
      onLoad={(e) => onMeta({ width: e.target.naturalWidth, height: e.target.naturalHeight })}
      onError={() => setFailed(true)}
    />
  ) : (
    <video
      ref={videoRef}
      src={file.url}
      controls
      playsInline
      preload="metadata"
      onLoadedMetadata={(e) =>
        onMeta({ width: e.target.videoWidth, height: e.target.videoHeight, duration: e.target.duration })
      }
      onError={() => setFailed(true)}
    />
  )
}

export default function MediaPreviewModal({ files, index, info, onIndex, onClose, onDownload }) {
  const file = files[index]
  const dialogRef = useRef(null)
  const closeRef = useRef(null)
  const [meta, setMeta] = useState({ url: null })
  const m = meta.url === file.url ? meta : {}
  const fileInfo = info[file.url]

  useEffect(() => {
    const previous = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' && e.target.tagName !== 'VIDEO' && index > 0) {
        onIndex(index - 1)
      } else if (e.key === 'ArrowRight' && e.target.tagName !== 'VIDEO' && index < files.length - 1) {
        onIndex(index + 1)
      } else if (e.key === 'Tab') {
        const items = dialogRef.current?.querySelectorAll('button:not([disabled]), video[controls]')
        if (!items?.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, files.length, onClose, onIndex])

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="preview"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Preview ${file.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="preview__bar">
          <span className="preview__title" title={file.path}>{file.name}</span>
          <span className="muted">{index + 1} / {files.length}</span>
          <button ref={closeRef} type="button" className="btn btn--ghost" onClick={onClose} aria-label="Close preview">✕</button>
        </header>
        <div className="preview__stage">
          <div className="preview__scroll">
            <Stage key={file.url} file={file} onMeta={(v) => setMeta({ url: file.url, ...v })} />
          </div>
          <button type="button" className="nav nav--prev" disabled={index === 0} onClick={() => onIndex(index - 1)} aria-label="Previous">‹</button>
          <button type="button" className="nav nav--next" disabled={index === files.length - 1} onClick={() => onIndex(index + 1)} aria-label="Next">›</button>
          <Watermark variant="modal" />
        </div>
        <footer className="preview__info">
          <p className="muted">
            {file.ext.toUpperCase()} · {fileInfo ? formatSize(fileInfo.size) : 'Size loading…'}
            {m.width ? ` · ${m.width} × ${m.height}` : ''}
            {file.type === 'video' && m.duration ? ` · ${formatDuration(m.duration)}` : ''}
            {' · '}{file.path}
          </p>
          <button type="button" className="btn btn--primary" onClick={() => onDownload(file)}>Download</button>
        </footer>
      </div>
    </div>
  )
}