export const GALLERY_CONFIG = {
  title: 'Dheeraj Project - Gallery',
  watermark: 'Dheeraj Project - Gallery',
  announcement:
    'Welcome to Dheeraj Project - Gallery | Explore your memories, photos and videos in one place.',
  message:
    'Your memories, organized beautifully. Browse galleries, preview media, and download your favorite collections.',
  defaultSort: 'name-asc',
  zipWarnBytes: 500 * 1024 * 1024,
  zipWarnFiles: 300,
  sizeFetchConcurrency: 6,
  pageSize: 60,
  authSessionKey: 'gallery.authorized',
}

export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'avif', 'svg']
export const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov', 'm4v']

export const CATEGORY_THEMES = [
  { match: /marri|wedding/i, accent: '#f472b6', icon: '💍' },
  { match: /trip|travel|tour/i, accent: '#38bdf8', icon: '✈️' },
  { match: /birth/i, accent: '#fbbf24', icon: '🎂' },
  { match: /family/i, accent: '#34d399', icon: '👨‍👩‍👧' },
  { match: /friend/i, accent: '#fbbf24', icon: '🎉' },
  { match: /image|photo|pic/i, accent: '#f472b6', icon: '🖼️' },
  { match: /video|clip|film|movie/i, accent: '#38bdf8', icon: '🎬' },
]

export const FALLBACK_THEMES = [
  { accent: '#34d399', icon: '📁' },
  { accent: '#fbbf24', icon: '📂' },
  { accent: '#f472b6', icon: '📷' },
  { accent: '#60a5fa', icon: '🗂️' },
]