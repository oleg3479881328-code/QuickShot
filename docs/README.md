# QuickShot Documentation

## Overview
QuickShot is a local-first Chrome extension for area screenshots. It captures a selected area from the visible tab, copies it to clipboard, then opens a lightweight editor.

## Main Features
- Start from left-click toolbar icon, hotkey, or context menu.
- DOM overlay area selection with smooth drag in any direction.
- Visible-tab capture + precise crop mapping for high-DPI screens.
- Immediate clipboard copy after crop.
- Separate editor window with arrow, text, blur, crop, rectangle, ellipse, undo/redo, save PNG/JPG, and copy again.
- Persistent settings in `chrome.storage.local`.
- Capture mode switch: full flow or clipboard-only flow.

## Project Structure
- `background/`: command manager and screenshot orchestration.
- `content/`: overlay UI + selection engine + isolated styles.
- `capture/`: capture pipeline coordinator.
- `image/`: crop engine.
- `clipboard/`: clipboard writer shared by content/editor.
- `editor/`: lightweight canvas editor window.
- `popup/`: minimal launcher UI.
- `options/`: settings page.
- `utils/`: settings and image helpers.
- `docs/`: user and technical documentation.

## Quick Start
1. Open Chrome extensions page: `chrome://extensions`.
2. Enable Developer mode.
3. Load unpacked extension from project root.
4. Start QuickShot via toolbar icon or `Ctrl+Shift+S`.
5. In `Options`, choose `Full mode` or `Clipboard only` depending on your workflow.

## Release Notes
- Use [INSTALL.md](INSTALL.md) for local setup and smoke testing.
- Use [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) before sharing builds with testers or packaging a release candidate.
