# Troubleshooting

## Capture Does Not Start
Check:
1. You are on a regular web page, not restricted Chrome UI pages (`chrome://`, Web Store, internal pages).
2. Extension is enabled in `chrome://extensions`.
3. Reload extension after recent icon/manifest or script updates.

## Clipboard Copy Failed
Check:
1. Browser focus is still in active page/editor.
2. Clipboard permission is allowed for extension context.
3. Retry with `Copy` in editor (`Ctrl+C`).

## Editor Did Not Open
Check:
1. `Capture mode` is not set to `Clipboard only`.
2. Option `Open editor automatically after capture` is enabled.
3. Capture succeeded (check copy status toast first).

## Selection Mismatch (Area vs Final Crop)
Check:
1. Browser zoom level.
2. HiDPI display scaling.
3. Retry after refreshing page.

Notes:
- QuickShot maps selection to bitmap using viewport-to-image scale and handles DPR.
- Small mismatch can occur on pages with extreme rendering transforms.

## Screenshot Looks Tinted/Overlay-Colored
Check:
1. Reload extension to apply the latest overlay cleanup timing fix.
2. Retest on a regular page.

## Overlay Not Visible
Check:
1. Page was not reloaded after extension update.
2. Site is not using restrictive policies that interfere with injected UI.
3. Try starting capture again.
