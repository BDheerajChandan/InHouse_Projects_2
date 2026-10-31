import { useEffect, useRef, useState } from 'react'

export default function Thumb({ file, onMeta }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || visible) return undefined
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [visible])

  return (
    <div className="thumb" ref={ref}>
      {failed && <span className="thumb__fallback">⚠ Unavailable</span>}
      {!failed && visible && file.type === 'image' && (
        <img
          src={file.url}
          alt={file.name}
          loading="lazy"
          decoding="async"
          onLoad={(e) => onMeta?.({ width: e.target.naturalWidth, height: e.target.naturalHeight })}
          onError={() => setFailed(true)}
        />
      )}
      {!failed && visible && file.type === 'video' && (
        <video
          src={`${file.url}#t=0.1`}
          preload="metadata"
          muted
          playsInline
          tabIndex={-1}
          onLoadedMetadata={(e) =>
            onMeta?.({
              width: e.target.videoWidth,
              height: e.target.videoHeight,
              duration: e.target.duration,
            })
          }
          onError={() => setFailed(true)}
        />
      )}
      {file.type === 'video' && !failed && <span className="thumb__play" aria-hidden="true">▶</span>}
    </div>
  )
}