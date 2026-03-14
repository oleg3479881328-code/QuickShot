const statusEl = document.getElementById('status');

document.getElementById('startBtn').addEventListener('click', async () => {
  setStatus('Starting capture...');

  const response = await chrome.runtime.sendMessage({
    type: 'QUICKSHOT_START_CAPTURE',
    source: 'popup'
  });

  if (response?.ok) {
    window.close();
  } else {
    const message = response?.error || 'Unable to start capture.';
    setStatus(`Error: ${message}`);
  }
});

document.getElementById('optionsBtn').addEventListener('click', async () => {
  await chrome.runtime.openOptionsPage();
});

document.getElementById('helpBtn').addEventListener('click', async () => {
  await chrome.tabs.create({ url: chrome.runtime.getURL('docs/help.html') });
});

function setStatus(text) {
  statusEl.textContent = text;
}
