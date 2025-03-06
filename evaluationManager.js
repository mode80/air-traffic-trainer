// Evaluation Manager for Air Traffic Trainer

class EvaluationManager {
    constructor() {
        // Interaction elements
        this.userResponseInput = document.getElementById('user-response');
        this.submitResponseBtn = document.getElementById('submit-response-btn');
        
        // Conversation state
        this.conversationHistory = [];
        this.conversationComplete = false;
        
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
            this.evaluateResponse(this.userResponseInput.value);
        });
        
        // Add Enter key support for the textarea
        if (this.userResponseInput) {
            this.userResponseInput.addEventListener('keydown', (e) => {
                // Submit on Enter (without Shift key)
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault(); // Prevent newline
                    if (this.userResponseInput.value.trim() !== '' && !this.submitResponseBtn.disabled) {
                        this.evaluateResponse(this.userResponseInput.value);
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
        
        // Initialize the UI
        this.conversationUI.initializeInteraction(this.conversationHistory);
        
        // Get the current scenario
        const currentScenario = window.scenarioManager.getCurrentScenario();
        if (!currentScenario) return;
        
        // If the scenario has an initial ATC call, add it to conversation history
        if (currentScenario.atcCall) {
            this.conversationHistory.push({
                role: 'atc',
                text: currentScenario.atcCall
            });
        }
    }
    
    // Reset the conversation for a new scenario
    resetConversation() {
        // Clear the conversation history
        this.conversationHistory = [];
        this.conversationComplete = false;
        
        // Reset the UI
        this.conversationUI.resetConversation();
        
        // Clear the input field
        this.userResponseInput.value = '';
        
        // Hide the feedback container
        this.feedbackUI.hideFeedback();
        
        // Reset the audio recording
        window.resetAudioRecording();
        
        // Reset the flag to track whether the user has peeked or made a radio call
        window.hasPeekedOrMadeFirstCall = false;
    }
    
    // Add a pilot message to the conversation
    addPilotMessage(text) {
        // Add to conversation history
        this.conversationHistory.push({
            role: 'pilot',
            text: text
        });
        
        // Update the UI
        this.conversationUI.addPilotMessage(text);
    }
    
    // Add an ATC message to the conversation
    addATCMessage(text) {
        // Add to conversation history
        this.conversationHistory.push({
            role: 'atc',
            text: text
        });
        
        // Update the UI
        this.conversationUI.addATCMessage(text);
    }
    
    // Evaluate user response using OpenAI's GPT-4o model
    async evaluateResponse(responseText, isAudio = false) {
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
        this.addPilotMessage(responseText);
        
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
            const prompt = window.EvaluationPrompt.generatePrompt(
                currentScenario, 
                this.conversationHistory, 
                responseText, 
                isAudio
            );
            
            // Call the OpenAI API
            const feedbackData = await window.ApiService.callOpenAI(prompt);
            
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
