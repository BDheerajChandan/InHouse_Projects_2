import { useEffect, useRef, useState } from 'react'
import { saveBlob, zipFiles } from '../services/downloadService'
import { GALLERY_CONFIG } from '../config/galleryConfig'
import { formatSize, prettyName, sumSizes } from '../utils/mediaHelpers'

export default function DownloadManager({ node, info, onClose }) {
  const files = node.all
  const size = sumSizes(files, info)
  const large = size.bytes >= GALLERY_CONFIG.zipWarnBytes || files.length >= GALLERY_CONFIG.zipWarnFiles
  const [state, setState] = useState({ phase: 'confirm' })
  const ctrl = useRef(null)
  const running = state.phase === 'running'

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (ctrl.current) ctrl.current.abort()
      else onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      ctrl.current?.abort()
    }
  }, [onClose])

  const start = async () => {
    if (ctrl.current) return
    const controller = new AbortController()
    ctrl.current = controller
    setState({ phase: 'running', done: 0, total: files.length, current: '', failed: 0, percent: 0 })
    try {
      const { blob, failed } = await zipFiles({
        files,
        basePath: node.path,
        rootName: node.name,
        signal: controller.signal,
        onProgress: (p) => setState({ ...p, phase: 'running' }),
      })
      saveBlob(blob, `${node.name}-gallery.zip`)
      setState({ phase: 'done', failed, bytes: blob.size })
    } catch (err) {
      setState(
        err.name === 'AbortError'
          ? { phase: 'cancelled' }
          : { phase: 'error', message: 'The archive could not be created. Please try again.' },
      )
    } finally {
      ctrl.current = null
    }
  }

  return (
    <div className="overlay" onClick={() => !running && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label="Download all" onClick={(e) => e.stopPropagation()}>
        <h2>Download {prettyName(node.name)}</h2>

        {state.phase === 'confirm' && (
          <>
            <p className="muted">
              {files.length} files · {size.known ? formatSize(size.bytes) + (size.partial ? '+' : '') : 'size unknown'}.
              The archive keeps the folder structure.
            </p>
            {large && (
              <p className="notice notice--warn" role="alert">
                This is a large collection. Building the ZIP happens in your browser and may use a lot of memory.
              </p>
            )}
            <div className="dialog__actions">
              <button type="button" className="btn" onClick={onClose}>Cancel</button>
              <button type="button" className="btn btn--primary" onClick={start} disabled={running}>Create ZIP</button>
            </div>
          </>
        )}

        {running && (
          <>
            <progress max="100" value={state.percent} aria-label="Archive progress" />
            <p className="muted" role="status">
              {state.percent}% · {state.done}/{state.total} files · {state.current}
              {state.failed > 0 ? ` · ${state.failed} failed` : ''}
            </p>
            <div className="dialog__actions">
              <button type="button" className="btn" onClick={() => ctrl.current?.abort()}>Cancel</button>
            </div>
          </>
        )}

        {state.phase === 'done' && (
          <>
            <p className="notice notice--ok" role="status">Archive ready · {formatSize(state.bytes)}</p>
            {state.failed.length > 0 && (
              <div className="notice notice--warn" role="alert">
                <p>{state.failed.length} file(s) could not be included:</p>
                <ul>{state.failed.map((p) => <li key={p}>{p}</li>)}</ul>
              </div>
            )}
            <div className="dialog__actions">
              <button type="button" className="btn btn--primary" onClick={onClose}>Close</button>
            </div>
          </>
        )}

        {(state.phase === 'cancelled' || state.phase === 'error') && (
          <>
            <p className={`notice ${state.phase === 'error' ? 'notice--warn' : ''}`} role="alert">
              {state.phase === 'cancelled' ? 'Download cancelled.' : state.message}
            </p>
            <div className="dialog__actions">
              <button type="button" className="btn btn--primary" onClick={onClose}>Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}