(function initSelectionEngine() {
  if (window.QuickShotSelectionEngine) {
    return;
  }

  class QuickShotSelectionEngine {
    constructor({ element, onStart, onChange, onComplete, onCancel }) {
      this.element = element;
      this.onStart = onStart;
      this.onChange = onChange;
      this.onComplete = onComplete;
      this.onCancel = onCancel;

      this.dragging = false;
      this.startPoint = null;
      this.currentRect = null;

      this.handlePointerDown = this.handlePointerDown.bind(this);
      this.handlePointerMove = this.handlePointerMove.bind(this);
      this.handlePointerUp = this.handlePointerUp.bind(this);
      this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    activate() {
      this.element.addEventListener('pointerdown', this.handlePointerDown);
      window.addEventListener('pointermove', this.handlePointerMove, true);
      window.addEventListener('pointerup', this.handlePointerUp, true);
      window.addEventListener('keydown', this.handleKeyDown, true);
    }

    destroy() {
      this.element.removeEventListener('pointerdown', this.handlePointerDown);
      window.removeEventListener('pointermove', this.handlePointerMove, true);
      window.removeEventListener('pointerup', this.handlePointerUp, true);
      window.removeEventListener('keydown', this.handleKeyDown, true);
    }

    handlePointerDown(event) {
      if (event.button !== 0) {
        return;
      }

      event.preventDefault();
      this.dragging = true;
      this.startPoint = { x: event.clientX, y: event.clientY };
      this.currentRect = normalizeRect(this.startPoint.x, this.startPoint.y, event.clientX, event.clientY);

      this.element.setPointerCapture?.(event.pointerId);
      this.onStart?.(this.currentRect);
    }

    handlePointerMove(event) {
      if (!this.dragging || !this.startPoint) {
        return;
      }

      event.preventDefault();
      this.currentRect = normalizeRect(
        this.startPoint.x,
        this.startPoint.y,
        event.clientX,
        event.clientY
      );

      this.onChange?.(this.currentRect);
    }

    handlePointerUp(event) {
      if (!this.dragging || !this.startPoint) {
        return;
      }

      event.preventDefault();
      this.dragging = false;
      this.currentRect = normalizeRect(
        this.startPoint.x,
        this.startPoint.y,
        event.clientX,
        event.clientY
      );

      this.onComplete?.(this.currentRect);
      this.startPoint = null;
    }

    handleKeyDown(event) {
      if (event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      this.dragging = false;
      this.startPoint = null;
      this.currentRect = null;
      this.onCancel?.();
    }
  }

  function normalizeRect(x1, y1, x2, y2) {
    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);

    return { x, y, width, height };
  }

  window.QuickShotSelectionEngine = QuickShotSelectionEngine;
})();
