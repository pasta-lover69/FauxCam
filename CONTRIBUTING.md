# Contributing to FauxCam

Thank you for taking the time to contribute! Here's everything you need to get started.

---

## Code of conduct

Be respectful. Assume good faith. Keep discussions focused on the code and the problem.

---

## Reporting bugs

Before opening a bug report, please:

1. Search [existing issues](../../issues) to avoid duplicates
2. Reproduce the problem in a fresh Chrome profile to rule out conflicts with other extensions

When opening a bug report, use the **Bug Report** issue template and include:
- Chrome version (`chrome://version`)
- Extension version (visible on `chrome://extensions`)
- Steps to reproduce
- What you expected vs what actually happened
- Console errors (open DevTools → Console on the target page)

---

## Requesting features

Open a **Feature Request** issue and describe:
- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

---

## Development workflow

### Prerequisites

- Google Chrome (latest stable)
- Node.js ≥ 18 (for the linter only — no build step required)

### Setup

```bash
git clone https://github.com/your-username/fauxcam.git
cd fauxcam

# Install dev dependencies (ESLint only)
npm install

# Load the extension into Chrome
# chrome://extensions → Developer mode → Load unpacked → select vcam-extension/
```

### Making changes

The extension requires **no build step**. Edit the source files and reload the extension on `chrome://extensions` to see changes:

- Changes to `popup.html` / `popup.js` — re-open the popup
- Changes to `content.js` or `inject.js` — reload the extension + reload the target tab
- Changes to `manifest.json` — reload the extension

### Linting

```bash
npm run lint
```

All JavaScript must pass ESLint with no errors before a PR can be merged.

---

## Pull request guidelines

1. **Fork** the repository and create your branch from `main`:
   ```bash
   git checkout -b fix/describe-the-fix
   # or
   git checkout -b feat/describe-the-feature
   ```

2. **Write clean, self-documenting code.** Follow the existing style:
   - `camelCase` for variables and functions
   - Descriptive names — no abbreviations, no single-letter variables outside loops
   - JSDoc on every exported/public function
   - No magic strings — use named constants

3. **Keep commits focused.** One logical change per commit. Use conventional commit messages:
   ```
   fix: fall back gracefully when stored image fails to load
   feat: add HEIC conversion via canvas before storage
   docs: update installation steps for Chrome 124+
   ```

4. **Update CHANGELOG.md** under the `[Unreleased]` section.

5. **Fill in the PR template** when you open the pull request.

6. **CI must pass** — the validate workflow runs ESLint and a manifest schema check automatically.

---

## Project structure cheat sheet

| File | What to touch |
|---|---|
| `manifest.json` | Permissions, CSP, new web-accessible resources |
| `content.js` | Extension ↔ page message bridge, storage reads |
| `inject.js` | `getUserMedia` override logic, canvas stream creation |
| `popup.html` | Popup markup and styles |
| `popup.js` | Popup state, file upload, storage writes |

**Do not** introduce circular dependencies between these files.  
**Do not** add network requests — all data must stay local.

---

## Questions?

Open a [Discussion](../../discussions) or comment on a relevant issue.
