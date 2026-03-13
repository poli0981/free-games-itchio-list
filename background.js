/**
 * background.js — Itch Collector service worker.
 *
 * Responsibilities:
 *   - Receive links from content script
 *   - Manage queue in chrome.storage.local
 *   - Auto-push when queue reaches threshold
 *   - Update badge count
 *   - Sync known URLs from GitHub
 */

import { getConfig, pushLinks, fetchKnownUrls } from "./lib/github.js";
import * as logger from "./lib/logger.js";

const QUEUE_THRESHOLD = 15;

// Storage keys
const KEY_QUEUE = "link_queue";        // string[] — URLs waiting to push
const KEY_KNOWN = "known_urls";        // string[] — all URLs already in repo
const KEY_LAST_PUSH = "last_push";     // { time: string, count: number, ok: boolean }
const KEY_PUSH_BUSY = "push_busy";     // boolean — prevent concurrent pushes

// ─── Badge ───────────────────────────────────────────────────────────────

async function updateBadge() {
  const { [KEY_QUEUE]: queue = [] } = await chrome.storage.local.get(KEY_QUEUE);
  const count = queue.length;

  if (count === 0) {
    chrome.action.setBadgeText({ text: "" });
    return;
  }

  chrome.action.setBadgeText({ text: String(count) });

  if (count >= QUEUE_THRESHOLD - 3) {
    // Near full → amber
    chrome.action.setBadgeBackgroundColor({ color: "#EF9F27" });
  } else {
    // Normal → blue
    chrome.action.setBadgeBackgroundColor({ color: "#378ADD" });
  }
}

function setBadgePushOk() {
  chrome.action.setBadgeText({ text: "✓" });
  chrome.action.setBadgeBackgroundColor({ color: "#639922" });
  setTimeout(() => updateBadge(), 3000);
}

function setBadgeError() {
  chrome.action.setBadgeText({ text: "!" });
  chrome.action.setBadgeBackgroundColor({ color: "#E24B4A" });
  setTimeout(() => updateBadge(), 5000);
}

// ─── Queue ───────────────────────────────────────────────────────────────

async function getQueue() {
  const { [KEY_QUEUE]: queue = [] } = await chrome.storage.local.get(KEY_QUEUE);
  return queue;
}

async function getKnownSet() {
  const { [KEY_KNOWN]: known = [] } = await chrome.storage.local.get(KEY_KNOWN);
  return new Set(known);
}

async function addToQueue(url) {
  const queue = await getQueue();
  const known = await getKnownSet();

  // Duplicate check (queue + known repo URLs)
  if (queue.includes(url) || known.has(url)) {
    logger.info("queue", `Duplicate skipped: ${url}`);
    return { added: false, reason: "duplicate", queueSize: queue.length };
  }

  queue.push(url);
  await chrome.storage.local.set({ [KEY_QUEUE]: queue });
  await updateBadge();
  logger.info("queue", `Added to queue (${queue.length}/${QUEUE_THRESHOLD}): ${url}`);

  // Auto-push check
  if (queue.length >= QUEUE_THRESHOLD) {
    logger.info("queue", "Queue threshold reached — triggering auto-push.");
    triggerPush();
  }

  return { added: true, queueSize: queue.length };
}

// ─── Push ────────────────────────────────────────────────────────────────

async function triggerPush() {
  const { [KEY_PUSH_BUSY]: busy } = await chrome.storage.local.get(KEY_PUSH_BUSY);
  if (busy) {
    logger.warn("push", "Push already in progress — skipped.");
    return { ok: false, message: "Push already in progress." };
  }

  await chrome.storage.local.set({ [KEY_PUSH_BUSY]: true });
  logger.info("push", "Push started.");

  try {
    const config = await getConfig();
    if (!config) {
      throw new Error("GitHub not configured. Open extension options.");
    }

    const queue = await getQueue();
    if (queue.length === 0) {
      logger.info("push", "Queue is empty — nothing to push.");
      return { ok: true, message: "Queue is empty." };
    }

    let result;
    try {
      result = await pushLinks(config, queue);
    } catch (err) {
      if (err.message.includes("409")) {
        logger.warn("push", "SHA conflict — retrying in 1.5s.");
        await new Promise((r) => setTimeout(r, 1500));
        result = await pushLinks(config, queue);
      } else {
        throw err;
      }
    }

    // Clear queue + update known URLs
    const known = await getKnownSet();
    for (const u of queue) known.add(u);
    await chrome.storage.local.set({
      [KEY_QUEUE]: [],
      [KEY_KNOWN]: [...known],
      [KEY_LAST_PUSH]: {
        time: new Date().toISOString(),
        count: result.pushed,
        ok: true,
        signed: result.signed || false,
      },
    });

    logger.info("push", `Push complete — ${result.pushed} link(s) pushed${result.signed ? " (GPG signed)" : ""}.`);
    setBadgePushOk();
    return { ok: true, message: `Pushed ${result.pushed} link(s).` };
  } catch (err) {
    logger.error("push", `Push failed: ${err.message}`, err.stack);
    await chrome.storage.local.set({
      [KEY_LAST_PUSH]: {
        time: new Date().toISOString(),
        count: 0,
        ok: false,
        error: err.message,
      },
    });
    setBadgeError();
    return { ok: false, message: err.message };
  } finally {
    await chrome.storage.local.set({ [KEY_PUSH_BUSY]: false });
  }
}

// ─── Sync known URLs from GitHub ─────────────────────────────────────────

async function syncKnownUrls() {
  try {
    const config = await getConfig();
    if (!config) return { ok: false, message: "Not configured." };

    logger.info("sync", "Syncing known URLs from GitHub...");
    const urls = await fetchKnownUrls(config);
    await chrome.storage.local.set({ [KEY_KNOWN]: [...urls] });
    logger.info("sync", `Sync complete — ${urls.size} known URL(s).`);
    return { ok: true, count: urls.size };
  } catch (err) {
    logger.error("sync", `Sync failed: ${err.message}`);
    return { ok: false, message: err.message };
  }
}

// ─── Clear queue ─────────────────────────────────────────────────────────

async function clearQueue() {
  await chrome.storage.local.set({ [KEY_QUEUE]: [] });
  await updateBadge();
  return { ok: true };
}

// ─── Message handler ─────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "ADD_LINK") {
    addToQueue(msg.url).then(sendResponse);
    return true; // async
  }

  if (msg.type === "GET_STATUS") {
    (async () => {
      const queue = await getQueue();
      const { [KEY_LAST_PUSH]: lastPush = null } = await chrome.storage.local.get(KEY_LAST_PUSH);
      const config = await getConfig();
      sendResponse({
        queueSize: queue.length,
        queue,
        threshold: QUEUE_THRESHOLD,
        lastPush,
        configured: !!config,
      });
    })();
    return true;
  }

  if (msg.type === "FORCE_PUSH") {
    triggerPush().then(sendResponse);
    return true;
  }

  if (msg.type === "CLEAR_QUEUE") {
    clearQueue().then(sendResponse);
    return true;
  }

  if (msg.type === "SYNC_KNOWN") {
    syncKnownUrls().then(sendResponse);
    return true;
  }

  if (msg.type === "CHECK_URL") {
    (async () => {
      const queue = await getQueue();
      const known = await getKnownSet();
      const isDuplicate = queue.includes(msg.url) || known.has(msg.url);
      sendResponse({ isDuplicate });
    })();
    return true;
  }

  // ─── Log handlers ────────────────────────────────────────────────────

  if (msg.type === "GET_LOGS") {
    logger.getLogs(msg.limit || 100).then(sendResponse);
    return true;
  }

  if (msg.type === "CLEAR_LOGS") {
    logger.clearLogs().then(() => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === "EXPORT_LOGS") {
    logger.exportLogsText().then((text) => sendResponse({ text }));
    return true;
  }
});

// ─── Startup ─────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async () => {
  logger.info("system", "Extension installed/updated.");
  await updateBadge();
  await syncKnownUrls();
});

// Restore badge on service worker wake
updateBadge();
logger.info("system", "Service worker started.");