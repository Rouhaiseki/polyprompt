/**
 * PolyPrompt popup — the full-page UI for managing folders and prompts.
 *
 * Renders into popup.html. Shares storage with the content-script panels
 * via chrome.storage.local (PolyPromptStorage exposes the same API).
 */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const state = {
  editingPromptId: null,
};

// ---------- Render ---------------------------------------------------------

async function renderFolders() {
  const folders = await PolyPromptStorage.listFolders();
  const list = $("#folders");
  if (!folders.length) {
    list.innerHTML = `<p class="item-body">No folders yet — create one to organize your chats.</p>`;
    return;
  }
  list.innerHTML = folders
    .map(
      (f) => `
      <div class="item" data-id="${f.id}">
        <div class="item-title">📁 ${escape(f.name)}</div>
        <div class="item-actions">
          <button data-act="rename" data-id="${f.id}">Rename</button>
          <button class="danger" data-act="delete-folder" data-id="${f.id}">Delete</button>
        </div>
      </div>`,
    )
    .join("");
  list.querySelectorAll("button[data-act]").forEach((btn) => {
    btn.addEventListener("click", (e) => handleFolderAction(e.currentTarget));
  });
  // Also refill the folder dropdown in modal.
  const select = $("#modal-prompt-folder");
  const current = select.value;
  select.innerHTML =
    `<option value="">(none)</option>` +
    folders.map((f) => `<option value="${f.id}">${escape(f.name)}</option>`).join("");
  if (current) select.value = current;
}

async function renderPrompts(query = "") {
  const all = await PolyPromptStorage.listPrompts();
  const q = query.trim().toLowerCase();
  const matched = !q
    ? all
    : all.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.body.toLowerCase().includes(q) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(q)),
      );

  const list = $("#prompts");
  if (!matched.length) {
    list.innerHTML = `<p class="item-body">${q ? "No matches." : "No prompts yet — click ＋ New prompt."}</p>`;
    return;
  }
  list.innerHTML = matched
    .map(
      (p) => `
      <div class="item" data-id="${p.id}">
        <div>
          <div class="item-title">${escape(p.title)}</div>
          <div class="item-body">${escape(p.body.slice(0, 80))}${p.body.length > 80 ? "…" : ""}</div>
        </div>
        <div class="item-actions">
          <button data-act="copy" data-id="${p.id}" title="Copy">Copy</button>
          <button data-act="edit" data-id="${p.id}">Edit</button>
          <button class="danger" data-act="delete-prompt" data-id="${p.id}">×</button>
        </div>
      </div>`,
    )
    .join("");
  list.querySelectorAll("button[data-act]").forEach((btn) =>
    btn.addEventListener("click", (e) => handlePromptAction(e.currentTarget)),
  );
}

// ---------- Actions --------------------------------------------------------

async function handleFolderAction(btn) {
  const id = btn.dataset.id;
  const act = btn.dataset.act;
  if (act === "rename") {
    const name = prompt("New folder name?");
    if (!name) return;
    await PolyPromptStorage.renameFolder(id, name);
  } else if (act === "delete-folder") {
    if (!confirm("Delete this folder? Prompts in it become un-foldered.")) return;
    await PolyPromptStorage.deleteFolder(id);
  }
  await renderFolders();
  await renderPrompts($("#search").value);
}

async function handlePromptAction(btn) {
  const id = btn.dataset.id;
  const act = btn.dataset.act;
  const all = await PolyPromptStorage.listPrompts();
  const p = all.find((x) => x.id === id);
  if (!p) return;

  if (act === "copy") {
    await navigator.clipboard.writeText(p.body);
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = "Copy"), 1200);
  } else if (act === "edit") {
    openModal(p);
  } else if (act === "delete-prompt") {
    if (!confirm("Delete this prompt?")) return;
    await PolyPromptStorage.deletePrompt(id);
    await renderPrompts($("#search").value);
  }
}

function openModal(prompt = null) {
  state.editingPromptId = prompt ? prompt.id : null;
  $("#modal-title").textContent = prompt ? "Edit prompt" : "New prompt";
  $("#modal-prompt-title").value = prompt ? prompt.title : "";
  $("#modal-prompt-body").value = prompt ? prompt.body : "";
  $("#modal-prompt-folder").value = prompt ? prompt.folderId || "" : "";
  $("#modal-overlay").classList.remove("hidden");
  $("#modal-prompt-title").focus();
}

function closeModal() {
  state.editingPromptId = null;
  $("#modal-overlay").classList.add("hidden");
}

async function saveModal() {
  const title = $("#modal-prompt-title").value.trim();
  const body = $("#modal-prompt-body").value.trim();
  const folderId = $("#modal-prompt-folder").value || null;
  if (!title || !body) {
    alert("Title and body are both required.");
    return;
  }
  if (state.editingPromptId) {
    await PolyPromptStorage.updatePrompt(state.editingPromptId, { title, body, folderId });
  } else {
    await PolyPromptStorage.createPrompt({ title, body, folderId });
  }
  closeModal();
  await renderPrompts($("#search").value);
}

// ---------- Wiring ---------------------------------------------------------

function escape(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

$("#new-folder").addEventListener("click", async () => {
  const name = prompt("Folder name?");
  if (!name) return;
  await PolyPromptStorage.createFolder({ name });
  await renderFolders();
});

$("#new-prompt").addEventListener("click", () => openModal());
$("#modal-cancel").addEventListener("click", closeModal);
$("#modal-save").addEventListener("click", saveModal);
$("#modal-overlay").addEventListener("click", (e) => {
  if (e.target.id === "modal-overlay") closeModal();
});

$("#search").addEventListener("input", (e) => renderPrompts(e.target.value));

// Initial render
renderFolders().then(() => renderPrompts());
