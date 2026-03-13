/**
 * github.js — GitHub REST API wrapper for Itch Collector.
 *
 * Supports two push strategies:
 *   1. Contents API (simple, unsigned)
 *   2. Git Data API (low-level, supports GPG signed commits)
 */

import * as logger from "./logger.js";
import { isGpgEnabled, getGpgConfig, buildCommitPayload, signCommit } from "./gpg.js";

const GITHUB_API = "https://api.github.com";
const SRC = "github";

// ─── Config ──────────────────────────────────────────────────────────────

/**
 * Load saved GitHub config from chrome.storage.local.
 */
export async function getConfig() {
  const data = await chrome.storage.local.get([
    "gh_token",
    "gh_owner",
    "gh_repo",
    "gh_path",
    "gh_branch",
  ]);
  if (!data.gh_token || !data.gh_owner || !data.gh_repo) return null;
  return {
    token: data.gh_token,
    owner: data.gh_owner,
    repo: data.gh_repo,
    path: data.gh_path || "scripts/temp_link.json",
    branch: data.gh_branch || "main",
  };
}

// ─── HTTP helper ─────────────────────────────────────────────────────────

async function ghFetch(url, token, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {}),
    },
  });
  return res;
}

async function ghPost(url, token, body) {
  return ghFetch(url, token, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function ghPatch(url, token, body) {
  return ghFetch(url, token, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

// ─── Contents API (simple) ───────────────────────────────────────────────

export async function readFile(config, filePath) {
  const url = `${GITHUB_API}/repos/${config.owner}/${config.repo}/contents/${filePath}`;
  const res = await ghFetch(url, config.token);

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub GET ${filePath}: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const decoded = atob(data.content.replace(/\n/g, ""));
  const content = JSON.parse(decoded);
  return { content, sha: data.sha };
}

async function writeFileSimple(config, filePath, content, sha, message) {
  const url = `${GITHUB_API}/repos/${config.owner}/${config.repo}/contents/${filePath}`;
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 4))));

  const body = { message, content: encoded };
  if (sha) body.sha = sha;

  const res = await ghFetch(url, config.token, {
    method: "PUT",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`GitHub PUT ${filePath}: ${res.status} — ${err.message || ""}`);
  }
  return res.json();
}

// ─── Git Data API (for signed commits) ───────────────────────────────────

/**
 * Get the SHA of the latest commit on a branch.
 */
async function getRefSha(config) {
  const url = `${GITHUB_API}/repos/${config.owner}/${config.repo}/git/ref/heads/${config.branch}`;
  const res = await ghFetch(url, config.token);
  if (!res.ok) throw new Error(`Failed to get ref: ${res.status}`);
  const data = await res.json();
  return data.object.sha;
}

/**
 * Get the tree SHA of a commit.
 */
async function getCommitTree(config, commitSha) {
  const url = `${GITHUB_API}/repos/${config.owner}/${config.repo}/git/commits/${commitSha}`;
  const res = await ghFetch(url, config.token);
  if (!res.ok) throw new Error(`Failed to get commit: ${res.status}`);
  const data = await res.json();
  return data.tree.sha;
}

/**
 * Create a blob from content.
 */
async function createBlob(config, content) {
  const url = `${GITHUB_API}/repos/${config.owner}/${config.repo}/git/blobs`;
  const res = await ghPost(url, config.token, {
    content: JSON.stringify(content, null, 4),
    encoding: "utf-8",
  });
  if (!res.ok) throw new Error(`Failed to create blob: ${res.status}`);
  const data = await res.json();
  return data.sha;
}

/**
 * Create a new tree with the updated file.
 */
async function createTree(config, baseTreeSha, filePath, blobSha) {
  const url = `${GITHUB_API}/repos/${config.owner}/${config.repo}/git/trees`;
  const res = await ghPost(url, config.token, {
    base_tree: baseTreeSha,
    tree: [
      {
        path: filePath,
        mode: "100644",
        type: "blob",
        sha: blobSha,
      },
    ],
  });
  if (!res.ok) throw new Error(`Failed to create tree: ${res.status}`);
  const data = await res.json();
  return data.sha;
}

/**
 * Create a commit with optional GPG signature.
 */
async function createCommit(config, treeSha, parentSha, message, signature) {
  const url = `${GITHUB_API}/repos/${config.owner}/${config.repo}/git/commits`;

  const gpgConfig = await getGpgConfig();
  const body = {
    message,
    tree: treeSha,
    parents: [parentSha],
  };

  // Add committer info from GPG config if available
  if (gpgConfig) {
    body.author = {
      name: gpgConfig.name,
      email: gpgConfig.email,
      date: new Date().toISOString(),
    };
    body.committer = body.author;
  }

  // Attach GPG signature if provided
  if (signature) {
    body.signature = signature;
  }

  const res = await ghPost(url, config.token, body);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Failed to create commit: ${res.status} — ${err.message || ""}`);
  }
  const data = await res.json();
  return data.sha;
}

/**
 * Update a branch ref to point to a new commit.
 */
async function updateRef(config, newCommitSha) {
  const url = `${GITHUB_API}/repos/${config.owner}/${config.repo}/git/refs/heads/${config.branch}`;
  const res = await ghPatch(url, config.token, {
    sha: newCommitSha,
    force: false,
  });
  if (!res.ok) throw new Error(`Failed to update ref: ${res.status}`);
  return res.json();
}

/**
 * Push file content via Git Data API with optional GPG signing.
 *
 * Flow:
 *   1. Get current commit + tree SHA
 *   2. Create blob → new tree → build commit payload
 *   3. Sign payload with GPG (if available)
 *   4. Create commit (with signature) → update ref
 */
async function writeFileSigned(config, filePath, content, message) {
  logger.info(SRC, "Starting signed push via Git Data API.");

  // Step 1: Current state
  const parentSha = await getRefSha(config);
  const baseTreeSha = await getCommitTree(config, parentSha);

  // Step 2: Create blob + tree
  const blobSha = await createBlob(config, content);
  const newTreeSha = await createTree(config, baseTreeSha, filePath, blobSha);

  // Step 3: Sign commit
  const gpgConfig = await getGpgConfig();
  let signature = null;

  if (gpgConfig) {
    const payload = buildCommitPayload({
      treeSha: newTreeSha,
      parentSha: parentSha,
      name: gpgConfig.name,
      email: gpgConfig.email,
      message,
    });

    signature = await signCommit(payload);
    if (signature) {
      logger.info(SRC, "Commit payload signed with GPG.");
    } else {
      logger.warn(SRC, "GPG signing failed — commit will be unsigned.");
    }
  }

  // Step 4: Create commit + update ref
  const newCommitSha = await createCommit(config, newTreeSha, parentSha, message, signature);
  await updateRef(config, newCommitSha);

  logger.info(SRC, `Signed commit created: ${newCommitSha.slice(0, 8)}`);
  return { commitSha: newCommitSha };
}

// ─── Push links (main entry point) ───────────────────────────────────────

/**
 * Push an array of new URLs into temp_link.json.
 * Automatically uses signed push if GPG is configured.
 */
export async function pushLinks(config, newUrls) {
  let existing = [];
  let sha = null;

  // Read current temp_link.json
  const file = await readFile(config, config.path);
  if (file) {
    existing = Array.isArray(file.content) ? file.content : [];
    sha = file.sha;
  }

  // Merge (deduplicate)
  const existingSet = new Set(existing);
  const toAdd = newUrls.filter((u) => !existingSet.has(u));
  if (toAdd.length === 0) {
    logger.info(SRC, "No new links to push (all duplicates).");
    return { pushed: 0, total: existing.length, signed: false };
  }

  const merged = [...existing, ...toAdd];
  const date = new Date().toISOString().slice(0, 10);
  const message = `Add ${toAdd.length} game link(s) [${date}] via Itch Collector`;

  // Choose strategy: signed (Git Data API) or simple (Contents API)
  const useGpg = await isGpgEnabled();

  if (useGpg) {
    logger.info(SRC, `Pushing ${toAdd.length} link(s) with GPG signature.`);
    await writeFileSigned(config, config.path, merged, message);
    return { pushed: toAdd.length, total: merged.length, signed: true };
  } else {
    logger.info(SRC, `Pushing ${toAdd.length} link(s) (unsigned).`);
    await writeFileSimple(config, config.path, merged, sha, message);
    return { pushed: toAdd.length, total: merged.length, signed: false };
  }
}

// ─── Sync known URLs ─────────────────────────────────────────────────────

export async function fetchKnownUrls(config) {
  const urls = new Set();
  try {
    const file = await readFile(config, "scripts/game_info.json");
    if (file && Array.isArray(file.content)) {
      for (const game of file.content) {
        if (game.url) urls.add(game.url);
      }
    }
  } catch { /* may not exist */ }

  try {
    const temp = await readFile(config, config.path);
    if (temp && Array.isArray(temp.content)) {
      for (const u of temp.content) urls.add(u);
    }
  } catch { /* ignore */ }

  logger.info(SRC, `Synced ${urls.size} known URL(s).`);
  return urls;
}

// ─── Test connection ─────────────────────────────────────────────────────

export async function testConnection(config) {
  try {
    const url = `${GITHUB_API}/repos/${config.owner}/${config.repo}`;
    const res = await ghFetch(url, config.token);
    if (res.status === 401) return { ok: false, message: "Invalid token." };
    if (res.status === 404) return { ok: false, message: "Repository not found." };
    if (!res.ok) return { ok: false, message: `HTTP ${res.status}` };

    const repo = await res.json();
    if (!repo.permissions?.push) {
      return { ok: false, message: "Token lacks push permission." };
    }
    return { ok: true, message: `Connected to ${repo.full_name}` };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}