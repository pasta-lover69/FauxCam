# Changelog

All notable changes to FauxCam are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

_Changes staged for the next release go here._

---

## [1.0.0] — 2026-03-13

### Added
- Initial release
- `getUserMedia` override via injected page-context script (`inject.js`)
- `content.js` message bridge between page context and `chrome.storage`
- Popup UI with drag-and-drop image upload, live preview, and enable/disable toggle
- Cover-crop scaling: image is letter-boxed / cropped to fit 1280×720 canvas
- Silent audio track injected when the site requests `{ video: true, audio: true }`
- Graceful fallback to real camera if virtual camera is disabled or image load fails
- 500 ms safety timeout on the `postMessage` bridge to prevent hanging callers
- Keep-alive redraw loop on canvas stream to prevent browser stream expiry

[Unreleased]: https://github.com/your-username/fauxcam/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/your-username/fauxcam/releases/tag/v1.0.0
