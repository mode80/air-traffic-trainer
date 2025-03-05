// Text to Speech functionality for Air Traffic Trainer

class TextToSpeechManager {
    constructor() {
        this.isPlaying = false;
        this.audioCache = new Map(); // Cache for audio URLs
        this.currentPlayingButton = null;
    }

    // Play ATC speech using OpenAI's text-to-speech API
    async playATCSpeech(text, buttonElement) {
        if (!text || text.trim() === '') {
            window.showToast('No ATC speech to play', true);
            return;
        }

        // If already playing, stop the current audio
        if (this.isPlaying && this.currentPlayingButton) {
            this.stopPlaying();
            // If clicking the same button, just stop playback and exit
            if (this.currentPlayingButton === buttonElement) {
                return;
            }
        }

        // Set current playing button
        this.currentPlayingButton = buttonElement;
        if (buttonElement) {
            buttonElement.classList.add('playing');
        }

        try {
            // Check if we have a cached audio for this text
            if (this.audioCache.has(text)) {
                this.playAudio(this.audioCache.get(text));
                return;
            }

            // Get API key
            const apiKey = localStorage.getItem('openai_api_key');
            if (!apiKey) {
                window.showToast("OpenAI API key required for text-to-speech. Please add your API key in the settings section below.", true);
                // Scroll to settings section
                document.getElementById('api-key-container').scrollIntoView({ behavior: 'smooth' });
                this.stopPlaying();
                return;
            }

            // Show loading toast
            window.showToast('Generating speech...', false);

            // Call OpenAI API
            const response = await fetch('https://api.openai.com/v1/audio/speech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'tts-1', // Using the base TTS model for efficiency
                    voice: 'onyx',  // Deep male voice, good for ATC
                    input: text,
                    speed: 1.1      // Slightly faster than default for ATC realism 
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error occurred' } }));
                
                // Handle API key errors
                if (response.status === 401) {
                    localStorage.removeItem('openai_api_key');
                    throw new Error("Invalid OpenAI API key. Please check your settings.");
                } else {
                    throw new Error(`Error generating speech: ${errorData.error?.message || 'Unknown error'}`);
                }
            }

            // Get audio blob from response
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Cache the audio URL
            this.audioCache.set(text, audioUrl);
            
            // Play the audio
            this.playAudio(audioUrl);

        } catch (err) {
            console.error("Error generating speech:", err);
            window.showToast(`Error: ${err.message}`, true);
            this.stopPlaying();
        }
    }

    // Play audio from a given URL
    playAudio(audioUrl) {
        const audio = new Audio(audioUrl);
        
        // Add event listeners
        audio.addEventListener('play', () => {
            this.isPlaying = true;
        });
        
        audio.addEventListener('ended', () => {
            this.stopPlaying();
        });
        
        audio.addEventListener('error', (e) => {
            console.error('Audio playback error:', e);
            window.showToast('Error playing audio', true);
            this.stopPlaying();
        });
        
        // Store reference to audio element for stopping
        this.currentAudio = audio;
        
        // Play the audio
        audio.play()
            .then(() => {
                window.showToast('Playing ATC speech...', false);
            })
            .catch(err => {
                console.error('Error playing audio:', err);
                
                // Don't show error toast for NotAllowedError (happens on initial load)
                if (err.name !== 'NotAllowedError') {
                    window.showToast('Failed to play audio', true);
                }
                
                this.stopPlaying();
            });
    }

    // Stop playing and reset the state
    stopPlaying() {
        this.isPlaying = false;
        
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        
        if (this.currentPlayingButton) {
            this.currentPlayingButton.classList.remove('playing');
            this.currentPlayingButton = null;
        }
    }
}

// Export the TextToSpeechManager class
window.TextToSpeechManager = TextToSpeechManager;

// Initialize the TextToSpeechManager when the window loads
window.addEventListener('DOMContentLoaded', () => {
    window.textToSpeechManager = new TextToSpeechManager();
});
