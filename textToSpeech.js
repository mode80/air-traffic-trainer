// Text to Speech functionality for Air Traffic Trainer

class TextToSpeechManager {
    constructor() {
        this.isPlaying = false;
        this.audioCache = new Map(); // Cache for audio URLs
        this.currentPlayingButton = null;
        this.currentUtterance = null;
        
        // Initialize speech synthesis
        this.synth = window.speechSynthesis;
        
        // Check if speech synthesis is available
        if (!this.synth) {
            console.error("Speech synthesis not supported in this browser");
        }
    }

    // Play ATC speech using browser's SpeechSynthesis API
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
            // Check if speech synthesis is available
            if (!this.synth) {
                throw new Error("Speech synthesis not supported in this browser");
            }
            
            // Create a new utterance
            const utterance = new SpeechSynthesisUtterance(text);
            this.currentUtterance = utterance;
            
            // Configure the utterance
            utterance.rate = 1.1; // Slightly faster than default for ATC realism
            
            // Find a suitable voice (preferably a male voice for ATC realism)
            const voices = this.synth.getVoices();
            let selectedVoice = null;
            
            // Try to find a male US English voice
            for (const voice of voices) {
                if (voice.lang.includes('en-US') && voice.name.toLowerCase().includes('male')) {
                    selectedVoice = voice;
                    break;
                }
            }
            
            // If no male US voice found, try any US voice
            if (!selectedVoice) {
                for (const voice of voices) {
                    if (voice.lang.includes('en-US')) {
                        selectedVoice = voice;
                        break;
                    }
                }
            }
            
            // If still no voice found, use the default voice
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
            
            // Add event listeners
            utterance.onstart = () => {
                this.isPlaying = true;
            };
            
            utterance.onend = () => {
                this.isPlaying = false;
                if (this.currentPlayingButton) {
                    this.currentPlayingButton.classList.remove('playing');
                    this.currentPlayingButton = null;
                }
                this.currentUtterance = null;
            };
            
            utterance.onerror = (event) => {
                console.error("Speech synthesis error:", event);
                this.isPlaying = false;
                if (this.currentPlayingButton) {
                    this.currentPlayingButton.classList.remove('playing');
                    this.currentPlayingButton = null;
                }
                this.currentUtterance = null;
                window.showToast(`Error playing speech: ${event.error}`, true);
            };
            
            // Speak the utterance
            this.synth.speak(utterance);

        } catch (err) {
            console.error("Error generating speech:", err);
            window.showToast(`Error: ${err.message}`, true);
            this.stopPlaying();
        }
    }

    // Stop playing audio
    stopPlaying() {
        if (this.synth && this.isPlaying) {
            this.synth.cancel(); // Cancel any ongoing speech
        }
        
        this.isPlaying = false;
        
        if (this.currentPlayingButton) {
            this.currentPlayingButton.classList.remove('playing');
            this.currentPlayingButton = null;
        }
        
        this.currentUtterance = null;
    }
}

// Export the TextToSpeechManager class
window.TextToSpeechManager = TextToSpeechManager;

// Initialize the TextToSpeechManager when the window loads
window.addEventListener('load', () => {
    window.textToSpeechManager = new TextToSpeechManager();
});
