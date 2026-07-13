import { getSettings, saveSettings } from '../utils/settings.js';

const LAST_CAPTURE_KEY = 'quickshotLastCapture';
const SETTINGS_KEY = 'quickshotSettings';
const MAX_HISTORY = 30;
const DRAWING_TOOLS = new Set(['arrow', 'blur', 'rect', 'ellipse', 'crop']);

const elements = {
  captureButton: document.getElementById('captureButton'),
  openOptionsButton: document.getElementById('openOptionsButton'),
  captureModeSelect: document.getElementById('captureModeSelect'),
  autoCopyCheckbox: document.getElementById('autoCopyCheckbox'),
  defaultFormatSelect: document.getElementById('defaultFormatSelect'),
  jpgQualityInput: document.getElementById('jpgQualityInput'),
  jpgQualityValue: document.getElementById('jpgQualityValue'),
  status: document.getElementById('status'),
  emptyState: document.getElementById('emptyState'),
  captureView: document.getElementById('captureView'),
  captureDimensions: document.getElementById('captureDimensions'),
  captureTime: document.getElementById('captureTime'),
  canvas: document.getElementById('editorCanvas'),
  clipboardOnlyNotice: document.getElementById('clipboardOnlyNotice'),
  editorControls: document.getElementById('editorControls'),
  toolSettings: document.getElementById('toolSettings'),
  undoButton: document.getElementById('undoButton'),
  redoButton: document.getElementById('redoButton'),
  copyButton: document.getElementById('copyButton'),
  savePngButton: document.getElementById('savePngButton'),
  saveJpgButton: document.getElementById('saveJpgButton')
};

const state = {
  settings: null,
  capture: null,
  ctx: null,
  currentTool: 'arrow',
  drawing: false,
  pointerId: null,
  startPoint: null,
  previewImageData: null,
  undoStack: [],
  redoStack: [],
  styles: {
    arrow: { color: '#d92d20', width: 3, lineStyle: 'solid', arrowMode: 'classic' },
    text: { color: '#d92d20', fontSize: 20 },
    rect: { color: '#d92d20', width: 2, lineStyle: 'solid' },
    ellipse: { color: '#d92d20', width: 2, lineStyle: 'solid' },
    blur: { blockSize: 10 }
  }
};

init().catch((error) => setStatus(error.message, 'error'));

async function init() {
  bindEvents();
  state.settings = await getSettings();
  syncSettingsControls();
  applyMode();

  const stored = await chrome.storage.local.get(LAST_CAPTURE_KEY);
  if (stored[LAST_CAPTURE_KEY]) {
    await loadCapture(stored[LAST_CAPTURE_KEY]);
  } else {
    showEmptyState();
  }
}

function bindEvents() {
  elements.captureButton.addEventListener('click', startCapture);
  elements.openOptionsButton.addEventListener('click', () => chrome.runtime.openOptionsPage());
  elements.captureModeSelect.addEventListener('change', persistPanelSettings);
  elements.autoCopyCheckbox.addEventListener('change', persistPanelSettings);
  elements.defaultFormatSelect.addEventListener('change', persistPanelSettings);
  elements.jpgQualityInput.addEventListener('input', () => {
    elements.jpgQualityValue.textContent = `${Math.round(Number(elements.jpgQualityInput.value) * 100)}%`;
  });
  elements.jpgQualityInput.addEventListener('change', persistPanelSettings);

  document.querySelectorAll('[data-tool]').forEach((button) => {
    button.addEventListener('click', () => setActiveTool(button.dataset.tool));
  });

  elements.undoButton.addEventListener('click', undo);
  elements.redoButton.addEventListener('click', redo);
  elements.copyButton.addEventListener('click', copyCurrentImage);
  elements.savePngButton.addEventListener('click', () => saveImage('png'));
  elements.saveJpgButton.addEventListener('click', () => saveImage('jpg'));

  elements.canvas.addEventListener('pointerdown', handlePointerDown);
  elements.canvas.addEventListener('pointermove', handlePointerMove);
  elements.canvas.addEventListener('pointerup', handlePointerUp);
  elements.canvas.addEventListener('pointercancel', handlePointerCancel);

  document.addEventListener('keydown', handleKeyboardShortcut);

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') {
      return;
    }

    if (changes[LAST_CAPTURE_KEY]?.newValue) {
      loadCapture(changes[LAST_CAPTURE_KEY].newValue)
        .catch((error) => setStatus(error.message, 'error'));
    }

    if (changes[SETTINGS_KEY]) {
      getSettings()
        .then((settings) => {
          state.settings = settings;
          syncSettingsControls();
          applyMode();
        })
        .catch((error) => setStatus(error.message, 'error'));
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === 'QUICKSHOT_CAPTURE_STARTED') {
      setStatus('Select an area on the page. Press Esc to cancel.');
    } else if (message?.type === 'QUICKSHOT_CAPTURE_CANCELLED') {
      setStatus('Capture cancelled.');
    } else if (message?.type === 'QUICKSHOT_CAPTURE_FAILED') {
      setStatus(message.error || 'Capture failed.', 'error');
    }
  });
}

async function persistPanelSettings() {
  try {
    state.settings = await saveSettings({
      captureMode: elements.captureModeSelect.value,
      openEditorAfterCapture: elements.captureModeSelect.value !== 'clipboard_only',
      autoCopyOnCapture: elements.autoCopyCheckbox.checked,
      defaultSaveFormat: elements.defaultFormatSelect.value,
      jpgQuality: Number(elements.jpgQualityInput.value)
    });
    syncSettingsControls();
    applyMode();
    setStatus('Settings saved.', 'success');
  } catch (error) {
    setStatus(error.message, 'error');
  }
}

function syncSettingsControls() {
  if (!state.settings) {
    return;
  }
  elements.captureModeSelect.value = state.settings.captureMode;
  elements.autoCopyCheckbox.checked = state.settings.autoCopyOnCapture;
  elements.defaultFormatSelect.value = state.settings.defaultSaveFormat;
  elements.jpgQualityInput.value = String(state.settings.jpgQuality);
  elements.jpgQualityValue.textContent = `${Math.round(state.settings.jpgQuality * 100)}%`;
}

async function startCapture() {
  elements.captureButton.disabled = true;
  setStatus('Starting capture…');
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'QUICKSHOT_START_CAPTURE',
      source: 'sidepanel'
    });
    if (!response?.ok) {
      throw new Error(response?.error || 'Unable to start capture.');
    }
    setStatus('Select an area on the page. Press Esc to cancel.');
  } catch (error) {
    setStatus(error.message, 'error');
  } finally {
    elements.captureButton.disabled = false;
  }
}

async function loadCapture(capture) {
  if (!capture?.dataUrl) {
    showEmptyState();
    return;
  }

  const image = await loadImage(capture.dataUrl);
  state.capture = capture;
  state.undoStack = [];
  state.redoStack = [];
  state.drawing = false;
  state.startPoint = null;
  state.previewImageData = null;

  elements.canvas.width = image.width;
  elements.canvas.height = image.height;
  state.ctx = elements.canvas.getContext('2d', { willReadFrequently: true });
  state.ctx.drawImage(image, 0, 0);

  elements.emptyState.hidden = true;
  elements.captureView.hidden = false;
  elements.captureDimensions.textContent = `${image.width} × ${image.height}`;
  elements.captureTime.textContent = formatCaptureTime(capture.createdAt);

  setActiveTool('arrow');
  updateHistoryButtons();
  applyMode();

  if (capture.clipboardResult?.ok) {
    setStatus('Captured and copied. Ready to edit.', 'success');
  } else if (state.settings?.autoCopyOnCapture) {
    setStatus('Captured. Automatic clipboard copy failed; use Copy below.', 'error');
  } else {
    setStatus('Capture ready.');
  }
}

function showEmptyState() {
  elements.emptyState.hidden = false;
  elements.captureView.hidden = true;
  setStatus('Ready.');
}

function applyMode() {
  const clipboardOnly = state.settings?.captureMode === 'clipboard_only';
  elements.clipboardOnlyNotice.hidden = !clipboardOnly;
  elements.editorControls.hidden = clipboardOnly;
  elements.canvas.style.cursor = clipboardOnly ? 'default' : 'crosshair';
}

function setActiveTool(tool) {
  state.currentTool = tool;
  document.querySelectorAll('[data-tool]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.tool === tool);
  });
  renderToolSettings(tool);
  setStatus(`${capitalize(tool)} tool active.`);
}

function renderToolSettings(tool) {
  const config = state.styles[tool];
  if (!config || tool === 'crop') {
    elements.toolSettings.innerHTML = tool === 'crop'
      ? '<div class="setting-row"><span>Crop</span><strong>Drag the area to keep</strong></div>'
      : '';
    return;
  }

  const rows = [];
  if ('color' in config) {
    rows.push(settingRow('Color', `<input type="color" data-setting="color" value="${config.color}" />`));
  }
  if ('width' in config) {
    rows.push(settingRow('Width', `<input type="range" data-setting="width" min="1" max="12" step="1" value="${config.width}" />`));
  }
  if ('lineStyle' in config) {
    rows.push(settingRow('Line', selectMarkup('lineStyle', [
      ['solid', 'Solid'],
      ['dashed', 'Dashed'],
      ['dotted', 'Dotted']
    ], config.lineStyle)));
  }
  if ('arrowMode' in config) {
    rows.push(settingRow('Arrow', selectMarkup('arrowMode', [
      ['classic', 'Classic'],
      ['double', 'Double'],
      ['line', 'Line only']
    ], config.arrowMode)));
  }
  if ('fontSize' in config) {
    rows.push(settingRow('Size', `<input type="range" data-setting="fontSize" min="12" max="72" step="2" value="${config.fontSize}" />`));
  }
  if ('blockSize' in config) {
    rows.push(settingRow('Blur', `<input type="range" data-setting="blockSize" min="3" max="30" step="1" value="${config.blockSize}" />`));
  }

  elements.toolSettings.innerHTML = rows.join('');
  elements.toolSettings.querySelectorAll('[data-setting]').forEach((input) => {
    input.addEventListener('input', () => {
      const key = input.dataset.setting;
      state.styles[tool][key] = input.type === 'range' ? Number(input.value) : input.value;
    });
  });
}

function handlePointerDown(event) {
  if (!state.ctx || state.settings?.captureMode === 'clipboard_only' || event.button !== 0) {
    return;
  }

  if (state.currentTool === 'text') {
    addTextAt(event);
    return;
  }

  if (!DRAWING_TOOLS.has(state.currentTool)) {
    return;
  }

  event.preventDefault();
  state.drawing = true;
  state.pointerId = event.pointerId;
  state.startPoint = toCanvasPoint(event);
  state.previewImageData = state.ctx.getImageData(0, 0, elements.canvas.width, elements.canvas.height);
  pushHistorySnapshot();
  elements.canvas.setPointerCapture(event.pointerId);
}

function handlePointerMove(event) {
  if (!state.drawing || event.pointerId !== state.pointerId || !state.startPoint || !state.previewImageData) {
    return;
  }

  const point = toCanvasPoint(event);
  const rect = getToolRect(state.startPoint, point, event);
  state.ctx.putImageData(state.previewImageData, 0, 0);

  if (state.currentTool === 'arrow') {
    drawArrow(state.startPoint, point, state.styles.arrow);
  } else if (state.currentTool === 'blur' || state.currentTool === 'crop') {
    drawPreviewRect(rect);
  } else if (state.currentTool === 'rect') {
    drawStyledRect(rect, state.styles.rect);
  } else if (state.currentTool === 'ellipse') {
    drawStyledEllipse(rect, state.styles.ellipse);
  }
}

function handlePointerUp(event) {
  if (!state.drawing || event.pointerId !== state.pointerId || !state.startPoint || !state.previewImageData) {
    return;
  }

  const point = toCanvasPoint(event);
  const rect = getToolRect(state.startPoint, point, event);
  state.ctx.putImageData(state.previewImageData, 0, 0);

  if (state.currentTool === 'arrow') {
    drawArrow(state.startPoint, point, state.styles.arrow);
    setStatus('Arrow added.', 'success');
  } else if (state.currentTool === 'blur') {
    applyBlur(rect);
    setStatus('Blur applied.', 'success');
  } else if (state.currentTool === 'rect') {
    drawStyledRect(rect, state.styles.rect);
    setStatus('Rectangle added.', 'success');
  } else if (state.currentTool === 'ellipse') {
    drawStyledEllipse(rect, state.styles.ellipse);
    setStatus('Ellipse added.', 'success');
  } else if (state.currentTool === 'crop') {
    applyCrop(rect);
  }

  finishDrawing(event.pointerId);
  updateHistoryButtons();
}

function handlePointerCancel(event) {
  if (!state.drawing || event.pointerId !== state.pointerId) {
    return;
  }
  if (state.previewImageData) {
    state.ctx.putImageData(state.previewImageData, 0, 0);
  }
  state.undoStack.pop();
  finishDrawing(event.pointerId);
  updateHistoryButtons();
}

function finishDrawing(pointerId) {
  if (elements.canvas.hasPointerCapture(pointerId)) {
    elements.canvas.releasePointerCapture(pointerId);
  }
  state.drawing = false;
  state.pointerId = null;
  state.startPoint = null;
  state.previewImageData = null;
}

function addTextAt(event) {
  const value = window.prompt('Text');
  if (!value) {
    return;
  }

  pushHistorySnapshot();
  const point = toCanvasPoint(event);
  const config = state.styles.text;
  state.ctx.save();
  state.ctx.font = `600 ${config.fontSize}px "Segoe UI"`;
  state.ctx.fillStyle = config.color;
  state.ctx.strokeStyle = '#ffffff';
  state.ctx.lineWidth = Math.max(2, Math.round(config.fontSize / 7));
  state.ctx.strokeText(value, point.x, point.y);
  state.ctx.fillText(value, point.x, point.y);
  state.ctx.restore();
  updateHistoryButtons();
  setStatus('Text added.', 'success');
}

function toCanvasPoint(event) {
  const rect = elements.canvas.getBoundingClientRect();
  const scaleX = elements.canvas.width / rect.width;
  const scaleY = elements.canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

function getToolRect(from, to, event) {
  if (state.currentTool === 'ellipse' && event.ctrlKey) {
    return normalizeSquareRect(from.x, from.y, to.x, to.y);
  }
  return normalizeRect(from.x, from.y, to.x, to.y);
}

function drawPreviewRect(rect) {
  state.ctx.save();
  state.ctx.strokeStyle = '#ffffff';
  state.ctx.lineWidth = 1.5;
  state.ctx.setLineDash([6, 4]);
  state.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  state.ctx.restore();
}

function drawStyledRect(rect, style) {
  applyStrokeStyle(style);
  state.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  state.ctx.restore();
}

function drawStyledEllipse(rect, style) {
  applyStrokeStyle(style);
  state.ctx.beginPath();
  state.ctx.ellipse(
    rect.x + rect.width / 2,
    rect.y + rect.height / 2,
    rect.width / 2,
    rect.height / 2,
    0,
    0,
    Math.PI * 2
  );
  state.ctx.stroke();
  state.ctx.restore();
}

function drawArrow(from, to, style) {
  const headLength = Math.max(10, style.width * 4);
  const angle = Math.atan2(to.y - from.y, to.x - from.x);

  applyStrokeStyle(style);
  state.ctx.beginPath();
  state.ctx.moveTo(from.x, from.y);
  state.ctx.lineTo(to.x, to.y);
  state.ctx.stroke();
  state.ctx.restore();

  if (style.arrowMode !== 'line') {
    drawArrowHead(to, angle, headLength, style.color);
    if (style.arrowMode === 'double') {
      drawArrowHead(from, angle + Math.PI, headLength, style.color);
    }
  }
}

function drawArrowHead(point, angle, headLength, color) {
  state.ctx.save();
  state.ctx.fillStyle = color;
  state.ctx.beginPath();
  state.ctx.moveTo(point.x, point.y);
  state.ctx.lineTo(
    point.x - headLength * Math.cos(angle - Math.PI / 7),
    point.y - headLength * Math.sin(angle - Math.PI / 7)
  );
  state.ctx.lineTo(
    point.x - headLength * Math.cos(angle + Math.PI / 7),
    point.y - headLength * Math.sin(angle + Math.PI / 7)
  );
  state.ctx.closePath();
  state.ctx.fill();
  state.ctx.restore();
}

function applyStrokeStyle(style) {
  state.ctx.save();
  state.ctx.strokeStyle = style.color;
  state.ctx.lineWidth = style.width;
  state.ctx.setLineDash(getLineDash(style.lineStyle));
  state.ctx.lineCap = 'round';
  state.ctx.lineJoin = 'round';
}

function applyBlur(rect) {
  const cleanRect = sanitizeRect(rect, elements.canvas.width, elements.canvas.height);
  if (!cleanRect) {
    setStatus('Blur area is too small.', 'error');
    return;
  }

  const source = document.createElement('canvas');
  source.width = cleanRect.width;
  source.height = cleanRect.height;
  source.getContext('2d').drawImage(
    elements.canvas,
    cleanRect.x,
    cleanRect.y,
    cleanRect.width,
    cleanRect.height,
    0,
    0,
    cleanRect.width,
    cleanRect.height
  );

  const blockSize = Math.max(2, state.styles.blur.blockSize);
  const down = document.createElement('canvas');
  down.width = Math.max(1, Math.floor(cleanRect.width / blockSize));
  down.height = Math.max(1, Math.floor(cleanRect.height / blockSize));
  const downCtx = down.getContext('2d');
  downCtx.imageSmoothingEnabled = true;
  downCtx.drawImage(source, 0, 0, down.width, down.height);

  state.ctx.imageSmoothingEnabled = false;
  state.ctx.drawImage(
    down,
    0,
    0,
    down.width,
    down.height,
    cleanRect.x,
    cleanRect.y,
    cleanRect.width,
    cleanRect.height
  );
  state.ctx.imageSmoothingEnabled = true;
}

function applyCrop(rect) {
  const cleanRect = sanitizeRect(rect, elements.canvas.width, elements.canvas.height);
  if (!cleanRect) {
    setStatus('Crop area is too small.', 'error');
    return;
  }

  const source = document.createElement('canvas');
  source.width = cleanRect.width;
  source.height = cleanRect.height;
  source.getContext('2d').drawImage(
    elements.canvas,
    cleanRect.x,
    cleanRect.y,
    cleanRect.width,
    cleanRect.height,
    0,
    0,
    cleanRect.width,
    cleanRect.height
  );

  elements.canvas.width = cleanRect.width;
  elements.canvas.height = cleanRect.height;
  state.ctx = elements.canvas.getContext('2d', { willReadFrequently: true });
  state.ctx.drawImage(source, 0, 0);
  elements.captureDimensions.textContent = `${cleanRect.width} × ${cleanRect.height}`;
  setStatus('Crop applied.', 'success');
}

function pushHistorySnapshot() {
  if (!state.ctx || !elements.canvas.width || !elements.canvas.height) {
    return;
  }
  state.undoStack.push(state.ctx.getImageData(0, 0, elements.canvas.width, elements.canvas.height));
  if (state.undoStack.length > MAX_HISTORY) {
    state.undoStack.shift();
  }
  state.redoStack = [];
}

function undo() {
  if (!state.undoStack.length || !state.ctx) {
    return;
  }
  state.redoStack.push(state.ctx.getImageData(0, 0, elements.canvas.width, elements.canvas.height));
  restoreImageData(state.undoStack.pop());
  updateHistoryButtons();
  setStatus('Undo applied.');
}

function redo() {
  if (!state.redoStack.length || !state.ctx) {
    return;
  }
  state.undoStack.push(state.ctx.getImageData(0, 0, elements.canvas.width, elements.canvas.height));
  restoreImageData(state.redoStack.pop());
  updateHistoryButtons();
  setStatus('Redo applied.');
}

function restoreImageData(imageData) {
  elements.canvas.width = imageData.width;
  elements.canvas.height = imageData.height;
  state.ctx = elements.canvas.getContext('2d', { willReadFrequently: true });
  state.ctx.putImageData(imageData, 0, 0);
  elements.captureDimensions.textContent = `${imageData.width} × ${imageData.height}`;
}

function updateHistoryButtons() {
  elements.undoButton.disabled = state.undoStack.length === 0;
  elements.redoButton.disabled = state.redoStack.length === 0;
}

async function copyCurrentImage() {
  if (!state.ctx || !window.QuickShotClipboardEngine) {
    setStatus('Clipboard engine unavailable.', 'error');
    return;
  }

  const result = await window.QuickShotClipboardEngine.writeImageDataUrl(elements.canvas.toDataURL('image/png'));
  if (result.ok) {
    setStatus('Edited image copied.', 'success');
  } else {
    setStatus(`Clipboard failed: ${result.error}`, 'error');
  }
}

function saveImage(format) {
  if (!state.ctx) {
    return;
  }

  const isJpg = format === 'jpg';
  const type = isJpg ? 'image/jpeg' : 'image/png';
  const quality = isJpg ? state.settings?.jpgQuality ?? 0.92 : undefined;
  const link = document.createElement('a');
  link.href = elements.canvas.toDataURL(type, quality);
  link.download = formatNowFilename(format);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setStatus(`Saved ${format.toUpperCase()}.`, 'success');
}

function handleKeyboardShortcut(event) {
  if (!state.ctx || state.settings?.captureMode === 'clipboard_only') {
    return;
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.shiftKey) {
    event.preventDefault();
    undo();
  } else if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey))) {
    event.preventDefault();
    redo();
  } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
    event.preventDefault();
    copyCurrentImage();
  }
}

function setStatus(text, level = 'info') {
  elements.status.textContent = text;
  elements.status.dataset.level = level;
}

function settingRow(label, control) {
  return `<label class="setting-row"><span>${label}</span>${control}</label>`;
}

function selectMarkup(name, options, currentValue) {
  const optionMarkup = options.map(([value, label]) => (
    `<option value="${value}"${value === currentValue ? ' selected' : ''}>${label}</option>`
  )).join('');
  return `<select data-setting="${name}">${optionMarkup}</select>`;
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to load captured image.'));
    image.src = dataUrl;
  });
}

function normalizeRect(x1, y1, x2, y2) {
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1)
  };
}

function normalizeSquareRect(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const size = Math.min(Math.abs(dx), Math.abs(dy));
  return {
    x: dx >= 0 ? x1 : x1 - size,
    y: dy >= 0 ? y1 : y1 - size,
    width: size,
    height: size
  };
}

function sanitizeRect(rect, maxWidth, maxHeight) {
  const x = Math.max(0, Math.round(rect.x));
  const y = Math.max(0, Math.round(rect.y));
  const width = Math.min(maxWidth - x, Math.max(0, Math.round(rect.width)));
  const height = Math.min(maxHeight - y, Math.max(0, Math.round(rect.height)));
  return width < 2 || height < 2 ? null : { x, y, width, height };
}

function getLineDash(lineStyle) {
  if (lineStyle === 'dashed') {
    return [10, 6];
  }
  if (lineStyle === 'dotted') {
    return [2, 6];
  }
  return [];
}

function formatNowFilename(format) {
  const now = new Date();
  const date = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
    .map((value, index) => index === 0 ? String(value) : String(value).padStart(2, '0'))
    .join('');
  const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((value) => String(value).padStart(2, '0'))
    .join('');
  return `quickshot_${date}_${time}.${format}`;
}

function formatCaptureTime(value) {
  if (!value) {
    return '';
  }
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
