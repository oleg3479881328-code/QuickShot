# Installation

## Load Unpacked Extension
1. Open Chrome.
2. Visit `chrome://extensions`.
3. Enable `Developer mode` (top-right).
4. Click `Load unpacked`.
5. Select the project root folder (`QuickShot`).

## Local Testing Checklist
1. Open any regular web page.
2. Trigger capture by left-clicking extension icon or pressing `Ctrl+Shift+S`.
3. Select area and verify clipboard copy.
4. Verify editor opens and tools work (Arrow/Text/Blur/Crop/Rect/Ellipse, Undo/Redo, Apply Crop).
5. Switch to `Clipboard only` mode in Options and verify capture finishes without opening editor.
6. Verify options persist after browser restart.

## Notes
- QuickShot does not require a backend.
- QuickShot runs fully locally.
- Some pages such as `chrome://*`, the Chrome Web Store, and other protected browser surfaces may block script injection. Test capture on regular web pages first.
