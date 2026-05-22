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
      // Perplexity uses Lexical (a contenteditable div) for its main
      // input. Older builds also used textareas in places. Listing every
      // realistic candidate; findInput() picks the last visible one.
      input:
        "div[contenteditable='true'][role='textbox'], div.lexical-editor[contenteditable='true'], div[contenteditable='true'].ProseMirror, textarea[placeholder*='Ask'], textarea[aria-label*='Ask'], textarea[placeholder]",
      // Lexical ignores execCommand; it needs a synthetic paste event.
      inputStrategy: "paste",
    },
  });

  adapter.init().catch((err) => {
    console.warn("[PolyPrompt/Perplexity] init failed:", err);
  });
})();
