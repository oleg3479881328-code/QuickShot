import { cropCapturedImage } from '../image/crop-engine.js';

export class QuickShotCaptureController {
  async captureSelection({ tabId, windowId, selection, settings }) {
    const rawCaptureDataUrl = await chrome.tabs.captureVisibleTab(windowId, { format: 'png' });

    const cropped = await cropCapturedImage({
      sourceDataUrl: rawCaptureDataUrl,
      selection,
      viewport: {
        width: selection.viewportWidth,
        height: selection.viewportHeight
      }
    });

    let clipboardResult = { ok: false, skipped: !settings.autoCopyOnCapture, error: null };
    if (settings.autoCopyOnCapture) {
      clipboardResult = await this.#requestClipboardWrite(tabId, cropped.dataUrl);
    }

    return {
      ...cropped,
      clipboardResult
    };
  }

  async #requestClipboardWrite(tabId, dataUrl) {
    try {
      const response = await sendTabMessageWithTimeout(tabId, {
        type: 'QUICKSHOT_CLIPBOARD_WRITE',
        dataUrl
      }, 4000);

      if (response?.ok) {
        return { ok: true, skipped: false, error: null };
      }

      return {
        ok: false,
        skipped: false,
        error: response?.error || 'Clipboard write rejected.'
      };
    } catch (error) {
      return {
        ok: false,
        skipped: false,
        error: error.message
      };
    }
  }
}

function sendTabMessageWithTimeout(tabId, message, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Clipboard request timed out.'));
    }, timeoutMs);

    chrome.tabs.sendMessage(tabId, message)
      .then((response) => {
        clearTimeout(timeout);
        resolve(response);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}
