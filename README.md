# 🪪 FauxCam

> A Chrome extension that intercepts `getUserMedia` camera requests and feeds websites a static uploaded image instead — no live camera required.

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-brightgreen?style=flat)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

---

## The problem

Many identity verification flows force users to open a live camera feed to capture their ID. If you already have a clear photo of your document, you're stuck — the site won't accept an upload.

## The solution

FauxCam installs a thin override on `navigator.mediaDevices.getUserMedia`. When any website asks for a video stream, the extension intercepts the call, draws your uploaded image onto an offscreen canvas, and returns `canvas.captureStream()` as the "camera" feed. The site receives a valid `MediaStream` with a real `VideoTrack` — indistinguishable from a hardware camera at the browser API level.

---

## How it works

```
Website calls getUserMedia({ video: true })
        │
        ▼
  inject.js override intercepts the call          (page JS context)
        │
        ▼
  postMessage → content.js bridge                 (extension context)
        │
        ▼
  chrome.storage.local lookup
        │
   ┌────┴─────────────────────────────────────┐
   │ Virtual camera ON + image stored          │ OFF or no image
   ▼                                           ▼
  Draw image onto offscreen HTMLCanvasElement  Pass through to real getUserMedia
  Return canvas.captureStream(30fps)
        │
        ▼
  Website receives MediaStream ✓
  (valid VideoTrack — site cannot distinguish
   canvas stream from real webcam at API level)
```

### Why two script files?

Chrome extensions enforce isolated JavaScript worlds:

| File | Context | Has `chrome.*` API | Can touch `window.navigator` |
|---|---|---|---|
| `content.js` | Extension world | ✅ | ❌ |
| `inject.js` | Page world | ❌ | ✅ |

`inject.js` must run in the page's context to override `getUserMedia`, but needs the stored image from `chrome.storage`. The two scripts communicate via `window.postMessage` as a bridge.

---

## Installation

### From source (developer mode)

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/fauxcam.git
   cd fauxcam
   ```

2. Open Chrome and navigate to `chrome://extensions`

3. Enable **Developer mode** using the toggle in the top-right corner

4. Click **Load unpacked** and select the `fauxcam/` directory

5. The FauxCam icon will appear in your Chrome toolbar

### From a release ZIP

1. Download `vcam-extension.zip` from the [Releases](../../releases) page
2. Unzip it
3. Follow steps 2–5 above

---

## Usage

1. **Open the popup** — click the extension icon in the Chrome toolbar
2. **Upload your ID image** — drag and drop or click to browse (JPG / PNG / WEBP, max 10 MB)
3. **Enable the virtual camera** — toggle "Replace camera with uploaded image" ON
4. **Reload the target tab** — the override must inject before the site's own scripts run
5. **Complete the verification flow** — your uploaded image will appear as the live camera feed

> ⚡ **Important:** You must reload the target tab after enabling the extension. The `getUserMedia` override is injected at `document_start`, so it won't take effect in tabs that were already open.

---

## Project structure

```
fauxcam/
├── .github/
│   ├── workflows/
│   │   └── validate.yml          # CI — manifest schema + JS lint
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── pull_request_template.md
├── icons/
│   ├── icon16.png                # Toolbar icon
│   ├── icon48.png                # Extensions page icon
│   └── icon128.png               # Chrome Web Store icon
├── manifest.json                 # Chrome MV3 manifest
├── content.js                    # Injector + chrome.storage message bridge
├── inject.js                     # getUserMedia override (page JS context)
├── popup.html                    # Extension popup UI
├── popup.js                      # Popup — image upload, toggle, storage
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

---

## Permissions

| Permission | Reason |
|---|---|
| `storage` | Persist the uploaded image and enabled state across browser sessions |
| `activeTab` | Read the current tab context for the content script |
| `scripting` | Inject `inject.js` into the page's JavaScript context |

No network requests are ever made. Your image never leaves the browser.

---

## Limitations

- Some sites use WebRTC with server-side stream analysis or liveness detection. A static canvas stream will not defeat these checks.
- The extension must be reloaded into a tab (tab refresh) to take effect after enabling.
- HEIC files are not supported in the browser's native file picker; convert to JPEG first.
- Firefox support would require porting to the WebExtensions API (the core logic is compatible; manifest and storage calls differ slightly).

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

Found a bug? [Open an issue](../../issues/new?template=bug_report.md).  
Have an idea? [Start a discussion](../../issues/new?template=feature_request.md).

---

## License

[MIT](./LICENSE) — © 2026 FauxCam Contributors
