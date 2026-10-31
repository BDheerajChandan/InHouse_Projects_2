import JSZip from 'jszip'

export const safeName = (name) => name.replace(/[\\/:*?"<>|]+/g, '_')

export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = safeName(filename)
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export async function downloadFile(file) {
  const res = await fetch(file.url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  saveBlob(await res.blob(), file.name)
}

const abortError = () => new DOMException('Cancelled', 'AbortError')

export async function zipFiles({ files, basePath, rootName, signal, onProgress }) {
  const zip = new JSZip()
  const failed = []
  const total = files.length
  let done = 0

  for (const f of files) {
    if (signal.aborted) throw abortError()
    onProgress({ phase: 'fetch', done, total, current: f.name, failed: failed.length, percent: Math.round((done / total) * 100) })
    try {
      const res = await fetch(f.url, { signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const rel = basePath ? f.path.slice(basePath.length + 1) : f.path
      zip.file(`${rootName}/${rel}`, await res.blob())
    } catch {
      if (signal.aborted) throw abortError()
      failed.push(f.path)
    }
    done++
  }

  if (failed.length === total) throw new Error('No files could be downloaded')

  const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' }, (m) =>
    onProgress({ phase: 'zip', done, total, current: 'Building archive…', failed: failed.length, percent: Math.round(m.percent) }),
  )
  if (signal.aborted) throw abortError()
  return { blob, failed }
}