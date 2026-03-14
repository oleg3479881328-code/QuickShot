# Release Checklist

## Versioning
1. Confirm `manifest.json` version matches the latest changelog entry.
2. Update `docs/CHANGELOG.md` with the release date and user-visible changes.
3. Recheck extension name, description, and icon assets.

## Smoke Test
1. Load the unpacked extension from `chrome://extensions`.
2. Verify launch from toolbar click, `Ctrl+Shift+S`, and context menu.
3. Capture a small and a large area on a normal HTTPS page.
4. Confirm clipboard copy succeeds after capture.
5. Confirm the editor opens in `Full` mode and does not open in `Clipboard only` mode.
6. In the editor, verify Arrow, Text, Blur, Crop, Rect, Ellipse, Undo, Redo, Copy, Save PNG, and Save JPG.
7. Reload Chrome and confirm settings persist.

## Edge Cases
1. Verify `Esc` cancels selection cleanly.
2. Verify tiny selections show an error instead of opening the editor.
3. Verify clipboard failure still preserves the captured image in the editor.
4. Verify the extension handles pages where script injection is blocked, such as `chrome://` pages, with a readable error.
5. Verify high-DPI display capture maps the crop correctly.

## Packaging
1. Remove any temporary local files that should not ship.
2. Zip the project contents with `manifest.json` at the archive root.
3. Keep documentation outside the zip only if the target distribution does not need it.
4. Save the packaged archive using the extension version in the filename, for example `quickshot-1.1.0.zip`.

## Store Readiness
1. Prepare screenshots of the capture flow, editor, and options page.
2. Prepare a short privacy statement noting QuickShot runs locally and does not upload screenshots.
3. Double-check requested permissions against actual features before publishing.
