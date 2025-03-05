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
        
        // Text input elements
        this.userResponseInput = document.getElementById('user-response');
        this.submitResponseBtn = document.getElementById('submit-response-btn');
        
        // No separate audio input elements in the new UI design
        
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
        
        // Replace clearResponseBtn with showAnswerBtn
        const showAnswerBtn = document.getElementById('show-answer-btn');
        if (showAnswerBtn) {
            showAnswerBtn.addEventListener('click', () => {
                this.showCorrectExample();
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
            
            // Create prompt with proper context for OpenAI to evaluate, with improved instructions for numeric phraseology
            const prompt = `You are an FAA examiner evaluating a pilot's radio communication for a VFR scenario. Rate the following radio call and provide feedback based on standard aviation communication practices:

Scenario: ${currentScenario.title}
${currentScenario.description}
${currentScenario.atcCall ? 'ATC said: "' + currentScenario.atcCall + '"' : ''}${weatherBlock}

Flight Info:
- Aircraft: ${currentScenario.aircraft}
- Tail Number: ${currentScenario.tailNumber}
- Airport: ${currentScenario.airport}${sourceInfo}

Pilot's actual radio call:
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

Please evaluate the pilot's radio communication and provide:
1. A letter grade (A, B, C, D, F) and percentage score (0-100%)
2. Specific feedback on what was correct and what needs improvement
3. An example of the proper communication for this specific scenario with the actual details

Format your response as valid JSON that can be parsed by JavaScript's JSON.parse():
{
  "grade": "A-F",
  "score": 85,
  "feedback": "Detailed feedback text here",
  "correctExample": "Exact example of correct communication"
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
                    this.displayFeedback(feedbackData);
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
        
        // Re-enable button
        this.submitResponseBtn.disabled = false;
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
