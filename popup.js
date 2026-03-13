/**
 * popup.js — Controls the extension popup UI.
 *
 * Manages:
 *  - Enable/disable toggle → persisted to chrome.storage.local
 *  - Image upload (file picker + drag-and-drop) → stored as base64 dataURL
 *  - Preview + remove of the stored image
 *
 * Storage keys:
 *  - fauxcam_enabled       : boolean
 *  - fauxcam_image_data_url: string (base64 data URL)
 */

const STORAGE_KEY_IMAGE   = "fauxcam_image_data_url";
const STORAGE_KEY_ENABLED = "fauxcam_enabled";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// ── DOM references ─────────────────────────────────────────────────────────────
const enabledToggle = document.getElementById("enabled-toggle");
const statusBadge = document.getElementById("status-badge");
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const previewContainer = document.getElementById("preview-container");
const previewImg = document.getElementById("preview-img");
const removeBtn = document.getElementById("remove-btn");
const statusMsg = document.getElementById("status-msg");

// ── Helpers ────────────────────────────────────────────────────────────────────

function showStatus(message, isError = false) {
  statusMsg.textContent = message;
  statusMsg.className = isError ? "error" : "";
  if (!isError) setTimeout(() => { statusMsg.textContent = ""; }, 3000);
}

function updateBadge(isEnabled) {
  statusBadge.textContent = isEnabled ? "ON" : "OFF";
  statusBadge.className = `header-badge ${isEnabled ? "active" : "inactive"}`;
}

function showPreview(dataUrl) {
  previewImg.src = dataUrl;
  dropZone.style.display = "none";
  previewContainer.style.display = "block";
}

function clearPreview() {
  previewImg.src = "";
  previewContainer.style.display = "none";
  dropZone.style.display = "block";
  fileInput.value = "";
}

/**
 * Reads a File as a base64 data URL.
 * Validates size before reading.
 */
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      reject(new Error("File exceeds the 10 MB limit. Please use a smaller image."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read the selected file."));
    reader.readAsDataURL(file);
  });
}

// ── Storage operations ─────────────────────────────────────────────────────────

async function saveImage(dataUrl) {
  await chrome.storage.local.set({ [STORAGE_KEY_IMAGE]: dataUrl });
  showPreview(dataUrl);
  showStatus("✓ Image saved — ready to use.");
}

async function removeImage() {
  await chrome.storage.local.remove(STORAGE_KEY_IMAGE);
  clearPreview();
  showStatus("Image removed.");
}

async function setEnabled(value) {
  await chrome.storage.local.set({ [STORAGE_KEY_ENABLED]: value });
  updateBadge(value);
}

// ── Event handlers ─────────────────────────────────────────────────────────────

enabledToggle.addEventListener("change", () => setEnabled(enabledToggle.checked));

dropZone.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));

dropZone.addEventListener("drop", async (event) => {
  event.preventDefault();
  dropZone.classList.remove("drag-over");
  const file = event.dataTransfer?.files[0];
  if (file) await handleFileSelected(file);
});

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (file) await handleFileSelected(file);
});

removeBtn.addEventListener("click", removeImage);

async function handleFileSelected(file) {
  try {
    const dataUrl = await readFileAsDataUrl(file);
    await saveImage(dataUrl);
  } catch (error) {
    showStatus(error.message, true);
  }
}

// ── Initialise from storage on popup open ─────────────────────────────────────

async function initialise() {
  const stored = await chrome.storage.local.get([STORAGE_KEY_IMAGE, STORAGE_KEY_ENABLED]);

  const isEnabled = stored[STORAGE_KEY_ENABLED] ?? false;
  enabledToggle.checked = isEnabled;
  updateBadge(isEnabled);

  if (stored[STORAGE_KEY_IMAGE]) {
    showPreview(stored[STORAGE_KEY_IMAGE]);
  }
}

initialise();
