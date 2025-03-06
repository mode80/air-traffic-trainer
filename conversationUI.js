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
        
        // Get the current scenario
        const currentScenario = window.scenarioManager.getCurrentScenario();
        if (!currentScenario) return;
        
        // If the scenario has an initial ATC call, display it
        if (currentScenario.atcCall) {
            // Use a special version of addATCMessage that doesn't auto-play on initial load
            this.addInitialATCMessage(currentScenario.atcCall);
        }
    }
    
    // Add an initial ATC message to the conversation without auto-playing
    addInitialATCMessage(text) {
        // Show the messages container if it's hidden
        const interactionMessages = document.getElementById('interaction-messages');
        if (interactionMessages && interactionMessages.classList.contains('hidden')) {
            interactionMessages.classList.remove('hidden');
        }
        
        // Create the message element
        const messageHTML = `
            <div class="atc-message mb-3">
                <div class="flex items-start">
                    <div class="bg-gray-200 dark:bg-gray-700 rounded-lg p-3 relative max-w-[85%]">
                        <button class="play-atc-speech absolute -left-8 top-2 flex items-center justify-center w-6 h-6 text-[var(--primary)] hover:text-[var(--accent)] rounded-full transition-colors" 
                                data-speech="${text.replace(/"/g, '&quot;')}" 
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
        const playButton = this.messagesContainer.querySelector('.atc-message:last-child .play-atc-speech');
        if (playButton) {
            playButton.addEventListener('click', (e) => {
                e.preventDefault();
                const speechText = playButton.getAttribute('data-speech');
                if (speechText && window.textToSpeechManager) {
                    window.textToSpeechManager.playATCSpeech(speechText, playButton);
                }
            });
            
            // Do NOT automatically play the ATC speech on initial load
            // This is the key difference from the regular addATCMessage method
        }
        
        // Scroll to the bottom of the messages container
        this.scrollToBottom();
    }
    
    // Add an ATC message to the conversation
    addATCMessage(text) {
        // Show the messages container if it's hidden
        const interactionMessages = document.getElementById('interaction-messages');
        if (interactionMessages && interactionMessages.classList.contains('hidden')) {
            interactionMessages.classList.remove('hidden');
        }
        
        // Create the message element
        const messageHTML = `
            <div class="atc-message mb-3">
                <div class="flex items-start">
                    <div class="bg-gray-200 dark:bg-gray-700 rounded-lg p-3 relative max-w-[85%]">
                        <button class="play-atc-speech absolute -left-8 top-2 flex items-center justify-center w-6 h-6 text-[var(--primary)] hover:text-[var(--accent)] rounded-full transition-colors" 
                                data-speech="${text.replace(/"/g, '&quot;')}" 
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
        const playButton = this.messagesContainer.querySelector('.atc-message:last-child .play-atc-speech');
        if (playButton) {
            playButton.addEventListener('click', (e) => {
                e.preventDefault();
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
        
        // Scroll to the bottom of the messages container
        this.scrollToBottom();
    }
    
    // Add a pilot message to the conversation
    addPilotMessage(text) {
        // Show the messages container if it's hidden
        const interactionMessages = document.getElementById('interaction-messages');
        if (interactionMessages && interactionMessages.classList.contains('hidden')) {
            interactionMessages.classList.remove('hidden');
        }
        
        // Create the message element
        const messageHTML = `
            <div class="pilot-message mb-3">
                <div class="flex items-start justify-end">
                    <div class="bg-[var(--primary)] text-white rounded-lg p-3 max-w-[85%]">
                        <p>${text}</p>
                    </div>
                </div>
            </div>
        `;
        
        // Add to the messages container
        this.messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        
        // Scroll to the bottom of the messages container
        this.scrollToBottom();
    }
    
    // Scroll to the bottom of the messages container
    scrollToBottom() {
        const interactionMessages = document.getElementById('interaction-messages');
        if (interactionMessages) {
            interactionMessages.scrollTop = interactionMessages.scrollHeight;
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
    
    // Show the next scenario button and hide the input container
    showNextScenarioButton() {
        this.interactionInputContainer.classList.add('hidden');
        this.nextScenarioContainer.classList.remove('hidden');
    }
}

// Export the ConversationUI class
window.ConversationUI = ConversationUI;
