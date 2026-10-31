import { getExtension, getMediaType, getMime, naturalCompare } from '../utils/mediaHelpers'

const modules = import.meta.glob(
  '/src/assets/gallery/**/*.{jpg,jpeg,png,webp,gif,bmp,avif,svg,mp4,webm,ogg,mov,m4v,JPG,JPEG,PNG,WEBP,GIF,BMP,AVIF,SVG,MP4,WEBM,OGG,MOV,M4V}',
  { eager: true, query: '?url', import: 'default' },
)

const ROOT = '/src/assets/gallery/'

const createFolder = (name, path) => ({
  name,
  path,
  folders: [],
  files: [],
  all: [],
  imageCount: 0,
  videoCount: 0,
})

function finalize(node) {
  node.folders.sort((a, b) => naturalCompare(a.name, b.name))
  node.files.sort((a, b) => naturalCompare(a.name, b.name))
  node.all = [...node.files]
  for (const child of node.folders) {
    finalize(child)
    node.all.push(...child.all)
  }
  node.imageCount = node.all.filter((f) => f.type === 'image').length
  node.videoCount = node.all.length - node.imageCount
}

function buildGallery() {
  const root = createFolder('Home', '')
  const index = new Map([['', root]])
  const files = []

  for (const [key, url] of Object.entries(modules)) {
    if (typeof url !== 'string') continue
    const rel = key.slice(ROOT.length)
    const parts = rel.split('/')
    const filename = parts.pop()
    const ext = getExtension(filename)
    const type = getMediaType(ext)
    if (!type) continue

    let node = root
    let acc = ''
    for (const seg of parts) {
      acc = acc ? `${acc}/${seg}` : seg
      let child = index.get(acc)
      if (!child) {
        child = createFolder(seg, acc)
        index.set(acc, child)
        node.folders.push(child)
      }
      node = child
    }

    const file = {
      id: rel,
      name: filename,
      ext,
      type,
      mime: getMime(ext),
      url,
      path: rel,
      folderPath: parts.join('/'),
    }
    node.files.push(file)
    files.push(file)
  }

  finalize(root)
  return { root, index, files }
}

export const gallery = buildGallery()