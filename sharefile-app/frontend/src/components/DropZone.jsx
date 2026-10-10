import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

/**
 * DropZone — drag and drop upload area
 * Supports files, folders, images, videos, PDFs, ZIPs — anything
 */
function DropZone({ onFilesSelected, uploading }) {
  const [isDragOver, setIsDragOver] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    setIsDragOver(false);
    if (acceptedFiles.length > 0) {
      onFilesSelected(acceptedFiles);
    }
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false),
    disabled: uploading,
    multiple: true,
    noClick: false
  });

  return (
    <div
      {...getRootProps()}
      className={`dropzone-base p-10 sm:p-16 flex flex-col items-center justify-center text-center
        min-h-[260px] select-none
        ${isDragActive || isDragOver ? 'dropzone-active' : ''}
        ${uploading ? 'opacity-60 cursor-not-allowed' : 'hover:border-shark-500'}
      `}
    >
      <input
        {...getInputProps()}
        /* Allow folder selection */
        {...{ webkitdirectory: '', mozdirectory: '', directory: '' }}
        id="file-upload"
      />

      {/* Animated icon */}
      <div className={`relative mb-5 ${isDragActive ? 'animate-bounce-subtle' : ''}`}>
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center
          ${isDragActive
            ? 'bg-cyan-400/20 border border-cyan-400/40'
            : 'bg-shark-800/80 border border-shark-700/60'
          } transition-all duration-300`}>
          {isDragActive ? (
            <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-shark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 5.75 5.75 0 011.344 8.195" />
            </svg>
          )}
        </div>

        {/* Decorative rings on drag */}
        {isDragActive && (
          <>
            <div className="absolute inset-0 rounded-2xl border border-cyan-400/20 animate-ping" />
            <div className="absolute -inset-2 rounded-3xl border border-cyan-400/10 animate-pulse" />
          </>
        )}
      </div>

      {/* Text */}
      {isDragActive ? (
        <div>
          <p className="text-lg font-semibold text-cyan-400">Release to upload</p>
          <p className="text-sm text-cyan-400/60 mt-1">Files will be shared instantly</p>
        </div>
      ) : (
        <div>
          <p className="text-base font-semibold text-white mb-1">
            {uploading ? 'Uploading...' : 'Drop files or folders here'}
          </p>
          <p className="text-sm text-shark-400 mb-4">
            or <span className="text-cyan-400 hover:underline cursor-pointer">click to browse</span>
          </p>

          {/* Supported types */}
          <div className="flex flex-wrap justify-center gap-2">
            {['Images', 'Videos', 'PDFs', 'ZIPs', 'Folders', 'Any file'].map(type => (
              <span key={type} className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-shark-800/80 border border-shark-700/50 text-shark-400">
                {type}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DropZone;
