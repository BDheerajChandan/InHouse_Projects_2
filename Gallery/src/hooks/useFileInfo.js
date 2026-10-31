import { useEffect, useState } from 'react'
import { GALLERY_CONFIG } from '../config/galleryConfig'

export function useFileInfo(files, enabled) {
  const [info, setInfo] = useState({})

  useEffect(() => {
    if (!enabled || !files.length) return undefined
    const ctrl = new AbortController()
    const queue = [...files]
    let buffer = {}

    const flush = () => {
      if (!Object.keys(buffer).length) return
      const batch = buffer
      buffer = {}
      setInfo((prev) => ({ ...prev, ...batch }))
    }
    const timer = setInterval(flush, 300)

    const worker = async () => {
      while (queue.length && !ctrl.signal.aborted) {
        const f = queue.shift()
        try {
          const res = await fetch(f.url, { method: 'HEAD', signal: ctrl.signal })
          if (!res.ok) throw new Error(String(res.status))
          const size = Number(res.headers.get('content-length'))
          const modified = Date.parse(res.headers.get('last-modified') || '')
          buffer[f.url] = {
            size: Number.isFinite(size) && size > 0 ? size : null,
            modified: Number.isNaN(modified) ? null : modified,
          }
        } catch {
          if (ctrl.signal.aborted) return
          buffer[f.url] = { size: null, modified: null }
        }
      }
    }

    Promise.all(Array.from({ length: GALLERY_CONFIG.sizeFetchConcurrency }, worker)).then(() => {
      if (!ctrl.signal.aborted) flush()
    })

    return () => {
      ctrl.abort()
      clearInterval(timer)
    }
  }, [files, enabled])

  return info
}