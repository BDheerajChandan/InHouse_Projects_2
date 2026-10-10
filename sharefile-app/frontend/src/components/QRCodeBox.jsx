import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

/**
 * QRCodeBox — renders a QR code for a given URL
 * Used so mobile phones can scan and download instantly
 */
function QRCodeBox({ url, onClose }) {
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!canvasRef.current || !url) return;

    QRCode.toCanvas(canvasRef.current, url, {
      width: 200,
      margin: 2,
      color: {
        dark: '#22d3ee',   // Cyan dots
        light: '#111118'   // Dark background
      },
      errorCorrectionLevel: 'M'
    }).catch(err => {
      console.error('QR generation error:', err);
      setError('Failed to generate QR code');
    });
  }, [url]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}>
      <div
        className="bg-shark-900 border border-shark-700 rounded-2xl p-6 flex flex-col items-center gap-4 shadow-2xl max-w-xs w-full mx-4 animate-slide-up"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between w-full">
          <h3 className="font-semibold text-white">Scan to Download</h3>
          <button onClick={onClose} className="text-shark-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* QR Canvas */}
        <div className="p-3 rounded-xl bg-shark-950 border border-shark-700/50">
          {error ? (
            <p className="text-red-400 text-sm text-center px-4 py-8">{error}</p>
          ) : (
            <canvas ref={canvasRef} className="rounded-lg" />
          )}
        </div>

        {/* URL below QR */}
        <div className="w-full text-center">
          <p className="text-xs text-shark-400 mb-1">Open this URL on another device:</p>
          <p className="text-xs font-mono text-cyan-400 break-all bg-shark-950 rounded-lg px-3 py-2 border border-shark-700/50">
            {url}
          </p>
        </div>

        <p className="text-xs text-shark-500 text-center">
          Both devices must be on the same WiFi network
        </p>
      </div>
    </div>
  );
}

export default QRCodeBox;
