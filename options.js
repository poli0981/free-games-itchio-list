/**
 * options.js — Itch Collector settings page.
 * Handles GitHub config + GPG signing config.
 */

const $ = (sel) => document.querySelector(sel);

// ─── GitHub fields ───────────────────────────────────────────────────────

const gh = {
  token:  $("#gh-token"),
  owner:  $("#gh-owner"),
  repo:   $("#gh-repo"),
  path:   $("#gh-path"),
  branch: $("#gh-branch"),
};

const testBtn  = $("#test-btn");
const saveBtn  = $("#save-btn");
const statusEl = $("#status-msg");

// ─── Combobox elements ───────────────────────────────────────────────────

const branchList     = $("#branch-list");
const pathList       = $("#path-list");
const fetchBranchBtn = $("#fetch-branches-btn");
const fetchPathBtn   = $("#fetch-paths-btn");

// ─── GPG fields ──────────────────────────────────────────────────────────

const gpg = {
  name:       $("#gpg-name"),
  email:      $("#gpg-email"),
  key:        $("#gpg-key"),
  passphrase: $("#gpg-passphrase"),
};

const gpgValidateBtn = $("#gpg-validate-btn");
const gpgSaveBtn     = $("#gpg-save-btn");
const gpgStatusEl    = $("#gpg-status-msg");
const gpgBadge       = $("#gpg-badge");
const gpgLibStatus   = $("#gpg-lib-status");

// ─── Status helpers ──────────────────────────────────────────────────────

function showStatus(el, message, ok) {
  el.hidden = false;
  el.textContent = message;
  el.className = `status ${ok ? "ok" : "err"}`;
}

function hideStatus(el) {
  el.hidden = true;
}

// ─── Load settings ───────────────────────────────────────────────────────

async function loadSettings() {
  const data = await chrome.storage.local.get([
    "gh_token", "gh_owner", "gh_repo", "gh_path", "gh_branch",
    "gpg_private_key", "gpg_passphrase", "gpg_name", "gpg_email",
  ]);

  if (data.gh_token)  gh.token.value  = data.gh_token;
  if (data.gh_owner)  gh.owner.value  = data.gh_owner;
  if (data.gh_repo)   gh.repo.value   = data.gh_repo;
  if (data.gh_path)   gh.path.value   = data.gh_path;
  if (data.gh_branch) gh.branch.value = data.gh_branch;

  if (data.gpg_name)        gpg.name.value       = data.gpg_name;
  if (data.gpg_email)       gpg.email.value      = data.gpg_email;
  if (data.gpg_private_key) gpg.key.value        = data.gpg_private_key;
  if (data.gpg_passphrase)  gpg.passphrase.value = data.gpg_passphrase;

  // Update GPG badge
  if (data.gpg_private_key && data.gpg_name && data.gpg_email) {
    gpgBadge.textContent = "configured";
    gpgBadge.classList.add("active");
  }

  checkGpgLib();
}

async function checkGpgLib() {
  try {
    const url = chrome.runtime.getURL("lib/openpgp.min.mjs");
    const mod = await import(url);
    if (mod.__stub) {
      gpgLibStatus.textContent = "⚠ openpgp.js is stub — replace with real library";
      gpgLibStatus.style.color = "var(--warning)";
    } else {
      gpgLibStatus.textContent = "✓ openpgp.js loaded";
      gpgLibStatus.style.color = "var(--success)";
    }
  } catch {
    gpgLibStatus.textContent = "✗ openpgp.js failed to load";
    gpgLibStatus.style.color = "var(--error)";
  }
}

// ─── GitHub: Save ────────────────────────────────────────────────────────

// ─── GitHub fetch helpers (for combobox) ─────────────────────────────────

function getGhCredentials() {
  const token = gh.token.value.trim();
  const owner = gh.owner.value.trim();
  const repo  = gh.repo.value.trim();
  if (!token || !owner || !repo) return null;
  return { token, owner, repo };
}

async function ghApiFetch(path, token) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function populateDatalist(datalist, items) {
  datalist.innerHTML = "";
  for (const item of items) {
    const opt = document.createElement("option");
    opt.value = item;
    datalist.appendChild(opt);
  }
}

/**
 * Fetch branches from the repo and populate datalist.
 */
async function fetchBranches() {
  const cred = getGhCredentials();
  if (!cred) {
    showStatus(statusEl, "Fill in token, owner, and repo first.", false);
    return;
  }

  fetchBranchBtn.classList.add("spinning");
  try {
    // Fetch up to 100 branches (paginated if needed)
    const branches = await ghApiFetch(
      `/repos/${cred.owner}/${cred.repo}/branches?per_page=100`,
      cred.token
    );
    const names = branches.map((b) => b.name);
    populateDatalist(branchList, names);

    // Auto-select default branch if current value is empty
    if (!gh.branch.value && names.length > 0) {
      // Prefer "main", then "master", then first
      gh.branch.value = names.includes("main")
        ? "main"
        : names.includes("master")
          ? "master"
          : names[0];
    }
  } catch (err) {
    showStatus(statusEl, `Failed to load branches: ${err.message}`, false);
  } finally {
    fetchBranchBtn.classList.remove("spinning");
  }
}

/**
 * Fetch the file tree from the current branch and populate path datalist.
 * Filters to .json files only.
 */
async function fetchPaths() {
  const cred = getGhCredentials();
  if (!cred) {
    showStatus(statusEl, "Fill in token, owner, and repo first.", false);
    return;
  }

  const branch = gh.branch.value.trim() || "main";

  fetchPathBtn.classList.add("spinning");
  try {
    const tree = await ghApiFetch(
      `/repos/${cred.owner}/${cred.repo}/git/trees/${branch}?recursive=1`,
      cred.token
    );

    // Filter: only blob (file) entries ending in .json
    const jsonPaths = (tree.tree || [])
      .filter((t) => t.type === "blob" && t.path.endsWith(".json"))
      .map((t) => t.path)
      .sort();

    populateDatalist(pathList, jsonPaths);

    // Auto-select if current value is empty and a likely match exists
    if (!gh.path.value) {
      const preferred = jsonPaths.find((p) => p.includes("temp_link"));
      if (preferred) gh.path.value = preferred;
    }
  } catch (err) {
    showStatus(statusEl, `Failed to load file tree: ${err.message}`, false);
  } finally {
    fetchPathBtn.classList.remove("spinning");
  }
}

/**
 * Fetch both branches and paths. Called after successful connection test.
 */
async function fetchRepoData() {
  await fetchBranches();
  await fetchPaths();
}

// Wire up refresh buttons
fetchBranchBtn.addEventListener("click", fetchBranches);
fetchPathBtn.addEventListener("click", fetchPaths);

// Re-fetch paths when branch changes (different branch = different file tree)
gh.branch.addEventListener("change", () => {
  if (getGhCredentials()) fetchPaths();
});

// ─── GitHub: Save ────────────────────────────────────────────────────────

saveBtn.addEventListener("click", async () => {
  const token  = gh.token.value.trim();
  const owner  = gh.owner.value.trim();
  const repo   = gh.repo.value.trim();
  const path   = gh.path.value.trim()   || "scripts/temp_link.json";
  const branch = gh.branch.value.trim() || "main";

  if (!token || !owner || !repo) {
    showStatus(statusEl, "Please fill in all required fields.", false);
    return;
  }

  await chrome.storage.local.set({
    gh_token: token,
    gh_owner: owner,
    gh_repo: repo,
    gh_path: path,
    gh_branch: branch,
  });

  showStatus(statusEl, "Settings saved.", true);
  chrome.runtime.sendMessage({ type: "SYNC_KNOWN" });
});

// ─── GitHub: Test connection ─────────────────────────────────────────────

testBtn.addEventListener("click", async () => {
  hideStatus(statusEl);
  testBtn.textContent = "Testing...";
  testBtn.disabled = true;

  const token = gh.token.value.trim();
  const owner = gh.owner.value.trim();
  const repo  = gh.repo.value.trim();

  if (!token || !owner || !repo) {
    showStatus(statusEl, "Please fill in token, owner, and repo first.", false);
    testBtn.textContent = "Test Connection";
    testBtn.disabled = false;
    return;
  }

  try {
    const url = `https://api.github.com/repos/${owner}/${repo}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (res.status === 401) {
      showStatus(statusEl, "Invalid token.", false);
    } else if (res.status === 404) {
      showStatus(statusEl, "Repository not found.", false);
    } else if (res.ok) {
      const data = await res.json();
      if (data.permissions?.push) {
        showStatus(statusEl, `Connected to ${data.full_name}`, true);
        // Auto-populate branch and path comboboxes
        fetchRepoData();
      } else {
        showStatus(statusEl, "Token lacks push permission.", false);
      }
    } else {
      showStatus(statusEl, `HTTP ${res.status}`, false);
    }
  } catch (err) {
    showStatus(statusEl, `Network error: ${err.message}`, false);
  }

  testBtn.textContent = "Test Connection";
  testBtn.disabled = false;
});

// ─── GPG: Validate key ──────────────────────────────────────────────────

gpgValidateBtn.addEventListener("click", async () => {
  hideStatus(gpgStatusEl);
  gpgValidateBtn.textContent = "Validating...";
  gpgValidateBtn.disabled = true;

  const armoredKey = gpg.key.value.trim();
  const passphrase = gpg.passphrase.value;

  if (!armoredKey) {
    showStatus(gpgStatusEl, "Please paste your GPG private key.", false);
    gpgValidateBtn.textContent = "Validate Key";
    gpgValidateBtn.disabled = false;
    return;
  }

  try {
    const url = chrome.runtime.getURL("lib/openpgp.min.mjs");
    const openpgpMod = await import(url);

    // Check if this is the stub file
    if (openpgpMod.__stub) {
      showStatus(gpgStatusEl, "openpgp.js is a stub — replace lib/openpgp.min.mjs with the real library, then reload extension.", false);
      gpgValidateBtn.textContent = "Validate Key";
      gpgValidateBtn.disabled = false;
      return;
    }

    // Step 1: Read the key (validates format)
    const rawKey = await openpgpMod.readPrivateKey({ armoredKey });
    const keyId = rawKey.getKeyID().toHex().toUpperCase();
    const userIds = rawKey.getUserIDs().join(", ");
    const isEncrypted = !rawKey.isDecrypted();

    // Step 2: Always attempt decryption — this is the real passphrase test
    // openpgp.decryptKey handles all cases:
    //   encrypted key + correct pass   → decrypts ✓
    //   encrypted key + wrong/empty "" → throws Error ✓
    //   unencrypted key + any pass     → returns as-is ✓
    try {
      await openpgpMod.decryptKey({
        privateKey: rawKey,
        passphrase: passphrase,
      });
    } catch (decryptErr) {
      if (isEncrypted) {
        const hint = passphrase
          ? `Wrong passphrase. (Key ID: ${keyId})`
          : `This key is encrypted — passphrase required. (Key ID: ${keyId})`;
        showStatus(gpgStatusEl, hint, false);
        gpgValidateBtn.textContent = "Validate Key";
        gpgValidateBtn.disabled = false;
        return;
      }
      throw decryptErr;
    }

    showStatus(gpgStatusEl, `Key valid — ID: ${keyId} — ${userIds}`, true);
  } catch (err) {
    const msg = err.message?.includes("passphrase") || err.message?.includes("decrypt")
      ? "Wrong passphrase."
      : `Invalid key: ${err.message}`;
    showStatus(gpgStatusEl, msg, false);
  }

  gpgValidateBtn.textContent = "Validate Key";
  gpgValidateBtn.disabled = false;
});

// ─── GPG: Save ───────────────────────────────────────────────────────────

gpgSaveBtn.addEventListener("click", async () => {
  const name       = gpg.name.value.trim();
  const email      = gpg.email.value.trim();
  const privateKey = gpg.key.value.trim();
  const passphrase = gpg.passphrase.value;

  // Empty = disable GPG
  if (!privateKey && !name && !email) {
    await chrome.storage.local.remove([
      "gpg_private_key", "gpg_passphrase", "gpg_name", "gpg_email",
    ]);
    gpgBadge.textContent = "optional";
    gpgBadge.classList.remove("active");
    showStatus(gpgStatusEl, "GPG signing disabled.", true);
    return;
  }

  if (!name || !email || !privateKey) {
    showStatus(gpgStatusEl, "Name, email, and key are all required.", false);
    return;
  }

  await chrome.storage.local.set({
    gpg_private_key: privateKey,
    gpg_passphrase: passphrase,
    gpg_name: name,
    gpg_email: email,
  });

  gpgBadge.textContent = "configured";
  gpgBadge.classList.add("active");
  showStatus(gpgStatusEl, "GPG settings saved.", true);
});

// ─── Hide status on input ────────────────────────────────────────────────

Object.values(gh).forEach((input) => {
  input.addEventListener("input", () => hideStatus(statusEl));
});
Object.values(gpg).forEach((input) => {
  input.addEventListener("input", () => hideStatus(gpgStatusEl));
});

// ─── Init ────────────────────────────────────────────────────────────────

loadSettings().then(() => {
  // Auto-populate comboboxes if credentials already saved
  if (getGhCredentials()) {
    fetchRepoData();
  }
});