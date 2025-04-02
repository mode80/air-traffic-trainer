// Text to Speech functionality for Air Traffic Trainer using Groq's TTS API

class TextToSpeechManager {
    constructor() {
        this.isPlaying = false;
        this.audioCache = new Map(); // Cache for audio data
        this.currentPlayingButton = null;
        this.currentAudio = null;
        
        // Available voices from Groq's TTS API
        this.availableVoices = {
            male: ['Atlas-PlayAI', 'Basil-PlayAI', 'Briggs-PlayAI', 'Calum-PlayAI', 
                   'Chip-PlayAI', 'Cillian-PlayAI', 'Fritz-PlayAI', 'Mikail-PlayAI', 
                   'Mitch-PlayAI', 'Thunder-PlayAI'],
            female: ['Arista-PlayAI', 'Celeste-PlayAI', 'Cheyenne-PlayAI', 'Deedee-PlayAI', 
                     'Gail-PlayAI', 'Indigo-PlayAI', 'Mamaw-PlayAI', 'Quinn-PlayAI']
        };
        
        // Default voice (male voice for ATC realism)
        this.defaultVoice = 'Fritz-PlayAI';
        
        // Current voice for the active scenario
        this.currentScenarioVoice = this.defaultVoice;
    }

    // Play ATC speech using Groq's TTS API
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
            // Check if we have a Groq API key
            const apiKey = localStorage.getItem('groq_api_key');
            if (!apiKey) {
                throw new Error('Groq API key required. Please add your Groq API key in settings.');
            }
            
            // Use the current scenario voice rather than the default voice
            const voiceToUse = this.currentScenarioVoice;
            
            // Create a cache key for this text and voice combination
            const cacheKey = `${text}_${voiceToUse}`;
            
            // Check if we have this audio in cache
            let audioBlob;
            if (this.audioCache.has(cacheKey)) {
                console.log('Using cached audio for:', text);
                audioBlob = this.audioCache.get(cacheKey);
            } else {
                // Show loading state
                if (buttonElement) {
                    buttonElement.classList.add('loading');
                }
                
                // Call Groq's TTS API
                const response = await fetch('https://api.groq.com/openai/v1/audio/speech', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: 'playai-tts',
                        input: text,
                        voice: voiceToUse,
                        response_format: 'wav'
                    })
                });
                
                // Remove loading state
                if (buttonElement) {
                    buttonElement.classList.remove('loading');
                }
                
                // Handle API response
                if (response.ok) {
                    audioBlob = await response.blob();
                    // Cache the audio blob for future use
                    this.audioCache.set(cacheKey, audioBlob);
                } else {
                    // Handle error response
                    const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error occurred' } }));
                    console.error('Groq TTS API error:', errorData);
                    
                    // Handle API key errors
                    if (response.status === 401) {
                        throw new Error('Invalid Groq API key. Please check your Groq API key in settings.');
                    } else {
                        throw new Error(`Error from Groq TTS API: ${errorData.error?.message || 'Unknown error'}`);
                    }
                }
            }
            
            // Create an audio element to play the speech
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            // Set playback rate to 1.5x using the Audio element's playbackRate property
            // Note: Groq's TTS API has a 'speed' parameter in its schema, but currently only supports 1.0
            audio.playbackRate = 1.5;
            this.currentAudio = audio;
            
            // Add event listeners
            audio.onplay = () => {
                this.isPlaying = true;
            };
            
            audio.onended = () => {
                this.isPlaying = false;
                if (this.currentPlayingButton) {
                    this.currentPlayingButton.classList.remove('playing');
                    this.currentPlayingButton = null;
                }
                this.currentAudio = null;
                URL.revokeObjectURL(audioUrl); // Clean up the URL object
            };
            
            audio.onerror = (event) => {
                console.error('Audio playback error:', event);
                this.isPlaying = false;
                if (this.currentPlayingButton) {
                    this.currentPlayingButton.classList.remove('playing');
                    this.currentPlayingButton = null;
                }
                this.currentAudio = null;
                URL.revokeObjectURL(audioUrl); // Clean up the URL object
                window.showToast(`Error playing speech: ${event.error || 'Unknown error'}`, true);
            };
            
            // Play the audio
            audio.play();

        } catch (err) {
            console.error('Error generating speech:', err);
            window.showToast(`Error: ${err.message}`, true);
            this.stopPlaying();
        }
    }

    // Stop playing audio
    stopPlaying() {
        if (this.currentAudio && this.isPlaying) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }
        
        this.isPlaying = false;
        
        if (this.currentPlayingButton) {
            this.currentPlayingButton.classList.remove('playing');
            this.currentPlayingButton = null;
        }
        
        this.currentAudio = null;
    }
    
    // Change the default voice used for TTS
    setVoice(voiceName) {
        // Check if the voice is valid
        const allVoices = [...this.availableVoices.male, ...this.availableVoices.female];
        if (allVoices.includes(voiceName)) {
            this.defaultVoice = voiceName;
            // Also update the current scenario voice
            this.currentScenarioVoice = voiceName;
            // Clear cache when voice changes
            this.audioCache.clear();
            return true;
        }
        return false;
    }
    
    // Set the voice for the current scenario
    setScenarioVoice(voiceName) {
        // Check if the voice is valid
        const allVoices = [...this.availableVoices.male, ...this.availableVoices.female];
        if (allVoices.includes(voiceName)) {
            this.currentScenarioVoice = voiceName;
            return true;
        }
        return false;
    }
    
    // Get a random voice from the available voices
    getRandomVoice() {
        // Combine male and female voices
        const allVoices = [...this.availableVoices.male, ...this.availableVoices.female];
        // Select a random voice
        const randomIndex = Math.floor(Math.random() * allVoices.length);
        return allVoices[randomIndex];
    }
    
    // Get a list of all available voices
    getAvailableVoices() {
        return {
            male: [...this.availableVoices.male],
            female: [...this.availableVoices.female]
        };
    }
}

// Export the TextToSpeechManager class
window.TextToSpeechManager = TextToSpeechManager;

// Initialize the TextToSpeechManager when the window loads
window.addEventListener('load', () => {
    window.textToSpeechManager = new TextToSpeechManager();
    
    // Add CSS for loading state
    const style = document.createElement('style');
    style.textContent = `
        .play-atc-speech.loading {
            animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
});
