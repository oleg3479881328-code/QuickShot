export const STORAGE_KEY = 'quickshotSettings';

export const DEFAULT_SETTINGS = {
  autoCopyOnCapture: true,
  captureMode: 'full',
  defaultSaveFormat: 'png',
  jpgQuality: 0.92,
  openEditorAfterCapture: true
};

export async function getSettings() {
  const payload = await chrome.storage.local.get(STORAGE_KEY);
  return sanitizeSettings(payload[STORAGE_KEY] || {});
}

export async function saveSettings(partialSettings) {
  const current = await getSettings();
  const merged = sanitizeSettings({ ...current, ...partialSettings });
  await chrome.storage.local.set({ [STORAGE_KEY]: merged });
  return merged;
}

export function sanitizeSettings(input) {
  const captureMode = input.captureMode === 'clipboard_only' ? 'clipboard_only' : 'full';
  const format = input.defaultSaveFormat === 'jpg' ? 'jpg' : 'png';
  const quality = clampNumber(Number(input.jpgQuality), 0.5, 1, DEFAULT_SETTINGS.jpgQuality);

  return {
    autoCopyOnCapture: Boolean(input.autoCopyOnCapture ?? DEFAULT_SETTINGS.autoCopyOnCapture),
    captureMode,
    defaultSaveFormat: format,
    jpgQuality: quality,
    openEditorAfterCapture: Boolean(input.openEditorAfterCapture ?? DEFAULT_SETTINGS.openEditorAfterCapture)
  };
}

function clampNumber(value, min, max, fallback) {
  if (Number.isNaN(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, value));
}
