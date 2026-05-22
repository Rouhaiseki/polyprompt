/**
 * Perplexity adapter (www.perplexity.ai).
 */

(function () {
  const adapter = new LLMAdapter({
    platform: "perplexity",
    displayName: "Perplexity",
    selectors: {
      sidebar: "aside, nav[aria-label='Sidebar'], div[class*='Sidebar']",
      chatList: "[class*='ThreadList'], aside ul",
      chatItem: "[class*='ThreadItem'], aside li",
      chatTitle: "[class*='ThreadItem'] a, aside li a",
      input: "textarea[placeholder*='Ask'], textarea[aria-label*='Ask']",
    },
  });

  adapter.init().catch((err) => {
    console.warn("[PolyPrompt/Perplexity] init failed:", err);
  });
})();
