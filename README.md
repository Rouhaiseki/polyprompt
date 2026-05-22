# PolyPrompt

> Folders and a unified prompt library for **every LLM you use** — ChatGPT, Claude, Gemini, and Perplexity. One Chrome extension. Free.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-orange.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)

Existing tools (Easy Folders, etc.) organize a single LLM's chats. PolyPrompt assumes you use 2–4 LLMs and want **one place to keep your folders and prompts** that shows up on every site.

## Features (v0.1)

- 📁 Folder organization for chat history on **ChatGPT, Claude, Gemini, Perplexity**
- 📝 Personal prompt library — write once, reuse on any of the four sites
- 🔍 Search across every folder and prompt
- ⚡ One-click "Insert" pushes a prompt into the active LLM's input field
- 💾 100% local storage in v0.1 — nothing leaves your machine
- 🆓 Free, MIT-licensed

## Install (developer mode, while pending Chrome Web Store review)

1. Clone this repo:
   ```bash
   git clone https://github.com/Rouhaiseki/polyprompt.git
   ```
2. Open `chrome://extensions` in Chrome (or any Chromium-based browser).
3. Enable **Developer mode** (top right).
4. Click **Load unpacked**, choose the `polyprompt/` directory.
5. Visit ChatGPT, Claude, Gemini, or Perplexity. You'll see a small **📁 PolyPrompt** panel at the bottom-right of the sidebar — click to expand.

## Coming soon (v0.2 / Pro)

- ☁️ Cloud sync across browsers / devices (Supabase-backed)
- 👥 Team-shared prompt libraries
- 🤖 Add more LLMs: Poe, Mistral, Grok, Kimi
- 🔑 OS keychain for masked prompts (so prompts with placeholders can't get leaked)
- 📊 Usage analytics — which prompts work best for you

## Why this exists

Power users juggle 3–5 LLMs daily: ChatGPT for general, Claude for code, Gemini for grounding, Perplexity for research. None of them know about each other, so every prompt lives in only one place. PolyPrompt is the connecting layer — the prompt library that follows you everywhere.

## Tech

- Manifest V3 Chrome extension
- Pure ES modules, no build step, no dependencies
- `chrome.storage.local` for v0.1 data layer (swappable for cloud later)
- Adapter pattern per LLM site — each one is a 12-line file, easy to add new ones

## Architecture

```
polyprompt/
├── manifest.json
├── background.js          # service worker stub
├── lib/
│   ├── storage.js         # the entire data layer in ~150 lines
│   └── adapter-base.js    # injects sidebar panel; subclassed per site
├── content/
│   ├── chatgpt.js         # selectors for chatgpt.com / chat.openai.com
│   ├── claude.js          # selectors for claude.ai
│   ├── gemini.js          # selectors for gemini.google.com
│   └── perplexity.js      # selectors for www.perplexity.ai
├── sidebar/
│   └── sidebar.css        # styles for the injected panel
├── popup/
│   ├── popup.html         # full-page CRUD UI when you click the toolbar icon
│   ├── popup.js
│   └── popup.css
└── icons/                 # 16/32/48/128 placeholders (better logo coming)
```

## Contributing

LLM UIs change often. If a site stops working, the fix is almost always in `content/<site>.js` — adjust the four selectors at the top.

Pull requests for new LLM adapters (Poe, Mistral, Kimi, Grok, …) very welcome.

## License

MIT.
