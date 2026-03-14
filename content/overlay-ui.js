(function initOverlayUi() {
  if (window.__quickShotOverlayInit) {
    return;
  }
  window.__quickShotOverlayInit = true;

  const OVERLAY_ROOT_ID = 'quickshot-overlay-root';
  const MAX_HISTORY = 30;
  const TOOL_ORDER = ['arrow', 'text', 'blur', 'rect', 'ellipse', 'crop'];
  const SETTINGS_TOOLS = new Set(['arrow', 'text', 'rect', 'ellipse', 'blur']);
  const COLOR_SWATCHES = [
    '#111111',
    '#ffffff',
    '#d92d20',
    '#f97316',
    '#facc15',
    '#22c55e',
    '#06b6d4',
    '#2563eb',
    '#7c3aed',
    '#ec4899'
  ];
  const STROKE_WIDTHS = [1, 2, 3, 4, 6, 8];
  const TEXT_SIZES = [14, 18, 22, 28, 36];
  const BLUR_SIZES = [4, 6, 8, 10, 14, 18, 22];

  const TOOL_ICONS = {
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18L18 6"/><path d="M12 6H18V12"/></svg>',
    text: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6H19"/><path d="M12 6V18"/><path d="M8 18H16"/></svg>',
    blur: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="5" height="5"/><rect x="14" y="5" width="5" height="5"/><rect x="9.5" y="14" width="5" height="5"/></svg>',
    rect: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="7" width="14" height="10" rx="1"/></svg>',
    ellipse: '<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="12" rx="7" ry="5"/></svg>',
    crop: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4V15C8 17.2 9.8 19 12 19H20"/><path d="M4 8H15C17.2 8 19 9.8 19 12V20"/></svg>',
    undo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7L5 11L9 15"/><path d="M19 18A7 7 0 0 0 9 7H5"/></svg>',
    redo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 7L19 11L15 15"/><path d="M5 18A7 7 0 0 1 15 7H19"/></svg>',
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="10" height="11" rx="1"/><path d="M7 15H6C5.4 15 5 14.6 5 14V5C5 4.4 5.4 4 6 4H14C14.6 4 15 4.4 15 5V6"/></svg>',
    save: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4H16L19 7V20H6Z"/><path d="M9 4V10H15V4"/><path d="M9 16H15"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6L18 18"/><path d="M18 6L6 18"/></svg>'
  };

  class QuickShotOverlaySession {
    constructor() {
      this.root = null;
      this.selectionBox = null;
      this.selectionLabel = null;
      this.hint = null;
      this.engine = null;
      this.mode = 'idle';

      this.editor = {
        shell: null,
        dock: null,
        stage: null,
        canvas: null,
        ctx: null,
        toolbar: null,
        settingsPanel: null,
        exportPanel: null,
        status: null,
        currentTool: 'arrow',
        scale: 1,
        displayWidth: 0,
        displayHeight: 0,
        drawing: false,
        startPoint: null,
        previewImageData: null,
        undoStack: [],
        redoStack: [],
        capture: null,
        styles: {
          arrow: { color: '#d92d20', width: 3, lineStyle: 'solid', arrowMode: 'classic' },
          text: { color: '#d92d20', fontSize: 20 },
          rect: { color: '#d92d20', width: 2, lineStyle: 'solid' },
          ellipse: { color: '#d92d20', width: 2, lineStyle: 'solid' },
          blur: { blockSize: 10 }
        }
      };

      this.handleGlobalPointerDown = this.handleGlobalPointerDown.bind(this);
      this.handleGlobalKeyDown = this.handleGlobalKeyDown.bind(this);
      this.handleEditorMouseMove = this.handleEditorMouseMove.bind(this);
      this.handleEditorMouseUp = this.handleEditorMouseUp.bind(this);
    }

    start() {
      this.destroyEditor();
      this.destroySelection();
      this.mode = 'selection';
      this.mountSelection();

      this.engine = new window.QuickShotSelectionEngine({
        element: this.root,
        onStart: (rect) => this.renderSelection(rect),
        onChange: (rect) => this.renderSelection(rect),
        onComplete: (rect) => this.finishSelection(rect),
        onCancel: () => this.cancelSelection()
      });

      this.engine.activate();
    }

    mountSelection() {
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

    renderSelection(rect) {
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

    async finishSelection(rect) {
      if (rect.width < 8 || rect.height < 8) {
        showToast('Selection is too small.', 'error');
        this.cancelSelection();
        return;
      }

      const selectionPayload = {
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

      this.destroySelection();
      await waitForNextPaint();
      await waitForNextPaint();

      try {
        await chrome.runtime.sendMessage({
          type: 'QUICKSHOT_SELECTION_DONE',
          selection: selectionPayload
        });
      } catch (error) {
        showToast(`Capture failed: ${error.message}`, 'error');
      }
    }

    async cancelSelection() {
      this.destroySelection();
      await chrome.runtime.sendMessage({ type: 'QUICKSHOT_SELECTION_CANCELLED' });
    }

    destroySelection() {
      this.mode = 'idle';
      this.engine?.destroy();
      this.engine = null;

      if (this.root && this.root.parentNode) {
        this.root.parentNode.removeChild(this.root);
      }

      this.root = null;
      this.selectionBox = null;
      this.selectionLabel = null;
      this.hint = null;
      document.documentElement.classList.remove('quickshot-no-select');
    }

    async openEditor(capture) {
      this.destroySelection();
      this.destroyEditor();
      this.mode = 'editor';

      const image = await loadImage(capture.dataUrl);
      this.mountEditor(capture, image);
      this.renderEditorPosition(capture.selection);
      this.setStatus(
        capture.clipboardResult?.ok
          ? 'Copied to clipboard. Add markup or save if needed.'
          : 'Capture ready.'
      );
    }

    mountEditor(capture, image) {
      const shell = document.createElement('div');
      shell.id = OVERLAY_ROOT_ID;
      shell.className = 'quickshot-overlay quickshot-editor-overlay';

      const stage = document.createElement('div');
      stage.className = 'quickshot-editor-stage';

      const canvas = document.createElement('canvas');
      canvas.className = 'quickshot-editor-canvas';
      canvas.width = image.width;
      canvas.height = image.height;
      canvas.setAttribute('aria-label', 'QuickShot editor canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(image, 0, 0);

      stage.appendChild(canvas);

      const toolbar = this.buildToolbar();
      const settingsPanel = document.createElement('div');
      settingsPanel.className = 'quickshot-settings-panel';
      settingsPanel.hidden = true;

      const dock = document.createElement('div');
      dock.className = 'quickshot-bottom-dock';

      const exportPanel = document.createElement('div');
      exportPanel.className = 'quickshot-export-panel';
      exportPanel.hidden = true;
      exportPanel.innerHTML = [
        '<button type="button" class="quickshot-export-option" data-format="png">Save PNG</button>',
        '<button type="button" class="quickshot-export-option" data-format="jpg">Save JPG</button>'
      ].join('');

      const status = document.createElement('div');
      status.className = 'quickshot-editor-status';
      status.hidden = true;

      dock.appendChild(settingsPanel);
      dock.appendChild(toolbar);

      shell.appendChild(stage);
      shell.appendChild(dock);
      shell.appendChild(exportPanel);
      shell.appendChild(status);
      document.documentElement.appendChild(shell);
      document.documentElement.classList.add('quickshot-no-select');

      this.editor = {
        ...this.editor,
        shell,
        dock,
        stage,
        canvas,
        ctx,
        toolbar,
        settingsPanel,
        exportPanel,
        status,
        capture
      };

      this.bindEditorEvents();
      this.setActiveTool('arrow', { openPanel: false });
      this.updateHistoryButtons();
    }

    buildToolbar() {
      const toolbar = document.createElement('div');
      toolbar.className = 'quickshot-toolbar';

      const toolGroup = document.createElement('div');
      toolGroup.className = 'quickshot-toolbar-group';
      for (const tool of TOOL_ORDER) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'quickshot-tool-button';
        button.dataset.tool = tool;
        button.setAttribute('aria-label', tool);
        button.title = capitalize(tool);
        button.innerHTML = TOOL_ICONS[tool];
        toolGroup.appendChild(button);
      }

      const actionGroup = document.createElement('div');
      actionGroup.className = 'quickshot-toolbar-group quickshot-toolbar-group-actions';
      for (const action of ['undo', 'redo', 'copy', 'save', 'close']) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'quickshot-action-button';
        button.dataset.action = action;
        button.setAttribute('aria-label', action);
        button.title = capitalize(action);
        button.innerHTML = TOOL_ICONS[action];
        actionGroup.appendChild(button);
      }

      toolbar.appendChild(toolGroup);
      toolbar.appendChild(actionGroup);
      return toolbar;
    }

    bindEditorEvents() {
      const { shell, canvas, toolbar, exportPanel, dock } = this.editor;

      toolbar.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) {
          return;
        }

        if (button.dataset.tool) {
          this.setActiveTool(button.dataset.tool, { openPanel: SETTINGS_TOOLS.has(button.dataset.tool) });
          return;
        }

        const action = button.dataset.action;
        if (action === 'undo') {
          this.undo();
        } else if (action === 'redo') {
          this.redo();
        } else if (action === 'copy') {
          this.copyCurrentImage();
        } else if (action === 'save') {
          this.toggleExportPanel();
        } else if (action === 'close') {
          this.destroyEditor();
        }
      });

      exportPanel.addEventListener('click', (event) => {
        const button = event.target.closest('[data-format]');
        if (!button) {
          return;
        }
        this.saveImage(button.dataset.format);
        this.hideExportPanel();
      });

      canvas.addEventListener('mousedown', (event) => this.handleEditorMouseDown(event));
      canvas.addEventListener('click', (event) => this.handleCanvasClick(event));
      window.addEventListener('mousemove', this.handleEditorMouseMove, true);
      window.addEventListener('mouseup', this.handleEditorMouseUp, true);
      window.addEventListener('keydown', this.handleGlobalKeyDown, true);
      shell.addEventListener('mousedown', this.handleGlobalPointerDown, true);
      dock.addEventListener('mousedown', (event) => event.stopPropagation(), true);
    }

    renderEditorPosition(selection) {
      const { shell, stage, toolbar, settingsPanel, exportPanel, canvas, dock } = this.editor;
      if (!shell || !stage || !toolbar || !canvas || !dock) {
        return;
      }

      const viewportPadding = 20;
      const toolbarHeight = 52;
      const dockHeight = (toolbar.offsetHeight || toolbarHeight) + (!settingsPanel.hidden ? (settingsPanel.offsetHeight || 140) + 12 : 0);
      const maxWidth = Math.max(220, window.innerWidth - viewportPadding * 2);
      const maxHeight = Math.max(120, window.innerHeight - viewportPadding * 2 - dockHeight - 24);
      const scale = Math.min(1, maxWidth / canvas.width, maxHeight / canvas.height);

      const displayWidth = Math.max(120, Math.round(canvas.width * scale));
      const displayHeight = Math.max(80, Math.round(canvas.height * scale));

      let left = Math.round(selection.x + (selection.width - displayWidth) / 2);
      let top = Math.round(selection.y + (selection.height - displayHeight) / 2);

      left = clamp(left, viewportPadding, Math.max(viewportPadding, window.innerWidth - viewportPadding - displayWidth));
      top = clamp(top, viewportPadding, Math.max(viewportPadding, window.innerHeight - viewportPadding - displayHeight - dockHeight - 24));

      stage.style.left = `${left}px`;
      stage.style.top = `${top}px`;
      stage.style.width = `${displayWidth}px`;
      stage.style.height = `${displayHeight}px`;
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;

      const toolbarRect = { width: toolbar.offsetWidth || 420, height: toolbar.offsetHeight || toolbarHeight };
      const dockWidth = Math.max(toolbarRect.width, !settingsPanel.hidden ? (settingsPanel.offsetWidth || 280) : 0);
      const dockLeft = clamp(
        Math.round(left + displayWidth / 2 - dockWidth / 2),
        viewportPadding,
        Math.max(viewportPadding, window.innerWidth - viewportPadding - dockWidth)
      );
      const dockTop = window.innerHeight - viewportPadding - 24 - dockHeight;

      dock.style.left = `${dockLeft}px`;
      dock.style.top = `${dockTop}px`;

      if (!exportPanel.hidden) {
        const exportWidth = exportPanel.offsetWidth || 132;
        exportPanel.style.left = `${clamp(
          Math.round(dockLeft + dockWidth - exportWidth),
          viewportPadding,
          Math.max(viewportPadding, window.innerWidth - viewportPadding - exportWidth)
        )}px`;
        exportPanel.style.top = `${Math.max(viewportPadding, dockTop - (exportPanel.offsetHeight || 72) - 12)}px`;
      }

      const statusWidth = Math.min(window.innerWidth - viewportPadding * 2, 360);
      this.editor.displayWidth = displayWidth;
      this.editor.displayHeight = displayHeight;
      this.editor.scale = scale;
      this.editor.status.style.width = `${statusWidth}px`;
      this.editor.status.style.left = `${clamp(
        Math.round(left + displayWidth / 2 - statusWidth / 2),
        viewportPadding,
        Math.max(viewportPadding, window.innerWidth - viewportPadding - statusWidth)
      )}px`;
      this.editor.status.style.top = `${Math.max(viewportPadding, top - 46)}px`;
    }

    setActiveTool(tool, { openPanel } = { openPanel: true }) {
      this.editor.currentTool = tool;

      this.editor.toolbar.querySelectorAll('[data-tool]').forEach((button) => {
        button.classList.toggle('is-active', button.dataset.tool === tool);
      });

      this.hideExportPanel();

      if (openPanel && SETTINGS_TOOLS.has(tool)) {
        this.renderSettingsPanel(tool);
      } else {
        this.hideSettingsPanel();
      }

      this.setStatus(`${capitalize(tool)} tool active.`);
      this.renderEditorPosition(this.editor.capture.selection);
    }

    renderSettingsPanel(tool) {
      const panel = this.editor.settingsPanel;
      const config = this.editor.styles[tool];
      if (!panel || !config) {
        this.hideSettingsPanel();
        return;
      }

      panel.hidden = false;

      if (tool === 'arrow') {
        panel.innerHTML = [
          this.renderField('Color', this.renderColorSwatches(config.color)),
          this.renderField('Width', this.renderWidthDots(config.width)),
          this.renderField('Line', this.renderLineStyleChips(config.lineStyle)),
          this.renderField('Arrow', this.renderArrowModeChips(config.arrowMode))
        ].join('');
      } else if (tool === 'text') {
        panel.innerHTML = [
          this.renderField('Color', this.renderColorSwatches(config.color)),
          this.renderField('Size', this.renderOptionChips('fontSize', TEXT_SIZES, config.fontSize, (value) => `${value}`))
        ].join('');
      } else if (tool === 'blur') {
        panel.innerHTML = [
          this.renderField('Block', this.renderOptionChips('blockSize', BLUR_SIZES, config.blockSize, (value) => `${value}`))
        ].join('');
      } else {
        panel.innerHTML = [
          this.renderField('Color', this.renderColorSwatches(config.color)),
          this.renderField('Width', this.renderWidthDots(config.width)),
          this.renderField('Line', this.renderLineStyleChips(config.lineStyle))
        ].join('');
      }

      panel.querySelectorAll('[data-setting]').forEach((input) => {
        input.addEventListener('input', () => {
          const settingName = input.dataset.setting;
          const value = input.type === 'range' ? Number(input.value) : input.value;
          this.editor.styles[tool][settingName] = value;
        });
      });

      panel.querySelectorAll('[data-color-swatch]').forEach((button) => {
        button.addEventListener('click', () => {
          this.editor.styles[tool].color = button.dataset.colorSwatch;
          panel.querySelectorAll('[data-color-swatch]').forEach((swatch) => {
            swatch.classList.toggle('is-active', swatch === button);
          });
          this.syncOptionChipColor(tool);
        });
      });

      panel.querySelectorAll('[data-option-value]').forEach((button) => {
        button.addEventListener('click', () => {
          const settingName = button.dataset.setting;
          const value = Number(button.dataset.optionValue);
          this.editor.styles[tool][settingName] = value;
          panel.querySelectorAll(`[data-setting="${settingName}"][data-option-value]`).forEach((chip) => {
            chip.classList.toggle('is-active', chip === button);
          });
          this.syncOptionChipColor(tool);
        });
      });

      panel.querySelectorAll('[data-line-style]').forEach((button) => {
        button.addEventListener('click', () => {
          this.editor.styles[tool].lineStyle = button.dataset.lineStyle;
          panel.querySelectorAll('[data-line-style]').forEach((chip) => {
            chip.classList.toggle('is-active', chip === button);
          });
          this.syncOptionChipColor(tool);
        });
      });

      panel.querySelectorAll('[data-arrow-mode]').forEach((button) => {
        button.addEventListener('click', () => {
          this.editor.styles[tool].arrowMode = button.dataset.arrowMode;
          panel.querySelectorAll('[data-arrow-mode]').forEach((chip) => {
            chip.classList.toggle('is-active', chip === button);
          });
          this.syncOptionChipColor(tool);
        });
      });

      this.syncOptionChipColor(tool);

      this.renderEditorPosition(this.editor.capture.selection);
    }

    renderField(label, controlMarkup) {
      return `<label class="quickshot-setting-field"><span>${label}</span>${controlMarkup}</label>`;
    }

    renderColorSwatches(activeColor) {
      const swatches = COLOR_SWATCHES.map((color) => (
        `<button type="button" class="quickshot-color-swatch${color === activeColor ? ' is-active' : ''}" data-color-swatch="${color}" style="--swatch-color: ${color}" aria-label="${color}"></button>`
      )).join('');
      return `<div class="quickshot-color-swatches">${swatches}</div>`;
    }

    renderOptionChips(settingName, values, activeValue, formatLabel) {
      const chips = values.map((value) => (
        `<button type="button" class="quickshot-option-chip${value === activeValue ? ' is-active' : ''}" data-setting="${settingName}" data-option-value="${value}">${formatLabel(value)}</button>`
      )).join('');
      return `<div class="quickshot-option-chips">${chips}</div>`;
    }

    renderWidthDots(activeValue) {
      const chips = STROKE_WIDTHS.map((value) => (
        `<button type="button" class="quickshot-width-chip${value === activeValue ? ' is-active' : ''}" data-setting="width" data-option-value="${value}" aria-label="Width ${value}">
          <span class="quickshot-width-dot" style="--dot-size: ${Math.max(4, value + 2)}px"></span>
        </button>`
      )).join('');
      return `<div class="quickshot-option-chips quickshot-width-chips">${chips}</div>`;
    }

    renderLineStyleChips(activeValue) {
      const styles = ['solid', 'dashed', 'dotted'];
      const chips = styles.map((value) => (
        `<button type="button" class="quickshot-line-style-chip${value === activeValue ? ' is-active' : ''}" data-line-style="${value}" aria-label="${value}">
          <span class="quickshot-line-style-sample quickshot-line-style-sample-${value}"></span>
        </button>`
      )).join('');
      return `<div class="quickshot-option-chips quickshot-line-style-chips">${chips}</div>`;
    }

    renderArrowModeChips(activeValue) {
      const modes = ['classic', 'double', 'line'];
      const chips = modes.map((value) => (
        `<button type="button" class="quickshot-arrow-mode-chip${value === activeValue ? ' is-active' : ''}" data-arrow-mode="${value}" aria-label="${value}">
          <span class="quickshot-arrow-mode-sample quickshot-arrow-mode-sample-${value}"></span>
        </button>`
      )).join('');
      return `<div class="quickshot-option-chips quickshot-arrow-mode-chips">${chips}</div>`;
    }

    syncOptionChipColor(tool) {
      const color = this.editor.styles[tool]?.color;
      if (!color || !this.editor.settingsPanel) {
        return;
      }

      this.editor.settingsPanel.querySelectorAll('[data-setting="width"][data-option-value]').forEach((chip) => {
        chip.style.setProperty('--chip-color', color);
      });
      this.editor.settingsPanel.querySelectorAll('[data-line-style]').forEach((chip) => {
        chip.style.setProperty('--chip-color', color);
      });
      this.editor.settingsPanel.querySelectorAll('[data-arrow-mode]').forEach((chip) => {
        chip.style.setProperty('--chip-color', color);
      });
    }

    renderSelect(settingName, currentValue, options) {
      const optionMarkup = options.map(([value, label]) => (
        `<option value="${value}"${value === currentValue ? ' selected' : ''}>${label}</option>`
      )).join('');
      return `<select data-setting="${settingName}">${optionMarkup}</select>`;
    }

    hideSettingsPanel() {
      if (this.editor.settingsPanel) {
        this.editor.settingsPanel.hidden = true;
        this.editor.settingsPanel.innerHTML = '';
      }
    }

    toggleExportPanel() {
      if (!this.editor.exportPanel) {
        return;
      }
      this.editor.exportPanel.hidden = !this.editor.exportPanel.hidden;
      this.hideSettingsPanel();
      this.renderEditorPosition(this.editor.capture.selection);
    }

    hideExportPanel() {
      if (this.editor.exportPanel) {
        this.editor.exportPanel.hidden = true;
      }
    }

    handleGlobalPointerDown(event) {
      const { toolbar, settingsPanel, exportPanel, canvas } = this.editor;
      const target = event.target;
      const insideToolbar = toolbar?.contains(target);
      const insideSettings = settingsPanel && !settingsPanel.hidden && settingsPanel.contains(target);
      const insideExport = exportPanel && !exportPanel.hidden && exportPanel.contains(target);
      const insideCanvas = canvas?.contains(target);

      if (!insideCanvas && !insideToolbar && !insideSettings && !insideExport) {
        this.destroyEditor();
        return;
      }

      if (!insideToolbar && !insideSettings) {
        this.hideSettingsPanel();
      }

      if (!insideToolbar && !insideExport) {
        this.hideExportPanel();
      }

      if (!insideCanvas) {
        this.renderEditorPosition(this.editor.capture.selection);
      }
    }

    handleGlobalKeyDown(event) {
      if (this.mode !== 'editor') {
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        if (this.editor.exportPanel && !this.editor.exportPanel.hidden) {
          this.hideExportPanel();
          return;
        }
        if (this.editor.settingsPanel && !this.editor.settingsPanel.hidden) {
          this.hideSettingsPanel();
          return;
        }
        this.destroyEditor();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault();
        this.undo();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey))) {
        event.preventDefault();
        this.redo();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        this.copyCurrentImage();
      }
    }

    handleEditorMouseDown(event) {
      if (event.button !== 0) {
        return;
      }

      const tool = this.editor.currentTool;
      if (!['arrow', 'blur', 'rect', 'ellipse', 'crop'].includes(tool)) {
        return;
      }

      event.preventDefault();
      this.editor.drawing = true;
      this.editor.startPoint = this.toCanvasPoint(event);
      this.editor.previewImageData = this.editor.ctx.getImageData(0, 0, this.editor.canvas.width, this.editor.canvas.height);
      this.pushHistorySnapshot();
    }

    handleEditorMouseMove(event) {
      if (!this.editor.drawing || !this.editor.startPoint || !this.editor.previewImageData) {
        return;
      }

      const point = this.toCanvasPoint(event);
      const rect = this.getToolRect(
        this.editor.startPoint.x,
        this.editor.startPoint.y,
        point.x,
        point.y,
        event
      );

      this.editor.ctx.putImageData(this.editor.previewImageData, 0, 0);

      if (this.editor.currentTool === 'arrow') {
        this.drawArrow(this.editor.startPoint, point, this.editor.styles.arrow);
      } else if (this.editor.currentTool === 'blur' || this.editor.currentTool === 'crop') {
        this.drawPreviewRect(rect);
      } else if (this.editor.currentTool === 'rect') {
        this.drawStyledRect(rect, this.editor.styles.rect);
      } else if (this.editor.currentTool === 'ellipse') {
        this.drawStyledEllipse(rect, this.editor.styles.ellipse);
      }
    }

    handleEditorMouseUp(event) {
      if (!this.editor.drawing || !this.editor.startPoint || !this.editor.previewImageData) {
        return;
      }

      const point = this.toCanvasPoint(event);
      const rect = this.getToolRect(
        this.editor.startPoint.x,
        this.editor.startPoint.y,
        point.x,
        point.y,
        event
      );

      this.editor.drawing = false;
      this.editor.ctx.putImageData(this.editor.previewImageData, 0, 0);

      if (this.editor.currentTool === 'arrow') {
        this.drawArrow(this.editor.startPoint, point, this.editor.styles.arrow);
        this.setStatus('Arrow added.');
      } else if (this.editor.currentTool === 'blur') {
        this.applyBlur(rect);
        this.setStatus('Blur applied.');
      } else if (this.editor.currentTool === 'rect') {
        this.drawStyledRect(rect, this.editor.styles.rect);
        this.setStatus('Rectangle added.');
      } else if (this.editor.currentTool === 'ellipse') {
        this.drawStyledEllipse(rect, this.editor.styles.ellipse);
        this.setStatus('Ellipse added.');
      } else if (this.editor.currentTool === 'crop') {
        this.applyCrop(rect);
      }

      this.editor.startPoint = null;
      this.editor.previewImageData = null;
      this.updateHistoryButtons();
    }

    handleCanvasClick(event) {
      if (this.editor.currentTool !== 'text') {
        return;
      }

      const value = window.prompt('Text');
      if (!value) {
        return;
      }

      this.pushHistorySnapshot();
      const point = this.toCanvasPoint(event);
      const config = this.editor.styles.text;
      const ctx = this.editor.ctx;
      ctx.save();
      ctx.font = `600 ${config.fontSize}px "Segoe UI"`;
      ctx.fillStyle = config.color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(2, Math.round(config.fontSize / 7));
      ctx.strokeText(value, point.x, point.y);
      ctx.fillText(value, point.x, point.y);
      ctx.restore();
      this.setStatus('Text added.');
      this.updateHistoryButtons();
    }

    toCanvasPoint(event) {
      const rect = this.editor.canvas.getBoundingClientRect();
      const scaleX = this.editor.canvas.width / rect.width;
      const scaleY = this.editor.canvas.height / rect.height;

      return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
      };
    }

    getToolRect(x1, y1, x2, y2, event) {
      if (this.editor.currentTool === 'ellipse' && event?.ctrlKey) {
        return normalizeSquareRect(x1, y1, x2, y2);
      }

      return normalizeRect(x1, y1, x2, y2);
    }

    drawPreviewRect(rect) {
      const ctx = this.editor.ctx;
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      ctx.restore();
    }

    drawStyledRect(rect, style) {
      this.applyStrokeStyle(style);
      this.editor.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      this.editor.ctx.restore();
    }

    drawStyledEllipse(rect, style) {
      this.applyStrokeStyle(style);
      this.editor.ctx.beginPath();
      this.editor.ctx.ellipse(
        rect.x + rect.width / 2,
        rect.y + rect.height / 2,
        rect.width / 2,
        rect.height / 2,
        0,
        0,
        Math.PI * 2
      );
      this.editor.ctx.stroke();
      this.editor.ctx.restore();
    }

    drawArrow(from, to, style) {
      const ctx = this.editor.ctx;
      const headLength = Math.max(10, style.width * 4);
      const angle = Math.atan2(to.y - from.y, to.x - from.x);

      this.applyStrokeStyle(style);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.restore();

      if (style.arrowMode !== 'line') {
        this.drawArrowHead(to, angle, headLength, style.color);
        if (style.arrowMode === 'double') {
          this.drawArrowHead(from, angle + Math.PI, headLength, style.color);
        }
      }
    }

    drawArrowHead(point, angle, headLength, color) {
      const ctx = this.editor.ctx;
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

    applyStrokeStyle(style) {
      const ctx = this.editor.ctx;
      ctx.save();
      ctx.strokeStyle = style.color;
      ctx.lineWidth = style.width;
      ctx.setLineDash(getLineDash(style.lineStyle));
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    applyBlur(rect) {
      const cleanRect = sanitizeRect(rect, this.editor.canvas.width, this.editor.canvas.height);
      if (!cleanRect) {
        return;
      }

      const source = document.createElement('canvas');
      source.width = cleanRect.width;
      source.height = cleanRect.height;
      const sourceCtx = source.getContext('2d');
      sourceCtx.drawImage(
        this.editor.canvas,
        cleanRect.x,
        cleanRect.y,
        cleanRect.width,
        cleanRect.height,
        0,
        0,
        cleanRect.width,
        cleanRect.height
      );

      const blockSize = Math.max(2, this.editor.styles.blur.blockSize);
      const down = document.createElement('canvas');
      down.width = Math.max(1, Math.floor(cleanRect.width / blockSize));
      down.height = Math.max(1, Math.floor(cleanRect.height / blockSize));
      const downCtx = down.getContext('2d');
      downCtx.imageSmoothingEnabled = true;
      downCtx.drawImage(source, 0, 0, down.width, down.height);

      this.editor.ctx.imageSmoothingEnabled = false;
      this.editor.ctx.drawImage(
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
      this.editor.ctx.imageSmoothingEnabled = true;
    }

    applyCrop(rect) {
      const cleanRect = sanitizeRect(rect, this.editor.canvas.width, this.editor.canvas.height);
      if (!cleanRect) {
        this.setStatus('Crop area is too small.', 'error');
        return;
      }

      const source = document.createElement('canvas');
      source.width = cleanRect.width;
      source.height = cleanRect.height;
      const sourceCtx = source.getContext('2d');
      sourceCtx.drawImage(
        this.editor.canvas,
        cleanRect.x,
        cleanRect.y,
        cleanRect.width,
        cleanRect.height,
        0,
        0,
        cleanRect.width,
        cleanRect.height
      );

      this.editor.canvas.width = cleanRect.width;
      this.editor.canvas.height = cleanRect.height;
      this.editor.ctx = this.editor.canvas.getContext('2d', { willReadFrequently: true });
      this.editor.ctx.drawImage(source, 0, 0);
      this.editor.capture.selection = {
        ...this.editor.capture.selection,
        width: cleanRect.width / this.editor.scale,
        height: cleanRect.height / this.editor.scale
      };
      this.setStatus('Crop applied.');
      this.renderEditorPosition(this.editor.capture.selection);
    }

    pushHistorySnapshot() {
      const { canvas, ctx } = this.editor;
      if (!canvas || !canvas.width || !canvas.height) {
        return;
      }

      this.editor.undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      if (this.editor.undoStack.length > MAX_HISTORY) {
        this.editor.undoStack.shift();
      }
      this.editor.redoStack = [];
    }

    undo() {
      const { canvas, ctx, undoStack, redoStack } = this.editor;
      if (!undoStack.length || !canvas.width || !canvas.height) {
        return;
      }

      redoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      const previous = undoStack.pop();
      canvas.width = previous.width;
      canvas.height = previous.height;
      this.editor.ctx = canvas.getContext('2d', { willReadFrequently: true });
      this.editor.ctx.putImageData(previous, 0, 0);
      this.updateHistoryButtons();
      this.renderEditorPosition(this.editor.capture.selection);
      this.setStatus('Undo applied.');
    }

    redo() {
      const { canvas, ctx, undoStack, redoStack } = this.editor;
      if (!redoStack.length || !canvas.width || !canvas.height) {
        return;
      }

      undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      const next = redoStack.pop();
      canvas.width = next.width;
      canvas.height = next.height;
      this.editor.ctx = canvas.getContext('2d', { willReadFrequently: true });
      this.editor.ctx.putImageData(next, 0, 0);
      this.updateHistoryButtons();
      this.renderEditorPosition(this.editor.capture.selection);
      this.setStatus('Redo applied.');
    }

    updateHistoryButtons() {
      if (!this.editor.toolbar) {
        return;
      }
      const undoButton = this.editor.toolbar.querySelector('[data-action="undo"]');
      const redoButton = this.editor.toolbar.querySelector('[data-action="redo"]');
      if (undoButton) {
        undoButton.disabled = this.editor.undoStack.length === 0;
      }
      if (redoButton) {
        redoButton.disabled = this.editor.redoStack.length === 0;
      }
    }

    async copyCurrentImage() {
      if (!window.QuickShotClipboardEngine) {
        this.setStatus('Clipboard engine unavailable.', 'error');
        return;
      }

      const result = await window.QuickShotClipboardEngine.writeImageDataUrl(this.editor.canvas.toDataURL('image/png'));
      if (result.ok) {
        this.setStatus('Copied to clipboard.');
      } else {
        this.setStatus(`Clipboard failed: ${result.error}`, 'error');
      }
    }

    saveImage(format) {
      const type = format === 'jpg' ? 'image/jpeg' : 'image/png';
      const quality = format === 'jpg' ? 0.92 : undefined;
      const dataUrl = this.editor.canvas.toDataURL(type, quality);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = formatNowFilename(format);
      document.body.appendChild(link);
      link.click();
      link.remove();
      this.setStatus(`Saved ${format.toUpperCase()}.`);
    }

    setStatus(text, level = 'info') {
      if (!this.editor.status) {
        showToast(text, level);
        return;
      }
      if (level === 'error') {
        this.editor.status.hidden = false;
        this.editor.status.textContent = `Error: ${text}`;
        this.editor.status.dataset.level = level;
        return;
      }

      this.editor.status.hidden = true;
      this.editor.status.textContent = '';
      this.editor.status.dataset.level = '';
    }

    destroyEditor() {
      if (this.editor.shell && this.editor.shell.parentNode) {
        this.editor.shell.parentNode.removeChild(this.editor.shell);
      }

      window.removeEventListener('mousemove', this.handleEditorMouseMove, true);
      window.removeEventListener('mouseup', this.handleEditorMouseUp, true);
      window.removeEventListener('keydown', this.handleGlobalKeyDown, true);
      document.documentElement.classList.remove('quickshot-no-select');

      this.editor = {
        ...this.editor,
        shell: null,
        dock: null,
        stage: null,
        canvas: null,
        ctx: null,
        toolbar: null,
        settingsPanel: null,
        exportPanel: null,
        status: null,
        drawing: false,
        startPoint: null,
        previewImageData: null,
        undoStack: [],
        redoStack: [],
        capture: null
      };
      this.mode = 'idle';
    }
  }

  const overlaySession = new QuickShotOverlaySession();

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || !message.type) {
      return;
    }

    if (message.type === 'QUICKSHOT_START_SELECTION') {
      overlaySession.start();
      sendResponse({ ok: true });
      return;
    }

    if (message.type === 'QUICKSHOT_OPEN_EDITOR') {
      overlaySession.openEditor(message.capture)
        .then(() => sendResponse({ ok: true }))
        .catch((error) => sendResponse({ ok: false, error: error.message }));
      return true;
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
      return;
    }
  });

  window.addEventListener('resize', () => {
    if (overlaySession.mode === 'editor' && overlaySession.editor.capture) {
      overlaySession.renderEditorPosition(overlaySession.editor.capture.selection);
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

  function waitForNextPaint() {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }

  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Unable to load captured image.'));
      image.src = dataUrl;
    });
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
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

    if (width < 2 || height < 2) {
      return null;
    }

    return { x, y, width, height };
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
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `quickshot_${year}${month}${day}_${hours}${minutes}${seconds}.${format}`;
  }

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
})();
