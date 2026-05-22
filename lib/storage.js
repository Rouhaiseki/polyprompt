/**
 * PolyPrompt storage layer.
 *
 * Single source of truth for folders, prompts, and tagged chats. Backed by
 * chrome.storage.local in v0.1; the same API will be swappable for Supabase
 * sync in Pro (no call sites change).
 *
 * Data shape:
 *   {
 *     folders: { [folderId]: { id, name, color, createdAt } },
 *     prompts: { [promptId]: { id, title, body, folderId, tags, createdAt, updatedAt } },
 *     taggedChats: { [platform]: { [chatId]: { folderId, customLabel? } } }
 *   }
 *
 * platform ∈ {chatgpt, claude, gemini, perplexity}
 */

(function () {
  const KEY = "polyprompt.v1";

  const empty = () => ({
    folders: {},
    prompts: {},
    taggedChats: { chatgpt: {}, claude: {}, gemini: {}, perplexity: {} },
  });

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  async function readAll() {
    const obj = await chrome.storage.local.get(KEY);
    return obj[KEY] || empty();
  }

  async function writeAll(state) {
    await chrome.storage.local.set({ [KEY]: state });
  }

  // ------- Folders ----------------------------------------------------------

  async function listFolders() {
    const s = await readAll();
    return Object.values(s.folders).sort((a, b) => a.createdAt - b.createdAt);
  }

  async function createFolder({ name, color = "#6b7280" }) {
    const s = await readAll();
    const folder = { id: uid(), name, color, createdAt: Date.now() };
    s.folders[folder.id] = folder;
    await writeAll(s);
    return folder;
  }

  async function renameFolder(folderId, name) {
    const s = await readAll();
    if (!s.folders[folderId]) return null;
    s.folders[folderId].name = name;
    await writeAll(s);
    return s.folders[folderId];
  }

  async function deleteFolder(folderId) {
    const s = await readAll();
    delete s.folders[folderId];
    // Unassign prompts and chats from the deleted folder.
    for (const p of Object.values(s.prompts)) {
      if (p.folderId === folderId) p.folderId = null;
    }
    for (const platform of Object.keys(s.taggedChats)) {
      for (const chatId of Object.keys(s.taggedChats[platform])) {
        if (s.taggedChats[platform][chatId].folderId === folderId) {
          delete s.taggedChats[platform][chatId];
        }
      }
    }
    await writeAll(s);
  }

  // ------- Prompts ----------------------------------------------------------

  async function listPrompts({ folderId } = {}) {
    const s = await readAll();
    let prompts = Object.values(s.prompts);
    if (folderId !== undefined) {
      prompts = prompts.filter((p) => p.folderId === folderId);
    }
    return prompts.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async function createPrompt({ title, body, folderId = null, tags = [] }) {
    const s = await readAll();
    const now = Date.now();
    const prompt = {
      id: uid(),
      title,
      body,
      folderId,
      tags,
      createdAt: now,
      updatedAt: now,
    };
    s.prompts[prompt.id] = prompt;
    await writeAll(s);
    return prompt;
  }

  async function updatePrompt(promptId, patch) {
    const s = await readAll();
    const p = s.prompts[promptId];
    if (!p) return null;
    Object.assign(p, patch, { updatedAt: Date.now() });
    await writeAll(s);
    return p;
  }

  async function deletePrompt(promptId) {
    const s = await readAll();
    delete s.prompts[promptId];
    await writeAll(s);
  }

  // ------- Tagged chats -----------------------------------------------------

  async function tagChat(platform, chatId, folderId, customLabel) {
    const s = await readAll();
    if (!s.taggedChats[platform]) s.taggedChats[platform] = {};
    s.taggedChats[platform][chatId] = { folderId, customLabel };
    await writeAll(s);
  }

  async function untagChat(platform, chatId) {
    const s = await readAll();
    if (s.taggedChats[platform]) delete s.taggedChats[platform][chatId];
    await writeAll(s);
  }

  async function getTaggedChats(platform) {
    const s = await readAll();
    return s.taggedChats[platform] || {};
  }

  // ------- Search -----------------------------------------------------------

  async function search(query) {
    const s = await readAll();
    const q = query.trim().toLowerCase();
    if (!q) return { folders: [], prompts: [] };

    const folders = Object.values(s.folders).filter((f) =>
      f.name.toLowerCase().includes(q),
    );
    const prompts = Object.values(s.prompts).filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.body.toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q)),
    );
    return { folders, prompts };
  }

  // Expose globally so content scripts and popup can use the same instance.
  globalThis.PolyPromptStorage = {
    listFolders,
    createFolder,
    renameFolder,
    deleteFolder,
    listPrompts,
    createPrompt,
    updatePrompt,
    deletePrompt,
    tagChat,
    untagChat,
    getTaggedChats,
    search,
  };
})();
