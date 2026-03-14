# Changelog

## 1.1.0 - 2026-03-14
- Switched toolbar action to instant capture start on left click (no popup required).
- Added editor tools: Rectangle and Ellipse.
- Added editor actions: Apply Crop button, Undo/Redo buttons, and keyboard shortcuts.
- Added capture mode setting: `Full` vs `Clipboard only`.
- Standardized UI feedback language in English and normalized error prefixing (`Error:`).
- Improved capture timing after overlay cleanup to prevent tinted screenshots.
- Updated extension icons and switched manifest icon assets to PNG for stable toolbar rendering.
- Removed automatic all-sites content script injection before Chrome Web Store submission.
- Synced documentation with current behavior and features.

## 1.0.0 - 2026-03-09
- Initial production-ready release.
- Added area selection overlay with Escape cancel.
- Added visible-tab capture and high-DPI crop mapping.
- Added immediate clipboard copy after crop.
- Added separate canvas editor with arrow/text/blur/crop.
- Added PNG/JPG export and copy-again action.
- Added popup launcher, options page, command shortcut, and context menu.
- Added full project documentation package.
