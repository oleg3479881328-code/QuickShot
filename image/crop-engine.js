import { clampRect } from '../utils/image-utils.js';

export async function cropCapturedImage({ sourceDataUrl, selection, viewport }) {
  const bitmap = await loadBitmapFromDataUrl(sourceDataUrl);

  if (!viewport.width || !viewport.height) {
    throw new Error('Invalid viewport size for crop mapping.');
  }

  const scaleX = bitmap.width / viewport.width;
  const scaleY = bitmap.height / viewport.height;

  const srcRect = clampRect({
    x: Math.round(selection.x * scaleX),
    y: Math.round(selection.y * scaleY),
    width: Math.round(selection.width * scaleX),
    height: Math.round(selection.height * scaleY)
  }, bitmap.width, bitmap.height);

  if (srcRect.width < 1 || srcRect.height < 1) {
    throw new Error('Selected area is too small to crop.');
  }

  const canvas = new OffscreenCanvas(srcRect.width, srcRect.height);
  const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: false });

  ctx.drawImage(
    bitmap,
    srcRect.x,
    srcRect.y,
    srcRect.width,
    srcRect.height,
    0,
    0,
    srcRect.width,
    srcRect.height
  );

  const blob = await canvas.convertToBlob({ type: 'image/png' });
  const dataUrl = await blobToDataUrl(blob);

  bitmap.close();

  return {
    blob,
    dataUrl,
    width: srcRect.width,
    height: srcRect.height
  };
}

async function loadBitmapFromDataUrl(dataUrl) {
  const blob = dataUrlToBlob(dataUrl);
  return createImageBitmap(blob);
}

async function blobToDataUrl(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return `data:${blob.type};base64,${btoa(binary)}`;
}

function dataUrlToBlob(dataUrl) {
  const [header, base64] = String(dataUrl).split(',');
  if (!header || !base64) {
    throw new Error('Invalid image data.');
  }

  const mimeMatch = /data:(.*?);base64/.exec(header);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mime });
}
