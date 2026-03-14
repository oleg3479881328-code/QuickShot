# Architecture

## Core Components
1. **Command Manager** (`background/service-worker.js`)
- Handles toolbar click, command hotkey, context menu, and start messages from content scripts.
- Injects overlay scripts/styles.
- Coordinates capture pipeline.

2. **Overlay UI** (`content/overlay-ui.js`, `content/overlay.css`)
- Injects DOM mask and selection box.
- Displays interaction hints and status toasts.
- Cleans up after capture/cancel.
- Waits for post-overlay paint before capture handoff to avoid tinted screenshots.

3. **Selection Engine** (`content/selection-engine.js`)
- Tracks pointer start/move/end.
- Normalizes drag from any direction.
- Supports `Esc` cancellation.

4. **Capture Controller** (`capture/capture-controller.js`)
- Calls visible tab capture.
- Invokes crop engine.
- Triggers immediate clipboard write via content script bridge.

5. **Crop Engine** (`image/crop-engine.js`)
- Converts viewport selection to bitmap coordinates.
- Applies DPR/zoom mapping via image-to-viewport scale.
- Outputs PNG blob + data URL.

6. **Clipboard Engine** (`clipboard/clipboard-engine.js`)
- Writes image to clipboard through `navigator.clipboard.write`.
- Shared by page capture flow and editor logic.

7. **Inline Editor** (`content/overlay-ui.js`)
- Runs directly on the page after capture in `Full` mode.
- Uses native Canvas API only.
- Supports arrow/text/blur/crop + copy/save actions.

8. **Settings** (`options/*`, `utils/settings.js`)
- Reads and writes settings in `chrome.storage.local`.
- Defaults enforced through sanitization.
- Includes `captureMode` (`full` / `clipboard_only`) to control editor opening.

## Data Flow
1. User starts capture.
2. Service worker injects overlay + starts selection.
3. Content script returns selection rectangle.
4. Service worker captures visible tab.
5. Crop engine crops selected region.
6. Cropped image is copied to clipboard.
7. If `captureMode=full`, the inline editor opens with the captured image.

## Why DOM Overlay + Canvas Editor
- DOM overlay gives fast injection and easy interaction on arbitrary pages.
- Canvas editor keeps runtime small and deterministic.
- No external services or backend dependencies.
