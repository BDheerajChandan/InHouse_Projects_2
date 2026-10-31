import { GALLERY_CONFIG } from '../config/galleryConfig'

const escapeXml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="220"><text x="180" y="110" fill="#17324d" fill-opacity="0.14" font-family="sans-serif" font-size="22" font-weight="600" text-anchor="middle" transform="rotate(-28 180 110)">${escapeXml(GALLERY_CONFIG.watermark)}</text></svg>`

const style = { backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")` }

export default function Watermark({ variant = 'page' }) {
  return <div className={`watermark watermark--${variant}`} style={style} aria-hidden="true" />
}