/**
 * content.js — Runs in the extension's isolated world (has chrome API access).
 *
 * Responsibilities:
 *  1. Inject inject.js into the real page JS context before any page scripts run.
 *  2. Bridge messages between the injected override and chrome.storage:
 *     - Page asks for the virtual camera image → fetch from storage → reply.
 *     - Page signals it no longer needs the stream → nothing to do (GC handles it).
 *
 * WHY a bridge? inject.js runs in the page's JS context and has no access to
 * chrome.* APIs, so it must communicate via window.postMessage.
 */

(function injectOverrideScript() {
  const scriptElement = document.createElement("script");
  scriptElement.src = chrome.runtime.getURL("inject.js");
  scriptElement.dataset.extensionId = chrome.runtime.id;
  // Insert before <head> so it runs before any site scripts touch getUserMedia
  (document.documentElement || document.head || document.body).prepend(scriptElement);
  scriptElement.remove(); // Clean up the DOM tag after script is queued
})();

// ── Message bridge ─────────────────────────────────────────────────────────────

const MESSAGE_REQUEST     = "FAUXCAM_REQUEST_IMAGE";
const MESSAGE_RESPONSE    = "FAUXCAM_IMAGE_RESPONSE";
const STORAGE_KEY_IMAGE   = "fauxcam_image_data_url";
const STORAGE_KEY_ENABLED = "fauxcam_enabled";

window.addEventListener("message", async (event) => {
  // Only handle messages from the same page — ignore cross-origin frames
  if (event.source !== window) {return;}
  if (!event.data || event.data.type !== MESSAGE_REQUEST) {return;}

  const storage = await chrome.storage.local.get([STORAGE_KEY_IMAGE, STORAGE_KEY_ENABLED]);
  const isEnabled = storage[STORAGE_KEY_ENABLED] ?? false;
  const imageDataUrl = storage[STORAGE_KEY_IMAGE] ?? null;

  window.postMessage(
    {
      type: MESSAGE_RESPONSE,
      isEnabled,
      imageDataUrl,
    },
    "*"
  );
});
