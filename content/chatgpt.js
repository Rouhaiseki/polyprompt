/**
 * ChatGPT adapter.
 *
 * Selectors target chatgpt.com (and the older chat.openai.com that redirects
 * there). The OpenAI UI changes often — if anything breaks, the most likely
 * culprits are below, and they're the only thing that needs updating.
 */

(function () {
  const adapter = new LLMAdapter({
    platform: "chatgpt",
    displayName: "ChatGPT",
    selectors: {
      sidebar: "nav[aria-label='Chat history'], nav#stage-slideover-sidebar, nav.flex-col",
      chatList: "nav ol",
      chatItem: "nav ol li",
      chatTitle: "nav ol li a",
      input: "textarea#prompt-textarea, div#prompt-textarea[contenteditable='true']",
    },
  });

  adapter.init().catch((err) => {
    console.warn("[PolyPrompt/ChatGPT] init failed:", err);
  });
})();
