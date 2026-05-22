# PolyPrompt Privacy Policy

**Last updated: 2026-05-22**

PolyPrompt is a Chrome extension that helps you organize prompts and folders
across ChatGPT, Claude, Gemini, and Perplexity. This policy describes exactly
what PolyPrompt does (and doesn't do) with your data.

## What we collect

**Nothing.** PolyPrompt does not collect, transmit, store on our servers, or
share any of your data. We don't run a server, so we have nothing to collect
*to*.

## What stays on your device

Your folders, prompts, and tagged-chat metadata are stored locally on your
device using Chrome's built-in `chrome.storage.local` API. This data:

- Never leaves your machine.
- Is not synced to your Google account by us (Chrome itself may sync
  extension data if you have Chrome Sync enabled — that's between you and
  Google).
- Is removed if you uninstall the extension or clear its storage.

## What we don't access

- We do **not** read your chats on ChatGPT, Claude, Gemini, or Perplexity.
  The extension only observes the page well enough to (a) display its own
  panel and (b) insert your prompt text into the chat input field when you
  click "Insert".
- We do **not** transmit any data to any third-party server.
- We do **not** use analytics, telemetry, or tracking.

## Permissions explained

`storage` — Lets the extension save your folders and prompts on your
device.

`scripting` — Required by Chrome's Manifest V3 for content-script injection
into LLM pages. Used solely to render the PolyPrompt panel and the
"Insert" button.

`activeTab` — Lets the extension insert your prompt into the current LLM
tab when you click Insert.

`host_permissions` for `chatgpt.com`, `claude.ai`, `gemini.google.com`,
`perplexity.ai` — Required for the panel to appear on those specific sites.
The extension does not run on any other domain.

## Future Pro tier (not yet shipped)

When PolyPrompt eventually offers a Pro tier with optional cloud sync, that
feature will be **opt-in only** and will be documented in detail before
launch. The free tier will always be 100% local.

## Contact

For privacy questions or data requests, open an issue at
[github.com/Rouhaiseki/polyprompt/issues](https://github.com/Rouhaiseki/polyprompt/issues).

This policy may be updated as the extension evolves; check the date at the
top.
