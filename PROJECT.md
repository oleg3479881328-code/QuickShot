# QuickShot Project Entrypoint

## 1. Project

- **Name:** QuickShot
- **Description:** Local-first Chrome extension for selecting, copying, editing, and exporting screenshots.
- **Type:** Browser extension, Manifest V3.

## 2. Purpose

QuickShot exists to make area screenshots fast and private. Success at the current stage means the existing capture flow remains intact while the complete editor and primary controls live in Chrome's Side Panel.

## 3. Source Of Truth

The GitHub repository is the durable source of truth:

- `https://github.com/oleg3479881328-code/QuickShot`

## 4. Source Trail

- Repository root and commit history in this GitHub repository.
- Active implementation review: `https://github.com/oleg3479881328-code/QuickShot/pull/1`.
- Product documentation: `README.md` and `docs/README.md`.
- Project execution standard: `https://github.com/oleg3479881328-code/Project-Execution-OS`.

## 5. Current Status

- **Mode:** Review and manual validation.
- **Phase:** Side Panel editor migration is open as draft PR #1.
- **Health:** Static validation passed; manual Chrome runtime testing is still required.

## 6. Done So Far

- Area selection, high-DPI crop, clipboard copy, keyboard shortcut, toolbar action, and context-menu launch exist.
- Annotation tools include arrow, text, blur, rectangle, ellipse, crop, undo/redo, copy, and PNG/JPG export.
- Side Panel editor implementation added for version `1.2.0`.
- Draft PR #1 opened from `feature/side-panel-editor` into `master`.

## 7. Current Focus

Validate that the Side Panel opens before selection and that every editor tool works inside the panel without changing screenshot accuracy.

## 8. Next Practical Step

Load draft PR #1 as an unpacked extension in Chrome 116+, run `docs/SIDE_PANEL_TEST_PLAN.md`, fix any runtime defects, and merge only after the test plan passes.

## 9. Key Decisions And Constraints

- Keep Manifest V3 and local-first behavior.
- Do not add permanent host permissions or remote screenshot uploads.
- Keep toolbar click, `Ctrl+Shift+S`, and context menu launch methods.
- Open the Side Panel and immediately start area selection from those launch methods.
- Keep clipboard-only mode; it shows the captured image in the panel but hides editing controls.
- The page overlay is responsible only for area selection, clipboard bridging, and status toasts.

## 10. Read Next

- Draft PR #1: `https://github.com/oleg3479881328-code/QuickShot/pull/1`
- `README.md`
- `docs/README.md`
- `docs/SIDE_PANEL_TEST_PLAN.md`
- `PROJECT_LOG.md`
