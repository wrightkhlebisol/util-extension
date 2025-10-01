/**
 * popup.js
 * JavaScript for the browser extension popup.
 * Handles UI interactions and invokes content scripts as needed.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Dropdown toggling logic
  const dropdowns = document.querySelectorAll(".dropdown");
  dropdowns.forEach((dropdown) => {
    const header = dropdown.querySelector(".dropdown-header");
    if (header) {
      header.addEventListener("click", () => {
        dropdown.classList.toggle("open");
      });
    }
  });

  // Dark mode detection and UI update
  const body = document.getElementById("body");
  const modeStatus = document.getElementById("mode-status");
  const openFlag = document.getElementById("open-flag");
  if (body && modeStatus && openFlag) {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (isDark) {
      body.classList.add("dark");
      body.querySelectorAll(".dropdown").forEach(dropdown => {
        dropdown.style.backgroundColor = "#333";
      });
      modeStatus.textContent = "Dark mode detected.";
    } else {
      body.classList.add("light");
      modeStatus.textContent = "Light mode detected.";
    }
    openFlag.addEventListener("click", () => {
      chrome.tabs.create({ url: "chrome://flags/#enable-force-dark" });
    });
  }

  // Prime Video Speed Control
  const setSpeedBtn = document.getElementById("set-speed");
  const speedInput = document.getElementById("speed-input");
  const speedStatus = document.getElementById("speed-status");
  if (setSpeedBtn && speedInput && speedStatus) {
    setSpeedBtn.addEventListener("click", () => {
      const speed = parseFloat(speedInput.value);
      if (isNaN(speed) || speed < 0.1 || speed > 16) {
        speedStatus.textContent = "Please enter a valid speed (0.1 - 16).";
        return;
      }
      // Inject content script to set playback speed on Prime Video
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs[0] || !tabs[0].id) {
          speedStatus.textContent = "Could not find active tab.";
          return;
        }
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: (playbackRate) => {
            /**
             * Attempts to set the playback speed on Prime Video.
             * @param {number} playbackRate
             */
            function increaseVidSpeed(playbackRate) {
              try {
                const video = document.querySelector("#dv-web-player > div > div.scalingVideoContainer > div.scalingVideoContainerBottom > div > video");
                if (video) {
                  video.playbackRate = playbackRate;
                  return "Playback speed set to " + playbackRate;
                } else {
                  return "Prime Video player not found.";
                }
              } catch (e) {
                return "Error: " + (e && e.message ? e.message : "Unknown error");
              }
            }
            return increaseVidSpeed(playbackRate);
          },
          args: [speed]
        }, (results) => {
          if (chrome.runtime.lastError) {
            speedStatus.textContent = "Error: " + chrome.runtime.lastError.message;
            return;
          }
          if (results && results[0] && results[0].result) {
            speedStatus.textContent = results[0].result;
          } else {
            speedStatus.textContent = "Could not set playback speed.";
          }
        });
      });
    });
  }

  // Ad/Overlay Remover
  const removeAdsBtn = document.getElementById("remove-ads");
  const adRemoverStatus = document.getElementById("adremover-status");
  if (removeAdsBtn && adRemoverStatus) {
    removeAdsBtn.addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs[0] || !tabs[0].id) {
          adRemoverStatus.textContent = "Could not find active tab.";
          return;
        }
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => {
            // Remove common overlays/popups/ads
            const selectors = [
              '[id*="ad" i]', '[class*="ad" i]', '[id*="overlay" i]', '[class*="overlay" i]', '[id*="popup" i]', '[class*="popup" i]'
            ];
            let removed = 0;
            selectors.forEach(sel => {
              document.querySelectorAll(sel).forEach(el => {
                el.style.display = "none";
                removed++;
              });
            });
            return `Removed ${removed} overlays/ads.`;
          }
        }, (results) => {
          if (chrome.runtime.lastError) {
            adRemoverStatus.textContent = "Error: " + chrome.runtime.lastError.message;
            return;
          }
          if (results && results[0] && results[0].result) {
            adRemoverStatus.textContent = results[0].result;
          } else {
            adRemoverStatus.textContent = "No overlays/ads removed.";
          }
        });
      });
    });
  }

  // Picture-in-Picture (PiP) Enhancer
  const pipBtn = document.getElementById("pip-btn");
  const pipStatus = document.getElementById("pip-status");
  if (pipBtn && pipStatus) {
    pipBtn.addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs[0] || !tabs[0].id) {
          pipStatus.textContent = "Could not find active tab.";
          return;
        }
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => {
            const video = document.querySelector("video");
            if (video && "requestPictureInPicture" in video) {
              video.requestPictureInPicture();
              return "PiP activated.";
            } else {
              return "No video found or PiP not supported.";
            }
          }
        }, (results) => {
          if (chrome.runtime.lastError) {
            pipStatus.textContent = "Error: " + chrome.runtime.lastError.message;
            return;
          }
          if (results && results[0] && results[0].result) {
            pipStatus.textContent = results[0].result;
          } else {
            pipStatus.textContent = "No video found.";
          }
        });
      });
    });
  }

  // Custom Keyboard Shortcuts
  const openShortcutsBtn = document.getElementById("open-shortcuts");
  if (openShortcutsBtn) {
    openShortcutsBtn.addEventListener("click", () => {
      chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
    });
  }

  // Auto-Scroll
  let scrollInterval;
  const startScrollBtn = document.getElementById("start-scroll");
  const stopScrollBtn = document.getElementById("stop-scroll");
  const scrollSpeedInput = document.getElementById("scroll-speed");
  const autoscrollStatus = document.getElementById("autoscroll-status");
  if (startScrollBtn && stopScrollBtn && scrollSpeedInput && autoscrollStatus) {
    startScrollBtn.addEventListener("click", () => {
      const speed = parseInt(scrollSpeedInput.value, 10);
      if (isNaN(speed) || speed < 1 || speed > 100) {
        autoscrollStatus.textContent = "Enter a valid speed (1-100).";
        return;
      }
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs[0] || !tabs[0].id) {
          autoscrollStatus.textContent = "Could not find active tab.";
          return;
        }
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: function (scrollStep) {
            window._autoScrollInterval = setInterval(function () {
              window.scrollBy(0, scrollStep);
            }, 100);
          },
          args: [speed]
        });
        autoscrollStatus.textContent = `Auto-scroll started at speed ${speed}.`;
      });
    });
    stopScrollBtn.addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs[0] || !tabs[0].id) {
          autoscrollStatus.textContent = "Could not find active tab.";
          return;
        }
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: function () {
            clearInterval(window._autoScrollInterval);
          }
        });
        autoscrollStatus.textContent = "Auto-scroll stopped.";
      });
    });
  }

  // Dark Mode/Theme Injector
  const injectDarkBtn = document.getElementById("inject-dark");
  const removeDarkBtn = document.getElementById("remove-dark");
  const themeInjectorStatus = document.getElementById("themeinjector-status");
  if (injectDarkBtn && removeDarkBtn && themeInjectorStatus) {
    injectDarkBtn.addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs[0] || !tabs[0].id) {
          themeInjectorStatus.textContent = "Could not find active tab.";
          return;
        }
        chrome.scripting.insertCSS({
          target: { tabId: tabs[0].id },
          css: "html,body{background:#181818!important;color:#eee!important;}*{background-color:inherit!important;color:inherit!important;}"
        }, () => {
          if (chrome.runtime.lastError) {
            themeInjectorStatus.textContent = "Error: " + chrome.runtime.lastError.message;
          } else {
            themeInjectorStatus.textContent = "Dark mode injected.";
          }
        });
      });
    });
    removeDarkBtn.addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs[0] || !tabs[0].id) {
          themeInjectorStatus.textContent = "Could not find active tab.";
          return;
        }
        chrome.scripting.removeCSS({
          target: { tabId: tabs[0].id },
          css: "html,body{background:#181818!important;color:#eee!important;}*{background-color:inherit!important;color:inherit!important;}"
        }, () => {
          if (chrome.runtime.lastError) {
            themeInjectorStatus.textContent = "Error: " + chrome.runtime.lastError.message;
          } else {
            themeInjectorStatus.textContent = "Dark mode removed.";
          }
        });
      });
    });
  }

  // Quick Notes/Clipboard Manager
  const quickNote = document.getElementById("quick-note");
  const saveNoteBtn = document.getElementById("save-note");
  const copyNoteBtn = document.getElementById("copy-note");
  const notesStatus = document.getElementById("notes-status");
  if (quickNote && saveNoteBtn && copyNoteBtn && notesStatus) {
    saveNoteBtn.addEventListener("click", () => {
      if (quickNote.value.trim().length === 0) {
        notesStatus.textContent = "Note is empty.";
        return;
      }
      chrome.storage.local.set({ quickNote: quickNote.value }, () => {
        notesStatus.textContent = "Note saved.";
      });
    });
    copyNoteBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(quickNote.value).then(() => {
        notesStatus.textContent = "Copied to clipboard.";
      }, () => {
        notesStatus.textContent = "Failed to copy.";
      });
    });
    // Load saved note
    chrome.storage.local.get(["quickNote"], (result) => {
      if (result.quickNote) quickNote.value = result.quickNote;
    });
  }

  // Tab Management Tools
  const closeTabsBtn = document.getElementById("close-tabs");
  const muteTabsBtn = document.getElementById("mute-tabs");
  const saveSessionBtn = document.getElementById("save-session");
  const restoreSessionBtn = document.getElementById("restore-session");
  const tabtoolsStatus = document.getElementById("tabtools-status");
  if (closeTabsBtn && muteTabsBtn && saveSessionBtn && restoreSessionBtn && tabtoolsStatus) {
    closeTabsBtn.addEventListener("click", () => {
      chrome.tabs.query({}, (tabs) => {
        const tabIds = tabs.filter(tab => !tab.pinned && tab.id !== undefined).map(tab => tab.id);
        chrome.tabs.remove(tabIds, () => {
          tabtoolsStatus.textContent = "Closed all unpinned tabs.";
        });
      });
    });
    muteTabsBtn.addEventListener("click", () => {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id !== undefined) {
            chrome.tabs.update(tab.id, { muted: true });
          }
        });
        tabtoolsStatus.textContent = "Muted all tabs.";
      });
    });
    saveSessionBtn.addEventListener("click", () => {
      chrome.tabs.query({}, (tabs) => {
        const urls = tabs.filter(tab => tab.url).map(tab => tab.url);
        chrome.storage.local.set({ savedSession: urls }, () => {
          tabtoolsStatus.textContent = "Session saved.";
        });
      });
    });
    restoreSessionBtn.addEventListener("click", () => {
      chrome.storage.local.get(["savedSession"], (result) => {
        if (result.savedSession && Array.isArray(result.savedSession)) {
          result.savedSession.forEach(function (url) {
            chrome.tabs.create({ url: url });
          });
          tabtoolsStatus.textContent = "Session restored.";
        } else {
          tabtoolsStatus.textContent = "No session found.";
        }
      });
    });
  }

  // Screenshot & Annotation
  const screenshotBtn = document.getElementById("take-screenshot");
  const screenshotStatus = document.getElementById("screenshot-status");
  if (screenshotBtn && screenshotStatus) {
    screenshotBtn.addEventListener("click", () => {
      chrome.tabs.captureVisibleTab(null, {}, (dataUrl) => {
        if (chrome.runtime.lastError || !dataUrl) {
          screenshotStatus.textContent = "Error: " + (chrome.runtime.lastError ? chrome.runtime.lastError.message : "Unknown error");
        } else {
          const img = document.createElement("img");
          img.src = dataUrl;
          img.style.maxWidth = "100%";
          screenshotStatus.innerHTML = "";
          screenshotStatus.appendChild(img);
        }
      });
    });
  }

  // Text-to-Speech
  const ttsText = document.getElementById("tts-text");
  const speakTextBtn = document.getElementById("speak-text");
  const stopSpeakBtn = document.getElementById("stop-speak");
  const ttsStatus = document.getElementById("tts-status");
  let ttsUtterance;
  if (ttsText && speakTextBtn && stopSpeakBtn && ttsStatus) {
    speakTextBtn.addEventListener("click", () => {
      if (!ttsText.value.trim()) {
        ttsStatus.textContent = "Enter text to speak.";
        return;
      }
      ttsUtterance = new window.SpeechSynthesisUtterance(ttsText.value);
      window.speechSynthesis.speak(ttsUtterance);
      ttsStatus.textContent = "Speaking...";
    });
    stopSpeakBtn.addEventListener("click", () => {
      window.speechSynthesis.cancel();
      ttsStatus.textContent = "Stopped.";
    });
  }

  // Price Tracker/History (minimal: just open camelcamelcamel)
  const priceUrlInput = document.getElementById("price-url");
  const trackPriceBtn = document.getElementById("track-price");
  const priceTrackerStatus = document.getElementById("pricetracker-status");
  if (priceUrlInput && trackPriceBtn && priceTrackerStatus) {
    trackPriceBtn.addEventListener("click", () => {
      if (!priceUrlInput.value.trim()) {
        priceTrackerStatus.textContent = "Enter a product URL.";
        return;
      }
      // Open camelcamelcamel for Amazon price history
      if (priceUrlInput.value.includes("amazon.")) {
        chrome.tabs.create({ url: `https://camelcamelcamel.com/search?sq=${encodeURIComponent(priceUrlInput.value)}` });
        priceTrackerStatus.textContent = "Opened price history.";
      } else {
        priceTrackerStatus.textContent = "Only Amazon supported in demo.";
      }
    });
  }

  // Auto-Translate (minimal: use Google Translate)
  const translateText = document.getElementById("translate-text");
  const translateBtn = document.getElementById("translate-btn");
  const translateStatus = document.getElementById("translate-status");
  if (translateText && translateBtn && translateStatus) {
    translateBtn.addEventListener("click", () => {
      if (!translateText.value.trim()) {
        translateStatus.textContent = "Enter text to translate.";
        return;
      }
      const url = `https://translate.google.com/?sl=auto&tl=en&text=${encodeURIComponent(translateText.value)}&op=translate`;
      chrome.tabs.create({ url: url });
      translateStatus.textContent = "Opened Google Translate.";
    });
  }

  // Focus Mode (minimal: block distracting sites by closing them)
  const startFocusBtn = document.getElementById("start-focus");
  const stopFocusBtn = document.getElementById("stop-focus");
  const focusModeStatus = document.getElementById("focusmode-status");
  let focusModeActive = false;
  const distractingSites = ["facebook.com", "twitter.com", "instagram.com", "youtube.com", "reddit.com"];
  if (startFocusBtn && stopFocusBtn && focusModeStatus) {
    startFocusBtn.addEventListener("click", () => {
      focusModeActive = true;
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(function (tab) {
          if (tab.url && distractingSites.some(function (site) { return tab.url.includes(site); }) && tab.id !== undefined) {
            chrome.tabs.remove(tab.id);
          }
        });
        focusModeStatus.textContent = "Focus mode started. Distracting tabs closed.";
      });
    });
    stopFocusBtn.addEventListener("click", () => {
      focusModeActive = false;
      focusModeStatus.textContent = "Focus mode stopped.";
    });
  }

  // Custom CSS/JS Injector
  const customCssInput = document.getElementById("custom-css");
  const injectCssBtn = document.getElementById("inject-css");
  const customJsInput = document.getElementById("custom-js");
  const injectJsBtn = document.getElementById("inject-js");
  const customCssStatus = document.getElementById("customcss-status");
  if (customCssInput && injectCssBtn && customCssStatus) {
    injectCssBtn.addEventListener("click", () => {
      if (!customCssInput.value.trim()) {
        customCssStatus.textContent = "Enter CSS to inject.";
        return;
      }
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs[0] || !tabs[0].id) {
          customCssStatus.textContent = "Could not find active tab.";
          return;
        }
        chrome.scripting.insertCSS({
          target: { tabId: tabs[0].id },
          css: customCssInput.value
        }, function () {
          if (chrome.runtime.lastError) {
            customCssStatus.textContent = "Error: " + chrome.runtime.lastError.message;
          } else {
            customCssStatus.textContent = "CSS injected.";
          }
        });
      });
    });
  }
  if (customJsInput && injectJsBtn && customCssStatus) {
    injectJsBtn.addEventListener("click", () => {
      if (!customJsInput.value.trim()) {
        customCssStatus.textContent = "Enter JS to inject.";
        return;
      }
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs[0] || !tabs[0].id) {
          customCssStatus.textContent = "Could not find active tab.";
          return;
        }
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: function (code) {
            // eslint-disable-next-line no-eval
            eval(code);
          },
          args: [customJsInput.value]
        }, function () {
          if (chrome.runtime.lastError) {
            customCssStatus.textContent = "Error: " + chrome.runtime.lastError.message;
          } else {
            customCssStatus.textContent = "JS injected.";
          }
        });
      });
    });
  }

  // Link Grabber
  const grabLinksBtn = document.getElementById("grab-links");
  const linksOutput = document.getElementById("links-output");
  const copyLinksBtn = document.getElementById("copy-links");
  const linkGrabberStatus = document.getElementById("linkgrabber-status");
  if (grabLinksBtn && linksOutput && copyLinksBtn && linkGrabberStatus) {
    grabLinksBtn.addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs[0] || !tabs[0].id) {
          linkGrabberStatus.textContent = "Could not find active tab.";
          return;
        }
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: function () {
            return Array.from(document.querySelectorAll("a")).map(function (a) { return a.href; }).join("\n");
          }
        }, function (results) {
          if (chrome.runtime.lastError) {
            linkGrabberStatus.textContent = "Error: " + chrome.runtime.lastError.message;
            return;
          }
          if (results && results[0] && results[0].result) {
            linksOutput.value = results[0].result;
            linkGrabberStatus.textContent = "Links grabbed.";
          } else {
            linkGrabberStatus.textContent = "No links found.";
          }
        });
      });
    });
    copyLinksBtn.addEventListener("click", () => {
      if (linksOutput.value.trim()) {
        navigator.clipboard.writeText(linksOutput.value).then(function () {
          linkGrabberStatus.textContent = "Links copied.";
        }, function () {
          linkGrabberStatus.textContent = "Failed to copy.";
        });
      }
    });
  }

  // Media Downloader (minimal: download first video/image/audio)
  const downloadMediaBtn = document.getElementById("download-media");
  const mediaDlStatus = document.getElementById("mediadl-status");
  if (downloadMediaBtn && mediaDlStatus) {
    downloadMediaBtn.addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs[0] || !tabs[0].id) {
          mediaDlStatus.textContent = "Could not find active tab.";
          return;
        }
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: function () {
            var media = document.querySelector("video, audio, img");
            if (media) {
              return media.src || media.currentSrc || null;
            }
            return null;
          }
        }, function (results) {
          if (chrome.runtime.lastError) {
            mediaDlStatus.textContent = "Error: " + chrome.runtime.lastError.message;
            return;
          }
          if (results && results[0] && results[0].result) {
            var url = results[0].result;
            chrome.downloads.download({ url: url });
            mediaDlStatus.textContent = "Download started.";
          } else {
            mediaDlStatus.textContent = "No media found.";
          }
        });
      });
    });
  }

  // Password Visibility Toggle
  const togglePasswordsBtn = document.getElementById("toggle-passwords");
  const passwordToggleStatus = document.getElementById("password-toggle-status");
  if (togglePasswordsBtn && passwordToggleStatus) {
    togglePasswordsBtn.addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs[0] || !tabs[0].id) {
          passwordToggleStatus.textContent = "Could not find active tab.";
          return;
        }
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: function () {
            const passwordFields = document.querySelectorAll('input[type="password"], input[type="text"][data-was-password="true"]');
            let toggledCount = 0;
            
            passwordFields.forEach(field => {
              if (field.type === "password") {
                field.type = "text";
                field.setAttribute("data-was-password", "true");
                toggledCount++;
              } else if (field.getAttribute("data-was-password") === "true") {
                field.type = "password";
                field.removeAttribute("data-was-password");
                toggledCount++;
              }
            });
            
            if (toggledCount > 0) {
              return `Toggled ${toggledCount} password field${toggledCount > 1 ? 's' : ''}.`;
            } else {
              return "No password fields found on this page.";
            }
          }
        }, function (results) {
          if (chrome.runtime.lastError) {
            passwordToggleStatus.textContent = "Error: " + chrome.runtime.lastError.message;
            return;
          }
          if (results && results[0] && results[0].result) {
            passwordToggleStatus.textContent = results[0].result;
          } else {
            passwordToggleStatus.textContent = "Unable to toggle password visibility.";
          }
        });
      });
    });
  }
}); 