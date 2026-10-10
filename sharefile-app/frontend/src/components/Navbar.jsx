import React from 'react';

/**
 * Navbar — top navigation bar with server status indicator
 */
function Navbar({ serverInfo, connected }) {
  return (
    <nav className="sticky top-0 z-40 border-b border-shark-800/60 bg-shark-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg glow-cyan">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-white tracking-tight">ShareFile</span>
            <span className="ml-2 text-[10px] font-mono text-shark-400 uppercase tracking-widest">local</span>
          </div>
        </div>

        {/* Right side: IP + status */}
        <div className="flex items-center gap-3">
          {/* Connection status */}
          <div className={`flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full border
            ${connected
              ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-400'
              : 'border-red-400/30 bg-red-400/10 text-red-400'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            {connected ? 'Live' : 'Offline'}
          </div>

          {/* IP display */}
          {serverInfo?.ip && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-shark-400 bg-shark-800/60 border border-shark-700/40 rounded-lg px-3 py-1.5">
              <svg className="w-3 h-3 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
              </svg>
              {serverInfo.ip}:{serverInfo.port}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
