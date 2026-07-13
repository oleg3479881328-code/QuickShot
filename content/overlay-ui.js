(function initOverlayUi() {
  if (window.__quickShotOverlayInit) {
    return;
  }
  window.__quickShotOverlayInit = true;

  const OVERLAY_ROOT_ID = 'quickshot-overlay-root';

  class QuickShotSelectionSession {
    constructor() {
      this.root = null;
      this.selectionBox = null;
      this.selectionLabel = null;
      this.hint = null;
      this.engine = null;
    }

    start() {
      this.destroy();
      this.mount();

      this.engine = new window.QuickShotSelectionEngine({
        element: this.root,
        onStart: (rect) => this.render(rect),
        onChange: (rect) => this.render(rect),
        onComplete: (rect) => this.finish(rect),
        onCancel: () => this.cancel()
      });

      this.engine.activate();
    }

    mount() {
      this.root = document.createElement('div');
      this.root.id = OVERLAY_ROOT_ID;
      this.root.className = 'quickshot-overlay';

      this.selectionBox = document.createElement('div');
      this.selectionBox.className = 'quickshot-selection';

      for (const handleName of ['nw', 'ne', 'sw', 'se']) {
        const handle = document.createElement('span');
        handle.className = `quickshot-selection-handle quickshot-selection-handle-${handleName}`;
        this.selectionBox.appendChild(handle);
      }

      this.selectionLabel = document.createElement('div');
      this.selectionLabel.className = 'quickshot-selection-label';
      this.selectionBox.appendChild(this.selectionLabel);

      this.hint = document.createElement('div');
      this.hint.className = 'quickshot-hint';
      this.hint.textContent = 'Drag to capture. Press Esc to cancel.';

      this.root.appendChild(this.selectionBox);
      this.root.appendChild(this.hint);
      document.documentElement.appendChild(this.root);
      document.documentElement.classList.add('quickshot-no-select');
    }

    render(rect) {
      if (!this.selectionBox || !this.selectionLabel) {
        return;
      }

      this.selectionBox.style.left = `${rect.x}px`;
      this.selectionBox.style.top = `${rect.y}px`;
      this.selectionBox.style.width = `${rect.width}px`;
      this.selectionBox.style.height = `${rect.height}px`;
      this.selectionBox.style.display = 'block';
      this.selectionLabel.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
    }

    async finish(rect) {
      if (rect.width < 8 || rect.height < 8) {
        showToast('Selection is too small.', 'error');
        await this.cancel();
        return;
      }

      const selection = {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        scrollX: window.scrollX,
        scrollY: window.scrollY
      };

      this.destroy();
      await nextPaint();
      await nextPaint();

      try {
        const response = await chrome.runtime.sendMessage({
          type: 'QUICKSHOT_SELECTION_DONE',
          selection
        });
        if (!response?.ok) {
          throw new Error(response?.error || 'Capture failed.');
        }
      } catch (error) {
        showToast(`Capture failed: ${error.message}`, 'error');
      }
    }

    async cancel() {
      this.destroy();
      await chrome.runtime.sendMessage({ type: 'QUICKSHOT_SELECTION_CANCELLED' });
    }

    destroy() {
      this.engine?.destroy();
      this.engine = null;

      if (this.root?.parentNode) {
        this.root.parentNode.removeChild(this.root);
      }

      this.root = null;
      this.selectionBox = null;
      this.selectionLabel = null;
      this.hint = null;
      document.documentElement.classList.remove('quickshot-no-select');
    }
  }

  const selectionSession = new QuickShotSelectionSession();

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || !message.type) {
      return;
    }

    if (message.type === 'QUICKSHOT_START_SELECTION') {
      selectionSession.start();
      sendResponse({ ok: true });
      return;
    }

    if (message.type === 'QUICKSHOT_CLIPBOARD_WRITE') {
      if (!window.QuickShotClipboardEngine) {
        sendResponse({ ok: false, error: 'Clipboard engine is unavailable.' });
        return;
      }

      window.QuickShotClipboardEngine.writeImageDataUrl(message.dataUrl)
        .then((result) => {
          if (!result.ok) {
            showToast('Clipboard copy failed.', 'error');
          }
          sendResponse(result);
        })
        .catch((error) => sendResponse({ ok: false, error: error.message }));
      return true;
    }

    if (message.type === 'QUICKSHOT_STATUS_TOAST') {
      showToast(message.text, message.level || 'info');
      sendResponse({ ok: true });
    }
  });

  function showToast(text, level = 'info') {
    const finalText = level === 'error' && !String(text).startsWith('Error:')
      ? `Error: ${text}`
      : text;

    const toast = document.createElement('div');
    toast.className = `quickshot-toast quickshot-toast-${level}`;
    toast.textContent = finalText;

    document.documentElement.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('quickshot-toast-hide');
      setTimeout(() => toast.remove(), 200);
    }, 1800);
  }

  function nextPaint() {
    return new Promise((resolve) => requestAnimationFrame(resolve));
  }
})();
