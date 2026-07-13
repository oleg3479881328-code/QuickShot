# QuickShot Documentation

## Overview

QuickShot is a local-first Chrome extension for area screenshots. It opens Chrome's Side Panel, captures a selected area from the visible tab, copies it to the clipboard when enabled, and loads the result into a lightweight editor inside the panel.

## Main Features

- Start from the toolbar icon, hotkey, context menu, or Side Panel button.
- Side Panel opens before area selection starts.
- DOM overlay area selection with smooth drag in any direction.
- Visible-tab capture with precise crop mapping for high-DPI screens.
- Immediate clipboard copy after crop when enabled.
- Side Panel editor with arrow, text, blur, crop, rectangle, ellipse, undo/redo, PNG/JPG export, and copy again.
- Capture mode, auto-copy, default format, and JPG quality controls in the Side Panel.
- Persistent settings and last capture in `chrome.storage.local`.
- Capture mode switch: full editor or clipboard-only.

## Project Structure

- `background/`: launch routing, Side Panel opening, and screenshot orchestration.
- `content/`: selection overlay, clipboard bridge, and page status toasts.
- `capture/`: capture pipeline coordinator.
- `image/`: crop engine.
- `clipboard/`: clipboard writer shared by content and Side Panel.
- `sidepanel/`: persistent editor and primary controls.
- `editor/`: legacy standalone editor files kept in the repository.
- `popup/`: legacy minimal launcher UI.
- `options/`: full settings page.
- `utils/`: settings and image helpers.
- `docs/`: user and technical documentation.

## Quick Start

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Load the unpacked extension from the project root.
4. Open a normal website.
5. Start QuickShot via the toolbar icon or `Ctrl+Shift+S`.
6. Confirm the Side Panel opens and drag an area on the page.
7. Edit, copy, or save the capture from the Side Panel.

In `Capture settings`, choose `Full editor` or `Clipboard only` depending on the workflow.

## Release Notes

- Use [INSTALL.md](INSTALL.md) for local setup.
- Use [SIDE_PANEL_TEST_PLAN.md](SIDE_PANEL_TEST_PLAN.md) for version 1.2.0 validation.
- Use [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) before packaging a release candidate.
