// Background script for handling extension events
// Currently minimal - can be extended for future features

chrome.runtime.onInstalled.addListener(() => {
  console.log("YouTube Smart Pause extension installed");
});

// Listen for messages from content script if needed
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSettings") {
    // Can add global settings here
    sendResponse({ success: true });
  }
});
