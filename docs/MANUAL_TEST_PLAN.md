# QuickShot Manual Test Plan

## Status

Current status: preparation document created.

This document defines the manual test plan for QuickShot before packaging and Chrome Web Store submission.

## Test Goal

Confirm that QuickShot works reliably as a Chrome Extension MVP:

1. Starts from all supported launch methods.
2. Captures a selected area from the visible tab.
3. Copies the result to the clipboard.
4. Opens the editor in full mode.
5. Skips the editor in clipboard-only mode.
6. Handles blocked pages and errors cleanly.
7. Does not request unnecessary permissions.

## Test Environment

Record actual values before testing:

- Operating system:
- Chrome version:
- QuickShot version:
- Display resolution:
- Display scaling:
- Browser zoom:
- Test date:
- Tester:

## Test Result Legend

Use one of the following statuses:

- PASS
- FAIL
- BLOCKED
- NOT TESTED

For every FAIL, record:

- What happened.
- What was expected.
- Page URL or page type.
- Browser zoom.
- Display scaling.
- Console error if available.
- Screenshot or screen recording if available.

## Test Pages

Use at least these page types:

1. Normal HTTPS page.
2. Long scrolling article page.
3. Page with images.
4. Page with forms or inputs.
5. Page with dark background.
6. Page with fixed header.
7. Blocked page such as `chrome://extensions`.
8. Local file page if relevant.

## Test Section 1: Installation

### Test 1.1 — Load unpacked extension

Steps:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click `Load unpacked`.
4. Select the QuickShot project root.

Expected result:

- Extension loads without manifest errors.
- QuickShot appears in the extensions list.
- Toolbar icon is available.

Status:

Notes:

### Test 1.2 — Reload extension

Steps:

1. Click reload on the QuickShot extension card.
2. Watch for errors.

Expected result:

- Extension reloads without errors.
- No service worker crash is shown.

Status:

Notes:

## Test Section 2: Launch Methods

### Test 2.1 — Toolbar click launch

Steps:

1. Open a normal HTTPS page.
2. Click the QuickShot toolbar icon.

Expected result:

- Selection overlay appears.
- User can drag to select area.

Status:

Notes:

### Test 2.2 — Keyboard shortcut launch

Steps:

1. Open a normal HTTPS page.
2. Press `Ctrl+Shift+S` on Windows/Linux or `Command+Shift+S` on macOS.

Expected result:

- Selection overlay appears.
- User can drag to select area.

Status:

Notes:

### Test 2.3 — Context menu launch

Steps:

1. Open a normal HTTPS page.
2. Right-click the page.
3. Click `Capture area with QuickShot`.

Expected result:

- Selection overlay appears.
- User can drag to select area.

Status:

Notes:

## Test Section 3: Area Selection

### Test 3.1 — Normal selection

Steps:

1. Start capture.
2. Drag a medium-sized rectangle.
3. Release mouse button.

Expected result:

- Selection rectangle follows pointer.
- Size label updates.
- Capture completes after release.

Status:

Notes:

### Test 3.2 — Drag in reverse direction

Steps:

1. Start capture.
2. Drag from bottom-right to top-left.
3. Release mouse button.

Expected result:

- Selection still works.
- Cropped image matches selected area.

Status:

Notes:

### Test 3.3 — Tiny selection

Steps:

1. Start capture.
2. Select a very tiny area.

Expected result:

- Extension rejects tiny selection.
- User sees readable error.
- No broken overlay remains.

Status:

Notes:

### Test 3.4 — Cancel with Escape

Steps:

1. Start capture.
2. Press `Esc`.

Expected result:

- Selection is cancelled.
- Overlay disappears.
- Page returns to normal.

Status:

Notes:

## Test Section 4: Capture and Clipboard

### Test 4.1 — Capture copies to clipboard

Steps:

1. Start capture on a normal HTTPS page.
2. Select a visible area.
3. Open an image-capable destination, such as a document, chat input, or image editor.
4. Paste.

Expected result:

- Captured image pastes successfully.
- Pasted image matches selected area.

Status:

Notes:

### Test 4.2 — Clipboard copy after editor change

Steps:

1. Capture an area in full mode.
2. Add an arrow or rectangle.
3. Click copy in the editor.
4. Paste into an image-capable destination.

Expected result:

- Edited image is copied.
- Pasted image includes the added markups.

Status:

Notes:

### Test 4.3 — Clipboard failure handling

Steps:

1. Attempt capture in conditions where clipboard may fail.
2. Observe behavior.

Expected result:

- User gets readable failure message.
- Captured image remains available in editor if possible.
- Extension does not crash.

Status:

Notes:

## Test Section 5: Editor Full Mode

### Test 5.1 — Editor opens after capture

Steps:

1. Set capture mode to full mode in Options.
2. Capture an area.

Expected result:

- Editor opens after capture.
- Captured image is visible in editor.

Status:

Notes:

### Test 5.2 — Arrow tool

Steps:

1. Open editor.
2. Select Arrow.
3. Draw an arrow.

Expected result:

- Arrow appears on canvas.
- Undo removes it.
- Redo restores it.

Status:

Notes:

### Test 5.3 — Text tool

Steps:

1. Open editor.
2. Select Text.
3. Add text.

Expected result:

- Text appears on canvas.
- Text is readable.
- Undo and redo work.

Status:

Notes:

### Test 5.4 — Blur tool

Steps:

1. Open editor.
2. Select Blur.
3. Blur a visible area.

Expected result:

- Selected area becomes blurred.
- Undo and redo work.

Status:

Notes:

### Test 5.5 — Rectangle and ellipse tools

Steps:

1. Open editor.
2. Draw rectangle.
3. Draw ellipse.

Expected result:

- Shapes appear correctly.
- Undo and redo work.

Status:

Notes:

### Test 5.6 — Crop tool

Steps:

1. Open editor.
2. Select Crop.
3. Crop image.

Expected result:

- Canvas is cropped.
- Save and copy use cropped result.

Status:

Notes:

### Test 5.7 — Save PNG

Steps:

1. Open editor.
2. Add one annotation.
3. Save as PNG.

Expected result:

- PNG downloads or saves successfully.
- File opens correctly.
- Annotation is included.

Status:

Notes:

### Test 5.8 — Save JPG

Steps:

1. Open editor.
2. Add one annotation.
3. Save as JPG.

Expected result:

- JPG downloads or saves successfully.
- File opens correctly.
- Annotation is included.

Status:

Notes:

## Test Section 6: Clipboard-Only Mode

### Test 6.1 — Clipboard-only capture

Steps:

1. Open Options.
2. Set capture mode to clipboard-only.
3. Capture an area.

Expected result:

- Image is copied to clipboard.
- Editor does not open.
- User sees success feedback.

Status:

Notes:

### Test 6.2 — Return to full mode

Steps:

1. Open Options.
2. Set capture mode back to full mode.
3. Capture an area.

Expected result:

- Editor opens again after capture.
- Setting persists after extension reload.

Status:

Notes:

## Test Section 7: Blocked Pages

### Test 7.1 — chrome:// page

Steps:

1. Open `chrome://extensions`.
2. Start QuickShot.

Expected result:

- Extension does not crash.
- User sees readable unavailable/error message.
- No stuck overlay remains.

Status:

Notes:

### Test 7.2 — chrome-extension:// page

Steps:

1. Open an extension page if available.
2. Start QuickShot.

Expected result:

- Extension does not crash.
- User sees readable unavailable/error message.
- No stuck overlay remains.

Status:

Notes:

## Test Section 8: High-DPI, Zoom, and Scaling

### Test 8.1 — Browser zoom 100%

Steps:

1. Set browser zoom to 100%.
2. Capture a known visual area.
3. Compare pasted image to selected area.

Expected result:

- Crop matches selected area.

Status:

Notes:

### Test 8.2 — Browser zoom 125%

Steps:

1. Set browser zoom to 125%.
2. Capture a known visual area.
3. Compare pasted image to selected area.

Expected result:

- Crop matches selected area.

Status:

Notes:

### Test 8.3 — Browser zoom 150%

Steps:

1. Set browser zoom to 150%.
2. Capture a known visual area.
3. Compare pasted image to selected area.

Expected result:

- Crop matches selected area.

Status:

Notes:

## Test Section 9: Persistence

### Test 9.1 — Options persist after reload

Steps:

1. Change capture mode in Options.
2. Reload extension.
3. Open Options again.

Expected result:

- Selected setting remains saved.

Status:

Notes:

### Test 9.2 — Browser restart persistence

Steps:

1. Change capture mode in Options.
2. Close Chrome.
3. Reopen Chrome.
4. Check Options.

Expected result:

- Selected setting remains saved.

Status:

Notes:

## Test Section 10: Store-Readiness Checks

### Test 10.1 — Permission review

Steps:

1. Open `manifest.json`.
2. Confirm permissions match current features.

Expected result:

- No unnecessary permissions are present.
- No permanent `<all_urls>` host permission is present.

Status:

Notes:

### Test 10.2 — Network call review

Steps:

1. Search codebase for network APIs and remote URLs.
2. Check whether screenshot data can leave the browser.

Expected result:

- No screenshot upload exists.
- No hidden analytics exists.
- Privacy statement remains accurate.

Status:

Notes:

## Final Test Summary

Overall status:

- PASS
- FAIL
- BLOCKED
- NOT TESTED

Blocking issues:

1.
2.
3.

Non-blocking issues:

1.
2.
3.

Release recommendation:

- Ready for packaging.
- Not ready for packaging.

Tester decision:

Date:

Tester:
