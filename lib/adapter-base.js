/**
 * Base adapter for LLM site integration.
 *
 * Each platform (ChatGPT, Claude, Gemini, Perplexity) ships a thin subclass
 * that fills in CSS selectors and platform-specific quirks. Common behavior
 * (sidebar injection, prompt-insertion, chat-list watching) lives here.
 */

(function () {
  class LLMAdapter {
    /**
     * @param {Object} config
     * @param {string} config.platform     - 'chatgpt' | 'claude' | 'gemini' | 'perplexity'
     * @param {string} config.displayName  - 'ChatGPT', 'Claude', …
     * @param {Object} config.selectors    - DOM selectors specific to the site
     *   .sidebar      — where to inject our panel
     *   .chatList     — element containing chat links
     *   .chatItem     — selector for individual chat link elements
     *   .chatTitle    — selector (within chatItem) for the chat title
     *   .input        — textarea or contenteditable for user input
     */
    constructor(config) {
      this.platform = config.platform;
      this.displayName = config.displayName;
      this.selectors = config.selectors;
      this.panel = null;
    }

    // ----- lifecycle ------------------------------------------------------

    async init() {
      // We use position:fixed for the panel, so we don't strictly need the
      // sidebar element. We only wait briefly to give the host UI time to
      // settle, but we ALWAYS inject — even if the sidebar selector misses.
      try {
        await this.waitForElement(this.selectors.input || this.selectors.sidebar, 8000);
      } catch (e) {
        // Site is loading slowly or selectors are stale. Inject anyway —
        // a position:fixed panel doesn't depend on the host DOM structure.
        console.info(`[PolyPrompt/${this.platform}] selectors didn't match in 8s, injecting anyway`);
      }
      this.injectPanel();
      this.watchChatList();
    }

    waitForElement(selector, timeoutMs = 10000) {
      return new Promise((resolve, reject) => {
        const existing = document.querySelector(selector);
        if (existing) return resolve(existing);

        const observer = new MutationObserver(() => {
          const el = document.querySelector(selector);
          if (el) {
            observer.disconnect();
            resolve(el);
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });

        setTimeout(() => {
          observer.disconnect();
          reject(new Error(`waitForElement timeout: ${selector}`));
        }, timeoutMs);
      });
    }

    // ----- panel UI -------------------------------------------------------

    injectPanel() {
      if (document.getElementById("polyprompt-panel")) return;

      const panel = document.createElement("div");
      panel.id = "polyprompt-panel";
      panel.className = "pp-panel pp-collapsed";
      panel.innerHTML = `
        <button class="pp-toggle" title="PolyPrompt">
          <span class="pp-toggle-icon">📁</span>
          <span class="pp-toggle-label">PolyPrompt</span>
        </button>
        <div class="pp-body">
          <div class="pp-header">
            <input class="pp-search" placeholder="Search folders & prompts…" />
            <button class="pp-new-folder" title="New folder">＋📁</button>
          </div>
          <div class="pp-folders"></div>
          <div class="pp-prompts-section">
            <div class="pp-prompts-header">
              <span>Prompts</span>
              <button class="pp-new-prompt" title="New prompt">＋✎</button>
            </div>
            <div class="pp-prompts"></div>
          </div>
        </div>
      `;

      // Attach to <body> rather than the host's sidebar — the panel is
      // position:fixed, so its parent is irrelevant, and document.body is
      // guaranteed to exist on every page.
      document.body.appendChild(panel);
      this.panel = panel;
      this.bindPanelEvents();
      this.refreshPanel();
    }

    bindPanelEvents() {
      const toggle = this.panel.querySelector(".pp-toggle");
      toggle.addEventListener("click", () => {
        this.panel.classList.toggle("pp-collapsed");
      });

      const newFolderBtn = this.panel.querySelector(".pp-new-folder");
      newFolderBtn.addEventListener("click", async () => {
        const name = prompt("Folder name?");
        if (!name) return;
        await PolyPromptStorage.createFolder({ name });
        this.refreshPanel();
      });

      const newPromptBtn = this.panel.querySelector(".pp-new-prompt");
      newPromptBtn.addEventListener("click", async () => {
        const title = prompt("Prompt title?");
        if (!title) return;
        const body = prompt("Prompt text? (full body)");
        if (!body) return;
        await PolyPromptStorage.createPrompt({ title, body });
        this.refreshPanel();
      });

      const search = this.panel.querySelector(".pp-search");
      search.addEventListener("input", (e) => this.refreshPanel(e.target.value));
    }

    async refreshPanel(query = "") {
      const folders = await PolyPromptStorage.listFolders();
      const allPrompts = await PolyPromptStorage.listPrompts();
      const q = query.trim().toLowerCase();

      const folderHtml = folders
        .filter((f) => !q || f.name.toLowerCase().includes(q))
        .map(
          (f) => `
            <div class="pp-folder" data-id="${f.id}">
              <span class="pp-folder-name">📁 ${escapeHtml(f.name)}</span>
              <button class="pp-folder-del" data-id="${f.id}" title="Delete">×</button>
            </div>`,
        )
        .join("");
      this.panel.querySelector(".pp-folders").innerHTML =
        folderHtml || `<div class="pp-empty">No folders yet</div>`;

      const promptHtml = allPrompts
        .filter(
          (p) =>
            !q ||
            p.title.toLowerCase().includes(q) ||
            p.body.toLowerCase().includes(q),
        )
        .slice(0, 50)
        .map(
          (p) => `
            <div class="pp-prompt" data-id="${p.id}">
              <div class="pp-prompt-title">${escapeHtml(p.title)}</div>
              <div class="pp-prompt-body">${escapeHtml(p.body.slice(0, 60))}${p.body.length > 60 ? "…" : ""}</div>
              <div class="pp-prompt-actions">
                <button class="pp-prompt-insert" data-id="${p.id}">Insert</button>
                <button class="pp-prompt-del" data-id="${p.id}">×</button>
              </div>
            </div>`,
        )
        .join("");
      this.panel.querySelector(".pp-prompts").innerHTML =
        promptHtml || `<div class="pp-empty">No prompts yet</div>`;

      // Wire delete buttons.
      this.panel.querySelectorAll(".pp-folder-del").forEach((btn) =>
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          if (!confirm("Delete this folder?")) return;
          await PolyPromptStorage.deleteFolder(btn.dataset.id);
          this.refreshPanel();
        }),
      );
      this.panel.querySelectorAll(".pp-prompt-del").forEach((btn) =>
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          if (!confirm("Delete this prompt?")) return;
          await PolyPromptStorage.deletePrompt(btn.dataset.id);
          this.refreshPanel();
        }),
      );

      // Wire insert buttons.
      this.panel.querySelectorAll(".pp-prompt-insert").forEach((btn) =>
        btn.addEventListener("click", async () => {
          const all = await PolyPromptStorage.listPrompts();
          const p = all.find((x) => x.id === btn.dataset.id);
          if (p) this.insertIntoInput(p.body);
        }),
      );
    }

    // ----- chat list watching --------------------------------------------

    watchChatList() {
      // Optional — only fires if the platform's chat list is found.
      // It's fine to skip; the panel works regardless.
      if (!this.selectors.chatList) return;
      const list = document.querySelector(this.selectors.chatList);
      if (!list) return;
      const observer = new MutationObserver(() => this.decorateChatList());
      observer.observe(list, { childList: true, subtree: true });
      this.decorateChatList();
    }

    async decorateChatList() {
      // Subclass-overridable. Default no-op.
    }

    // ----- input injection ------------------------------------------------

    findInput() {
      // Try every selector in order; return the first visible match.
      // `selectors.input` can be a single CSS selector string or a comma-
      // separated list; either way we split and try each so per-site
      // adapters can list fallbacks.
      const selectorStr = this.selectors.input || "";
      const list = selectorStr.split(",").map((s) => s.trim()).filter(Boolean);
      for (const sel of list) {
        const candidates = document.querySelectorAll(sel);
        for (const c of candidates) {
          // Pick the last visible candidate — modern LLM UIs put the
          // active input near the bottom of the page.
          const rect = c.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            return c;
          }
        }
      }
      return null;
    }

    insertIntoInput(text) {
      const inp = this.findInput();
      if (!inp) {
        this._fallbackToClipboard(text, "couldn't find the chat input");
        return;
      }

      // Native form inputs: set value directly.
      if (inp.tagName === "TEXTAREA" || inp.tagName === "INPUT") {
        inp.focus();
        const prev = inp.value || "";
        const sep = prev && !prev.endsWith("\n") ? "\n" : "";
        inp.value = prev + sep + text;
        inp.dispatchEvent(new Event("input", { bubbles: true }));
        inp.dispatchEvent(new Event("change", { bubbles: true }));
        return;
      }

      // Contenteditable: each LLM picks its own strategy. We dispatch
      // exactly one — no cascading, no verification.
      //   "execCommand" → ChatGPT, Claude, Gemini (ProseMirror & friends)
      //   "paste"       → Perplexity (Lexical)
      //
      // If a site changes editors and stops working, we just flip its
      // `inputStrategy` in the per-site content script.
      const strategy = this.selectors.inputStrategy || "execCommand";
      inp.focus();
      try {
        if (strategy === "paste") {
          this._insertViaPaste(inp, text);
        } else {
          this._insertViaExecCommand(inp, text);
        }
      } catch (e) {
        this._fallbackToClipboard(text, "insertion failed");
      }
    }

    _insertViaExecCommand(inp, text) {
      // The classic approach. Works for ProseMirror, Google's editor,
      // and most "type into me" contenteditable controls.
      document.execCommand("insertText", false, text);
    }

    _insertViaPaste(inp, text) {
      // Place the cursor at the end so the paste appends rather than
      // overwriting any selection or starting mid-document.
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        const range = document.createRange();
        range.selectNodeContents(inp);
        range.collapse(false);
        selection.addRange(range);
      }
      const dt = new DataTransfer();
      dt.setData("text/plain", text);
      inp.dispatchEvent(
        new ClipboardEvent("paste", {
          bubbles: true,
          cancelable: true,
          clipboardData: dt,
        }),
      );
    }

    _fallbackToClipboard(text, reason) {
      navigator.clipboard.writeText(text).catch(() => {});
      alert(
        `PolyPrompt: ${reason}.\n\n` +
          "Prompt copied to clipboard — paste with Cmd/Ctrl+V.",
      );
    }
  }

  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  globalThis.LLMAdapter = LLMAdapter;
})();
