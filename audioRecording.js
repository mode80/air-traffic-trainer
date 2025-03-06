// Audio Recording functionality for Air Traffic Trainer

class AudioRecorder {
    constructor() {
        // DOM Elements - use defensive coding to handle possible missing elements
        this.recordBtn = document.getElementById('record-btn');
        this.stopRecordingBtn = document.getElementById('stop-recording-btn');
        this.recordingIndicator = document.getElementById('recording-indicator');
        // Audio playback is now handled through the play icon in ATC messages
        this.userResponseTextarea = document.getElementById('user-response');
        this.transcriptionProcessing = document.getElementById('transcription-processing');
        this.submitResponseBtn = document.getElementById('submit-response-btn');
        
        // Permission elements
        this.permissionModal = document.getElementById('permission-modal');
        this.allowMicBtn = document.getElementById('allow-mic-btn');
        this.denyMicBtn = document.getElementById('deny-mic-btn');
        
        // Audio recording variables
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioBlob = null;
        this.audioURL = null;
        this.isRecording = false;
        
        // Audio storage for message history
        this.storedAudio = new Map(); // Map of messageId -> {blob, url}
        this.currentPlayingAudio = null;
        
        // Check if all required elements are available
        if (!this.recordBtn || !this.stopRecordingBtn || !this.recordingIndicator || 
            !this.userResponseTextarea || !this.permissionModal || 
            !this.allowMicBtn || !this.denyMicBtn) {
            console.warn('AudioRecorder: Some required DOM elements are missing');
        }
        
        // Initialize
        this.init();
    }
    
    init() {
        // Set up event listeners
        this.setupEventListeners();
        
        // Set global flag for microphone initialization
        window.microphoneInitialized = false;
    }
    
    setupEventListeners() {
        // Permission modal handlers
        if (this.allowMicBtn) {
            this.allowMicBtn.addEventListener('click', () => this.requestMicrophonePermission());
        }
        
        if (this.denyMicBtn) {
            this.denyMicBtn.addEventListener('click', () => {
                // Hide the modal
                this.permissionModal.classList.add('hidden');
                // Record user preference
                localStorage.setItem('microphone_preference', 'denied');
            });
        }
        
        // Recording controls
        if (this.recordBtn) {
            this.recordBtn.addEventListener('click', () => {
                // Check if we need to ask for permission first
                const micPref = localStorage.getItem('microphone_preference');
                
                if (micPref === 'granted') {
                    // Permission already granted, start recording
                    this.startRecording();
                } else if (micPref === 'denied') {
                    // Permission previously denied, show toast
                    window.showToast('Microphone access is disabled. Please use text input instead.', true);
                } else {
                    // Show permission modal
                    this.permissionModal.classList.remove('hidden');
                }
            });
        }
        
        if (this.stopRecordingBtn) {
            this.stopRecordingBtn.addEventListener('click', () => this.stopRecording());
        }
    }
    
    // Start recording
    startRecording() {
        if (!this.mediaRecorder) {
            // If microphone is not initialized, show permission modal instead of error
            const micPref = localStorage.getItem('microphone_preference');
            
            if (micPref === 'denied') {
                // Permission previously denied, show toast
                window.showToast('Microphone access is disabled. Please use text input instead.', true);
            } else {
                // Show permission modal
                this.permissionModal.classList.remove('hidden');
            }
            return;
        }
        
        // Reset UI first
        this.resetAudioRecording();
        
        // Start recording
        try {
            this.mediaRecorder.start();
            this.recordingIndicator.classList.remove('hidden');
        } catch (err) {
            console.error("Error starting recording:", err);
            window.showToast('Error starting recording. Please try again.', true);
        }
    }
    
    // Stop recording
    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
        }
    }
    
    // Request microphone permission
    async requestMicrophonePermission() {
        try {
            // Hide permission modal
            this.permissionModal.classList.add('hidden');
            
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // If we got here, permission was granted
            this.initAudioRecording(stream);
            
            // Set flag
            window.microphoneInitialized = true;
            
            // Update record button style to show it's enabled
            this.recordBtn.classList.remove('opacity-50');
            
            // Show toast notification
            window.showToast('Microphone access granted. Starting recording...', false);
            
            // Record user preference
            localStorage.setItem('microphone_preference', 'granted');
            
            // Start recording automatically
            this.startRecording();
            
        } catch (err) {
            console.error("Error accessing microphone:", err);
            
            // Show error message
            window.showToast('Could not access microphone. Check your browser permissions.', true);
        }
    }
    
    // Initialize audio recording with a given stream
    initAudioRecording(stream) {
        try {
            // Create media recorder with MIME types that OpenAI supports
            // Options in order of preference: mp3, m4a, wav, or webm
            const mimeTypes = [
                'audio/mp3',
                'audio/mpeg',
                'audio/m4a',
                'audio/wav',
                'audio/webm'
            ];
            
            // Find the first supported MIME type
            let mimeType = '';
            for (const type of mimeTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    mimeType = type;
                    break;
                }
            }
            
            // Fallback to default if none are supported
            if (!mimeType) {
                console.log("None of the preferred MIME types are supported, using default format");
                this.mediaRecorder = new MediaRecorder(stream);
            } else {
                console.log(`Using MIME type: ${mimeType}`);
                this.mediaRecorder = new MediaRecorder(stream, { mimeType });
            }
            
            // Set up event handlers
            this.mediaRecorder.onstart = () => {
                this.audioChunks = [];
                this.isRecording = true;
                this.updateRecordingUI(true);
            };
            
            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };
            
            this.mediaRecorder.onstop = async () => {
                this.isRecording = false;
                this.updateRecordingUI(false);
                
                // Create audio blob and URL
                // We don't specify the type here to ensure it matches the recorded format
                this.audioBlob = new Blob(this.audioChunks);
                this.audioURL = URL.createObjectURL(this.audioBlob);
                
                // Hide recording indicator
                this.recordingIndicator.classList.add('hidden');
                
                // Transcribe the audio using OpenAI's Speech-to-Text API
                await this.transcribeAudio(this.audioBlob);
            };
            
            // Enable record button
            this.recordBtn.disabled = false;
            
        } catch (err) {
            console.error("Error initializing audio recording:", err);
            window.showToast('Error initializing audio recording', true);
        }
    }
    
    // Update UI during recording
    updateRecordingUI(isRecording) {
        if (isRecording) {
            // Change record button to red
            this.recordBtn.classList.remove('bg-[var(--primary)]', 'hover:bg-[var(--accent)]');
            this.recordBtn.classList.add('bg-[var(--recording)]', 'hover:bg-red-600');
        } else {
            // Reset record button to primary color
            this.recordBtn.classList.add('bg-[var(--primary)]', 'hover:bg-[var(--accent)]');
            this.recordBtn.classList.remove('bg-[var(--recording)]', 'hover:bg-red-600');
            
            // Hide recording indicator
            this.recordingIndicator.classList.add('hidden');
        }
    }
    
    // Reset audio recording UI
    resetAudioRecording() {
        if (this.recordingIndicator) {
            this.recordingIndicator.classList.add('hidden');
        }
        // Audio playback is now handled through the play icon in ATC messages
        if (this.transcriptionProcessing) {
            this.transcriptionProcessing.classList.add('hidden');
        }
        
        if (this.audioURL) {
            URL.revokeObjectURL(this.audioURL);
            this.audioURL = null;
        }
        
        this.audioBlob = null;
        this.audioChunks = [];
        
        this.updateRecordingUI(false);
    }
    
    // Store audio blob for a specific message
    storeAudioForMessage(messageId, audioBlob) {
        if (!messageId || !audioBlob) return;
        
        // Create a URL for the blob
        const audioURL = URL.createObjectURL(audioBlob);
        
        // Store both the blob and URL
        this.storedAudio.set(messageId, {
            blob: audioBlob,
            url: audioURL
        });
        
        console.log(`Stored audio for message ${messageId}`);
    }
    
    // Play stored audio for a specific message
    playStoredAudio(messageId) {
        if (!messageId) return;
        
        // Get the stored audio
        const audioData = this.storedAudio.get(messageId);
        if (!audioData || !audioData.url) {
            console.warn(`No audio found for message ${messageId}`);
            return;
        }
        
        // Stop any currently playing audio
        if (this.currentPlayingAudio) {
            this.currentPlayingAudio.pause();
            this.currentPlayingAudio = null;
        }
        
        // Create and play the audio
        const audio = new Audio(audioData.url);
        
        // Add event listeners
        audio.addEventListener('play', () => {
            // Update UI to show playing state
            const playButton = document.querySelector(`.play-pilot-speech[data-message-id="${messageId}"]`);
            if (playButton) {
                playButton.classList.add('playing');
            }
        });
        
        audio.addEventListener('ended', () => {
            // Reset UI when playback ends
            const playButton = document.querySelector(`.play-pilot-speech[data-message-id="${messageId}"]`);
            if (playButton) {
                playButton.classList.remove('playing');
            }
            this.currentPlayingAudio = null;
        });
        
        audio.addEventListener('error', (e) => {
            console.error('Audio playback error:', e);
            window.showToast('Error playing audio', true);
            
            // Reset UI
            const playButton = document.querySelector(`.play-pilot-speech[data-message-id="${messageId}"]`);
            if (playButton) {
                playButton.classList.remove('playing');
            }
            this.currentPlayingAudio = null;
        });
        
        // Store reference to current audio
        this.currentPlayingAudio = audio;
        
        // Play the audio
        audio.play()
            .then(() => {
                window.showToast('Playing your recorded response...', false);
            })
            .catch(err => {
                console.error('Error playing audio:', err);
                window.showToast('Failed to play audio', true);
            });
    }
    
    // Transcribe audio using OpenAI's Speech-to-Text API
    async transcribeAudio(audioBlob) {
        try {
            // Show transcription processing indicator
            this.transcriptionProcessing.classList.remove('hidden');
            
            // Get API key from local storage
            let apiKey = localStorage.getItem('openai_api_key');
            
            if (!apiKey) {
                this.transcriptionProcessing.classList.add('hidden');
                window.showToast("OpenAI API key required. Please add your API key in the settings section below.", true);
                // Scroll to settings section
                document.getElementById('api-key-container').scrollIntoView({ behavior: 'smooth' });
                return;
            }
            
            // Determine file extension based on the MIME type
            let fileExtension = 'webm';
            if (audioBlob.type) {
                const mimeType = audioBlob.type.toLowerCase();
                if (mimeType.includes('mp3') || mimeType.includes('mpeg')) {
                    fileExtension = 'mp3';
                } else if (mimeType.includes('wav')) {
                    fileExtension = 'wav';
                } else if (mimeType.includes('m4a')) {
                    fileExtension = 'm4a';
                }
            }
            
            // Create unique filename for the audio file
            const fileName = window.generateFileName('aviation-radio', fileExtension);
            
            // Create FormData for OpenAI API
            const formData = new FormData();
            formData.append('file', audioBlob, fileName);
            formData.append('model', 'whisper-1');
            formData.append('language', 'en');
            formData.append('prompt', 'This is a pilot radio communication in standard aviation phraseology');
            
            // Call OpenAI API
            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                },
                body: formData
            });
            
            // Handle API response
            if (response.ok) {
                const data = await response.json();
                
                // Format the transcription text specifically for aviation
                let formattedText = data.text;
                
                // Replace common number patterns with aviation format
                // Replace frequencies (e.g. 119.5 -> one one niner point five)
                formattedText = formattedText.replace(/(\d+)\.(\d+)/g, (match, p1, p2) => {
                    // Convert each digit to spoken word with "niner" for 9, etc.
                    const p1Spoken = p1.split('').map(window.digitsToWords).join(' ');
                    const p2Spoken = p2.split('').map(window.digitsToWords).join(' ');
                    return `${p1Spoken} point ${p2Spoken}`;
                });
                
                // Set the formatted text in the textarea
                this.userResponseTextarea.value = formattedText;
                
                // Hide processing indicator
                this.transcriptionProcessing.classList.add('hidden');
                
                // Show success message
                window.showToast('Audio transcribed successfully', false);
                
                // Check if we're in edit mode (re-recording a previous response)
                if (window.evaluationManager && window.evaluationManager.editingMessageIndex >= 0) {
                    // Submit the corrected response with the new audio
                    window.evaluationManager.submitCorrectedResponse(formattedText, this.audioBlob);
                } 
                // If we're in a conversation and the conversation is not complete, automatically submit the response
                else if (window.evaluationManager && !window.evaluationManager.conversationComplete) {
                    // Call the evaluateResponse method with the transcribed text and the audio blob
                    window.evaluationManager.evaluateResponse(formattedText, true, this.audioBlob);
                }
                
            } else {
                const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error occurred' } }));
                console.error("OpenAI API error:", errorData);
                
                // Handle API key errors
                if (response.status === 401) {
                    localStorage.removeItem('openai_api_key');
                    window.showToast('Invalid OpenAI API key. Please try again with a valid key.', true);
                } else {
                    window.showToast(`Error transcribing audio: ${errorData.error?.message || 'Unknown error'}`, true);
                }
                
                // Hide processing indicator
                this.transcriptionProcessing.classList.add('hidden');
            }
        } catch (err) {
            console.error("Error transcribing audio:", err);
            window.showToast("Error transcribing audio. Please try again.", true);
            this.transcriptionProcessing.classList.add('hidden');
        }
    }
}

// Export the AudioRecorder class
window.AudioRecorder = AudioRecorder;

// Export the resetAudioRecording function for use by other modules
window.resetAudioRecording = function() {
    if (window.audioRecorder) {
        window.audioRecorder.resetAudioRecording();
    } else {
        console.error("Audio recorder not initialized");
    }
};
