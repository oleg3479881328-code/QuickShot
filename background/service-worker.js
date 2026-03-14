import { QuickShotCaptureController } from '../capture/capture-controller.js';
import { DEFAULT_SETTINGS, getSettings } from '../utils/settings.js';

const MENU_ID = 'quickshot-start-capture';
const LAST_CAPTURE_KEY = 'quickshotLastCapture';
const CAPTURE_CONTROLLER = new QuickShotCaptureController();

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'Capture area with QuickShot',
    contexts: ['all']
  });

  const stored = await chrome.storage.local.get('quickshotSettings');
  if (!stored.quickshotSettings) {
    await chrome.storage.local.set({ quickshotSettings: DEFAULT_SETTINGS });
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  await startCaptureFlow({ source: 'action', tab });
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'start-quickshot') {
    return;
  }
  await startCaptureFlow({ source: 'command' });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID) {
    return;
  }
  await startCaptureFlow({ source: 'context-menu', tab });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) {
    return;
  }

  if (message.type === 'QUICKSHOT_START_CAPTURE') {
    startCaptureFlow({ source: message.source || 'popup', tab: sender.tab })
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === 'QUICKSHOT_SELECTION_DONE') {
    handleSelectionDone(message, sender)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === 'QUICKSHOT_SELECTION_CANCELLED') {
    sendTabToast(sender.tab?.id, 'Capture cancelled', 'info').catch(() => {});
    sendResponse({ ok: true });
    return;
  }
});

async function startCaptureFlow({ source, tab } = {}) {
  const targetTab = tab || await getActiveTab();
  if (!targetTab?.id) {
    throw new Error('No active tab found.');
  }

  if (!canCaptureTab(targetTab)) {
    const error = new Error('QuickShot is unavailable on this page.');
    await reportStartFailure(targetTab.id, error);
    throw error;
  }

  try {
    await chrome.scripting.insertCSS({
      target: { tabId: targetTab.id },
      files: ['content/overlay.css']
    });

    await chrome.scripting.executeScript({
      target: { tabId: targetTab.id },
      files: [
        'clipboard/clipboard-engine.js',
        'content/selection-engine.js',
        'content/overlay-ui.js'
      ]
    });

    await chrome.tabs.sendMessage(targetTab.id, {
      type: 'QUICKSHOT_START_SELECTION',
      source
    });
  } catch (error) {
    await reportStartFailure(targetTab.id, error);
    throw error;
  }
}

async function handleSelectionDone(message, sender) {
  const tabId = sender.tab?.id;
  const windowId = sender.tab?.windowId;

  if (!tabId || typeof windowId !== 'number') {
    throw new Error('Capture context is unavailable.');
  }

  const selection = message.selection;
  if (!selection || selection.width < 2 || selection.height < 2) {
    await sendTabToast(tabId, 'Selection is too small.', 'error');
    throw new Error('Invalid selection size.');
  }

  const settings = await getSettings();

  try {
    const result = await CAPTURE_CONTROLLER.captureSelection({
      tabId,
      windowId,
      selection,
      settings
    });

    await chrome.storage.local.set({
      [LAST_CAPTURE_KEY]: {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        dataUrl: result.dataUrl,
        width: result.width,
        height: result.height,
        clipboardResult: result.clipboardResult
      }
    });

    const shouldOpenEditor = settings.captureMode !== 'clipboard_only';
    if (shouldOpenEditor) {
      await openInlineEditor(tabId, {
        dataUrl: result.dataUrl,
        width: result.width,
        height: result.height,
        selection,
        clipboardResult: result.clipboardResult
      });
    }

    if (result.clipboardResult?.ok) {
      await sendTabToast(tabId, 'Image copied to clipboard.', 'success');
    } else if (settings.autoCopyOnCapture) {
      await sendTabToast(tabId, 'Clipboard copy failed. Open editor to copy again.', 'error');
    }
  } catch (error) {
    await sendTabToast(tabId, `Capture failed: ${error.message}`, 'error');
    throw error;
  }
}

async function openInlineEditor(tabId, capture) {
  await chrome.tabs.sendMessage(tabId, {
    type: 'QUICKSHOT_OPEN_EDITOR',
    capture
  });
}

async function reportStartFailure(tabId, error) {
  const message = error?.message || 'Unable to start QuickShot on this page.';
  await sendTabToast(tabId, message, 'error').catch(() => {});

  chrome.action.setBadgeBackgroundColor({ color: '#c62828' });
  chrome.action.setBadgeText({ text: 'ERR' });
  setTimeout(() => {
    chrome.action.setBadgeText({ text: '' });
  }, 3000);
}

async function sendTabToast(tabId, text, level = 'info') {
  if (!tabId) {
    return;
  }
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: 'QUICKSHOT_STATUS_TOAST',
      text,
      level
    });
  } catch (_error) {
    // ignore if content script is unavailable
  }
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

function canCaptureTab(tab) {
  const url = String(tab?.url || '');
  if (!url) {
    return false;
  }

  const blockedPrefixes = [
    'chrome://',
    'chrome-extension://',
    'edge://',
    'about:',
    'view-source:',
    'devtools://'
  ];

  return !blockedPrefixes.some((prefix) => url.startsWith(prefix));
}
