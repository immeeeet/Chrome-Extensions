// Update statistics
async function updateStats() {
  const data = await chrome.storage.local.get(null);
  const enabled = Object.keys(data).length;

  document.getElementById("enabled-count").textContent = enabled;
}

// Clear all preferences
document.getElementById("clear-btn").addEventListener("click", async () => {
  await chrome.storage.local.clear();
  updateStats();

  // Notify all YouTube tabs to refresh their buttons
  const tabs = await chrome.tabs.query({ url: "https://www.youtube.com/*" });
  tabs.forEach((tab) => {
    chrome.tabs
      .sendMessage(tab.id, { action: "preferencesCleared" })
      .catch(() => {
        // Ignore errors for tabs where content script isn't loaded
      });
  });

  // Visual feedback - change button text temporarily
  const btn = document.getElementById("clear-btn");
  const originalText = btn.textContent;
  btn.textContent = "✓ Cleared!";
  btn.style.background = "#10b981";
  setTimeout(() => {
    btn.textContent = originalText;
    btn.style.background = "";
  }, 1500);
});

// Initialize on popup open
updateStats();
