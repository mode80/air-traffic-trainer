// Conversation UI Manager for Air Traffic Trainer

class ConversationUI {
    constructor() {
        // DOM Elements
        this.messagesContainer = document.getElementById('messages-container');
        this.interactionInputContainer = document.getElementById('interaction-input-container');
        this.nextScenarioContainer = document.getElementById('next-scenario-container');
        
        // Initialize
        this.init();
    }
    
    init() {
        // Any initialization code specific to the UI
    }
    
    // Initialize the interaction panel based on the current scenario
    initializeInteraction(conversationHistory) {
        // Clear any existing messages
        this.messagesContainer.innerHTML = '';
        
        // Hide the next scenario button
        this.nextScenarioContainer.classList.add('hidden');
        
        // Show the input container
        this.interactionInputContainer.classList.remove('hidden');
        
        // Hide the interaction messages container if it's empty
        const interactionMessages = document.getElementById('interaction-messages');
        if (interactionMessages) {
            interactionMessages.classList.add('hidden');
        }
        
        // Note: We don't add the initial ATC message here anymore
        // The EvaluationManager.initializeInteraction method will handle this
    }
    
    // Add an initial ATC message to the conversation without auto-playing
    addInitialATCMessage(text) {
        // Show the messages container if it's hidden
        const interactionMessages = document.getElementById('interaction-messages');
        if (interactionMessages && interactionMessages.classList.contains('hidden')) {
            interactionMessages.classList.remove('hidden');
        }
        
        // Generate a unique ID for this message
        const messageId = `atc-msg-${Date.now()}`;
        
        // Create the message element
        const messageHTML = `
            <div class="atc-message mb-3" data-message-id="${messageId}">
                <div class="flex items-start">
                    <div class="bg-gray-200 dark:bg-gray-700 rounded-lg p-3 relative max-w-[85%]">
                        <button class="play-atc-speech absolute -left-8 top-2 flex items-center justify-center w-6 h-6 text-[var(--primary)] hover:text-[var(--accent)] rounded-full transition-colors" 
                                data-speech="${text.replace(/"/g, '&quot;')}" 
                                data-message-id="${messageId}"
                                title="Play ATC speech">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                            </svg>
                        </button>
                        <p>${text}</p>
                    </div>
                </div>
            </div>
        `;
        
        // Add to the messages container
        this.messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        
        // Add event listener to the play button
        const playButton = this.messagesContainer.querySelector(`.atc-message[data-message-id="${messageId}"] .play-atc-speech`);
        if (playButton) {
            playButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation(); // Prevent triggering the message click event
                const speechText = playButton.getAttribute('data-speech');
                if (speechText && window.textToSpeechManager) {
                    window.textToSpeechManager.playATCSpeech(speechText, playButton);
                }
            });
            
            // Do NOT automatically play the ATC speech on initial load
            // This is the key difference from the regular addATCMessage method
        }
        
        // Add click event to the message for audio playback
        const messageElement = this.messagesContainer.querySelector(`.atc-message[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.addEventListener('click', (e) => {
                // Don't trigger if clicking on the play button
                if (e.target.closest('.play-atc-speech')) return;
                
                // Play the ATC speech
                const playButton = messageElement.querySelector('.play-atc-speech');
                if (playButton) {
                    const speechText = playButton.getAttribute('data-speech');
                    if (speechText && window.textToSpeechManager) {
                        window.textToSpeechManager.playATCSpeech(speechText, playButton);
                    }
                }
            });
        }
        
        // Scroll to the bottom of the messages container
        this.scrollToBottom();
        
        return messageId;
    }
    
    // Add an ATC message to the conversation
    addATCMessage(text) {
        // Show the messages container if it's hidden
        const interactionMessages = document.getElementById('interaction-messages');
        if (interactionMessages && interactionMessages.classList.contains('hidden')) {
            interactionMessages.classList.remove('hidden');
        }
        
        // Generate a unique ID for this message
        const messageId = `atc-msg-${Date.now()}`;
        
        // Create the message element
        const messageHTML = `
            <div class="atc-message mb-3" data-message-id="${messageId}">
                <div class="flex items-start">
                    <div class="bg-gray-200 dark:bg-gray-700 rounded-lg p-3 relative max-w-[85%]">
                        <button class="play-atc-speech absolute -left-8 top-2 flex items-center justify-center w-6 h-6 text-[var(--primary)] hover:text-[var(--accent)] rounded-full transition-colors" 
                                data-speech="${text.replace(/"/g, '&quot;')}" 
                                data-message-id="${messageId}"
                                title="Play ATC speech">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                            </svg>
                        </button>
                        <p>${text}</p>
                    </div>
                </div>
            </div>
        `;
        
        // Add to the messages container
        this.messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        
        // Add event listener to the play button
        const playButton = this.messagesContainer.querySelector(`.atc-message[data-message-id="${messageId}"] .play-atc-speech`);
        if (playButton) {
            playButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation(); // Prevent triggering the message click event
                const speechText = playButton.getAttribute('data-speech');
                if (speechText && window.textToSpeechManager) {
                    window.textToSpeechManager.playATCSpeech(speechText, playButton);
                }
            });
            
            // Automatically play the ATC speech without requiring a click
            if (window.textToSpeechManager) {
                window.textToSpeechManager.playATCSpeech(text, playButton);
            }
        }
        
        // Add click event to the message for audio playback
        const messageElement = this.messagesContainer.querySelector(`.atc-message[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.addEventListener('click', (e) => {
                // Don't trigger if clicking on the play button
                if (e.target.closest('.play-atc-speech')) return;
                
                // Play the ATC speech
                const playButton = messageElement.querySelector('.play-atc-speech');
                if (playButton) {
                    const speechText = playButton.getAttribute('data-speech');
                    if (speechText && window.textToSpeechManager) {
                        window.textToSpeechManager.playATCSpeech(speechText, playButton);
                    }
                }
            });
        }
        
        // Scroll to the bottom of the messages container
        this.scrollToBottom();
        
        return messageId;
    }
    
    // Add a pilot message to the conversation
    addPilotMessage(text, audioBlob = null, customMessageId = null) {
        // Generate a unique ID for this message
        const messageId = customMessageId || 'pilot-' + Date.now();
        const isProgressiveMessage = messageId.startsWith('progressive-');
        
        // Create HTML for the message
        const messageHTML = `
            <div class="pilot-message message-container mb-4" data-message-id="${messageId}">
                <div class="flex items-start justify-end">
                    <div class="bg-[var(--primary)] text-white rounded-lg p-3 max-w-[85%] relative">
                        ${audioBlob ? `
                        <button class="play-pilot-speech absolute -left-8 top-2 flex items-center justify-center w-6 h-6 text-[var(--primary)] hover:text-[var(--accent)] rounded-full transition-colors" 
                                data-message-id="${messageId}" 
                                title="Play your recorded response">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                            </svg>
                        </button>
                        ` : ''}
                        ${isProgressiveMessage ? '' : `<p>${text}</p>`}
                        <div class="word-timestamp-container" style="display: none;" data-message-id="${messageId}">
                            ${isProgressiveMessage ? 
                                `<div class="transcription-placeholder">Listening...</div>` : 
                                ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add to the messages container
        this.messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        
        // Store the audio blob if available
        if (audioBlob) {
            window.audioRecorder.storeAudioForMessage(messageId, audioBlob);
        }
        
        // Add event listeners for the newly added message
        const messageElement = this.messagesContainer.querySelector(`.pilot-message[data-message-id="${messageId}"]`);
        if (messageElement) {
            // Only add click handlers if this is not a progressive message (doesn't start with 'progressive-')
            if (!isProgressiveMessage) {
                // Single click/tap to show feedback
                messageElement.addEventListener('click', (e) => {
                    // Don't trigger if clicking on the play button
                    if (e.target.closest('.play-pilot-speech')) return;
                    
                    // Get the index of this message in the conversation history
                    const messageIndex = this.getMessageIndex(messageId);
                    if (messageIndex !== -1) {
                        // Show feedback for this message
                        window.evaluationManager.showFeedbackForMessage(messageIndex);
                    }
                });
                
                // Double click to edit
                messageElement.addEventListener('dblclick', (e) => {
                    // Don't trigger if double-clicking on the play button
                    if (e.target.closest('.play-pilot-speech')) return;
                    
                    // Get the index of this message in the conversation history
                    const messageIndex = this.getMessageIndex(messageId);
                    if (messageIndex !== -1) {
                        // Make this message available for correction
                        window.evaluationManager.correctPreviousResponse(messageIndex);
                    }
                });
            }
            
            // Add event listener to the play button if it exists
            const playButton = messageElement.querySelector('.play-pilot-speech');
            if (playButton) {
                playButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation(); // Prevent triggering the message click event
                    const messageId = playButton.getAttribute('data-message-id');
                    if (messageId) {
                        window.audioRecorder.playStoredAudio(messageId);
                    }
                });
            }
        }
        
        // Scroll to the bottom of the messages container
        this.scrollToBottom();
        
        return messageId;
    }
    
    // Get the index of a message in the conversation history by its ID
    getMessageIndex(messageId) {
        if (!window.evaluationManager || !window.evaluationManager.conversationHistory) {
            return -1;
        }
        
        return window.evaluationManager.conversationHistory.findIndex(
            msg => msg.messageId === messageId
        );
    }
    
    // Scroll to the bottom of the messages container
    scrollToBottom() {
        const interactionMessages = document.getElementById('interaction-messages');
        if (interactionMessages) {
            interactionMessages.scrollTop = interactionMessages.scrollHeight;
        }
    }
    
    // Update the word timestamp display for a message
    updateWordTimestampDisplay(messageId, wordTimestamps, currentTime) {
        const container = this.messagesContainer.querySelector(`.word-timestamp-container[data-message-id="${messageId}"]`);
        if (!container) {
            // Try to find the container by its parent message element
            const messageElement = this.messagesContainer.querySelector(`[data-message-id="${messageId}"]`);
            if (messageElement) {
                const altContainer = messageElement.querySelector('.word-timestamp-container');
                if (altContainer) {
                    // Update the container with the message ID for future reference
                    altContainer.setAttribute('data-message-id', messageId);
                    this._updateWordTimestampContent(altContainer, wordTimestamps, currentTime);
                    return;
                } else {
                    console.warn(`No word timestamp container found within message element: ${messageId}`);
                }
            } else {
                console.warn(`Message element not found for ID: ${messageId}`);
            }
            console.warn(`Word timestamp container not found for message ID: ${messageId}`);
            return;
        }
        
        this._updateWordTimestampContent(container, wordTimestamps, currentTime);
    }
    
    // Helper method to update the content of a word timestamp container
    _updateWordTimestampContent(container, wordTimestamps, currentTime) {
        // Clear previous content
        container.innerHTML = '';
        
        // Find words that should be displayed at the current time
        const visibleWords = wordTimestamps.filter(word => word.start <= currentTime);
        
        // Keep the container hidden - we don't need to show the progressive transcription
        container.style.display = 'none';
        
        if (visibleWords.length > 0) {
            const visibleText = visibleWords.map(word => word.text).join(' ');
            
            // Create a more visible content with styling
            const contentElement = document.createElement('div');
            contentElement.className = 'transcription-text';
            contentElement.textContent = visibleText;
            
            container.appendChild(contentElement);
            
            // Scroll to bottom to ensure the latest text is visible
            this.scrollToBottom();
        } else {
            // Add a placeholder with styling
            const placeholderElement = document.createElement('div');
            placeholderElement.className = 'transcription-placeholder';
            placeholderElement.textContent = 'Listening...';
            placeholderElement.style.opacity = '0.7';
            placeholderElement.style.fontStyle = 'italic';
            
            container.appendChild(placeholderElement);
        }
    }
    
    // Clear word timestamp display for a message
    clearWordTimestampDisplay(messageId) {
        const container = this.messagesContainer.querySelector(`.word-timestamp-container[data-message-id="${messageId}"]`);
        if (container) {
            container.innerHTML = '';
            container.style.display = 'none';
            container.style.minHeight = '0';
            container.style.padding = '0';
            container.style.margin = '0';
            container.style.border = 'none';
        }
    }
    
    // Reset the conversation UI for a new scenario
    resetConversation() {
        // Clear the messages container
        this.messagesContainer.innerHTML = '';
        
        // Show the input container
        this.interactionInputContainer.classList.remove('hidden');
        
        // Hide the next scenario button
        this.nextScenarioContainer.classList.add('hidden');
        
        // Hide the interaction messages container since it's now empty
        const interactionMessages = document.getElementById('interaction-messages');
        if (interactionMessages) {
            interactionMessages.classList.add('hidden');
        }
    }
    
    // Show the next scenario button (without hiding the input container)
    showNextScenarioButton() {
        // Show the next scenario button without hiding the input container
        this.nextScenarioContainer.classList.remove('hidden');
    }
}

// Export the ConversationUI class
window.ConversationUI = ConversationUI;
