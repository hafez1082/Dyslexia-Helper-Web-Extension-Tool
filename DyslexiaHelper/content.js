let isEnabled = true;
let savedStyles = {};
let featureStates = {
  fontSizeEnabled: true,
  textStyleEnabled: true,
  fontSelectEnabled: true,
  colorsEnabled: true,
  highlightEnabled: true,
  spacingEnabled: true
};

const observer = new MutationObserver(function (mutations) {
  if (isEnabled) {
    applySettings();
  }
});

// Configure the observer to watch for changes in the DOM
observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
});

// Inject the Open Dyslexic fonts into the document
function injectFont() {
  const fontFaceCSS = `
        @font-face {
            font-family: 'OpenDyslexic';
            src: url(${chrome.runtime.getURL('fonts/OpenDyslexic-Regular.woff2')}) format('woff2');
            font-weight: normal;
            font-style: normal;
        }
        @font-face {
            font-family: 'OpenDyslexic';
            src: url(${chrome.runtime.getURL('fonts/OpenDyslexic-Bold.woff2')}) format('woff2');
            font-weight: bold;
            font-style: normal;
        }
        @font-face {
            font-family: 'OpenDyslexic';
            src: url(${chrome.runtime.getURL('fonts/OpenDyslexic-Italic.woff2')}) format('woff2');
            font-weight: normal;
            font-style: italic;
        }
        @font-face {
            font-family: 'OpenDyslexic';
            src: url(${chrome.runtime.getURL('fonts/OpenDyslexic-Bold-Italic.woff2')}) format('woff2');
            font-weight: bold;
            font-style: italic;
        }
    `;
  const styleTag = document.createElement('style');
  styleTag.innerHTML = fontFaceCSS;
  document.head.appendChild(styleTag);
}

// Call injectFont to ensure the font is available
injectFont();

// Load feature states
chrome.storage.sync.get(Object.keys(featureStates), (data) => {
  featureStates = { ...featureStates, ...data };
});

function applySettings() {
  chrome.storage.sync.get(
    ["enabled", "fontSize", "fontStyle", "textColor", "bgColor", "fontSelect", "bold", "italic", "highlightColor", "wordSpacing", "lineSpacing", "urlColor"],
    function (data) {
      isEnabled = data.enabled !== false;
      if (!isEnabled) {
        resetStyles();
        return;
      }

      const allTextElements = document.querySelectorAll(
        "p:not(.extension-highlight), span:not(.extension-highlight), h1:not(.extension-highlight), h2:not(.extension-highlight), h3:not(.extension-highlight), h4:not(.extension-highlight), h5:not(.extension-highlight), h6:not(.extension-highlight), a:not(.extension-highlight), li:not(.extension-highlight), td:not(.extension-highlight), th:not(.extension-highlight), div:not(.extension-highlight)"
      );

      allTextElements.forEach((element) => {
        if (featureStates.fontSizeEnabled && data.fontSize) {
          element.style.fontSize = data.fontSize + "px";
        }

        // Apply bold and italic based on settings
        if (featureStates.textStyleEnabled) {
          element.style.fontWeight = data.bold ? "bold" : "normal";
          element.style.fontStyle = data.italic ? "italic" : "normal";
        }

        if (featureStates.colorsEnabled) {
          if (data.textColor) {
            element.style.color = data.textColor;
          }
          if (data.bgColor) {
            element.style.backgroundColor = data.bgColor;
          }
        }

        if (featureStates.spacingEnabled) {
          if (data.wordSpacing) {
            element.style.wordSpacing = data.wordSpacing + "px";;
          }
          if (data.lineSpacing) {
            element.style.lineHeight = data.lineSpacing ;
          }
        }

        // Apply line spacing independently
        if (featureStates.spacingEnabled && data.lineSpacing) {
          element.style.lineHeight = data.lineSpacing;
        }

        // Word spacing stays in the same block
        if (featureStates.spacingEnabled && data.wordSpacing) {
          element.style.wordSpacing = data.wordSpacing + 'px';
        }
      });

      const highlightedElements = document.querySelectorAll('.extension-highlight');
      highlightedElements.forEach((element) => {
        element.style.backgroundColor = data.highlightColor || '#ffeb3b';
      });

      if (data.bgColor) {
        document.body.style.backgroundColor = data.bgColor;
      }
      document.addEventListener('mouseup', function () {
        const selection = window.getSelection();
        if (!selection.toString()) return;

        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.cssText = `background-color: ${data.highlightColor || '#ffeb3b'} !important;`;
        span.className = 'extension-highlight';
        range.surroundContents(span);
        selection.removeAllRanges();
      });
      document.addEventListener('dblclick', function (e) {
        if (e.target.className === 'extension-highlight') {
          const parent = e.target.parentNode;
          parent.replaceChild(document.createTextNode(e.target.textContent), e.target);
        }
      });

      // Apply Open Dyslexic font
      if (featureStates.fontSelectEnabled && data.fontSelect === "open-dyslexic") {
        allTextElements.forEach((element) => {
          element.style.fontFamily = "OpenDyslexic, sans-serif";
        });
      } else {
        allTextElements.forEach((element) => {
          element.style.fontFamily = "";
        });
      }

      // Apply URL color specifically to links
      if (featureStates.colorsEnabled && data.urlColor) {
        document.querySelectorAll('a').forEach((element) => {
          element.style.color = data.urlColor;
        });
      }
    }
  );
}

function resetStyles() {
  const allTextElements = document.querySelectorAll(
    "p, span, h1, h2, h3, h4, h5, h6, a, li, td, th, div"
  );
  allTextElements.forEach((element) => {
    element.style.fontSize = "";
    element.style.fontWeight = "";
    element.style.fontStyle = "";
    element.style.color = "";
    element.style.backgroundColor = "";
    element.style.fontFamily = "";
  });
  document.body.style.backgroundColor = "";
  const highlightedSpans = document.querySelectorAll('span[style*="background-color"]');
  highlightedSpans.forEach(span => {
    const parent = span.parentNode;
    parent.replaceChild(document.createTextNode(span.textContent), span);
  });

  document.body.style.backgroundColor = "";
}

function resetFeatureStyles(feature) {
  const elements = document.querySelectorAll(
    "p, span, h1, h2, h3, h4, h5, h6, a, li, td, th, div"
  );

  switch (feature) {
    case 'fontSizeEnabled':
      elements.forEach(el => el.style.fontSize = '');
      break;
    case 'textStyleEnabled':
      elements.forEach(el => {
        el.style.fontWeight = '';
        el.style.fontStyle = '';
      });
      break;
    case 'fontSelectEnabled':
      elements.forEach(el => el.style.fontFamily = '');
      break;
    case 'colorsEnabled':
      elements.forEach(el => {
        el.style.color = '';
        el.style.backgroundColor = '';
      });
      document.body.style.backgroundColor = '';
      document.querySelectorAll('a').forEach(el => {
        el.style.color = '';
      });
      break;
    case 'highlightEnabled':
      document.querySelectorAll('.extension-highlight').forEach(el => {
        el.outerHTML = el.textContent;
      });
      break;
    case 'spacingEnabled':
      elements.forEach(el => {
        el.style.wordSpacing = '';
        el.style.lineHeight = '';
      });
      break;
  }
}

// Modify the message listener to handle refresh
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type === "toggleExtension") {
    isEnabled = request.value;
    if (!isEnabled) {
      resetStyles();
    } else {
      applySettings();
    }
    return;
  }

  if (request.type === 'featureToggle') {
    featureStates[request.feature] = request.enabled;
    if (!request.enabled) {
      // Reset specific feature styles before refresh
      resetFeatureStyles(request.feature);
      // Refresh the page
      window.location.reload();
    } else {
      applySettings();
    }
    return;
  }

  if (!isEnabled) return;

  const allTextElements = document.querySelectorAll(
    "p, span, h1, h2, h3, h4, h5, h6, a, li, td, th, div"
  );

  switch (request.type) {
    case "fontSize":
      allTextElements.forEach((element) => {
        element.style.fontSize = request.value + "px";
      });
      break;

    case "fontStyle":
      allTextElements.forEach((element) => {
        element.style.fontWeight =
          request.value === "bold" ? "bold" : "normal";
        element.style.fontStyle =
          request.value === "italic" ? "italic" : "normal";
      });
      break;

    case "textColor":
      allTextElements.forEach((element) => {
        element.style.color = request.value;
      });
      break;

    case "bgColor":
      document.body.style.backgroundColor = request.value;
      allTextElements.forEach((element) => {
        element.style.backgroundColor = request.value;
      });
      break;

    case "fontSelect":
      if (request.value === "open-dyslexic") {
        allTextElements.forEach((element) => {
          element.style.fontFamily = "OpenDyslexic, sans-serif";
        });
      } else {
        allTextElements.forEach((element) => {
          element.style.fontFamily = "";
        });
      }
      break;

    case "textStyles":
      // Handle the bold and italic styles
      allTextElements.forEach((element) => {
        element.style.fontWeight = request.bold ? "bold" : "normal";
        element.style.fontStyle = request.italic ? "italic" : "normal";
      });
      break;
      case "wordSpacing":
      allTextElements.forEach((element) => {
        element.style.wordSpacing = request.value+"px" ;
      });
      break;

    case "lineSpacing":
      allTextElements.forEach((element) => {
        element.style.lineSpacing = request.value;
      });
      // Force a layout recalculation
      document.body.style.display = 'none';
      document.body.offsetHeight; // Force reflow
      document.body.style.display = '';
      break;

    case "urlColor":
      document.querySelectorAll('a').forEach((element) => {
        element.style.color = request.value;
      });
      break;
  }
});

// Add message listener for TTS
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'getSelection') {
        const selectedText = window.getSelection().toString();
        if (selectedText) {
            chrome.runtime.sendMessage({
                type: 'speak',
                text: selectedText,
                lang: request.lang
            });
        }
    }
});

document.addEventListener("DOMContentLoaded", applySettings);
applySettings();
