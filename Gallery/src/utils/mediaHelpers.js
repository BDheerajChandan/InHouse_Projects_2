import {
  IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS,
  CATEGORY_THEMES,
  FALLBACK_THEMES,
} from '../config/galleryConfig'

const MIME = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  gif: 'image/gif', bmp: 'image/bmp', avif: 'image/avif', svg: 'image/svg+xml',
  mp4: 'video/mp4', webm: 'video/webm', ogg: 'video/ogg', mov: 'video/quicktime', m4v: 'video/x-m4v',
}

export const getExtension = (name) => {
  const i = name.lastIndexOf('.')
  return i < 0 ? '' : name.slice(i + 1).toLowerCase()
}

export const getMediaType = (ext) =>
  IMAGE_EXTENSIONS.includes(ext) ? 'image' : VIDEO_EXTENSIONS.includes(ext) ? 'video' : null

export const getMime = (ext) => MIME[ext] || 'application/octet-stream'

export const naturalCompare = (a, b) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })

export const prettyName = (name) =>
  name.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

export function formatSize(bytes) {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes < 0) return 'Not available'
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes
  let i = -1
  do {
    value /= 1024
    i++
  } while (value >= 1024 && i < units.length - 1)
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[i]}`
}

export function formatDuration(sec) {
  if (typeof sec !== 'number' || !Number.isFinite(sec)) return 'Not available'
  const s = Math.round(sec)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`
}

export function sumSizes(files, info) {
  let bytes = 0
  let known = 0
  for (const f of files) {
    const s = info[f.url]?.size
    if (typeof s === 'number') {
      bytes += s
      known++
    }
  }
  return { bytes, known, total: files.length, partial: known < files.length }
}

export function describeTotal(size) {
  if (size.total === 0) return '0 B'
  if (size.known === 0) return 'Size loading…'
  return `${formatSize(size.bytes)}${size.partial ? ' +' : ''}`
}

export function getTheme(name) {
  const hit = CATEGORY_THEMES.find((t) => t.match.test(name))
  if (hit) return hit
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return FALLBACK_THEMES[h % FALLBACK_THEMES.length]
}