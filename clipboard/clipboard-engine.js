(function initClipboardEngine() {
  if (window.QuickShotClipboardEngine) {
    return;
  }

  async function writeImageDataUrl(dataUrl) {
    try {
      if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
        throw new Error('Clipboard API is not available in this context.');
      }

      const blob = dataUrlToBlob(dataUrl);

      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type || 'image/png']: blob })
      ]);

      return { ok: true, error: null };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  window.QuickShotClipboardEngine = {
    writeImageDataUrl
  };

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
})();
