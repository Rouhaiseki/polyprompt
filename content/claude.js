/**
 * Claude adapter (claude.ai).
 */

(function () {
  const adapter = new LLMAdapter({
    platform: "claude",
    displayName: "Claude",
    selectors: {
      sidebar: "nav, aside[data-testid='sidebar'], div[data-testid='sidebar']",
      chatList: "nav ul, [data-testid='recent-chats']",
      chatItem: "nav ul li, [data-testid='chat-item']",
      chatTitle: "nav ul li a, [data-testid='chat-item'] a",
      input: "div[contenteditable='true'].ProseMirror, textarea[name='message']",
    },
  });

  adapter.init().catch((err) => {
    console.warn("[PolyPrompt/Claude] init failed:", err);
  });
})();
