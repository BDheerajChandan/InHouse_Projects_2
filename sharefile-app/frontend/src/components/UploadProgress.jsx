import React from 'react';

/**
 * UploadProgress — animated upload progress indicator
 */
function UploadProgress({ progress, fileCount }) {
  return (
    <div className="bg-shark-900/60 border border-shark-700/50 rounded-xl p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Spinning icon */}
          <div className="w-5 h-5 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin" />
          <span className="text-sm font-medium text-white">
            Uploading {fileCount} {fileCount === 1 ? 'file' : 'files'}...
          </span>
        </div>
        <span className="text-sm font-mono font-semibold text-cyan-400">{progress}%</span>
      </div>

      {/* Progress bar */}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Status text */}
      <p className="text-xs text-shark-500 mt-2 font-mono">
        {progress < 100
          ? `Transferring to local server...`
          : `Processing files...`
        }
      </p>
    </div>
  );
}

export default UploadProgress;
