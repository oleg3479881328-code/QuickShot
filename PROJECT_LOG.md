# QuickShot Project Log

## 2026-07-13 — Side Panel editor migration

### Request

Keep the current QuickShot behavior but move the main editor functions into Chrome's Side Panel. Opening QuickShot must open the panel and immediately start area selection.

### Implementation

- Added Manifest V3 Side Panel configuration and `sidePanel` permission.
- Updated version from `1.1.0` to `1.2.0` and set Chrome 116 as the minimum version because programmatic `sidePanel.open()` starts there.
- Added a persistent Side Panel with capture controls, editor canvas, all annotation tools, undo/redo, clipboard copy, PNG/JPG export, and capture settings.
- Changed toolbar, keyboard, and context-menu launches to open the Side Panel before starting selection.
- Removed the inline page editor from `content/overlay-ui.js`; the content script now handles only selection, clipboard bridging, and toasts.
- Preserved the existing crop and automatic clipboard pipeline.
- Added Side Panel-specific manual tests and updated project documentation.
- Opened draft PR #1: `https://github.com/oleg3479881328-code/QuickShot/pull/1`.

### Validation

- `manifest.json` parsed successfully as JSON.
- `node --check` passed for:
  - `background/service-worker.js`
  - `content/overlay-ui.js`
  - `sidepanel/sidepanel.js`
- Uploaded Git blob hashes match the locally validated candidate files.
- Chrome runtime and visual testing could not be executed in the current environment and remains required before merge.

### Execution Environment Error

- **Error:** Direct `git clone` failed because the execution container could not resolve `github.com`.
- **Path taken:** Switched to the connected GitHub API and worked on a dedicated branch.
- **Resolution:** Repository reads and writes continued through the GitHub connector; local static validation used reconstructed candidate files.
