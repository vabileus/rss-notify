<div align="center">

# 📡 RSS Notify

**A lightweight desktop watcher for your RSS/Atom feeds — with native notifications.**

Lives in the system tray, polls each feed on its own schedule, and pings you the moment something new drops.

![Electron](https://img.shields.io/badge/Electron-2B2E3A?logo=electron&logoColor=9FEAF9)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-555)
![License](https://img.shields.io/badge/license-MIT-blue)

</div>

---

## ✨ Features

- 🔔 **Native notifications** — OS-level toasts; click to open the article.
- 🗂️ **Multiple feeds** — each with its own polling interval.
- 🧰 **Tray-resident** — closing the window hides it; it keeps watching in the background.
- 💾 **Persistent state** — remembers what you've already seen across restarts.
- 🤫 **No first-run spam** — existing items are marked seen silently on startup.
- 🔒 **Secure by default** — `contextIsolation` on, `nodeIntegration` off, IPC over a typed preload bridge.

## 🚀 Quick start

```bash
npm install
npm start        # builds TypeScript, then launches Electron
```

Build only (compile TS → `dist/`):

```bash
npm run build
```

## 🖼️ Usage

1. Paste a feed URL (e.g. `https://hnrss.org/frontpage`), give it a name, set an interval in seconds.
2. Hit **Add** — the feed is primed silently, then polled on its schedule.
3. New items appear in the right-hand pane and fire a desktop notification.
4. Close the window to tuck it into the tray; quit from the tray menu.

## 🧱 Project structure

```
src/
├── main.ts          Electron main process: window, tray, notifications, IPC
├── preload.ts       Secure renderer ⇆ main bridge (contextBridge)
├── feedStore.ts     Feed config + "seen" state, persisted as JSON in userData
├── watcher.ts       Polling engine: one timer per feed, silent priming pass
└── renderer/
    ├── index.html   UI markup + styles
    ├── renderer.ts  UI logic (manage feeds, live item stream)
    └── global.d.ts  Ambient types for window.api
```

## ⚙️ How it works

- **Polling.** Every feed gets its own `setInterval`, so intervals are independent. Node's single-threaded event loop means no locking is needed — state mutations are naturally serialized.
- **State.** Seen item IDs live in `app.getPath("userData")/rss-state.json`, keyed by feed URL (history is capped per feed to bound growth). On first launch the current items are marked seen *without* notifying.
- **Notifications.** Electron's built-in `Notification` API (native on all three platforms). On Windows, `app.setAppUserModelId(...)` ensures toasts show the app name rather than `electron.exe`. Clicking a notification opens the link via `shell.openExternal`.
- **Security.** The renderer has no direct Node access — only the typed surface exposed in `preload.ts` through `contextBridge`.

## 📦 Building installers

Add [`electron-builder`](https://www.electron.build/) for distributables:

```bash
npm i -D electron-builder
npx electron-builder --win    # or --mac / --linux
```

## 🗒️ Notes & next steps

- `rss-parser` has no built-in HTTP timeout — for production, wrap `parseURL` in an `AbortController` so a hung feed can't pin memory.
- For dozens of feeds, swap the timer-per-feed model for a small worker pool fed by a queue, plus a little jitter on intervals to avoid thundering-herd requests.
- For flaky feeds with unstable GUIDs (tracking params in URLs), normalize the item ID — strip query strings or hash `title + published`.

## 📄 License

MIT
