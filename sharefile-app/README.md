# ShareFile — Local Network File Sharing

> Instant file sharing on your local WiFi network. No internet. No cloud. No accounts.

---

## Folder Structure

```
sharefile-app/
├── backend/
│   ├── server.js          ← Express + Socket.IO + Multer server
│   ├── package.json
│   ├── uploads/           ← Files stored here (auto-created)
│   └── registry.json      ← File metadata (auto-created)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── DropZone.jsx
│   │   │   ├── FileCard.jsx
│   │   │   ├── UploadProgress.jsx
│   │   │   ├── QRCodeBox.jsx
│   │   │   └── Toast.jsx
│   │   ├── pages/
│   │   │   └── Home.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
├── start.bat              ← One-click Windows launcher
└── README.md
```

---

## Prerequisites

- **Node.js** v18 or later → https://nodejs.org
- Both devices must be on the **same WiFi network**

---

## Installation

### Step 1 — Copy this folder into your Vite project

Copy the contents into your existing project or use as standalone:

```
sharefile-app/
  backend/   → standalone Node.js server
  frontend/  → your React + Vite app (copy src/ contents)
```

### Step 2 — Install backend dependencies

```cmd
cd sharefile-app\backend
npm install
```

### Step 3 — Install frontend dependencies

```cmd
cd sharefile-app\frontend
npm install
```

---

## Running the App

### Option A — Double-click launcher (easiest)
```
Double-click: start.bat
```
This opens two terminal windows — one for backend, one for frontend.

### Option B — Manual (two terminals)

**Terminal 1 — Backend:**
```cmd
cd sharefile-app\backend
node server.js
```

**Terminal 2 — Frontend:**
```cmd
cd sharefile-app\frontend
npm run dev
```

---

## Accessing from Another Device

When the backend starts, it prints your network IP:
```
╔══════════════════════════════════════════════╗
║  Network access: http://192.168.1.5:5000    ║
╚══════════════════════════════════════════════╝
```

To access ShareFile from another PC/phone on the same WiFi:
```
http://192.168.1.5:5173
```
Replace `192.168.1.5` with your actual IP shown in the backend terminal.

---

## Features

| Feature | Details |
|---|---|
| Drag & Drop | Files, folders, images, videos, PDFs, ZIPs |
| Shareable URL | `http://192.168.x.x:5000/download/abc123` |
| QR Code | Scan with phone to download instantly |
| Progress Bar | Real-time upload progress |
| Live Updates | Socket.IO — all connected devices update instantly |
| File Management | Delete individual files or all at once |
| Category Filter | Filter by image, video, PDF, archive, etc. |
| Auto Cleanup | Old files purged daily at 2 AM automatically |
| Large Files | Supports up to 10 GB per file |
| Multiple Files | Upload up to 50 files at once |

---

## Tailwind Setup (if starting fresh)

If using inside the existing Vite project (`sharefile/`):

```cmd
cd sharefile
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Then replace `tailwind.config.js` and add `@tailwind` directives to `index.css`.

---

## Troubleshooting

**"Server unreachable" / red status indicator**
- Make sure the backend is running (`node server.js`)
- Check that port 5000 is not blocked by Windows Firewall

**Another device can't connect**
- Confirm both devices are on the same WiFi (not guest network)
- Try disabling Windows Firewall temporarily to test
- Use the IP shown in the backend terminal, not `localhost`

**Port already in use**
- Change `PORT` in `backend/server.js` (default 5000)
- Change `port` in `frontend/vite.config.js` (default 5173)

---

## Security Note

This app is designed for **local network use only**. Do not expose port 5000 to the internet.
Files are stored in `backend/uploads/` and auto-deleted after 24 hours.
