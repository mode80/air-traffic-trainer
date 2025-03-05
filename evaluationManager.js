// Evaluation Manager for Air Traffic Trainer

class EvaluationManager {
    constructor() {
        // DOM Elements
        this.feedbackContainer = document.getElementById('feedback-container');
        this.feedbackLoading = document.getElementById('feedback-loading');
        this.feedbackContent = document.getElementById('feedback-content');
        this.scoreIndicator = document.getElementById('score-indicator');
        this.scoreValue = document.getElementById('score-value');
        this.feedbackDetails = document.getElementById('feedback-details');
        this.correctResponse = document.getElementById('correct-response');
        
        // Interaction elements
        this.userResponseInput = document.getElementById('user-response');
        this.submitResponseBtn = document.getElementById('submit-response-btn');
        this.messagesContainer = document.getElementById('messages-container');
        this.interactionInputContainer = document.getElementById('interaction-input-container');
        this.nextScenarioContainer = document.getElementById('next-scenario-container');
        this.nextScenarioBtn = document.getElementById('next-scenario-btn');
        
        // Conversation state
        this.conversationHistory = [];
        this.conversationComplete = false;
        
        // Initialize
        this.init();
    }
    
    init() {
        // Set up event listeners
        this.setupEventListeners();
        
        // Export the evaluateResponse function for use by other modules
        window.evaluateResponse = this.evaluateResponse.bind(this);
        
        // Add MutationObserver to check visibility of feedback container
        this.setupFeedbackVisibilityObserver();
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
                this.showCorrectExample();
            });
        }
        
        // Next scenario button
        if (this.nextScenarioBtn) {
            this.nextScenarioBtn.addEventListener('click', () => {
                this.resetConversation();
                window.scenarioManager.generateScenario();
            });
        }
    }
    
    setupFeedbackVisibilityObserver() {
        // Create a MutationObserver to watch for changes to the feedback container's class list
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    // Check if the container is being shown
                    if (!this.feedbackContainer.classList.contains('hidden')) {
                        // If the user hasn't peeked or made a call yet, hide the feedback container
                        if (!window.hasPeekedOrMadeFirstCall) {
                            this.feedbackContainer.classList.add('hidden');
                        }
                    }
                }
            });
        });
        
        // Start observing the feedback container
        observer.observe(this.feedbackContainer, { attributes: true });
    }
    
    // Initialize the interaction panel based on the current scenario
    initializeInteraction() {
        // Clear any existing messages
        this.messagesContainer.innerHTML = '';
        this.conversationHistory = [];
        this.conversationComplete = false;
        
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
        
        // Add to conversation history
        this.conversationHistory.push({
            role: 'atc',
            text: text
        });
        
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
    
    // Reset the conversation for a new scenario
    resetConversation() {
        // Clear the conversation history
        this.conversationHistory = [];
        this.conversationComplete = false;
        
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
        
        // Clear the input field
        this.userResponseInput.value = '';
        
        // Hide the feedback container
        this.feedbackContainer.classList.add('hidden');
        
        // Reset the audio recording
        window.resetAudioRecording();
        
        // Reset the flag to track whether the user has peeked or made a radio call
        window.hasPeekedOrMadeFirstCall = false;
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
        
        // Add to conversation history
        this.conversationHistory.push({
            role: 'atc',
            text: text
        });
        
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
        
        // Add to conversation history
        this.conversationHistory.push({
            role: 'pilot',
            text: text
        });
        
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
    
    // New method to show the correct example without evaluation
    showCorrectExample() {
        // Get the current scenario
        const currentScenario = window.scenarioManager.getCurrentScenario();
        if (!currentScenario) {
            window.showToast('No active scenario. Please generate a scenario first.', true);
            return;
        }
        
        // Track that user has peeked at the answer
        window.hasPeekedOrMadeFirstCall = true;
        
        // First, show the feedback container
        this.feedbackContainer.classList.remove('hidden');
        
        // Hide the feedback loading section
        this.feedbackLoading.classList.add('hidden');
        
        // Customize the feedback container to only show the correct response
        // 1. Hide the feedback title (first h2 element in the container)
        const feedbackTitle = this.feedbackContainer.querySelector('h2');
        if (feedbackTitle) {
            feedbackTitle.classList.add('hidden');
        }
        
        // 2. Show the feedback content section that contains our elements
        this.feedbackContent.classList.remove('hidden');
        
        // 3. Hide the score section
        const scoreSection = this.scoreIndicator.parentElement.parentElement;
        scoreSection.classList.add('hidden');
        
        // 4. Hide the feedback details section
        this.feedbackDetails.parentElement.classList.add('hidden');
        
        // 5. Only show the correct response section
        const correctResponseSection = this.correctResponse.parentElement.parentElement;
        correctResponseSection.classList.remove('hidden');
        
        // 6. Get the correct example from the current scenario
        this.correctResponse.textContent = currentScenario.correctResponse || "Example response not available for this scenario.";
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
        this.feedbackContainer.classList.remove('hidden');
        this.feedbackLoading.classList.remove('hidden');
        this.feedbackContent.classList.add('hidden');
        this.submitResponseBtn.disabled = true;
        
        try {
            // Get API key
            const apiKey = localStorage.getItem('openai_api_key');
            if (!apiKey) {
                window.showToast("OpenAI API key required. Please add your API key in the settings section below.", true);
                // Scroll to settings section
                document.getElementById('api-key-container').scrollIntoView({ behavior: 'smooth' });
                // Hide feedback section
                this.feedbackContainer.classList.add('hidden');
                this.submitResponseBtn.disabled = false;
                return;
            }
            
            // Build weather information for prompt
            const weatherBlock = currentScenario.weatherInfo && currentScenario.weatherInfo.trim() !== '' ? 
                `\nWeather Information:\n${currentScenario.weatherInfo}` : '';
            
            // Add source information
            const sourceInfo = isAudio ? 
                `\nNote: This response was provided via audio recording and then transcribed.` : 
                `\nNote: This response was typed directly by the user.`;
            
            // Build conversation history for context
            let conversationContext = '';
            if (this.conversationHistory.length > 0) {
                conversationContext = '\nConversation history:\n';
                this.conversationHistory.forEach((message, index) => {
                    if (index === this.conversationHistory.length - 1) {
                        // The last message is the current pilot message, which we'll evaluate
                        return;
                    }
                    conversationContext += `${message.role === 'atc' ? 'ATC' : 'Pilot'}: "${message.text}"\n`;
                });
            }
            
            // Create prompt with proper context for OpenAI to evaluate
            const prompt = `You are an FAA examiner evaluating a pilot's radio communication for a VFR scenario. Rate the following radio call and provide feedback based on standard aviation communication practices:

Scenario: ${currentScenario.title}
${currentScenario.description}${conversationContext}${weatherBlock}

Flight Info:
- Aircraft: ${currentScenario.aircraft}
- Tail Number: ${currentScenario.tailNumber}
- Airport: ${currentScenario.airport}${sourceInfo}

Pilot's actual radio call (ONLY EVALUATE THIS SPECIFIC TRANSMISSION):
"${responseText}"

IMPORTANT EVALUATION GUIDELINES:
1. Allow for situation-appropriate abbreviations and variations as used in real-world radio communications:
   - Aircraft type instead of full tail number when appropriate (e.g., "Cessna six niner zero" instead of "November one four six niner zero")
   - Airport name instead of identifier when commonly used (e.g., "Half Moon traffic" vs "KHAF traffic")

2. Strongly favor spelled-out aviation numeric phraseology over digits:
   - Give higher scores when pilots use "one one niner point five" rather than "119.5"
   - Reward proper aviation number pronunciation (e.g., "niner" for 9, "tree" for 3, "fife" for 5)
   - Prefer "three thousand five hundred" over "3,500"
   - Expect headings to be spoken as individual digits (e.g., "heading zero niner zero" not "heading ninety")
   - Expect altitudes as thousands and hundreds (e.g., "six thousand five hundred" not "six five zero zero")
   - Expect frequencies to be spoken with "point" or "decimal" (e.g., "one one niner point eight")

3. Focus only on content that matters in verbal communications:
   - IGNORE capitalization, punctuation, and spelling in the evaluation
   - Focus on whether the essential information is communicated
   - Consider whether the communication would be clear to ATC or other pilots

4. Be lenient on word order when all required information is present and the meaning is clear.

5. CONVERSATION COMPLETION GUIDELINES:
   - Mark the conversation as complete when the exchange has reached a natural conclusion
   - For frequency changes, mark as complete after the pilot acknowledges the new frequency
   - For clearances, mark as complete after the pilot reads back the clearance correctly
   - For emergency situations, mark as complete when the pilot has acknowledged instructions and is proceeding as directed
   - DO NOT continue the conversation unnecessarily with repetitive instructions
   - If the pilot has acknowledged all necessary information, mark the conversation as complete
   - If the pilot's response is a complete readback of ATC instructions, mark the conversation as complete

Please evaluate ONLY THE MOST RECENT pilot radio call and provide:
1. A letter grade (A, B, C, D, F) and percentage score (0-100%) for THIS SPECIFIC TRANSMISSION
2. Specific feedback on what was correct and what needs improvement in THIS TRANSMISSION
3. An example of the proper communication for this specific transmission
4. The ATC's response to this specific transmission (if applicable)
5. Whether this communication concludes the conversation (true/false)

Format your response as valid JSON that can be parsed by JavaScript's JSON.parse():
{
  "grade": "A-F",
  "score": 85,
  "feedback": "Detailed feedback text here",
  "correctExample": "Exact example of correct communication",
  "atcResponse": "ATC's response to this communication (or null if not applicable)",
  "conversationComplete": true/false
}

Provide ONLY raw JSON in your response with no explanations, additional text, or code block formatting (no \`\`\`).`;

            // Call OpenAI API
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an FAA examiner evaluating a pilot\'s radio communication for a VFR scenario.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7
                })
            });
            
            // Handle API response
            if (response.ok) {
                const data = await response.json();
                const responseContent = data.choices[0].message.content.trim();
                
                try {
                    // Parse the JSON response
                    const feedbackData = JSON.parse(responseContent);
                    
                    // Display feedback
                    this.displayFeedback(feedbackData);
                    
                    // If there's an ATC response, add it to the conversation
                    if (feedbackData.atcResponse && feedbackData.atcResponse !== "null") {
                        setTimeout(() => {
                            this.addATCMessage(feedbackData.atcResponse);
                        }, 1000); // Slight delay for better UX
                    }
                    
                    // If the conversation is complete, show the next scenario button
                    if (feedbackData.conversationComplete) {
                        this.conversationComplete = true;
                        this.interactionInputContainer.classList.add('hidden');
                        this.nextScenarioContainer.classList.remove('hidden');
                    }
                    
                } catch (e) {
                    console.error("Failed to parse JSON response:", e);
                    this.displayErrorFeedback("Failed to parse evaluation response. The API returned an invalid format.");
                }
            } else {
                // Handle error response
                const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error occurred' } }));
                console.error("OpenAI API error:", errorData);
                
                // Handle API key errors
                if (response.status === 401) {
                    localStorage.removeItem('openai_api_key');
                    this.displayErrorFeedback("Invalid API key. Please check your OpenAI API key in the settings.");
                } else {
                    this.displayErrorFeedback(`Error from OpenAI API: ${errorData.error?.message || 'Unknown error'}`);
                }
            }
        } catch (err) {
            console.error("Error evaluating response:", err);
            this.displayErrorFeedback(err.message);
        }
    }

    // Display feedback from evaluation
    displayFeedback(feedbackData) {
        // Show the feedback container
        this.feedbackContainer.classList.remove('hidden');
        
        // Restore the feedback title if it was hidden
        const feedbackTitle = this.feedbackContainer.querySelector('h2');
        if (feedbackTitle) {
            feedbackTitle.classList.remove('hidden');
        }
        
        // Hide loading, show content
        this.feedbackLoading.classList.add('hidden');
        this.feedbackContent.classList.remove('hidden');
        
        // Make sure all feedback elements are visible (might have been hidden by showCorrectExample)
        const scoreSection = this.scoreIndicator.parentElement.parentElement;
        scoreSection.classList.remove('hidden');
        
        this.feedbackDetails.parentElement.classList.remove('hidden');
        
        const correctResponseSection = this.correctResponse.parentElement.parentElement;
        correctResponseSection.classList.remove('hidden');
        
        // Update score indicators
        this.scoreIndicator.textContent = feedbackData.grade;
        this.scoreValue.textContent = `${feedbackData.score}%`;
        
        // Set color based on grade
        const scoreColors = {
            'A': 'bg-green-500',
            'B': 'bg-blue-500',
            'C': 'bg-yellow-500',
            'D': 'bg-orange-500',
            'F': 'bg-red-500'
        };
        
        // Reset all color classes first
        Object.values(scoreColors).forEach(color => {
            this.scoreIndicator.classList.remove(color);
        });
        
        // Add the appropriate color class
        const grade = feedbackData.grade.charAt(0);
        this.scoreIndicator.classList.add(scoreColors[grade] || 'bg-gray-500');
        
        // Update feedback details
        this.feedbackDetails.innerHTML = marked.parse(feedbackData.feedback);
        
        // Update correct response example
        this.correctResponse.textContent = feedbackData.correctExample;
        
        // Re-enable button if conversation is not complete
        if (!feedbackData.conversationComplete) {
            this.submitResponseBtn.disabled = false;
        }
    }

    // Display error feedback
    displayErrorFeedback(errorMessage = null) {
        // Show the feedback container
        this.feedbackContainer.classList.remove('hidden');
        
        // Restore the feedback title if it was hidden
        const feedbackTitle = this.feedbackContainer.querySelector('h2');
        if (feedbackTitle) {
            feedbackTitle.classList.remove('hidden');
        }
        
        // Hide loading, show content
        this.feedbackLoading.classList.add('hidden');
        this.feedbackContent.classList.remove('hidden');
        
        // Make sure all feedback elements are visible (might have been hidden by showCorrectExample)
        const scoreSection = this.scoreIndicator.parentElement.parentElement;
        scoreSection.classList.remove('hidden');
        
        this.feedbackDetails.parentElement.classList.remove('hidden');
        
        const correctResponseSection = this.correctResponse.parentElement.parentElement;
        correctResponseSection.classList.remove('hidden');
        
        // Set error display
        this.scoreIndicator.textContent = '?';
        this.scoreIndicator.classList.remove(
            'bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'
        );
        this.scoreIndicator.classList.add('bg-gray-500');
        this.scoreValue.textContent = 'N/A';
        
        // Set error message
        const errorText = errorMessage || 
            "There was an error evaluating your response. Please check your API key or try again later.";
        
        this.feedbackDetails.innerHTML = `
            <div class="text-red-500 dark:text-red-400">
                <p>${errorText}</p>
                <p class="mt-2">If this error persists, please try the following:</p>
                <ul class="list-disc pl-5 mt-1">
                    <li>Check your OpenAI API key in the settings</li>
                    <li>Ensure your OpenAI account has available credits</li>
                    <li>Try a different browser or clear your cache</li>
                </ul>
            </div>
        `;
        
        this.correctResponse.textContent = "N/A";
        
        // Re-enable button
        this.submitResponseBtn.disabled = false;
    }
}

// Export the EvaluationManager class
window.EvaluationManager = EvaluationManager;
