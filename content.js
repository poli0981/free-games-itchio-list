/**
 * content.js — Itch Collector content script.
 *
 * Runs on *.itch.io/* pages.
 * Detects game pages → checks free status → sends to service worker.
 * Injects a small toast notification.
 */

(() => {
  "use strict";

  // ─── URL validation ──────────────────────────────────────────────────

  /**
   * Check if the current URL is a game page:
   *   https://dev-name.itch.io/game-name
   *
   * Excludes:
   *   - itch.io homepage
   *   - itch.io/games, itch.io/jams, etc.
   *   - Profile pages (dev.itch.io without game slug)
   *   - Devlog, download, purchase subpages
   */
  function isGamePageUrl(url) {
    try {
      const u = new URL(url);

      // Must be *.itch.io, not just itch.io
      if (u.hostname === "itch.io" || u.hostname === "www.itch.io") return false;

      // Must match: subdomain.itch.io
      if (!u.hostname.endsWith(".itch.io")) return false;

      // Path must be exactly /game-name (with optional trailing slash)
      const path = u.pathname.replace(/\/+$/, "");
      const segments = path.split("/").filter(Boolean);

      // Exactly 1 segment = game page
      if (segments.length !== 1) return false;

      // Exclude known non-game slugs on subdomains
      const excluded = ["profile", "feed", "followers", "following"];
      if (excluded.includes(segments[0])) return false;

      return true;
    } catch {
      return false;
    }
  }

  // ─── Free detection ──────────────────────────────────────────────────

  /**
   * Determine if the current page is a free game.
   *
   * Free indicators:
   *   - No buy_row div at all (browser game / direct download)
   *   - Button text is "Download Now" with "Name your own price"
   *   - No <span class="dollars" itemprop="price">
   *
   * Paid indicators:
   *   - <span class="dollars" itemprop="price"> with non-zero price
   *   - Button text contains "Buy"
   */
  function isFreeGame() {
    const buyRow = document.querySelector("div.buy_row");
    if (!buyRow) return true; // No purchase section → free

    // Explicit price tag → paid
    const priceTag = buyRow.querySelector('span.dollars[itemprop="price"]');
    if (priceTag) {
      const priceText = priceTag.textContent.trim();
      if (priceText && priceText !== "$0.00" && priceText !== "$0.00 USD") {
        return false;
      }
    }

    // Button text hint
    const buyBtn = buyRow.querySelector("a.buy_btn");
    if (buyBtn) {
      const btnText = buyBtn.textContent.trim().toLowerCase();
      if (btnText.includes("buy")) return false;
    }

    return true;
  }

  // ─── Toast notification ──────────────────────────────────────────────

  function showToast(message, type = "info") {
    // Remove existing toast
    const existing = document.getElementById("itch-collector-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "itch-collector-toast";

    const colors = {
      success: { bg: "#0F6E56", border: "#5DCAA5" },
      info:    { bg: "#185FA5", border: "#85B7EB" },
      skip:    { bg: "#854F0B", border: "#FAC775" },
      error:   { bg: "#A32D2D", border: "#F09595" },
    };
    const c = colors[type] || colors.info;

    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      padding: 12px 18px;
      background: ${c.bg};
      border: 1px solid ${c.border};
      border-radius: 8px;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 13px;
      line-height: 1.4;
      max-width: 320px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      opacity: 0;
      transform: translateY(12px);
      transition: opacity 0.3s, transform 0.3s;
      pointer-events: none;
    `;

    toast.textContent = message;
    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });

    // Animate out after 3s
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(12px)";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ─── Main ────────────────────────────────────────────────────────────

  async function main() {
    const url = window.location.href.split("?")[0].split("#")[0]; // clean URL

    // Step 1: Is this a game page?
    if (!isGamePageUrl(url)) return;

    // Step 2: Check free status
    if (!isFreeGame()) {
      showToast("💰 Paid game — skipped", "skip");
      return;
    }

    // Step 3: Check duplicate first
    try {
      const dupCheck = await chrome.runtime.sendMessage({
        type: "CHECK_URL",
        url,
      });
      if (dupCheck?.isDuplicate) {
        showToast("📋 Already in list", "info");
        return;
      }
    } catch {
      // Extension context might be invalidated — skip silently
      return;
    }

    // Step 4: Add to queue
    try {
      const result = await chrome.runtime.sendMessage({
        type: "ADD_LINK",
        url,
      });

      if (!result) return;

      if (result.added) {
        showToast(
          `✓ Added to queue (${result.queueSize}/15)`,
          "success"
        );
      } else if (result.reason === "duplicate") {
        showToast("📋 Already in list", "info");
      }
    } catch (err) {
      console.error("[Itch Collector]", err);
    }
  }

  // Run when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
  } else {
    main();
  }
})();