import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import DropZone from '../components/DropZone';
import FileCard from '../components/FileCard';
import UploadProgress from '../components/UploadProgress';
import Toast from '../components/Toast';
import { uploadFiles, deleteFile, deleteAllFiles, getServerInfo } from '../services/api';

// Connect to backend Socket.IO
const SOCKET_URL = `http://${window.location.hostname}:5000`;
const socket = io(SOCKET_URL, { autoConnect: true, reconnectionDelay: 1000 });

/**
 * Home — main page of ShareFile
 */
function Home() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [serverInfo, setServerInfo] = useState(null);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState('all');
  const toastTimerRef = useRef(null);

  // ── Toast helper ────────────────────────────────────────────────────────────
  const showToast = useCallback((message, type = 'info') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type, key: Date.now() });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  // ── Socket.IO ───────────────────────────────────────────────────────────────
  useEffect(() => {
    socket.on('connect', () => {
      setConnected(true);
      console.log('[Socket] Connected');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('[Socket] Disconnected');
    });

    socket.on('files:updated', (updatedFiles) => {
      setFiles(updatedFiles);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('files:updated');
    };
  }, []);

  // ── Server info (IP) ────────────────────────────────────────────────────────
  useEffect(() => {
    getServerInfo()
      .then(setServerInfo)
      .catch(() => {}); // silent fail — navbar shows offline
  }, []);

  // ── Expose serverInfo to parent (App) via custom event ──────────────────────
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('serverInfo', { detail: { serverInfo, connected } }));
  }, [serverInfo, connected]);

  // ── Upload handler ──────────────────────────────────────────────────────────
  const handleFilesSelected = useCallback(async (selectedFiles) => {
    if (!selectedFiles.length) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadingCount(selectedFiles.length);

    try {
      const result = await uploadFiles(selectedFiles, (pct) => {
        setUploadProgress(pct);
      });

      showToast(
        `${result.files.length} file${result.files.length !== 1 ? 's' : ''} shared successfully!`,
        'success'
      );
    } catch (err) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadingCount(0);
    }
  }, [showToast]);

  // ── Delete file ─────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id) => {
    await deleteFile(id);
  }, []);

  // ── Delete all ──────────────────────────────────────────────────────────────
  const handleDeleteAll = useCallback(async () => {
    if (!window.confirm(`Delete all ${files.length} shared files? This cannot be undone.`)) return;
    try {
      await deleteAllFiles();
      showToast('All files deleted', 'info');
    } catch {
      showToast('Failed to delete all files', 'error');
    }
  }, [files.length, showToast]);

  // ── Filtered files ──────────────────────────────────────────────────────────
  const filteredFiles = filter === 'all'
    ? files
    : files.filter(f => f.category === filter);

  const categories = ['all', ...new Set(files.map(f => f.category || 'file'))];

  // ── Stats ───────────────────────────────────────────────────────────────────
  const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const formatTotalSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${['B','KB','MB','GB'][i]}`;
  };

  return (
    <div className="min-h-screen bg-grid hero-glow">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero text */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-cyan-500 uppercase tracking-widest">
              Local Network Sharing
            </span>
            {serverInfo?.ip && (
              <span className="text-xs font-mono text-shark-500">·</span>
            )}
            {serverInfo?.ip && (
              <span className="text-xs font-mono text-shark-500">{serverInfo.ip}</span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Share files <span className="text-cyan-400">instantly</span>
          </h1>
          <p className="text-shark-400 mt-2 text-sm">
            No internet. No cloud. Works on your local WiFi network only.
          </p>
        </div>

        {/* ── Stats bar ────────────────────────────────────────────────────── */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="stat-badge">
              <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="text-shark-300">{files.length} file{files.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="stat-badge">
              <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
              </svg>
              <span className="text-shark-300">{formatTotalSize(totalSize)} total</span>
            </div>
            <div className="stat-badge">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-shark-300">{connected ? 'Live sync on' : 'Disconnected'}</span>
            </div>
          </div>
        )}

        {/* ── Drop Zone ────────────────────────────────────────────────────── */}
        <div className="mb-6">
          <DropZone onFilesSelected={handleFilesSelected} uploading={uploading} />
        </div>

        {/* ── Upload Progress ───────────────────────────────────────────────── */}
        {uploading && (
          <div className="mb-6">
            <UploadProgress progress={uploadProgress} fileCount={uploadingCount} />
          </div>
        )}

        {/* ── File List ─────────────────────────────────────────────────────── */}
        {files.length > 0 && (
          <div>
            {/* Section header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">Shared Files</h2>
                <span className="text-xs font-mono bg-shark-800 border border-shark-700/50 text-shark-400 px-2 py-0.5 rounded-full">
                  {filteredFiles.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Category filter */}
                <div className="flex items-center gap-1 bg-shark-900/60 border border-shark-700/50 rounded-lg p-1">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFilter(cat)}
                      className={`text-xs font-medium px-3 py-1 rounded-md capitalize transition-all duration-150
                        ${filter === cat
                          ? 'bg-shark-700 text-white'
                          : 'text-shark-400 hover:text-shark-300'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Delete all */}
                <button onClick={handleDeleteAll} className="btn-danger text-xs">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Delete All
                </button>
              </div>
            </div>

            {/* File cards */}
            {filteredFiles.length === 0 ? (
              <div className="text-center py-10 text-shark-500 text-sm">
                No {filter} files shared yet
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredFiles.map(file => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onDelete={handleDelete}
                    onToast={showToast}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {files.length === 0 && !uploading && (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-shark-800/60 border border-shark-700/40 flex items-center justify-center">
              <svg className="w-6 h-6 text-shark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="text-shark-400 text-sm">No files shared yet</p>
            <p className="text-shark-600 text-xs mt-1">Drop something above to get started</p>
          </div>
        )}

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div className="mt-12 pt-6 border-t border-shark-800/60 text-center">
          <p className="text-xs text-shark-600 font-mono">
            ShareFile · Local only · No data leaves your network
          </p>
        </div>
      </div>

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          type={toast.type}
          onClose={dismissToast}
        />
      )}
    </div>
  );
}

export default Home;
