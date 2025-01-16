chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'speak') {
        chrome.tts.speak(request.text, {
            lang: request.lang || 'en-US',
            rate: 1.0,
            onEvent: function(event) {
                if (event.type === 'error') {
                    console.error('TTS Error:', event);
                }
            }
        });
    } else if (request.type === 'stop') {
        chrome.tts.stop();
    }
});
