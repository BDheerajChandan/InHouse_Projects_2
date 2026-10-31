import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import AnnouncementBar from './components/AnnouncementBar.jsx'
import MessageBanner from './components/MessageBanner.jsx'
import Watermark from './components/Watermark.jsx'
import AuthorizationModal from './components/AuthorizationModal.jsx'
import GalleryHeader from './components/GalleryHeader.jsx'
import FolderBrowser from './components/FolderBrowser.jsx'
import MediaPreviewModal from './components/MediaPreviewModal.jsx'
import DownloadManager from './components/DownloadManager.jsx'
import { useFileInfo } from './hooks/useFileInfo'
import { gallery } from './services/galleryService'
import { isSessionAuthorized } from './services/authorizationService'
import { downloadFile } from './services/downloadService'
import { GALLERY_CONFIG } from './config/galleryConfig'
import { prettyName } from './utils/mediaHelpers'

export default function App() {
  const [authorized, setAuthorized] = useState(isSessionAuthorized)
  const [path, setPath] = useState('')
  const [query, setQuery] = useState('')
  const [preview, setPreview] = useState(null)
  const [zipNode, setZipNode] = useState(null)
  const [toast, setToast] = useState(null)

  const info = useFileInfo(gallery.files, authorized)
  const node = gallery.index.get(path) ?? gallery.root

  const crumbs = useMemo(() => {
    const parts = path ? path.split('/') : []
    return parts.map((p, i) => ({ label: prettyName(p), path: parts.slice(0, i + 1).join('/') }))
  }, [path])

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const navigate = useCallback((p) => {
    setPath(p)
    if (p === '') setQuery('')
    window.scrollTo({ top: 0 })
  }, [])

  const handleDownload = useCallback(async (file) => {
    try {
      await downloadFile(file)
      setToast({ type: 'success', text: `Downloaded ${file.name}` })
    } catch {
      setToast({ type: 'error', text: `Could not download ${file.name}.` })
    }
  }, [])

  const openPreview = useCallback((files, index) => setPreview({ files, index }), [])
  const closePreview = useCallback(() => setPreview(null), [])
  const changeIndex = useCallback((i) => setPreview((p) => (p ? { ...p, index: i } : p)), [])
  const closeZip = useCallback(() => setZipNode(null), [])

  return (
    <div className="app">
      <AnnouncementBar text={GALLERY_CONFIG.announcement} />
      <MessageBanner text={GALLERY_CONFIG.message} />

      {authorized ? (
        <>
          <Watermark variant="page" />
          <GalleryHeader
            query={query}
            onQuery={setQuery}
            crumbs={crumbs}
            onNavigate={navigate}
          />
          <main className="container main">
            <FolderBrowser
              node={node}
              query={query}
              info={info}
              onClearQuery={() => setQuery('')}
              onOpenFolder={navigate}
              onPreview={openPreview}
              onDownloadFile={handleDownload}
              onDownloadFolder={setZipNode}
            />
          </main>
          {preview && (
            <MediaPreviewModal
              files={preview.files}
              index={preview.index}
              info={info}
              onIndex={changeIndex}
              onClose={closePreview}
              onDownload={handleDownload}
            />
          )}
          {zipNode && <DownloadManager node={zipNode} info={info} onClose={closeZip} />}
          {toast && (
            <div className={`toast toast--${toast.type}`} role="status">{toast.text}</div>
          )}
        </>
      ) : (
        <AuthorizationModal onSuccess={() => setAuthorized(true)} />
      )}
    </div>
  )
}