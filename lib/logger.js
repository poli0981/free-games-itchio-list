/**
 * logger.js — Centralized logging for Itch Collector.
 *
 * Stores logs in chrome.storage.local with automatic rotation.
 * Levels: INFO, WARN, ERROR
 * Max entries: 500 (oldest removed first)
 */

const KEY_LOGS = "ext_logs";
const MAX_ENTRIES = 500;

/** @enum {string} */
export const Level = {
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
};

/**
 * Write a log entry to storage.
 * @param {string} level - Level.INFO | Level.WARN | Level.ERROR
 * @param {string} source - Component name (e.g. "background", "content", "github")
 * @param {string} message - Log message
 * @param {object} [detail] - Optional extra data
 */
export async function log(level, source, message, detail = null) {
  try {
    const { [KEY_LOGS]: logs = [] } = await chrome.storage.local.get(KEY_LOGS);

    const entry = {
      t: new Date().toISOString(),
      l: level,
      s: source,
      m: message,
    };
    if (detail !== null && detail !== undefined) {
      // Keep detail small to avoid bloating storage
      try {
        const str = typeof detail === "string" ? detail : JSON.stringify(detail);
        entry.d = str.length > 300 ? str.slice(0, 297) + "..." : str;
      } catch {
        entry.d = String(detail);
      }
    }

    logs.push(entry);

    // Rotate: keep only last MAX_ENTRIES
    const trimmed = logs.length > MAX_ENTRIES ? logs.slice(-MAX_ENTRIES) : logs;

    await chrome.storage.local.set({ [KEY_LOGS]: trimmed });
  } catch {
    // If logging itself fails, just console.error — don't recurse
    console.error("[Logger] Failed to write log:", level, source, message);
  }
}

// ─── Convenience methods ─────────────────────────────────────────────────

export const info  = (source, message, detail) => log(Level.INFO, source, message, detail);
export const warn  = (source, message, detail) => log(Level.WARN, source, message, detail);
export const error = (source, message, detail) => log(Level.ERROR, source, message, detail);

// ─── Read / Clear / Export ───────────────────────────────────────────────

/**
 * Get all log entries.
 * @param {number} [limit=100] - Max entries to return (newest first)
 * @returns {Promise<Array>}
 */
export async function getLogs(limit = 100) {
  const { [KEY_LOGS]: logs = [] } = await chrome.storage.local.get(KEY_LOGS);
  // Return newest first, limited
  return logs.slice(-limit).reverse();
}

/**
 * Clear all logs.
 */
export async function clearLogs() {
  await chrome.storage.local.set({ [KEY_LOGS]: [] });
}

/**
 * Export logs as a formatted text string.
 * @returns {Promise<string>}
 */
export async function exportLogsText() {
  const { [KEY_LOGS]: logs = [] } = await chrome.storage.local.get(KEY_LOGS);

  if (logs.length === 0) return "(No logs recorded)";

  const lines = [
    "=== Itch Collector Logs ===",
    `Exported: ${new Date().toISOString()}`,
    `Total entries: ${logs.length}`,
    "=".repeat(50),
    "",
  ];

  for (const entry of logs) {
    const time = entry.t?.slice(0, 19).replace("T", " ") || "?";
    const line = `[${time}] [${entry.l}] [${entry.s}] ${entry.m}`;
    lines.push(line);
    if (entry.d) {
      lines.push(`  → ${entry.d}`);
    }
  }

  return lines.join("\n");
}