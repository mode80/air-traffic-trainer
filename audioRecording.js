// Audio Recording functionality for Air Traffic Trainer

class AudioRecorder {
    constructor() {
        // DOM Elements - use defensive coding to handle possible missing elements
        this.recordBtn = document.getElementById('record-btn');
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
        
        // Progressive transcription variables
        this.progressiveTranscriptionEnabled = true;
        this.recordingStartTime = null;
        this.progressiveChunks = [];
        this.progressiveTranscriptionInterval = null;
        this.progressiveMessageId = null;
        this._processingProgressiveChunk = false; // Flag to prevent concurrent processing
        
        // Audio storage for message history
        this.storedAudio = new Map(); // Map of messageId -> {blob, url, wordTimestamps}
        this.currentPlayingAudio = null;
        this.currentAudioBlob = null;
        this.currentWordTimestamps = null;
        
        // Word-level timestamp data
        this.wordTimestamps = [];
        this.wordDisplayInterval = null;
        this.currentPlayingMessageId = null;
        
        // Check if all required elements are available
        if (!this.recordBtn || !this.userResponseTextarea || !this.permissionModal || 
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
            // Initialize the data-recording attribute
            this.recordBtn.setAttribute('data-recording', 'false');
            
            this.recordBtn.addEventListener('click', () => {
                // Check if we're currently recording
                const isRecording = this.recordBtn.getAttribute('data-recording') === 'true';
                
                if (isRecording) {
                    // If we're recording, stop the recording
                    this.stopRecording();
                } else {
                    // If we're not recording, check permissions and start recording
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
                }
            });
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
            const timeslice = 500; // milliseconds
            this.mediaRecorder.start(timeslice);
            console.log('MediaRecorder started with timeslice:', timeslice);
            
            // Update UI to show recording state
            this.updateRecordingUI(true);
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
        // Create MediaRecorder instance
        try {
            // Try with preferred options first
            const options = { mimeType: 'audio/webm' };
            this.mediaRecorder = new MediaRecorder(stream, options);
        } catch (e1) {
            console.error(`Error creating MediaRecorder with options ${JSON.stringify({ mimeType: 'audio/webm' })}: ${e1}`);
            try {
                // Fallback to mp4 format
                const options = { mimeType: 'audio/mp4' };
                this.mediaRecorder = new MediaRecorder(stream, options);
            } catch (e2) {
                console.error(`Error creating MediaRecorder with options ${JSON.stringify(options)}: ${e2}`);
                try {
                    // For Safari, explicitly set the MIME type to ensure compatibility with Groq
                    this.mediaRecorder = new MediaRecorder(stream);
                } catch (e3) {
                    console.error(`Error creating MediaRecorder without options: ${e3}`);
                    window.showToast('Recording not supported in this browser', true);
                    return;
                }
            }
        }
        
        // Set up event handlers
        this.mediaRecorder.onstart = () => {
            this.isRecording = true;
            this.recordingStartTime = Date.now();
            this.audioChunks = [];
            this.progressiveChunks = [];
            
            // Generate a unique ID for the progressive message, but don't create the message
            // We'll just use this ID to track the current recording session
            this.progressiveMessageId = 'progressive-' + Date.now();
            
            // Make sure the interaction-messages container is visible
            const interactionMessages = document.getElementById('interaction-messages');
            if (interactionMessages && interactionMessages.classList.contains('hidden')) {
                interactionMessages.classList.remove('hidden');
            }
            
            // Clear the text input field to prepare for new transcription
            if (this.userResponseTextarea) {
                this.userResponseTextarea.value = '';
            }
            
            // Set up interval to process chunks every 1 second (reduced from 2 seconds)
            if (this.progressiveTranscriptionEnabled) {
                this.progressiveTranscriptionInterval = setInterval(() => {
                    this.processProgressiveTranscription();
                }, 1000);
            }
        };
        
        this.mediaRecorder.ondataavailable = (event) => {
            this.audioChunks.push(event.data);
            
            // Also add to progressive chunks if enabled
            if (this.progressiveTranscriptionEnabled) {
                this.progressiveChunks.push(event.data);
                
                // If we have enough data and we're not already processing, trigger processing
                if (this.progressiveChunks.length > 0 && this.isRecording && !this._processingProgressiveChunk) {
                    this.processProgressiveTranscription();
                }
            }
        };
        
        this.mediaRecorder.onstop = () => {
            console.log('Recording stopped');
            
            // Clear progressive transcription interval
            if (this.progressiveTranscriptionInterval) {
                clearInterval(this.progressiveTranscriptionInterval);
                this.progressiveTranscriptionInterval = null;
            }
            
            // Create audio blob
            let blobOptions = { type: this.mediaRecorder.mimeType };
            
            // Handle Safari which may not set mimeType correctly
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
            if (isSafari && (!this.mediaRecorder.mimeType || this.mediaRecorder.mimeType === '')) {
                blobOptions = { type: 'audio/mp3' }; // Groq supports mp3
            }
            
            this.audioBlob = new Blob(this.audioChunks, blobOptions);
            this.audioURL = URL.createObjectURL(this.audioBlob);
            
            // Reset chunks for next recording
            this.audioChunks = [];
            
            // Update UI
            this.updateRecordingUI(false);
            
            // Check if we already have text from progressive transcription
            if (this.userResponseTextarea && this.userResponseTextarea.value.trim() !== '') {
                // We already have text from progressive transcription, so just store the audio blob
                this.currentAudioBlob = this.audioBlob;
                
                // Enable the submit button
                if (this.submitResponseBtn) {
                    this.submitResponseBtn.disabled = false;
                }
                
                // Show a toast notification to inform the user they can edit before submitting
                window.showToast('You can edit the text before submitting your response', false);
                
                // Remove the progressive message if it exists
                if (this.progressiveMessageId && window.conversationUI) {
                    const progressiveElement = document.querySelector(`.pilot-message[data-message-id="${this.progressiveMessageId}"]`);
                    if (progressiveElement) {
                        progressiveElement.remove();
                    }
                    this.progressiveMessageId = null;
                }
                
                // Focus on the input textbox after recording stops
                if (this.userResponseTextarea) {
                    this.userResponseTextarea.focus();
                }
            } else {
                // No text from progressive transcription, so do the full transcription
                this.transcribeAudio(this.audioBlob);
            }
        };
        
        // Enable record button
        this.recordBtn.disabled = false;
    } catch (err) {
        console.error("Error initializing audio recording:", err);
        window.showToast('Error initializing audio recording', true);
    }
    
    // Update UI during recording
    updateRecordingUI(isRecording) {
        if (isRecording) {
            // Change record button to a pulsing red stop button
            this.recordBtn.classList.remove('bg-[var(--primary)]', 'hover:bg-[var(--accent)]');
            this.recordBtn.classList.add('bg-[var(--recording)]', 'hover:bg-red-600', 'pulse');
            
            // Change the icon to a simple square stop icon
            this.recordBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="6" y="6" width="12" height="12" stroke-width="2" />
                </svg>
            `;
            
            // Update title attribute
            this.recordBtn.title = "Stop recording";
            
            // We'll use a data attribute to track state instead of onclick
            this.recordBtn.setAttribute('data-recording', 'true');
        } else {
            // Reset record button to primary color and microphone icon
            this.recordBtn.classList.add('bg-[var(--primary)]', 'hover:bg-[var(--accent)]');
            this.recordBtn.classList.remove('bg-[var(--recording)]', 'hover:bg-red-600', 'pulse');
            
            // Restore the microphone icon
            this.recordBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            `;
            
            // Update title attribute
            this.recordBtn.title = "Record your radio call";
            
            // Reset the recording state
            this.recordBtn.setAttribute('data-recording', 'false');
        }
    }
    
    // Reset audio recording UI
    resetAudioRecording() {
        if (this.userResponseTextarea) {
            this.userResponseTextarea.value = '';
        }
        // Audio playback is now handled through the play icon in ATC messages
        if (this.transcriptionProcessing) {
            this.transcriptionProcessing.classList.add('hidden');
        }
        
        if (this.audioURL) {
            URL.revokeObjectURL(this.audioURL);
            this.audioURL = null;
        }
        
        // Clear current audio blob and word timestamps
        this.currentAudioBlob = null;
        this.currentWordTimestamps = null;
        
        this.audioBlob = null;
        this.audioChunks = [];
        
        // Clear progressive transcription data
        if (this.progressiveTranscriptionInterval) {
            clearInterval(this.progressiveTranscriptionInterval);
            this.progressiveTranscriptionInterval = null;
        }
        this.progressiveChunks = [];
        this.recordingStartTime = null;
        
        // Clear any word timestamp data and stop any ongoing display
        this.clearWordTimestampDisplay();
        
        this.updateRecordingUI(false);
    }
    
    // Process progressive transcription of audio chunks
    async processProgressiveTranscription() {
        if (!this.isRecording || this.progressiveChunks.length === 0) return;
        
        this._processingProgressiveChunk = true; // Set flag to prevent concurrent processing
        
        try {
            // Create a blob from the current chunks
            let blobOptions = { type: this.mediaRecorder.mimeType };
            
            // Handle Safari which may not set mimeType correctly
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
            if (isSafari && (!this.mediaRecorder.mimeType || this.mediaRecorder.mimeType === '')) {
                blobOptions = { type: 'audio/mp3' }; // Groq supports mp3
            }
            
            const currentBlob = new Blob(this.progressiveChunks, blobOptions);
            
            // Get API key from local storage
            let apiKey = localStorage.getItem('groq_api_key');
            
            if (!apiKey) {
                console.warn("Groq API key required for progressive transcription");
                return;
            }
            
            // Ensure we have a supported audio format
            const { blob: processedBlob, extension: fileExtension } = this.ensureSupportedAudioFormat(currentBlob);
            
            // Create unique filename for the audio file
            const fileName = window.generateFileName('aviation-radio-chunk', fileExtension);
            
            // Call Groq Whisper API through our ApiService
            const data = await window.ApiService.transcribeAudioWithGroq(
                processedBlob, 
                fileName,
                'This is a pilot radio communication in standard aviation phraseology. Preserve all spelled-out numbers exactly as spoken (e.g. "one two tree" should not be converted to "123"). Aviation communications require numbers to be spoken individually.'
            );
            
            // Extract word-level timestamps if available
            let wordTimestamps = [];
            
            // Check for words in the new format (timestamp_granularities[] parameter)
            if (data.words && Array.isArray(data.words)) {
                wordTimestamps = data.words.map(word => ({
                    text: word.word,
                    start: 0, // Set all start times to 0 for progressive display
                    end: word.end
                }));
            } 
            // Check for words in segments (older format)
            else if (data.segments && Array.isArray(data.segments) && data.segments.length > 0) {
                const segments = data.segments;
                for (const segment of segments) {
                    if (segment.words && Array.isArray(segment.words)) {
                        const segmentWords = segment.words.map(word => ({
                            text: word.word,
                            start: 0, // Set all start times to 0 for progressive display
                            end: word.end
                        }));
                        
                        wordTimestamps = [...wordTimestamps, ...segmentWords];
                    }
                }
            }
            // If no word timestamps found, create them from the text
            else if (data.text) {
                const words = data.text.trim().split(/\s+/);
                wordTimestamps = words.map((word, index) => ({
                    text: word,
                    start: 0,
                    end: (index + 1) * 0.3 // Approximate timing
                }));
            }
            
            if (wordTimestamps.length > 0) {
                // Get the full text from the word timestamps
                const transcribedText = wordTimestamps.map(word => word.text).join(' ');
                
                // Update the text input field with the current transcription
                if (this.userResponseTextarea) {
                    this.userResponseTextarea.value = transcribedText;
                }
                
                // Keep the progressive message ID for when we finalize the transcription
                if (window.conversationUI && this.progressiveMessageId) {
                    // We'll still keep the progressive message ID, but we won't update its content
                    // until the user stops recording
                }
            } else {
                console.warn('No word timestamps found in transcription data');
            }
        } catch (error) {
            console.error('Error in progressive transcription:', error);
        } finally {
            this._processingProgressiveChunk = false; // Reset flag
        }
    }
    
    // Clear word timestamp display and stop interval
    clearWordTimestampDisplay() {
        this.wordTimestamps = [];
        if (this.wordDisplayInterval) {
            clearInterval(this.wordDisplayInterval);
            this.wordDisplayInterval = null;
        }
        
        // If there's a current playing message, clear its word display
        if (this.currentPlayingMessageId && window.conversationUI) {
            window.conversationUI.clearWordTimestampDisplay(this.currentPlayingMessageId);
        }
        
        this.currentPlayingMessageId = null;
    }
    
    // Play stored audio for a specific message with word-level timestamps
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
        
        // Clear any previous word display
        this.clearWordTimestampDisplay();
        
        // Create and play the audio
        const audio = new Audio(audioData.url);
        
        // Set the current playing message ID
        this.currentPlayingMessageId = messageId;
        
        // If we have word timestamps for this message, use them for progressive display
        if (audioData.wordTimestamps && audioData.wordTimestamps.length > 0 && window.conversationUI) {
            // Set up interval to check audio time and update word display
            this.wordDisplayInterval = setInterval(() => {
                if (!audio.paused) {
                    const currentTime = audio.currentTime;
                    window.conversationUI.updateWordTimestampDisplay(
                        messageId, 
                        audioData.wordTimestamps, 
                        currentTime
                    );
                }
            }, 50); // Check every 50ms
            
            // When audio ends, make sure all words are visible
            audio.addEventListener('ended', () => {
                window.conversationUI.updateWordTimestampDisplay(
                    messageId, 
                    audioData.wordTimestamps, 
                    Number.MAX_VALUE // Show all words
                );
                clearInterval(this.wordDisplayInterval);
                this.wordDisplayInterval = null;
            });
        }
        
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
            this.currentPlayingMessageId = null;
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
            
            // Clear word display interval if active
            this.clearWordTimestampDisplay();
        });
        
        // Store reference to current audio
        this.currentPlayingAudio = audio;
        
        // Play the audio
        audio.play();
        window.showToast('Playing your recorded response...', false);
        audio.onerror = (err) => {
            console.error('Error playing audio:', err);
            window.showToast('Failed to play audio', true);
        };
    }
    
    // Transcribe audio using Groq's Whisper API
    async transcribeAudio(audioBlob) {
        try {
            // Show transcription processing indicator
            this.transcriptionProcessing.classList.remove('hidden');
            
            // Get API key from local storage
            let apiKey = localStorage.getItem('groq_api_key');
            
            if (!apiKey) {
                this.transcriptionProcessing.classList.add('hidden');
                window.showToast("Groq API key required. Please add your API key in the settings section below.", true);
                // Scroll to settings section
                document.getElementById('api-key-container').scrollIntoView({ behavior: 'smooth' });
                return;
            }
            
            // Ensure we have a supported audio format (especially important for Safari)
            const { blob: processedBlob, extension: fileExtension } = this.ensureSupportedAudioFormat(audioBlob);
            
            // Create unique filename for the audio file
            const fileName = window.generateFileName('aviation-radio', fileExtension);
            
            try {
                // Call Groq Whisper API through our ApiService
                const data = await window.ApiService.transcribeAudioWithGroq(
                    processedBlob, 
                    fileName,
                    'This is a pilot radio communication in standard aviation phraseology. Preserve all spelled-out numbers exactly as spoken (e.g. "one two tree" should not be converted to "123"). Aviation communications require numbers to be spoken individually.'
                );
                
                // Extract word-level timestamps if available
                let wordTimestamps = [];
                if (data.words && Array.isArray(data.words)) {
                    wordTimestamps = data.words.map(word => ({
                        text: word.word,
                        start: word.start,
                        end: word.end
                    }));
                    
                    // Store word timestamps for later use
                    this.wordTimestamps = wordTimestamps;
                    console.log('Word timestamps:', wordTimestamps);
                }
                
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
                
                // Remove the progressive message if it exists
                if (this.progressiveMessageId && window.conversationUI) {
                    const progressiveElement = document.querySelector(`.pilot-message[data-message-id="${this.progressiveMessageId}"]`);
                    if (progressiveElement) {
                        progressiveElement.remove();
                    }
                    this.progressiveMessageId = null;
                }
                
                // Ensure all word-timestamp-containers are hidden after transcription is complete
                setTimeout(() => {
                    const pilotMessages = document.querySelectorAll('.pilot-message');
                    pilotMessages.forEach(message => {
                        const messageId = message.getAttribute('data-message-id');
                        if (messageId && !messageId.startsWith('progressive-') && window.conversationUI) {
                            window.conversationUI.clearWordTimestampDisplay(messageId);
                        }
                    });
                }, 100);
                
                // Enable the submit button
                if (this.submitResponseBtn) {
                    this.submitResponseBtn.disabled = false;
                }
                
                // Check if we're in edit mode (re-recording a previous response)
                if (window.evaluationManager && window.evaluationManager.editingMessageIndex >= 0) {
                    // Submit the corrected response with the new audio and word timestamps
                    window.evaluationManager.submitCorrectedResponse(formattedText, this.audioBlob, wordTimestamps);
                } 
                // Don't automatically submit the response, let the user edit and submit manually
                // Store the audio blob and word timestamps for later submission
                else {
                    // Store the current audio blob and word timestamps for later use when the user submits
                    this.currentAudioBlob = this.audioBlob;
                    this.currentWordTimestamps = wordTimestamps;
                    
                    // Show a toast notification to inform the user they can edit before submitting
                    window.showToast('You can edit the text before submitting your response', false);
                    
                    // Focus on the input textbox after transcription is complete
                    if (this.userResponseTextarea) {
                        this.userResponseTextarea.focus();
                    }
                }
                
            } catch (error) {
                console.error("Groq API error:", error);
                
                // Show error message
                window.showToast(`Error transcribing audio: ${error.message}`, true);
                
                // Hide processing indicator
                this.transcriptionProcessing.classList.add('hidden');
            }
        } catch (err) {
            console.error("Error transcribing audio:", err);
            window.showToast("Error transcribing audio. Please try again.", true);
            this.transcriptionProcessing.classList.add('hidden');
        }
    }
    
    // Store audio blob for a specific message
    storeAudioForMessage(messageId, audioBlob, wordTimestamps = []) {
        if (!messageId || !audioBlob) {
            console.warn('Cannot store audio: missing messageId or audioBlob');
            return;
        }
        
        // Create a URL for the audio blob
        const audioURL = URL.createObjectURL(audioBlob);
        
        // Store the audio data
        this.storedAudio.set(messageId, {
            blob: audioBlob,
            url: audioURL,
            wordTimestamps: wordTimestamps
        });
        
        console.log(`Stored audio for message ${messageId} with ${wordTimestamps.length} word timestamps`);
    }
    
    // Reset current audio data after submission
    resetCurrentAudioData() {
        this.currentAudioBlob = null;
        this.currentWordTimestamps = null;
    }
    
    // Helper method to ensure audio blob is in a format supported by Groq
    ensureSupportedAudioFormat(audioBlob) {
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        if (!isSafari || (audioBlob.type && window.isGroqSupportedFormat(audioBlob.type))) {
            return { blob: audioBlob, extension: this.getFileExtensionFromMimeType(audioBlob.type) };
        }
        
        // For Safari, convert to MP3 which is well-supported by Groq
        console.log('Converting audio to MP3 for better compatibility with Groq');
        const mp3Blob = new Blob([audioBlob], { type: 'audio/mp3' });
        return { blob: mp3Blob, extension: 'mp3' };
    }
    
    // Helper to get file extension from MIME type
    getFileExtensionFromMimeType(mimeType) {
        if (!mimeType) return 'mp3'; // Default to mp3
        
        const type = mimeType.toLowerCase();
        
        if (type.includes('mp3') || type.includes('mpeg')) {
            return 'mp3';
        } else if (type.includes('wav')) {
            return 'wav';
        } else if (type.includes('m4a') || type.includes('mp4')) {
            return 'm4a';
        } else if (type.includes('webm')) {
            return 'webm';
        } else if (type.includes('flac')) {
            return 'flac';
        } else if (type.includes('ogg')) {
            return 'ogg';
        }
        
        return 'mp3'; // Default to mp3 for unknown types
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
