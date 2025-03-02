// Audio Recording functionality for Air Traffic Trainer

class AudioRecorder {
    constructor() {
        // DOM Elements
        this.recordBtn = document.getElementById('record-btn');
        this.recordingIndicator = document.getElementById('recording-indicator');
        this.audioControls = document.getElementById('audio-controls');
        this.audioPlayback = document.getElementById('audio-playback');
        this.audioPlayer = document.getElementById('audio-player');
        this.recordAgainBtn = document.getElementById('record-again-btn');
        this.submitAudioBtn = document.getElementById('submit-audio-btn');
        this.transcriptionContainer = document.getElementById('transcription-container');
        this.transcriptionText = document.getElementById('transcription-text');
        this.micUnavailable = document.getElementById('mic-unavailable');
        
        // Permission elements
        this.permissionModal = document.getElementById('permission-modal');
        this.allowMicBtn = document.getElementById('allow-mic-btn');
        this.denyMicBtn = document.getElementById('deny-mic-btn');
        this.requestMicBtn = document.getElementById('request-mic-btn');
        
        // Audio recording variables
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioBlob = null;
        this.audioURL = null;
        this.isRecording = false;
        
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
        this.allowMicBtn.addEventListener('click', () => this.requestMicrophonePermission());
        
        this.denyMicBtn.addEventListener('click', () => {
            this.permissionModal.classList.add('hidden');
            window.toggleInputMode('text');
        });
        
        this.requestMicBtn.addEventListener('click', () => {
            window.showMicrophonePermissionModal();
        });
        
        // Audio recording controls
        this.recordBtn.addEventListener('click', () => {
            if (!this.mediaRecorder) {
                window.showToast('Microphone not initialized. Please enable microphone access.', true);
                return;
            }
            
            if (this.isRecording) {
                this.mediaRecorder.stop();
            } else {
                // Reset UI first
                this.resetAudioRecording();
                
                // Start recording
                try {
                    this.mediaRecorder.start();
                } catch (err) {
                    console.error("Error starting recording:", err);
                    window.showToast('Error starting recording. Please try again.', true);
                }
            }
        });
        
        this.recordAgainBtn.addEventListener('click', () => {
            this.resetAudioRecording();
        });
        
        this.submitAudioBtn.addEventListener('click', () => {
            const transcriptionContent = this.transcriptionText.textContent.trim();
            if (transcriptionContent && transcriptionContent !== 'Transcription will appear here...') {
                // Get the formatted text if available, otherwise use the original text
                const formattedDiv = this.transcriptionText.querySelector('div:nth-child(2) > p:nth-child(2)');
                const originalDiv = this.transcriptionText.querySelector('div:nth-child(1) > p:nth-child(2)');
                
                const textToSubmit = formattedDiv ? formattedDiv.textContent : 
                                    (originalDiv ? originalDiv.textContent : transcriptionContent);
                
                window.evaluateResponse(textToSubmit, true);
            } else {
                window.showToast('Please wait for transcription to complete before submitting', true);
            }
        });
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
            
            // Update UI
            this.micUnavailable.classList.add('hidden');
            this.audioControls.classList.remove('hidden');
            
            // Set flag
            window.microphoneInitialized = true;
            
            // Enable audio mode button
            document.getElementById('audio-mode-btn').disabled = false;
            
            // Automatically switch to audio mode
            window.toggleInputMode('audio');
            
        } catch (err) {
            console.error("Error accessing microphone:", err);
            
            // Update UI to show error
            this.micUnavailable.classList.remove('hidden');
            this.audioControls.classList.add('hidden');
            
            // Show error message
            window.showToast('Could not access microphone. Check your browser permissions.', true);
            
            // Switch back to text mode
            window.toggleInputMode('text');
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
                
                // Update audio player
                this.audioPlayer.src = this.audioURL;
                
                // Show audio playback UI
                this.recordingIndicator.classList.add('hidden');
                this.audioPlayback.classList.remove('hidden');
                
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
            this.recordBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                Stop Recording
            `;
            this.recordBtn.classList.remove('bg-[var(--primary)]', 'hover:bg-[var(--accent)]');
            this.recordBtn.classList.add('bg-[var(--recording)]', 'hover:bg-red-600');
            this.recordingIndicator.classList.remove('hidden');
        } else {
            this.recordBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Start Recording
            `;
            this.recordBtn.classList.add('bg-[var(--primary)]', 'hover:bg-[var(--accent)]');
            this.recordBtn.classList.remove('bg-[var(--recording)]', 'hover:bg-red-600');
        }
    }
    
    // Reset audio recording UI
    resetAudioRecording() {
        this.recordingIndicator.classList.add('hidden');
        this.audioPlayback.classList.add('hidden');
        this.transcriptionContainer.classList.add('hidden');
        
        if (this.audioURL) {
            URL.revokeObjectURL(this.audioURL);
            this.audioURL = null;
        }
        
        this.audioBlob = null;
        this.audioChunks = [];
        
        this.updateRecordingUI(false);
    }
    
    // Transcribe audio using OpenAI's Speech-to-Text API
    async transcribeAudio(audioBlob) {
        try {
            this.transcriptionText.textContent = "Processing audio...";
            
            // Get API key from local storage
            let apiKey = localStorage.getItem('openai_api_key');
            
            if (!apiKey) {
                this.transcriptionText.textContent = "OpenAI API key required for transcription.";
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
            
            // Show loading state
            this.transcriptionContainer.classList.remove('hidden');
            this.transcriptionText.innerHTML = `
                <div class="flex items-center">
                    <div class="loading-dots mr-3">
                        <span class="bg-[var(--primary)]"></span>
                        <span class="bg-[var(--primary)]"></span>
                        <span class="bg-[var(--primary)]"></span>
                    </div>
                    <p>Transcribing with OpenAI...</p>
                </div>
            `;
            
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
                this.transcriptionText.textContent = data.text;
                
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
                
                // Show both original and formatted
                this.transcriptionText.innerHTML = `
                    <div class="mb-2">
                        <p class="text-sm font-medium opacity-75">Original Transcription:</p>
                        <p>${data.text}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium opacity-75">Formatted for Radio:</p>
                        <p>${formattedText}</p>
                    </div>
                    <div class="mt-4">
                        <button id="use-transcription-btn" class="bg-[var(--primary)] hover:bg-[var(--accent)] text-white text-sm font-medium py-1 px-3 rounded-md transition-colors">
                            Use for Evaluation
                        </button>
                    </div>
                `;
                
                // Add event listener to use transcription button
                document.getElementById('use-transcription-btn').addEventListener('click', () => {
                    window.evaluateResponse(formattedText, true);
                });
                
            } else {
                const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error occurred' } }));
                console.error("OpenAI API error:", errorData);
                
                // Handle API key errors
                if (response.status === 401) {
                    localStorage.removeItem('openai_api_key');
                    this.transcriptionText.textContent = "Invalid OpenAI API key. Please try again with a valid key.";
                } else {
                    this.transcriptionText.textContent = `Error transcribing audio: ${errorData.error?.message || 'Unknown error'}`;
                }
            }
        } catch (err) {
            console.error("Error transcribing audio:", err);
            this.transcriptionText.textContent = "Error transcribing audio. Please try again.";
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
