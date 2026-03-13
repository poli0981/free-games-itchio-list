/**
 * popup.js — Itch Collector popup logic.
 */

const $ = (sel) => document.querySelector(sel);

const els = {
  setupBanner:   $("#setup-banner"),
  openOptions:   $("#open-options-link"),
  syncBtn:       $("#sync-btn"),
  queueCount:    $("#queue-count"),
  progressFill:  $("#progress-fill"),
  queueList:     $("#queue-list"),
  lastPush:      $("#last-push"),
  pushStatusIcon: $("#push-status-icon"),
  pushStatusText: $("#push-status-text"),
  pushBtn:       $("#push-btn"),
  clearBtn:      $("#clear-btn"),
  // Log viewer
  logToggle:     $("#log-toggle"),
  logArrow:      $("#log-toggle-arrow"),
  logPanel:      $("#log-panel"),
  logList:       $("#log-list"),
  logExportBtn:  $("#log-export-btn"),
  logClearBtn:   $("#log-clear-btn"),
};

// ─── Render ──────────────────────────────────────────────────────────────

function renderQueue(status) {
  const { queue = [], queueSize = 0, threshold = 15 } = status;

  // Counter
  els.queueCount.textContent = queueSize;
  const pct = Math.min((queueSize / threshold) * 100, 100);
  els.progressFill.style.width = `${pct}%`;

  // Queue list
  if (queue.length === 0) {
    els.queueList.innerHTML = '<div class="empty-state">Queue is empty</div>';
  } else {
    els.queueList.innerHTML = queue
      .map((url, i) => {
        const name = extractGameName(url);
        return `
          <div class="queue-item">
            <span class="queue-item-index">${i + 1}</span>
            <span class="queue-item-name" title="${escHtml(url)}">${escHtml(name)}</span>
          </div>`;
      })
      .join("");
  }

  // Buttons
  els.pushBtn.disabled = queueSize === 0;
  els.clearBtn.disabled = queueSize === 0;

  // Setup banner
  els.setupBanner.hidden = status.configured !== false;

  // Last push
  if (status.lastPush) {
    els.lastPush.hidden = false;
    const lp = status.lastPush;
    const timeAgo = formatTimeAgo(lp.time);

    if (lp.ok) {
      els.pushStatusIcon.textContent = "✓";
      els.pushStatusIcon.style.color = "var(--success)";
      const signedTag = lp.signed ? " 🔏" : "";
      els.pushStatusText.textContent = `Pushed ${lp.count} link(s)${signedTag} — ${timeAgo}`;
    } else {
      els.pushStatusIcon.textContent = "✗";
      els.pushStatusIcon.style.color = "var(--error)";
      els.pushStatusText.textContent = `Failed — ${timeAgo}`;
      els.pushStatusText.title = lp.error || "";
    }
  } else {
    els.lastPush.hidden = true;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function extractGameName(url) {
  try {
    const u = new URL(url);
    const slug = u.pathname.replace(/^\/+|\/+$/g, "");
    const dev = u.hostname.replace(".itch.io", "");
    return `${slug} (${dev})`;
  } catch {
    return url;
  }
}

function escHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

function formatTimeAgo(isoStr) {
  const now = Date.now();
  const then = new Date(isoStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

// ─── Actions ─────────────────────────────────────────────────────────────

async function refresh() {
  const status = await chrome.runtime.sendMessage({ type: "GET_STATUS" });
  renderQueue(status);
}

els.pushBtn.addEventListener("click", async () => {
  els.pushBtn.disabled = true;
  els.pushBtn.textContent = "Pushing...";

  const result = await chrome.runtime.sendMessage({ type: "FORCE_PUSH" });

  if (result?.ok) {
    els.pushBtn.textContent = "Done!";
    setTimeout(() => {
      els.pushBtn.textContent = "Push Now";
      refresh();
    }, 1500);
  } else {
    els.pushBtn.textContent = "Failed";
    setTimeout(() => {
      els.pushBtn.textContent = "Push Now";
      refresh();
    }, 2000);
  }
});

els.clearBtn.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "CLEAR_QUEUE" });
  refresh();
});

els.syncBtn.addEventListener("click", async () => {
  els.syncBtn.classList.add("spinning");
  await chrome.runtime.sendMessage({ type: "SYNC_KNOWN" });
  els.syncBtn.classList.remove("spinning");
  refresh();
});

els.openOptions.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// Listen for storage changes to auto-update popup
chrome.storage.onChanged.addListener((changes) => {
  if (changes.link_queue || changes.last_push) {
    refresh();
  }
});

// ─── Log viewer ──────────────────────────────────────────────────────────

let logOpen = false;

els.logToggle.addEventListener("click", () => {
  logOpen = !logOpen;
  els.logPanel.hidden = !logOpen;
  els.logArrow.classList.toggle("open", logOpen);
  if (logOpen) refreshLogs();
});

async function refreshLogs() {
  const logs = await chrome.runtime.sendMessage({ type: "GET_LOGS", limit: 80 });
  if (!logs || logs.length === 0) {
    els.logList.innerHTML = '<div class="empty-state">No logs yet</div>';
    return;
  }

  els.logList.innerHTML = logs
    .map((e) => {
      const time = (e.t || "").slice(11, 19); // HH:MM:SS
      return `<div class="log-entry">
        <span class="log-time">${escHtml(time)}</span>
        <span class="log-level ${e.l}">${e.l}</span>
        <span class="log-source">${escHtml(e.s)}</span>
        <span class="log-msg">${escHtml(e.m)}${e.d ? `<br><span style="opacity:.6">${escHtml(e.d)}</span>` : ""}</span>
      </div>`;
    })
    .join("");
}

els.logExportBtn.addEventListener("click", async () => {
  const { text } = await chrome.runtime.sendMessage({ type: "EXPORT_LOGS" });
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `itch-collector-logs-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
});

els.logClearBtn.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "CLEAR_LOGS" });
  refreshLogs();
});

// Initial load
refresh();