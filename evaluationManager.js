// Evaluation Manager for Air Traffic Trainer

class EvaluationManager {
    constructor() {
        // Interaction elements
        this.userResponseInput = document.getElementById('user-response');
        this.submitResponseBtn = document.getElementById('submit-response-btn');
        
        // Conversation state
        this.conversationHistory = [];
        this.conversationComplete = false;
        this.feedbackHistory = []; // Store feedback for each pilot response
        this.editingMessageIndex = -1; // Index of the message being edited, -1 if not editing
        
        // UI Managers
        this.conversationUI = new window.ConversationUI();
        this.feedbackUI = new window.FeedbackUI();
        
        // Initialize
        this.init();
    }
    
    init() {
        // Set up event listeners
        this.setupEventListeners();
        
        // Export the evaluateResponse function for use by other modules
        window.evaluateResponse = this.evaluateResponse.bind(this);
    }
    
    setupEventListeners() {
        // Text input controls
        this.submitResponseBtn.addEventListener('click', () => {
            if (this.editingMessageIndex >= 0) {
                this.submitCorrectedResponse(this.userResponseInput.value);
            } else {
                this.evaluateResponse(this.userResponseInput.value);
            }
        });
        
        // Add Enter key support for the textarea
        if (this.userResponseInput) {
            this.userResponseInput.addEventListener('keydown', (e) => {
                // Submit on Enter (without Shift key)
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault(); // Prevent newline
                    if (this.userResponseInput.value.trim() !== '' && !this.submitResponseBtn.disabled) {
                        if (this.editingMessageIndex >= 0) {
                            this.submitCorrectedResponse(this.userResponseInput.value);
                        } else {
                            this.evaluateResponse(this.userResponseInput.value);
                        }
                    }
                }
            });
        }
        
        // Show answer button
        const showAnswerBtn = document.getElementById('show-answer-btn');
        if (showAnswerBtn) {
            showAnswerBtn.addEventListener('click', () => {
                this.feedbackUI.showCorrectExample();
            });
        }
        
        // Next scenario button
        const nextScenarioBtn = document.getElementById('next-scenario-btn');
        if (nextScenarioBtn) {
            nextScenarioBtn.addEventListener('click', () => {
                this.resetConversation();
                window.scenarioManager.generateScenario();
            });
        }
    }
    
    // Initialize the interaction panel based on the current scenario
    initializeInteraction() {
        // Reset conversation state
        this.conversationHistory = [];
        this.conversationComplete = false;
        this.feedbackHistory = [];
        this.editingMessageIndex = -1;
        
        // Initialize the UI
        this.conversationUI.initializeInteraction(this.conversationHistory);
        
        // Get the current scenario
        const currentScenario = window.scenarioManager.getCurrentScenario();
        if (!currentScenario) return;
        
        // If the scenario has an initial ATC call, add it to conversation history
        if (currentScenario.atcCall) {
            const messageId = this.conversationUI.addInitialATCMessage(currentScenario.atcCall);
            this.conversationHistory.push({
                role: 'atc',
                text: currentScenario.atcCall,
                messageId: messageId
            });
        }
    }
    
    // Reset the conversation for a new scenario
    resetConversation() {
        // Clear the conversation history
        this.conversationHistory = [];
        this.conversationComplete = false;
        this.feedbackHistory = [];
        this.editingMessageIndex = -1;
        
        // Reset the UI
        this.conversationUI.resetConversation();
        
        // Clear the input field
        this.userResponseInput.value = '';
        
        // Hide the feedback container
        this.feedbackUI.hideFeedback();
        
        // Reset the audio recording
        window.resetAudioRecording();
        
        // Reset the submit button to normal state
        this.submitResponseBtn.textContent = 'Submit';
        this.submitResponseBtn.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
        this.submitResponseBtn.classList.add('bg-[var(--primary)]', 'hover:bg-[var(--accent)]');
        
        // Reset the flag to track whether the user has peeked or made a radio call
        window.hasPeekedOrMadeFirstCall = false;
    }
    
    // Add a pilot message to the conversation
    addPilotMessage(text, audioBlob = null) {
        // Add to conversation history with a unique message ID
        const messageId = this.conversationUI.addPilotMessage(text, audioBlob);
        
        this.conversationHistory.push({
            role: 'pilot',
            text: text,
            messageId: messageId,
            audioBlob: audioBlob
        });
        
        return messageId;
    }
    
    // Add an ATC message to the conversation
    addATCMessage(text) {
        // Add to conversation history with a unique message ID
        const messageId = this.conversationUI.addATCMessage(text);
        
        this.conversationHistory.push({
            role: 'atc',
            text: text,
            messageId: messageId
        });
        
        return messageId;
    }
    
    // Show feedback for a specific message
    showFeedbackForMessage(messageIndex) {
        if (messageIndex < 0 || messageIndex >= this.conversationHistory.length) {
            console.error(`Invalid message index: ${messageIndex}`);
            return;
        }
        
        const message = this.conversationHistory[messageIndex];
        if (message.role !== 'pilot') {
            console.warn(`Cannot show feedback for non-pilot message at index ${messageIndex}`);
            return;
        }
        
        // Find the corresponding feedback in the feedback history
        const feedback = this.feedbackHistory.find(fb => fb.messageIndex === messageIndex);
        if (!feedback) {
            console.warn(`No feedback found for message at index ${messageIndex}`);
            return;
        }
        
        // Display the feedback
        this.feedbackUI.displayFeedback(feedback.data);
    }
    
    // Make a previous response available for correction
    correctPreviousResponse(messageIndex) {
        if (messageIndex < 0 || messageIndex >= this.conversationHistory.length) {
            console.error(`Invalid message index: ${messageIndex}`);
            return;
        }
        
        const message = this.conversationHistory[messageIndex];
        if (message.role !== 'pilot') {
            console.warn(`Cannot correct non-pilot message at index ${messageIndex}`);
            return;
        }
        
        // Set the editing message index
        this.editingMessageIndex = messageIndex;
        
        // Set the text in the input field
        this.userResponseInput.value = message.text;
        
        // Focus the input field
        this.userResponseInput.focus();
        
        // Update UI to show we're in editing mode
        this.submitResponseBtn.textContent = 'Update';
        this.submitResponseBtn.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
        this.submitResponseBtn.classList.remove('bg-[var(--primary)]', 'hover:bg-[var(--accent)]');
        this.submitResponseBtn.disabled = false;
        
        // Show a toast notification
        window.showToast('Editing previous response. Submit to replace.', false);
    }
    
    // Submit a corrected response
    async submitCorrectedResponse(text, audioBlob = null) {
        if (this.editingMessageIndex < 0) {
            console.error('No message is being edited');
            return;
        }
        
        if (!text || text.trim() === '') {
            window.showToast('Please provide a radio communication before submitting', true);
            return;
        }
        
        // Get the current scenario
        const currentScenario = window.scenarioManager.getCurrentScenario();
        if (!currentScenario) {
            window.showToast('No active scenario. Please generate a scenario first.', true);
            return;
        }
        
        // Get the original message
        const originalMessage = this.conversationHistory[this.editingMessageIndex];
        
        // Remove all messages after the edited message
        this.conversationHistory = this.conversationHistory.slice(0, this.editingMessageIndex);
        
        // Remove all feedback entries for the removed messages
        this.feedbackHistory = this.feedbackHistory.filter(fb => fb.messageIndex < this.editingMessageIndex);
        
        // Clear the messages container and re-add the remaining messages
        this.conversationUI.messagesContainer.innerHTML = '';
        for (const msg of this.conversationHistory) {
            if (msg.role === 'atc') {
                this.conversationUI.addATCMessage(msg.text);
            } else {
                this.conversationUI.addPilotMessage(msg.text, msg.audioBlob);
            }
        }
        
        // Reset editing state
        this.editingMessageIndex = -1;
        this.submitResponseBtn.textContent = 'Submit';
        this.submitResponseBtn.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
        this.submitResponseBtn.classList.add('bg-[var(--primary)]', 'hover:bg-[var(--accent)]');
        
        // Now evaluate the new response and continue the conversation from this point
        // Pass true for isEditedResponse to indicate this is a corrected message
        await this.evaluateResponse(text, audioBlob !== null, audioBlob, true);
    }
    
    // Evaluate user response using OpenAI's GPT-4o model
    async evaluateResponse(responseText, isAudio = false, audioBlob = null, isEditedResponse = false) {
        if (!responseText || responseText.trim() === '') {
            window.showToast('Please provide a radio communication before submitting', true);
            return;
        }
        
        // Get the current scenario
        const currentScenario = window.scenarioManager.getCurrentScenario();
        if (!currentScenario) {
            window.showToast('No active scenario. Please generate a scenario first.', true);
            return;
        }
        
        // Track that user has made a radio call
        window.hasPeekedOrMadeFirstCall = true;
        
        // Add the pilot's message to the conversation
        this.addPilotMessage(responseText, audioBlob);
        
        // Clear the input field
        this.userResponseInput.value = '';
        
        // Show feedback section with loading state
        this.feedbackUI.showLoading();
        this.submitResponseBtn.disabled = true;
        
        try {
            // Check for API key
            const apiKey = localStorage.getItem('openai_api_key');
            if (!apiKey) {
                window.showToast("OpenAI API key required. Please add your API key in the settings section below.", true);
                // Scroll to settings section
                document.getElementById('api-key-container').scrollIntoView({ behavior: 'smooth' });
                // Hide feedback section
                this.feedbackUI.hideFeedback();
                this.submitResponseBtn.disabled = false;
                return;
            }
            
            // Generate the evaluation prompt
            // If this is an edited response, add a note to generate a new response
            let prompt;
            if (isEditedResponse) {
                // Create a custom prompt for edited responses
                prompt = window.EvaluationPrompt.generatePrompt(
                    currentScenario, 
                    this.conversationHistory,
                    responseText, 
                    isAudio,
                    true // Add flag for edited response
                );
            } else {
                prompt = window.EvaluationPrompt.generatePrompt(
                    currentScenario, 
                    this.conversationHistory,
                    responseText, 
                    isAudio
                );
            }
            
            // Call the OpenAI API
            const feedbackData = await window.ApiService.callOpenAI(prompt);
            
            // Store the feedback in the feedback history
            this.feedbackHistory.push({
                messageIndex: this.conversationHistory.length - 1,
                data: feedbackData
            });
            
            // Display feedback
            this.feedbackUI.displayFeedback(feedbackData);
            
            // If there's an ATC response, add it to the conversation
            if (feedbackData.atcResponse && feedbackData.atcResponse.trim() !== "") {
                setTimeout(() => {
                    this.addATCMessage(feedbackData.atcResponse);
                }, 1000); // Slight delay for better UX
            } else {
                // If there's no ATC response, we can assume the conversation might be complete
                console.log("No ATC response received, checking if conversation should end");
            }
            
            // If the conversation is explicitly marked as complete OR there's an empty ATC response
            if (feedbackData.conversationComplete || feedbackData.atcResponse.trim() === "") {
                console.log("Conversation complete, showing next scenario button");
                console.log("Completion reason: " + 
                    (feedbackData.conversationComplete ? "conversationComplete flag is true" : "empty ATC response"));
                this.conversationComplete = true;
                this.conversationUI.showNextScenarioButton();
            } else {
                console.log("Conversation continuing, ATC response provided");
                // Re-enable button if conversation is not complete
                this.submitResponseBtn.disabled = false;
            }
            
        } catch (err) {
            console.error("Error evaluating response:", err);
            this.feedbackUI.displayErrorFeedback(err.message);
            this.submitResponseBtn.disabled = false;
        }
    }
}

// Export the EvaluationManager class
window.EvaluationManager = EvaluationManager;
