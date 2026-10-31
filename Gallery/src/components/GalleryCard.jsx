import Thumb from './Thumb.jsx'
import { describeTotal, getTheme, prettyName, sumSizes } from '../utils/mediaHelpers'

export default function GalleryCard({ node, info, onOpen }) {
  const theme = getTheme(node.name)
  const images = node.all.filter((f) => f.type === 'image')
  const previews = (images.length ? images : node.all).slice(0, 3)
  const empty = node.all.length === 0
  const subs = node.folders.length
  const single = (node.imageCount > 0) !== (node.videoCount > 0)

  return (
    <article className="card" style={{ '--accent': theme.accent }}>
      <div className="card__media">
        <button
          type="button"
          className={`collage collage--${previews.length}`}
          onClick={() => onOpen(node.path)}
          aria-label={`Open ${prettyName(node.name)}`}
        >
          {previews.length ? (
            previews.map((f) => <Thumb key={f.id} file={f} />)
          ) : (
            <span className="collage__empty" aria-hidden="true">{theme.icon}</span>
          )}
        </button>
      </div>

      <div className="card__body">
        <button type="button" className="card__title" onClick={() => onOpen(node.path)}>
          <span className="card__icon" aria-hidden="true">{theme.icon}</span>
          <span>{prettyName(node.name)}</span>
          <span className="card__arrow" aria-hidden="true">›</span>
        </button>

        {empty ? (
          <p className="card__meta">No supported media yet</p>
        ) : (
          <dl className={`stats${single ? ' stats--single' : ''}`}>
            {node.imageCount > 0 && (
              <div className="stat stat--images"><dt>Images</dt><dd>{node.imageCount}</dd></div>
            )}
            {node.videoCount > 0 && (
              <div className="stat stat--videos"><dt>Videos</dt><dd>{node.videoCount}</dd></div>
            )}
            <div className="stat stat--size">
              <dt>Total size</dt>
              <dd>{describeTotal(sumSizes(node.all, info))}</dd>
            </div>
          </dl>
        )}

        {subs > 0 && <p className="card__meta">{subs} subfolder{subs > 1 ? 's' : ''}</p>}

        <button
          type="button"
          className="btn btn--accent btn--block card__download"
          onClick={() => onOpen(node.path)}
        >
          Open
        </button>
      </div>
    </article>
  )
}