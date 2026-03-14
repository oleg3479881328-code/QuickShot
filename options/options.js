import { getSettings, saveSettings } from '../utils/settings.js';

const form = document.getElementById('settingsForm');
const autoCopy = document.getElementById('autoCopyOnCapture');
const captureMode = document.getElementById('captureMode');
const defaultFormat = document.getElementById('defaultSaveFormat');
const jpgQuality = document.getElementById('jpgQuality');
const jpgQualityValue = document.getElementById('jpgQualityValue');
const status = document.getElementById('status');

init().catch((error) => {
  setStatus(error.message, true);
});

async function init() {
  const settings = await getSettings();

  autoCopy.checked = settings.autoCopyOnCapture;
  captureMode.value = settings.captureMode;
  defaultFormat.value = settings.defaultSaveFormat;
  jpgQuality.value = String(settings.jpgQuality);
  jpgQualityValue.textContent = `${Math.round(settings.jpgQuality * 100)}%`;

  jpgQuality.addEventListener('input', () => {
    jpgQualityValue.textContent = `${Math.round(Number(jpgQuality.value) * 100)}%`;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    await saveSettings({
      autoCopyOnCapture: autoCopy.checked,
      openEditorAfterCapture: captureMode.value !== 'clipboard_only',
      captureMode: captureMode.value,
      defaultSaveFormat: defaultFormat.value,
      jpgQuality: Number(jpgQuality.value)
    });

    setStatus('Settings saved.', false);
  });
}

function setStatus(message, isError) {
  status.textContent = message;
  status.classList.toggle('error', Boolean(isError));
}
