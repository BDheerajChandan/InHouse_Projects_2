/**
 * API service — all HTTP calls to the backend
 */

// Backend base URL — in dev, Vite proxies /api → localhost:5000
// In production (same-machine access), use window.location.hostname
const BASE_URL = `http://${window.location.hostname}:5000`;

/**
 * Upload files with progress reporting
 * @param {File[]} files
 * @param {function} onProgress — called with 0-100
 * @returns {Promise<{files: Array}>}
 */
export async function uploadFiles(files, onProgress) {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress?.(pct);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error('Invalid server response'));
        }
      } else {
        let msg = `Upload failed (${xhr.status})`;
        try { msg = JSON.parse(xhr.responseText).error || msg; } catch {}
        reject(new Error(msg));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error — is the server running?')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

    xhr.open('POST', `${BASE_URL}/api/upload`);
    xhr.send(formData);
  });
}

/**
 * Fetch the list of all shared files
 */
export async function fetchFiles() {
  const res = await fetch(`${BASE_URL}/api/files`);
  if (!res.ok) throw new Error('Failed to fetch files');
  return res.json();
}

/**
 * Delete a file by ID
 */
export async function deleteFile(id) {
  const res = await fetch(`${BASE_URL}/api/files/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete file');
  return res.json();
}

/**
 * Delete ALL files
 */
export async function deleteAllFiles() {
  const res = await fetch(`${BASE_URL}/api/files`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete all files');
  return res.json();
}

/**
 * Get server info (IP, port)
 */
export async function getServerInfo() {
  const res = await fetch(`${BASE_URL}/api/info`);
  if (!res.ok) throw new Error('Server unreachable');
  return res.json();
}

export { BASE_URL };
