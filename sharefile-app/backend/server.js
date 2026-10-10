/**
 * ShareFile - Local Network File Sharing Server
 * Express + Socket.IO + Multer backend
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const schedule = require('node-schedule');

const app = express();
const server = http.createServer(app);

// ─── Socket.IO Setup ──────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'DELETE']
  },
  maxHttpBufferSize: 1e9 // 1GB for socket events
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// ─── Paths ───────────────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// In-memory file registry (persisted to disk)
const REGISTRY_PATH = path.join(__dirname, 'registry.json');
let fileRegistry = loadRegistry();

function loadRegistry() {
  try {
    if (fs.existsSync(REGISTRY_PATH)) {
      const data = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
      // Filter out files that no longer exist on disk
      return data.filter(f => fs.existsSync(path.join(UPLOADS_DIR, f.storedName)));
    }
  } catch (e) { console.error('Registry load error:', e.message); }
  return [];
}

function saveRegistry() {
  try {
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(fileRegistry, null, 2));
  } catch (e) { console.error('Registry save error:', e.message); }
}

// ─── Detect Local IP ─────────────────────────────────────────────────────────
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const LOCAL_IP = getLocalIP();
const PORT = process.env.PORT || 5000;

// ─── Multer Storage Config ───────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    // Preserve original extension, prefix with UUID
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024, // 10 GB max per file
    files: 50                            // max 50 files at once
  }
});

// ─── Helper: Format File Size ─────────────────────────────────────────────────
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// ─── Helper: Get File Type Category ──────────────────────────────────────────
function getFileCategory(mimetype, originalname) {
  if (!mimetype) return 'file';
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype === 'application/pdf') return 'pdf';
  if (mimetype.includes('zip') || mimetype.includes('rar') || mimetype.includes('7z')) return 'archive';
  if (mimetype.includes('word') || originalname.endsWith('.docx')) return 'document';
  if (mimetype.includes('spreadsheet') || originalname.endsWith('.xlsx')) return 'spreadsheet';
  return 'file';
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /api/info — server info + IP
app.get('/api/info', (req, res) => {
  res.json({ ip: LOCAL_IP, port: PORT, uptime: process.uptime() });
});

// GET /api/files — list all shared files
app.get('/api/files', (req, res) => {
  res.json(fileRegistry);
});

// POST /api/upload — upload one or more files
app.post('/api/upload', upload.array('files', 50), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const uploadedFiles = req.files.map(file => {
    const fileId = path.parse(file.filename).name; // UUID without extension
    const downloadUrl = `http://${LOCAL_IP}:${PORT}/download/${fileId}`;

    const entry = {
      id: fileId,
      originalName: file.originalname,
      storedName: file.filename,
      size: file.size,
      sizeFormatted: formatSize(file.size),
      mimetype: file.mimetype,
      category: getFileCategory(file.mimetype, file.originalname),
      downloadUrl,
      uploadedAt: new Date().toISOString(),
      downloads: 0
    };

    fileRegistry.unshift(entry); // newest first
    return entry;
  });

  saveRegistry();

  // Broadcast update to all connected clients
  io.emit('files:updated', fileRegistry);

  res.json({ success: true, files: uploadedFiles });
});

// GET /download/:id — download a file by its UUID
app.get('/download/:id', (req, res) => {
  const fileEntry = fileRegistry.find(f => f.id === req.params.id);

  if (!fileEntry) {
    return res.status(404).send('<h2>File not found or has been deleted</h2>');
  }

  const filePath = path.join(UPLOADS_DIR, fileEntry.storedName);
  if (!fs.existsSync(filePath)) {
    // Remove stale entry
    fileRegistry = fileRegistry.filter(f => f.id !== req.params.id);
    saveRegistry();
    return res.status(404).send('<h2>File no longer exists on disk</h2>');
  }

  // Increment download count
  fileEntry.downloads = (fileEntry.downloads || 0) + 1;
  saveRegistry();
  io.emit('files:updated', fileRegistry);

  // Stream file to client with proper headers
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileEntry.originalName)}"`);
  res.setHeader('Content-Type', fileEntry.mimetype || 'application/octet-stream');
  res.setHeader('Content-Length', fileEntry.size);
  res.sendFile(filePath);
});

// DELETE /api/files/:id — delete a file
app.delete('/api/files/:id', (req, res) => {
  const fileEntry = fileRegistry.find(f => f.id === req.params.id);

  if (!fileEntry) {
    return res.status(404).json({ error: 'File not found' });
  }

  const filePath = path.join(UPLOADS_DIR, fileEntry.storedName);
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {
    console.error('Delete error:', e.message);
  }

  fileRegistry = fileRegistry.filter(f => f.id !== req.params.id);
  saveRegistry();
  io.emit('files:updated', fileRegistry);

  res.json({ success: true });
});

// DELETE /api/files — delete ALL files
app.delete('/api/files', (req, res) => {
  fileRegistry.forEach(f => {
    const filePath = path.join(UPLOADS_DIR, f.storedName);
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) {}
  });
  fileRegistry = [];
  saveRegistry();
  io.emit('files:updated', fileRegistry);
  res.json({ success: true, message: 'All files deleted' });
});

// ─── Auto Cleanup (runs daily at 2 AM, deletes files older than 24h) ─────────
schedule.scheduleJob('0 2 * * *', () => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  let cleaned = 0;

  fileRegistry = fileRegistry.filter(f => {
    const age = now - new Date(f.uploadedAt).getTime();
    if (age > maxAge) {
      const filePath = path.join(UPLOADS_DIR, f.storedName);
      try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) {}
      cleaned++;
      return false;
    }
    return true;
  });

  if (cleaned > 0) {
    saveRegistry();
    io.emit('files:updated', fileRegistry);
    console.log(`[Cleanup] Removed ${cleaned} old file(s)`);
  }
});

// ─── Socket.IO Events ────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Send current file list immediately on connect
  socket.emit('files:updated', fileRegistry);

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║         ShareFile - Local File Sharing       ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  Server running on port: ${PORT}                 ║`);
  console.log(`║  Local access:  http://localhost:${PORT}          ║`);
  console.log(`║  Network access: http://${LOCAL_IP}:${PORT}    ║`);
  console.log('╚══════════════════════════════════════════════╝\n');
});
