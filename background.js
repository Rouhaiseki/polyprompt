/**
 * PolyPrompt background service worker.
 *
 * Currently a stub. Future use:
 *  - Listen for keyboard shortcut commands.
 *  - Coordinate cross-tab sync once we add cloud (Pro).
 *  - Handle install / update lifecycle.
 */

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") {
    chrome.tabs.create({
      url: chrome.runtime.getURL("popup/popup.html?onboarding=1"),
    });
  }
});
