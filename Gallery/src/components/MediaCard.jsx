import { useState } from 'react'
import Thumb from './Thumb.jsx'
import { formatSize } from '../utils/mediaHelpers'

export default function MediaCard({ file, info, view, onPreview, onDownload }) {
  const [busy, setBusy] = useState(false)

  const download = async () => {
    setBusy(true)
    try {
      await onDownload(file)
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className={`media-card media-card--${view}`}>
      <button
        type="button"
        className="media-card__thumb"
        onClick={onPreview}
        aria-label={`Preview ${file.name}`}
      >
        <Thumb file={file} />
      </button>
      <div className="media-card__body">
        <h4 className="media-card__name" title={file.path}>{file.name}</h4>
        <p className="media-card__size">
          File size: <strong>{info ? formatSize(info.size) : 'Loading…'}</strong>
        </p>
        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={download}
          disabled={busy}
        >
          {busy ? 'Saving…' : '⬇ Download'}
        </button>
      </div>
    </article>
  )
}