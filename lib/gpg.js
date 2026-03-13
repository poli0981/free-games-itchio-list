/**
 * gpg.js — GPG commit signing for Itch Collector.
 *
 * ARCHITECTURE NOTE:
 * Chrome MV3 service workers PROHIBIT dynamic import() entirely.
 * See: https://github.com/nicolo-ribaudo/tc39-proposal-dynamic-import-host-adjustment
 *
 * Solution: We use a STATIC import of openpgp.min.mjs.
 * The extension ships with a stub file (exports { __stub: true }).
 * When the user downloads the real openpgp.min.mjs and replaces the stub,
 * GPG signing becomes available after extension reload.
 *
 * Detection: if _openpgp.__stub === true → stub mode (GPG disabled)
 *            if typeof _openpgp.readPrivateKey === "function" → real library (GPG available)
 */

import * as logger from "./logger.js";
import * as _openpgp from "./openpgp.min.mjs";

const SRC = "gpg";

// ─── Detect stub vs real library ─────────────────────────────────────────

const gpgReady = !_openpgp.__stub && typeof _openpgp.readPrivateKey === "function";
const openpgp = gpgReady ? _openpgp : null;

if (gpgReady) {
  logger.info(SRC, "openpgp.js loaded (real library detected).");
} else {
  logger.info(SRC, "GPG signing disabled — openpgp.min.mjs is stub. Replace with real library to enable.");
}

// ─── Config ──────────────────────────────────────────────────────────────

/**
 * Load GPG config from chrome.storage.local.
 */
export async function getGpgConfig() {
  const data = await chrome.storage.local.get([
    "gpg_private_key",
    "gpg_passphrase",
    "gpg_name",
    "gpg_email",
  ]);
  if (!data.gpg_private_key || !data.gpg_name || !data.gpg_email) return null;
  return {
    privateKey: data.gpg_private_key,
    passphrase: data.gpg_passphrase ?? "",
    name: data.gpg_name,
    email: data.gpg_email,
  };
}

/**
 * Check if GPG signing is available AND configured.
 */
export async function isGpgEnabled() {
  if (!gpgReady) return false;
  const config = await getGpgConfig();
  return config !== null;
}

// ─── Commit payload builder ──────────────────────────────────────────────

export function buildCommitPayload({ treeSha, parentSha, name, email, message }) {
  const now = Math.floor(Date.now() / 1000);
  const offset = "+0000";
  const author = `${name} <${email}> ${now} ${offset}`;

  return [
    `tree ${treeSha}`,
    `parent ${parentSha}`,
    `author ${author}`,
    `committer ${author}`,
    "",
    message,
  ].join("\n");
}

// ─── Key decryption helper ───────────────────────────────────────────────

/**
 * Read and decrypt a private key.
 * Always calls decryptKey() — openpgp handles all cases:
 *   encrypted + correct pass  → decrypts ✓
 *   encrypted + wrong pass    → throws ✓
 *   encrypted + empty ""      → throws ✓
 *   unencrypted + any pass    → no-op ✓
 */
async function readAndDecryptKey(armoredKey, passphrase) {
  const rawKey = await openpgp.readPrivateKey({ armoredKey });
  return await openpgp.decryptKey({
    privateKey: rawKey,
    passphrase: passphrase,
  });
}

// ─── Sign ────────────────────────────────────────────────────────────────

/**
 * Sign a commit payload with the configured GPG key.
 * @returns {Promise<string|null>} ASCII-armored signature, or null on failure
 */
export async function signCommit(commitPayload) {
  if (!gpgReady || !openpgp) {
    logger.warn(SRC, "Cannot sign: openpgp.js not available (stub mode).");
    return null;
  }

  const config = await getGpgConfig();
  if (!config) {
    logger.warn(SRC, "Cannot sign: GPG key not configured.");
    return null;
  }

  try {
    const privateKey = await readAndDecryptKey(config.privateKey, config.passphrase);

    const message = await openpgp.createMessage({ text: commitPayload });
    const signature = await openpgp.sign({
      message,
      signingKeys: privateKey,
      detached: true,
      format: "armored",
    });

    logger.info(SRC, "Commit signed successfully.");
    return signature;
  } catch (err) {
    if (err.message?.includes("passphrase") || err.message?.includes("decrypt")) {
      logger.error(SRC, "Signing failed: wrong passphrase or key cannot be decrypted.");
    } else {
      logger.error(SRC, `Signing failed: ${err.message}`, err.stack);
    }
    return null;
  }
}

// ─── Validate ────────────────────────────────────────────────────────────

/**
 * Validate a private key and passphrase.
 * Called from options page — openpgp must be available.
 */
export async function validateKey(armoredKey, passphrase) {
  if (!gpgReady || !openpgp) {
    return { ok: false, message: "openpgp.js is stub — replace lib/openpgp.min.mjs with the real library." };
  }

  try {
    const rawKey = await openpgp.readPrivateKey({ armoredKey });
    const keyId = rawKey.getKeyID().toHex().toUpperCase();
    const userIds = rawKey.getUserIDs().join(", ");
    const isEncrypted = !rawKey.isDecrypted();

    try {
      await openpgp.decryptKey({
        privateKey: rawKey,
        passphrase: passphrase,
      });
    } catch (decryptErr) {
      if (isEncrypted) {
        const hint = passphrase
          ? "Wrong passphrase."
          : "This key is encrypted — passphrase required.";
        return { ok: false, message: hint, keyId };
      }
      return { ok: false, message: `Decrypt error: ${decryptErr.message}`, keyId };
    }

    return { ok: true, message: `Key valid — ${userIds}`, keyId };
  } catch (err) {
    return { ok: false, message: `Invalid key: ${err.message}` };
  }
}

/**
 * Check if openpgp.js real library is loaded (not stub).
 */
export function isLibraryLoaded() {
  return gpgReady;
}