# Permissions

QuickShot requests only the minimal permissions needed for core behavior.

## `activeTab`
Required to interact with the currently active tab for capture flow.

## `scripting`
Required to inject overlay UI scripts and styles on demand.

## `clipboardWrite`
Required for automatic copy after capture and copy action in editor.

## `commands`
Required for keyboard shortcut registration (`Ctrl+Shift+S`).

## `contextMenus`
Required to add the right-click entry point.

## `storage`
Required to persist options and pass last capture payload.

## Privacy Statement
- QuickShot is local-first.
- No backend, no cloud upload, no login.
- Captured images and settings stay in browser extension storage context.
