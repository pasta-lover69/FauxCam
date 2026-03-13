# Contributing to Virtual ID Camera

Thank you for taking the time to contribute! Here's how to get involved.

## Getting started

1. Fork this repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/virtual-id-camera.git
   cd virtual-id-camera
   ```
3. Load the extension in Chrome:
   - Go to `chrome://extensions`
   - Enable **Developer mode**
   - Click **Load unpacked** → select the project folder
4. Create a branch for your change:
   ```bash
   git checkout -b feat/your-feature-name
   ```

## Development workflow

There is no build step — the extension runs directly from source. After any
change to `inject.js` or `content.js`, reload the extension on
`chrome://extensions` and refresh the target tab. After changing `popup.js` or
`popup.html`, close and reopen the popup.

## Code style

- **Vanilla JS only** — no bundler, no framework, no dependencies.
- Follow the single-responsibility principle. Each function should do exactly one thing.
- All public functions and non-obvious logic must have a JSDoc comment explaining *why*, not just *what*.
- Max 40 lines per function. Refactor if exceeded.
- No magic strings. Use named constants at the top of the file.

## Submitting a pull request

1. Make sure your changes don't break the fallback path (virtual camera disabled → real camera still works).
2. Test on at least one site that uses `getUserMedia` for video.
3. Update `README.md` if your change affects usage or file structure.
4. Open a PR with a clear title and description of what changed and why.

## Reporting bugs

Open an issue and include:
- Chrome version
- The URL of the site where it failed (or a minimal reproduction)
- What you expected vs what happened
- Any errors from the browser console (`F12 → Console`)

## Feature ideas

Before opening a large PR for a new feature, open an issue first to discuss
whether it fits the project's scope. Some good candidates:

- Firefox (MV2) port
- Support for video files as a looping stream source
- Per-domain enable/disable (rather than global toggle)
- Keyboard shortcut to toggle on/off
