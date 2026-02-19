# Borsa Italiana — Live Desktop Terminal

A real-time Italian stock market terminal built with React + Electron.

## Quick Start (3 steps)

### Prerequisites
- Node.js 18+ installed on your machine
```bash

### 1. Install dependencies
npm install
2. Run in development mode (instant preview)
npm start
This opens the app as a native desktop window.

3. Build a distributable installer
npm run dist
This creates a platform-specific installer in the dist-electron/ folder:

macOS → Borsa Italiana.dmg (drag to Applications)

Windows → Borsa Italiana Setup.exe (double-click installer)

Linux → Borsa Italiana.AppImage (make executable, double-click)

Project Structure
borsa-italiana/
├── electron/
│   ├── main.js        ← Electron main process (native window)
│   └── icon.png       ← App icon
├── src/
│   ├── App.jsx        ← Main React component (live terminal UI)
│   └── main.jsx       ← React entry point
├── index.html
├── vite.config.js
└── package.json
Scripts
Command	Description
npm start	Dev mode: Vite + Electron together
npm run dev	Vite only (browser at localhost:5173)
npm run build	Build React app for production
npm run dist	Build + package into installer
Features
Live price simulation (updates every 1.2s)

FTSE MIB index with real-time chart

Scrolling ticker tape

Watchlist with sparklines

Flash alerts on large moves

Sector performance breakdown

Search with clear button

Dark terminal aesthetic


If you want, I can also add:
- badges (build, license, Electron version)
- screenshots section
- auto-update instructions for Electron
- real market data API integration notes
