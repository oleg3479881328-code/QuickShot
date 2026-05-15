# QuickShot Store Readiness Audit

## Status

Current status: preparation document created.

This document records the store-readiness audit for QuickShot before Chrome Web Store packaging and submission.

## Product Summary

QuickShot is a Chrome Extension using Manifest V3. Its core workflow is:

1. Start capture from toolbar icon, keyboard shortcut, or context menu.
2. Select an area on the current visible tab.
3. Capture the visible tab.
4. Crop the selected area.
5. Copy the cropped image to the clipboard.
6. Open the lightweight editor in full mode, or stop after clipboard copy in clipboard-only mode.

## Audit Scope

This audit covers:

- Manifest permissions.
- Local-first privacy posture.
- Screenshot handling.
- Clipboard behavior.
- Blocked-page behavior.
- Store-risk areas.
- Manual release readiness.

This audit does not certify final Chrome Web Store approval. Chrome Web Store approval depends on Google's review process.

## Manifest Review

Current permission model:

- `activeTab`
- `scripting`
- `clipboardWrite`
- `commands`
- `contextMenus`
- `storage`

Observed store-positive points:

- No permanent `<all_urls>` host permission is declared.
- No broad host permission is required for the normal capture flow.
- Script injection is tied to explicit user actions.
- Toolbar click, keyboard shortcut, and context menu are user-initiated flows.

Risk notes:

- `scripting` must be justified by the need to inject the selection overlay and editor into the active tab.
- `clipboardWrite` must be justified by the instant copy feature.
- `storage` must be justified by user settings and last capture state.

Recommended store description language:

QuickShot uses permissions only to capture the visible active tab after a user action, draw a temporary selection interface, copy the selected image to the clipboard, and save local settings. QuickShot does not upload screenshots or send screenshot data to a remote server.

## Privacy Review

Current privacy position:

- Local-first extension.
- Screenshot data is handled in-browser.
- No external upload is part of the documented workflow.
- No account system is required.
- No analytics are currently required for the MVP.

Required pre-release verification:

- Search the codebase for `fetch(`, `XMLHttpRequest`, `WebSocket`, `axios`, remote URLs, and third-party scripts.
- Confirm no screenshot data leaves the browser.
- Confirm no telemetry is silently collected.
- Confirm privacy statement matches real code behavior.

Suggested privacy statement:

QuickShot processes screenshots locally in your browser. Captured images are not uploaded to QuickShot servers. QuickShot stores only local extension settings using Chrome storage.

## User Action Review

Expected valid user actions:

- Clicking the extension toolbar icon.
- Pressing `Ctrl+Shift+S` or `Command+Shift+S` on macOS.
- Selecting the context menu item `Capture area with QuickShot`.

Store-risk reduction:

- No automatic page scanning.
- No background page scraping.
- No hidden screenshot capture without user action.

## Blocked Page Review

Known blocked or restricted page types:

- `chrome://`
- `chrome-extension://`
- `edge://`
- `about:`
- `view-source:`
- `devtools://`

Expected behavior:

- Extension must not crash.
- User must see a readable error.
- Extension badge may show short error feedback.
- No broken overlay should remain on the page.

## Clipboard Review

Expected behavior:

- After successful capture, image is copied to clipboard.
- If clipboard write fails, the capture should remain available in editor where possible.
- User should receive readable failure message.

Risks:

- Clipboard APIs can be sensitive to user gesture timing.
- Some pages or browser states may reject clipboard writes.
- Browser security rules can change.

Required manual checks:

- Clipboard copy after normal capture.
- Clipboard copy after editor modification.
- Clipboard failure behavior when permission or browser state blocks writing.

## High-DPI and Scaling Review

Expected behavior:

- Cropped output should match selected region on normal and high-DPI displays.
- Browser zoom should not visibly shift or resize the cropped output incorrectly.

Required manual checks:

- 100% browser zoom.
- 125% browser zoom.
- 150% browser zoom.
- Windows display scaling if available.
- Retina or high-DPI display if available.

## Editor Review

Expected editor tools:

- Arrow.
- Text.
- Blur.
- Rectangle.
- Ellipse.
- Crop.
- Undo.
- Redo.
- Copy.
- Save PNG.
- Save JPG.

Required manual checks:

- Every tool works on a captured image.
- Undo and redo do not corrupt the canvas.
- Save PNG creates a usable file.
- Save JPG creates a usable file.
- Copy after edits copies the edited image, not the original image.

## Store Listing Preparation

Required assets:

- Extension name: QuickShot.
- Short description.
- Full description.
- Privacy statement.
- At least one screenshot of selection flow.
- At least one screenshot of editor.
- At least one screenshot of options page.
- 128x128 icon.

Recommended positioning:

QuickShot is a fast local-first screenshot tool for capturing selected areas of the current tab with instant clipboard copy and quick annotation.

Avoid overstating:

- Do not claim full desktop capture unless implemented.
- Do not claim cloud sync unless implemented.
- Do not claim OCR unless implemented.
- Do not claim video capture unless implemented.

## Known MVP Boundaries

In scope:

- Current visible tab capture.
- Area selection.
- Clipboard copy.
- Lightweight annotation editor.
- Local settings.

Out of scope for MVP:

- Full desktop capture.
- Cloud storage.
- Team collaboration.
- OCR.
- Video recording.
- Cross-device sync.
- Account login.

## Release Gate

Before packaging, all of the following must be true:

- Manifest permissions are minimal and justified.
- No unnecessary host permissions are added.
- No screenshot data is uploaded remotely.
- Manual test plan passes on common websites.
- Blocked pages fail gracefully.
- Clipboard failure is handled without data loss where possible.
- High-DPI crop behavior is verified.
- Release checklist is updated.
- Version in `manifest.json` matches release notes.

## Audit Result

Current audit result: not final.

Reason:

This document is a preparation audit. Final status must be updated only after manual tests are executed and results are recorded in `docs/MANUAL_TEST_PLAN.md`.
