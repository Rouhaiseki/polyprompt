/**
 * Gemini adapter (gemini.google.com).
 */

(function () {
  const adapter = new LLMAdapter({
    platform: "gemini",
    displayName: "Gemini",
    selectors: {
      sidebar: "side-nav-menu, [role='navigation']",
      chatList: "[data-test-id='conversation-list'], conversations-list",
      chatItem: "[data-test-id='conversation'], conversation-card",
      chatTitle: ".conversation-title",
      input: "rich-textarea div[contenteditable='true'], textarea.user-input",
    },
  });

  adapter.init().catch((err) => {
    console.warn("[PolyPrompt/Gemini] init failed:", err);
  });
})();
