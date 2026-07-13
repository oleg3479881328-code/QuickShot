# QuickShot Side Panel Test Plan

## Scope

Validate the version 1.2.0 migration from the inline page editor to Chrome's Side Panel.

## Environment Record

- Operating system:
- Chrome version (must be 114 or newer):
- Display scaling:
- Browser zoom:
- Test date:
- Tester:

Use `PASS`, `FAIL`, `BLOCKED`, or `NOT TESTED` for every test.

## 1. Installation

### 1.1 Manifest load

1. Load the project root through `chrome://extensions`.
2. Confirm there are no manifest or service-worker errors.
3. Confirm the extension Side Panel is available.

Expected: QuickShot loads as version 1.2.0 without errors.

Status:
Notes:

## 2. Launch behavior

Repeat the following with toolbar click, `Ctrl+Shift+S`, and the context menu:

1. Open a normal HTTPS page.
2. Start QuickShot.

Expected:
- The Side Panel opens.
- Area selection starts immediately without another button click.
- Selection uses the page viewport after the panel is open.

Status:
Notes:

### 2.2 Side Panel button

1. Keep the panel open.
2. Click `Capture area`.

Expected: selection starts on the active page.

Status:
Notes:

## 3. Capture pipeline

1. Select an area in each drag direction.
2. Test at browser zoom 100%, 125%, and 150%.
3. Paste the automatic clipboard result into an image-capable application.

Expected:
- The crop matches the selected area.
- The new capture replaces the previous image in the Side Panel.
- Automatic copy follows the current Auto-copy setting.

Status:
Notes:

## 4. Full editor mode

Set Mode to `Full editor`, then test:

- Arrow, including classic, double, and line-only modes.
- Text with different colors and sizes.
- Blur with different block sizes.
- Rectangle with color, width, and line style.
- Ellipse with color, width, and line style; hold Ctrl for a circle.
- Crop.
- Undo and redo, including after crop.
- Copy edited image.
- Save PNG.
- Save JPG at different quality settings.
- Keyboard shortcuts: Ctrl/Cmd+Z, Ctrl/Cmd+Y, Ctrl/Cmd+Shift+Z, Ctrl/Cmd+C.

Expected: every tool modifies only the Side Panel canvas; no editor overlay appears on the website.

Status:
Notes:

## 5. Clipboard-only mode

1. Set Mode to `Clipboard only` in the Side Panel.
2. Capture an area.

Expected:
- Capture is copied when Auto-copy is enabled.
- The Side Panel remains open and shows the capture.
- Editing controls are hidden.
- The page does not receive an editor overlay.

Status:
Notes:

## 6. Settings persistence

1. Change mode, Auto-copy, default format, and JPG quality in the Side Panel.
2. Close and reopen Chrome.
3. Reopen QuickShot.

Expected: all settings persist and match the Options page.

Status:
Notes:

## 7. Error handling

Test on `chrome://extensions`, an extension page, and after pressing Esc during selection.

Expected:
- The Side Panel may open, but capture reports a readable error on blocked pages.
- Escape removes the selection overlay and reports cancellation.
- No stuck overlay remains.

Status:
Notes:

## Final decision

- Overall status:
- Blocking defects:
- Non-blocking defects:
- Ready to merge: Yes / No
