import { getSettings } from '../utils/settings.js';
import { createDownload, formatNowFilename, normalizeRect } from '../utils/image-utils.js';

const canvas = document.getElementById('editorCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const dragSurface = document.getElementById('dragSurface');
const dragPreview = document.getElementById('dragPreview');
const statusText = document.getElementById('statusText');
const applyCropBtn = document.getElementById('applyCropBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const dragOutBtn = document.getElementById('dragOutBtn');
const lineStyleSelect = document.getElementById('lineStyleSelect');
const strokeColorInput = document.getElementById('strokeColorInput');
const strokeWidthInput = document.getElementById('strokeWidthInput');
const arrowModeSelect = document.getElementById('arrowModeSelect');

let currentTool = 'arrow';
let settings = null;
let drawing = false;
let startPoint = null;
let previewImageData = null;
let pendingCropRect = null;
let undoStack = [];
let redoStack = [];
const MAX_HISTORY = 30;
let dragOutEnabled = false;
let drawStyle = {
  lineStyle: 'solid',
  strokeColor: '#ff3b30',
  strokeWidth: 3,
  arrowMode: 'classic'
};

init().catch((error) => setStatus(error.message, 'error'));

async function init() {
  settings = await getSettings();
  wireToolbar();
  wireCanvasHandlers();
  wireKeyboardHandlers();
  await loadInitialCapture();
}

function wireToolbar() {
  document.querySelectorAll('[data-tool]').forEach((button) => {
    button.addEventListener('click', () => {
      disableDragOutMode();
      document.querySelectorAll('[data-tool]').forEach((el) => el.classList.remove('is-active'));
      button.classList.add('is-active');
      currentTool = button.dataset.tool;
      pendingCropRect = null;
      updateApplyCropButton();
      setStatus(`Tool: ${currentTool}`);
    });
  });

  document.getElementById('copyBtn').addEventListener('click', copyCurrentImage);
  document.getElementById('savePngBtn').addEventListener('click', () => saveImage('png'));
  document.getElementById('saveJpgBtn').addEventListener('click', () => saveImage('jpg'));
  undoBtn.addEventListener('click', undoLastChange);
  redoBtn.addEventListener('click', redoLastChange);
  lineStyleSelect.addEventListener('change', () => {
    drawStyle.lineStyle = lineStyleSelect.value;
  });
  strokeColorInput.addEventListener('input', () => {
    drawStyle.strokeColor = strokeColorInput.value;
  });
  strokeWidthInput.addEventListener('input', () => {
    drawStyle.strokeWidth = Number(strokeWidthInput.value);
  });
  arrowModeSelect.addEventListener('change', () => {
    drawStyle.arrowMode = arrowModeSelect.value;
  });
  applyCropBtn.addEventListener('click', () => {
    if (!pendingCropRect) {
      return;
    }
    applyCrop(pendingCropRect);
  });
  wireDragOut();

  syncStyleControls();
}

function wireCanvasHandlers() {
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('click', onCanvasClick);
}

function wireKeyboardHandlers() {
  window.addEventListener('keydown', async (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.shiftKey) {
      event.preventDefault();
      undoLastChange();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey))) {
      event.preventDefault();
      redoLastChange();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      await copyCurrentImage();
      return;
    }

    if (event.key === 'Enter' && pendingCropRect) {
      event.preventDefault();
      applyCrop(pendingCropRect);
    }
  });
}

async function loadInitialCapture() {
  const payload = await chrome.storage.local.get('quickshotLastCapture');
  const capture = payload.quickshotLastCapture;

  if (!capture?.dataUrl) {
    throw new Error('No capture found. Run QuickShot first.');
  }

  await drawDataUrl(capture.dataUrl);

  if (capture.clipboardResult && !capture.clipboardResult.ok && !capture.clipboardResult.skipped) {
    setStatus(`Clipboard copy failed: ${capture.clipboardResult.error || 'Unknown error'}`, 'error');
  } else {
    setStatus('Capture loaded.');
  }
}

async function drawDataUrl(dataUrl) {
  const image = await loadImage(dataUrl);
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);
  syncDragSurface();
  undoStack = [];
  redoStack = [];
  updateHistoryButtons();
}

function onMouseDown(event) {
  if (dragOutEnabled) {
    return;
  }

  if (!['arrow', 'blur', 'crop', 'rect', 'ellipse'].includes(currentTool)) {
    return;
  }

  drawing = true;
  startPoint = toCanvasPoint(event);
  if (currentTool !== 'crop') {
    pushHistorySnapshot();
  }
  previewImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  pendingCropRect = null;
  updateApplyCropButton();
}

function onMouseMove(event) {
  if (dragOutEnabled) {
    return;
  }

  if (!drawing || !startPoint || !previewImageData) {
    return;
  }

  const point = toCanvasPoint(event);
  const rect = normalizeRect(startPoint.x, startPoint.y, point.x, point.y);
  ctx.putImageData(previewImageData, 0, 0);

  if (currentTool === 'arrow') {
    drawArrow(startPoint, point, {
      color: drawStyle.strokeColor,
      width: drawStyle.strokeWidth,
      lineStyle: drawStyle.lineStyle,
      mode: drawStyle.arrowMode
    });
  }

  if (currentTool === 'blur' || currentTool === 'crop') {
    drawPreviewRect(rect, currentTool === 'crop' ? '#f59e0b' : '#00bcd4');
  }

  if (currentTool === 'rect') {
    drawStyledRect(rect, {
      color: drawStyle.strokeColor,
      width: drawStyle.strokeWidth,
      lineStyle: drawStyle.lineStyle
    });
  }

  if (currentTool === 'ellipse') {
    drawStyledEllipse(rect, {
      color: drawStyle.strokeColor,
      width: drawStyle.strokeWidth,
      lineStyle: drawStyle.lineStyle
    });
  }
}

function onMouseUp(event) {
  if (dragOutEnabled) {
    return;
  }

  if (!drawing || !startPoint) {
    return;
  }

  drawing = false;

  const point = toCanvasPoint(event);
  const rect = normalizeRect(startPoint.x, startPoint.y, point.x, point.y);

  if (currentTool === 'blur') {
    ctx.putImageData(previewImageData, 0, 0);
    applyBlur(rect);
    setStatus('Blur applied.');
    syncDragSurface();
  }

  if (currentTool === 'crop') {
    ctx.putImageData(previewImageData, 0, 0);
    pendingCropRect = rect;
    updateApplyCropButton();
    drawPreviewRect(rect, '#f59e0b');
    setStatus('Press Enter or click Apply Crop to confirm.');
  }

  if (currentTool === 'arrow') {
    ctx.putImageData(previewImageData, 0, 0);
    drawArrow(startPoint, point, {
      color: drawStyle.strokeColor,
      width: drawStyle.strokeWidth,
      lineStyle: drawStyle.lineStyle,
      mode: drawStyle.arrowMode
    });
    setStatus('Arrow added.');
    syncDragSurface();
  }

  if (currentTool === 'rect') {
    ctx.putImageData(previewImageData, 0, 0);
    drawStyledRect(rect, {
      color: drawStyle.strokeColor,
      width: drawStyle.strokeWidth,
      lineStyle: drawStyle.lineStyle
    });
    setStatus('Rectangle added.');
    syncDragSurface();
  }

  if (currentTool === 'ellipse') {
    ctx.putImageData(previewImageData, 0, 0);
    drawStyledEllipse(rect, {
      color: drawStyle.strokeColor,
      width: drawStyle.strokeWidth,
      lineStyle: drawStyle.lineStyle
    });
    setStatus('Ellipse added.');
    syncDragSurface();
  }

  startPoint = null;
  previewImageData = null;
}

function onCanvasClick(event) {
  if (dragOutEnabled) {
    return;
  }

  if (currentTool !== 'text') {
    return;
  }

  const value = prompt('Text:');
  if (!value) {
    return;
  }

  pushHistorySnapshot();
  const point = toCanvasPoint(event);
  ctx.font = '600 22px Segoe UI';
  ctx.fillStyle = '#ffeb3b';
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 3;
  ctx.strokeText(value, point.x, point.y);
  ctx.fillText(value, point.x, point.y);
  setStatus('Text added.');
  syncDragSurface();
}

function applyBlur(rect) {
  const cleanRect = sanitizeRect(rect);
  if (!cleanRect) {
    return;
  }

  const source = document.createElement('canvas');
  source.width = cleanRect.width;
  source.height = cleanRect.height;
  const sourceCtx = source.getContext('2d');
  sourceCtx.drawImage(
    canvas,
    cleanRect.x,
    cleanRect.y,
    cleanRect.width,
    cleanRect.height,
    0,
    0,
    cleanRect.width,
    cleanRect.height
  );

  const down = document.createElement('canvas');
  down.width = Math.max(1, Math.floor(cleanRect.width / 10));
  down.height = Math.max(1, Math.floor(cleanRect.height / 10));
  const downCtx = down.getContext('2d');
  downCtx.imageSmoothingEnabled = true;
  downCtx.drawImage(source, 0, 0, down.width, down.height);

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(down, 0, 0, down.width, down.height, cleanRect.x, cleanRect.y, cleanRect.width, cleanRect.height);
  ctx.imageSmoothingEnabled = true;
}

function applyCrop(rect) {
  const cleanRect = sanitizeRect(rect);
  if (!cleanRect) {
    setStatus('Crop area is too small.', 'error');
    return;
  }

  pushHistorySnapshot();
  const target = document.createElement('canvas');
  target.width = cleanRect.width;
  target.height = cleanRect.height;
  const targetCtx = target.getContext('2d');
  targetCtx.drawImage(
    canvas,
    cleanRect.x,
    cleanRect.y,
    cleanRect.width,
    cleanRect.height,
    0,
    0,
    cleanRect.width,
    cleanRect.height
  );

  canvas.width = cleanRect.width;
  canvas.height = cleanRect.height;
  ctx.drawImage(target, 0, 0);

  pendingCropRect = null;
  updateApplyCropButton();
  setStatus('Crop applied.', 'success');
  syncDragSurface();
}

async function saveImage(format) {
  const type = format === 'jpg' ? 'image/jpeg' : 'image/png';
  const quality = format === 'jpg' ? settings.jpgQuality : undefined;
  const dataUrl = canvas.toDataURL(type, quality);

  createDownload(dataUrl, formatNowFilename(format));
  setStatus(`Saved as ${format.toUpperCase()}.`, 'success');
}

async function copyCurrentImage() {
  if (!window.QuickShotClipboardEngine) {
    setStatus('Clipboard engine unavailable.', 'error');
    return;
  }

  const dataUrl = canvas.toDataURL('image/png');
  const result = await window.QuickShotClipboardEngine.writeImageDataUrl(dataUrl);

  if (result.ok) {
    setStatus('Copied to clipboard.', 'success');
  } else {
    setStatus(`Clipboard failed: ${result.error}`, 'error');
  }
}

function sanitizeRect(rect) {
  const x = Math.max(0, Math.round(rect.x));
  const y = Math.max(0, Math.round(rect.y));
  const width = Math.min(canvas.width - x, Math.max(0, Math.round(rect.width)));
  const height = Math.min(canvas.height - y, Math.max(0, Math.round(rect.height)));

  if (width < 2 || height < 2) {
    return null;
  }

  return { x, y, width, height };
}

function drawPreviewRect(rect, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 4]);
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  ctx.restore();
}

function drawStyledRect(rect, style) {
  applyStrokeStyle(style);
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  ctx.restore();
}

function drawStyledEllipse(rect, style) {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const rx = rect.width / 2;
  const ry = rect.height / 2;

  applyStrokeStyle(style);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawArrow(from, to, style) {
  const width = style.width;
  const color = style.color;
  const mode = style.mode || 'classic';
  const headLength = Math.max(10, width * 4);
  const angle = Math.atan2(to.y - from.y, to.x - from.x);

  applyStrokeStyle(style);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  if (mode !== 'line') {
    drawArrowHead(to, angle, headLength, color);
    if (mode === 'double') {
      drawArrowHead(from, angle + Math.PI, headLength, color);
    }
  }

  ctx.restore();
}

function drawArrowHead(point, angle, headLength, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(point.x, point.y);
  ctx.lineTo(
    point.x - headLength * Math.cos(angle - Math.PI / 7),
    point.y - headLength * Math.sin(angle - Math.PI / 7)
  );
  ctx.lineTo(
    point.x - headLength * Math.cos(angle + Math.PI / 7),
    point.y - headLength * Math.sin(angle + Math.PI / 7)
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function applyStrokeStyle(style) {
  ctx.save();
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.width;
  ctx.setLineDash(getLineDash(style.lineStyle));
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
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

function toCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to load captured image.'));
    image.src = dataUrl;
  });
}

function setStatus(message, type = 'info') {
  const finalMessage = type === 'error' && !String(message).startsWith('Error:')
    ? `Error: ${message}`
    : message;

  statusText.textContent = finalMessage;
  statusText.classList.remove('is-success', 'is-error');

  if (type === 'success') {
    statusText.classList.add('is-success');
  }

  if (type === 'error') {
    statusText.classList.add('is-error');
  }
}

function updateApplyCropButton() {
  applyCropBtn.disabled = !pendingCropRect;
}

function pushHistorySnapshot() {
  if (!canvas.width || !canvas.height) {
    return;
  }

  undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  if (undoStack.length > MAX_HISTORY) {
    undoStack.shift();
  }

  redoStack = [];
  updateHistoryButtons();
}

function undoLastChange() {
  if (!undoStack.length || !canvas.width || !canvas.height) {
    return;
  }

  redoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  const previous = undoStack.pop();
  canvas.width = previous.width;
  canvas.height = previous.height;
  ctx.putImageData(previous, 0, 0);

  pendingCropRect = null;
  updateApplyCropButton();
  updateHistoryButtons();
  setStatus('Undo applied.');
  syncDragSurface();
}

function redoLastChange() {
  if (!redoStack.length || !canvas.width || !canvas.height) {
    return;
  }

  undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  const next = redoStack.pop();
  canvas.width = next.width;
  canvas.height = next.height;
  ctx.putImageData(next, 0, 0);

  pendingCropRect = null;
  updateApplyCropButton();
  updateHistoryButtons();
  setStatus('Redo applied.');
  syncDragSurface();
}

function updateHistoryButtons() {
  undoBtn.disabled = undoStack.length === 0;
  redoBtn.disabled = redoStack.length === 0;
}

function syncStyleControls() {
  lineStyleSelect.value = drawStyle.lineStyle;
  strokeColorInput.value = drawStyle.strokeColor;
  strokeWidthInput.value = String(drawStyle.strokeWidth);
  arrowModeSelect.value = drawStyle.arrowMode;
}

function wireDragOut() {
  let currentObjectUrl = null;

  dragOutBtn.addEventListener('click', () => {
    if (dragOutEnabled) {
      disableDragOutMode();
      setStatus('Drag Out mode disabled.');
      return;
    }

    syncDragSurface();
    dragOutEnabled = true;
    dragSurface.draggable = true;
    dragOutBtn.classList.add('is-active');
    dragSurface.classList.add('drag-out-enabled');
    setStatus('Drag Out mode enabled. Drag the image into another window or app.');
  });

  dragSurface.addEventListener('dragstart', (event) => {
    if (!dragOutEnabled || !canvas.width || !canvas.height || !event.dataTransfer) {
      event.preventDefault();
      return;
    }

    const filename = formatNowFilename('png');
    const blob = canvasToBlob();
    const file = new File([blob], filename, { type: 'image/png' });
    currentObjectUrl = URL.createObjectURL(file);
    dragSurface.href = currentObjectUrl;
    dragSurface.download = filename;

    // Preferred by Chromium for dragging downloadable files.
    // Also add File object for real drop targets (desktop/apps/chat inputs).
    if (event.dataTransfer.items && typeof event.dataTransfer.items.add === 'function') {
      try {
        event.dataTransfer.items.add(file);
      } catch (_error) {
        // Fallback to URL-based drag payload below.
      }
    }

    event.dataTransfer.setData('DownloadURL', `image/png:${filename}:${currentObjectUrl}`);
    event.dataTransfer.setData('text/uri-list', currentObjectUrl);
    event.dataTransfer.setData('text/plain', filename);
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setDragImage(dragPreview, Math.max(1, dragPreview.width / 2), Math.max(1, dragPreview.height / 2));
    setStatus('Dragging image...');
  });

  dragSurface.addEventListener('dragend', () => {
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
      dragSurface.removeAttribute('href');
    }
  });

  disableDragOutMode = function disableDragOutModeImpl() {
    dragOutEnabled = false;
    dragSurface.draggable = false;
    dragOutBtn.classList.remove('is-active');
    dragSurface.classList.remove('drag-out-enabled');
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
    }
    dragSurface.removeAttribute('href');
  };

  syncDragSurface = function syncDragSurfaceImpl() {
    if (!canvas.width || !canvas.height) {
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
        currentObjectUrl = null;
      }
      dragSurface.removeAttribute('href');
      dragPreview.removeAttribute('src');
      return;
    }

    dragPreview.src = canvas.toDataURL('image/png');
  };
}

let disableDragOutMode = function noopDisableDragOutMode() {};
let syncDragSurface = function noopSyncDragSurface() {};

function canvasToBlob() {
  const dataUrl = canvas.toDataURL('image/png');
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = /data:(.*?);base64/.exec(header);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: mime });
}
