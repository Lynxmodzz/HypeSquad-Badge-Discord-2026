function showStatus(msg, type) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = 'status ' + type;
  setTimeout(() => { el.className = 'status hidden'; }, 3000);
}

function setActive(id) {
  document.querySelectorAll('.house-btn').forEach(btn => {
    btn.classList.remove('active', 'bravery-active', 'brilliance-active', 'balance-active');
  });
  if (id) {
    const target = document.querySelector(`[data-id="${id}"]`);
    if (target) {
      target.classList.add('active');
      if (id === 1 || id === '1') target.classList.add('bravery-active');
      if (id === 2 || id === '2') target.classList.add('brilliance-active');
      if (id === 3 || id === '3') target.classList.add('balance-active');
    }
  }
}

function ensureDiscordTab(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab || !tab.url || !tab.url.includes('discord.com')) {
      showStatus('Open Discord in this tab first.', 'error');
      return;
    }
    callback(tab.id);
  });
}

function handleResult(results) {
  if (chrome.runtime.lastError) {
    showStatus('Script failed. Reload Discord and try again.', 'error');
    return;
  }
  const result = results && results[0] && results[0].result;
  if (result && result.ok) {
    showStatus(result.msg, 'success');
    setActive(result.activeId !== undefined ? result.activeId : null);
  } else {
    showStatus((result && result.msg) || 'Something went wrong.', 'error');
  }
}

function applyHouse(houseId) {
  ensureDiscordTab((tabId) => {
    chrome.scripting.executeScript({
      target: { tabId, allFrames: false },
      world: 'MAIN',
      func: async (id) => {
        try {
          webpackRequire = webpackChunkdiscord_app.push([[Symbol()], {}, (r) => r]);
          webpackChunkdiscord_app.pop();
          const modules = webpackRequire.m;
          const cache = webpackRequire.c;
          function findByCode(src) {
            for (const [modId, mod] of Object.entries(modules)) {
              if (mod.toString().includes(src)) return cache[modId].exports;
            }
          }
          function findObjectFromKey(exports, key) {
            if (!exports) return;
            for (const k in exports) {
              if (exports[k] && exports[k][key]) return exports[k];
            }
          }
          const api = findObjectFromKey(findByCode('.set("X-Audit-Log-Reason",'), 'patch');
          await api.post({ url: '/hypesquad/online', body: { house_id: id } });
          const n = { 1: 'Bravery', 2: 'Brilliance', 3: 'Balance' };
          return { ok: true, msg: 'Joined House of ' + n[id] + '.', activeId: id };
        } catch (e) {
          return { ok: false, msg: 'Error: ' + e.message };
        }
      },
      args: [houseId]
    }, handleResult);
  });
}

document.getElementById('btn-bravery').addEventListener('click', () => applyHouse(1));
document.getElementById('btn-brilliance').addEventListener('click', () => applyHouse(2));
document.getElementById('btn-balance').addEventListener('click', () => applyHouse(3));

