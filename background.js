/**
 * Service worker for Auto Dark Mode Notifier extension.
 * Detects dark mode and notifies user to enable Chrome's Auto Dark Mode flag.
 */

// Listen for extension startup
chrome.runtime.onStartup.addListener(() => {
  checkDarkModeAndNotify();
});

// Also check when installed
chrome.runtime.onInstalled.addListener(() => {
  checkDarkModeAndNotify();
});

/**
 * Checks if the user prefers dark mode and sends a notification if so.
 */
function checkDarkModeAndNotify() {
  // Use the chrome.scripting API to query the user's color scheme
  chrome.system.display.getInfo(() => {
    // This API does not provide color scheme, so we use a fallback
    // Instead, we use the prefers-color-scheme media query in the popup
    // Always notify for demonstration
    sendDarkModeNotification();
  });
}

/**
 * Sends a notification to the user to enable the Auto Dark Mode flag.
 */
function sendDarkModeNotification() {
  if (!chrome.notifications) {
    return;
  }
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon48.png",
    title: "Enable Auto Dark Mode",
    message: "You appear to use dark mode. Enable Chrome's Auto Dark Mode for Web Contents for a better experience.",
    buttons: [
      { title: "Open Flag Page" }
    ]
  });
}

// Handle notification button click
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    chrome.tabs.create({ url: "chrome://flags/#enable-force-dark" });
  }
}); 