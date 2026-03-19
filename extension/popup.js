let enabled = true;
let scanning = false;

const toggleBtn     = document.getElementById('toggleBtn');
const toggleLabel   = document.getElementById('toggleLabel');
const pausedOverlay = document.getElementById('pausedOverlay');
const turnOnBtn     = document.getElementById('turnOnBtn');
const dashLink      = document.getElementById('dashLink');

const useHdStyles = !!toggleBtn && toggleBtn.classList.contains('hd-pill');

function applyToggleClass(isEnabled) {
  if (!toggleBtn) return;
  if (useHdStyles) {
    toggleBtn.className = 'hd-pill ' + (isEnabled ? 'on' : 'off');
    return;
  }
  toggleBtn.className = 'p-toggle ' + (isEnabled ? 'on' : 'off');
}

function setEnabled(val) {
  enabled = val;
  if (!toggleLabel || !pausedOverlay) return;
  if (enabled) {
    applyToggleClass(true);
    toggleLabel.textContent = 'Active';
    pausedOverlay.classList.add('hidden');
  } else {
    applyToggleClass(false);
    toggleLabel.textContent = 'Paused';
    pausedOverlay.classList.remove('hidden');
  }
}

if (toggleBtn) {
  toggleBtn.addEventListener('click', () => setEnabled(!enabled));
}
if (turnOnBtn) {
  turnOnBtn.addEventListener('click', () => setEnabled(true));
}

setEnabled(true);


if (dashLink) {
  dashLink.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    }
  });
}
