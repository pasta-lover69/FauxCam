# 🪪 Virtual ID Camera

> A Chrome extension that intercepts any website's camera capture flow and
> feeds it a static uploaded image instead — no live camera required.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Manifest](https://img.shields.io/badge/manifest-v3-brightgreen.svg)
![Platform](https://img.shields.io/badge/platform-Chrome%20%7C%20Edge-yellow.svg)

---

## The problem

Many identity-verification flows on the web force you to **capture** your ID
through the camera (`getUserMedia`), even when you already have a perfectly
good photo of it. There's no upload option, no "use existing file" button —
just a camera feed.

## The solution

Virtual ID Camera overrides `navigator.mediaDevices.getUserMedia` at the page
level. When a site requests a video stream, the extension draws your uploaded
image onto an offscreen `<canvas>` and returns `canvas.captureStream()` as the
response. The site receives a valid `MediaStream` with a `VideoTrack` — it
cannot distinguish this from a real webcam at the API level.

---

## How it works

```
Website calls getUserMedia({ video: true })
        │
        ▼
inject.js intercepts the call
        │
        ▼
Asks content.js via postMessage:
"Is virtual camera enabled? Do we have an image?"
        │
   ┌────┴──────────────────────────────────────┐
   │ YES — enabled + image stored              │ NO — disabled or no image
   ▼                                           ▼
Draw image on offscreen <canvas>         Call the real getUserMedia
Return canvas.captureStream()            (real camera, unmodified)
   │
   ▼
Website gets a valid MediaStream ✓
```

### Why two separate scripts?

Chrome enforces **isolated worlds** — extension content scripts have access to
`chrome.*` APIs but cannot touch `window.navigator`. The page-injected script
(`inject.js`) can override browser APIs but has no access to `chrome.*`.

The solution is a lightweight message bridge:

| Script | Context | Can do |
|---|---|---|
| `content.js` | Extension isolated world | Read `chrome.storage`, inject `inject.js` |
| `inject.js` | Page JS context | Override `navigator.mediaDevices.getUserMedia` |

They communicate via `window.postMessage` using a request/response protocol.

---

## Install

### Developer mode (recommended for personal use)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (toggle, top-right)
4. Click **Load unpacked**
5. Select the project folder (the one containing `manifest.json`)
6. The 🪪 icon appears in your Chrome toolbar

### Edge

Identical steps — Edge supports Chrome extensions natively via the same
Developer mode flow.

---

## Usage

1. Click the 🪪 toolbar icon to open the popup
2. Upload a photo of your ID (JPEG / PNG / WEBP, max 10 MB)
3. Toggle **"Replace camera with uploaded image"** to ON
4. Navigate to the website that requires camera capture
5. **Reload the target tab** — the override injects at `document_start` and
   must run before the site's own scripts
6. Proceed through the site's camera capture flow — your uploaded image will
   appear as the live video feed

> **Tip:** You can toggle virtual camera on/off per-session without removing
> the image. Your uploaded image persists across browser restarts.

---

## File structure

```
virtual-id-camera/
├── manifest.json      Chrome Manifest V3 declaration
├── content.js         Injector + chrome.storage bridge (extension context)
├── inject.js          getUserMedia override (page JS context)
├── popup.html         Extension popup UI
├── popup.js           Popup logic — upload, toggle, storage
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

---

## Technical details

### Canvas stream

`HTMLCanvasElement.captureStream(fps)` produces a real `MediaStream`. The
returned `VideoTrack` has `readyState: "live"` and reports dimensions matching
the canvas (1280×720). The image is drawn cover-cropped to fill the canvas and
redrawn at 30 fps to keep the stream alive — some browsers drop a canvas stream
that never repaints.

### Audio passthrough

If the site requests `{ video: true, audio: true }`, the extension appends a
silent `AudioTrack` (via `AudioContext → MediaStreamDestination`) so the
constraints are fully satisfied without prompting for microphone access.

### Fallback chain

```
Virtual camera enabled?  →  No  →  Call real getUserMedia (unmodified)
Image stored?            →  No  →  Call real getUserMedia (unmodified)
Image loads OK?          →  No  →  Call real getUserMedia (unmodified, warning logged)
All good                 →  Return canvas.captureStream()
```

The extension never breaks a site's camera flow — it always falls back cleanly.

---

## Limitations

| Limitation | Notes |
|---|---|
| Tab must be reloaded after enabling | `inject.js` runs at `document_start`; already-loaded pages are not affected |
| Some sites may detect a canvas stream | Sites using custom `MediaStream` processors or fingerprinting may distinguish synthetic streams |
| HEIC not supported in file picker | Browser `<input type="file">` restriction; convert to JPEG first |
| No Firefox support yet | Firefox uses MV2 and a different content script injection model; PRs welcome |

---

## Privacy

- Your image is stored **locally** in `chrome.storage.local` — it never leaves your machine.
- No analytics, no network requests, no external dependencies.
- The extension only activates when you explicitly toggle it on.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, code style, and PR guidelines.

---

## License

[MIT](LICENSE)
