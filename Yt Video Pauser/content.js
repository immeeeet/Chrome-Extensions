// Get current video ID from URL
function getVideoId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("v");
}

// Check if auto-pause is enabled for this video
function isAutoPauseEnabled(videoId) {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get([videoId], (result) => {
        resolve(result[videoId] === true);
      });
    } catch (error) {
      console.error("Storage error:", error);
      resolve(false);
    }
  });
}

// Toggle auto-pause for current video
function toggleAutoPause(videoId) {
  return new Promise(async (resolve) => {
    try {
      const current = await isAutoPauseEnabled(videoId);
      const newState = !current;

      if (newState) {
        chrome.storage.local.set({ [videoId]: true }, () => {
          resolve(newState);
        });
      } else {
        chrome.storage.local.remove([videoId], () => {
          resolve(newState);
        });
      }
    } catch (error) {
      console.error("Toggle error:", error);
      resolve(false);
    }
  });
}

// Create toggle button UI
function createToggleButton() {
  const button = document.createElement("button");
  button.id = "smart-pause-toggle";
  button.className = "smart-pause-btn";
  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
    </svg>
    <span class="toggle-text">Auto-pause: OFF</span>
  `;
  return button;
}

// Update button state
async function updateButtonState(button, videoId) {
  try {
    const enabled = await isAutoPauseEnabled(videoId);
    button.classList.toggle("disabled", !enabled);
    button.querySelector(".toggle-text").textContent = `Auto-pause: ${
      enabled ? "ON" : "OFF"
    }`;
  } catch (error) {
    console.error("Update button error:", error);
  }
}

// Insert button into YouTube controls
function insertToggleButton() {
  const existingBtn = document.getElementById("smart-pause-toggle");
  if (existingBtn) existingBtn.remove();

  const controls = document.querySelector(".ytp-right-controls");
  if (!controls) return;

  const button = createToggleButton();
  const videoId = getVideoId();

  if (!videoId) return;

  updateButtonState(button, videoId);

  button.addEventListener("click", async () => {
    try {
      const newState = await toggleAutoPause(videoId);
      await updateButtonState(button, videoId);
    } catch (error) {
      console.error("Button click error:", error);
    }
  });

  controls.insertBefore(button, controls.firstChild);
}

// Handle tab visibility changes
let wasPlaying = false;

document.addEventListener("visibilitychange", async () => {
  try {
    const video = document.querySelector("video");
    if (!video) return;

    const videoId = getVideoId();
    if (!videoId) return;

    const autoPauseEnabled = await isAutoPauseEnabled(videoId);

    if (!autoPauseEnabled) return;

    if (document.hidden) {
      wasPlaying = !video.paused;
      if (wasPlaying) {
        video.pause();
      }
    } else {
      if (wasPlaying) {
        video.play();
        wasPlaying = false;
      }
    }
  } catch (error) {
    console.error("Visibility change error:", error);
  }
});

// Initialize on page load and navigation
function init() {
  const checkPlayer = setInterval(() => {
    const controls = document.querySelector(".ytp-right-controls");
    if (controls) {
      clearInterval(checkPlayer);
      insertToggleButton();
    }
  }, 1000);

  setTimeout(() => clearInterval(checkPlayer), 10000);
}

// Run on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Re-run when YouTube navigates (SPA navigation)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(init, 1000);
  }
}).observe(document, { subtree: true, childList: true });

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "preferencesCleared") {
    const button = document.getElementById("smart-pause-toggle");
    const videoId = getVideoId();
    if (button && videoId) {
      updateButtonState(button, videoId).then(() => {
        sendResponse({ success: true });
      });
    } else {
      sendResponse({ success: false });
    }
    return true;
  }
});
