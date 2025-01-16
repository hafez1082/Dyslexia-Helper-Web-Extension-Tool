document.addEventListener("DOMContentLoaded", function () {
  const controls = ["fontSize", "textColor", "bgColor", "fontSelect", "highlightColor", "wordSpacing", "lineSpacing", "urlColor"];
  const enableSwitch = document.getElementById("enableExtension");
  const controlsContainer = document.getElementById("controlsContainer");

  // Load extension state
  chrome.storage.sync.get("enabled", function (data) {
    enableSwitch.checked = data.enabled !== false;
    controlsContainer.classList.toggle("disabled", !enableSwitch.checked);
  });

  // Load saved settings
  controls.forEach((control) => {
    const element = document.getElementById(control);
    chrome.storage.sync.get(control, function (data) {
      if (data[control]) {
        element.value = data[control];
      }
    });
  });

  // Handle font type
  document.getElementById("fontSelect").addEventListener("change", function () {
    const value = this.value;
    chrome.storage.sync.set({ fontSelect: value });

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "fontSelect",
        value: value,
      });
    });
  });

  // Handle bold and italic checkboxes
  const boldCheckbox = document.getElementById("bold");
  const italicCheckbox = document.getElementById("italic");

  // Load saved bold and italic states
  chrome.storage.sync.get("bold", function (data) {
    boldCheckbox.checked = data.bold || false;
  });

  chrome.storage.sync.get("italic", function (data) {
    italicCheckbox.checked = data.italic || false;
  });

  // Send updated bold and italic states to content script
  function updateTextStyles() {
    const bold = boldCheckbox.checked;
    const italic = italicCheckbox.checked;

    chrome.storage.sync.set({ bold: bold, italic: italic });

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "textStyles",
        bold: bold,
        italic: italic,
      });
    });
  }

  // Handle bold and italic changes
  boldCheckbox.addEventListener("change", updateTextStyles);
  italicCheckbox.addEventListener("change", updateTextStyles);

  // Handle enable/disable switch
  enableSwitch.addEventListener("change", function () {
    const enabled = enableSwitch.checked;
    chrome.storage.sync.set({ enabled: enabled });
    controlsContainer.classList.toggle("disabled", !enabled);

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "toggleExtension",
        value: enabled,
      });
    });
  });

  // Handle other controls
  controls.forEach((control) => {
    const element = document.getElementById(control);
    element.addEventListener("change", function () {
      let value = element.value;

      let saveData = {};
      saveData[control] = value;
      chrome.storage.sync.set(saveData);

      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: control,
          value: value,
        });
      });
    });
  });
  // Add an event listener specifically for line spacing to ensure it updates immediately
  const lineSpacingElement = document.getElementById("lineSpacing");
  lineSpacingElement.addEventListener("input", function () {
    let value = lineSpacingElement.value;

    chrome.storage.sync.set({ lineSpacing: value });

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "lineSpacing",
        value: value,
      });
    });
  });
  // Add an event listener specifically for word spacing to ensure it updates immediately
  const wordSpacingElement = document.getElementById("wordSpacing");
  wordSpacingElement.addEventListener("input", function () {
    let value = wordSpacingElement.value;

    chrome.storage.sync.set({ wordSpacing: value });

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "wordSpacing",
        value: value,
      });
    });
  });

  // Add to popup.js
  const featureControls = {
    fontSizeEnabled: ['fontSize'],
    textStyleEnabled: ['bold', 'italic'], 
    fontSelectEnabled: ['fontSelect'],
    colorsEnabled: ['textColor', 'bgColor', 'urlColor'],
    highlightEnabled: ['highlightColor'],
    spacingEnabled: ['wordSpacing', 'lineSpacing']
  };

  // Initialize feature switches
  Object.keys(featureControls).forEach(feature => {
    const switchElement = document.getElementById(feature);
    
    // Load saved state
    chrome.storage.sync.get(feature, (data) => {
      switchElement.checked = data[feature] !== false;
      
      // Toggle related controls
      featureControls[feature].forEach(control => {
        const element = document.getElementById(control);
        if (element) {
          element.parentElement.style.display = switchElement.checked ? 'flex' : 'none';
        }
      });
    });

    // Handle switch changes
    switchElement.addEventListener('change', () => {
      const enabled = switchElement.checked;
      
      // Save state
      chrome.storage.sync.set({ [feature]: enabled });
      
      // Toggle controls visibility
      featureControls[feature].forEach(control => {
        const element = document.getElementById(control);
        if (element) {
          element.parentElement.style.display = enabled ? 'flex' : 'none';
        }
      });

      // Update content script and trigger refresh if feature is disabled
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'featureToggle',
          feature: feature,
          enabled: enabled
        });
      });
    });
  });

  // Load saved TTS language preference
  chrome.storage.sync.get('ttsLanguage', (data) => {
    if (data.ttsLanguage) {
      document.getElementById('ttsLanguage').value = data.ttsLanguage;
    }
  });

  // Save language preference when changed
  document.getElementById('ttsLanguage').addEventListener('change', function() {
    chrome.storage.sync.set({ ttsLanguage: this.value });
  });

  document.getElementById('speak').addEventListener('click', () => {
    const lang = document.getElementById('ttsLanguage').value;
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'getSelection',
        lang: lang
      });
    });
  });

  document.getElementById('stop').addEventListener('click', () => {
    chrome.runtime.sendMessage({type: 'stop'});
  });

  // Add to popup.js for smooth transitions
  document.querySelectorAll('.control input, .control select').forEach(element => {
    element.addEventListener('change', function() {
      this.closest('.control').classList.add('highlight');
      setTimeout(() => {
        this.closest('.control').classList.remove('highlight');
      }, 300);
    });
  });
});
