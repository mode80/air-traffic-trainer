// Feedback UI Manager for Air Traffic Trainer

class FeedbackUI {
    constructor() {
        // DOM Elements
        this.feedbackContainer = document.getElementById('feedback-container');
        this.feedbackLoading = document.getElementById('feedback-loading');
        this.feedbackContent = document.getElementById('feedback-content');
        this.scoreIndicator = document.getElementById('score-indicator');
        this.scoreValue = document.getElementById('score-value');
        this.feedbackDetails = document.getElementById('feedback-details');
        this.correctResponse = document.getElementById('correct-response');
        
        // Initialize
        this.init();
    }
    
    init() {
        // Set up MutationObserver to check visibility of feedback container
        this.setupFeedbackVisibilityObserver();
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
    
    // Show loading state in the feedback container
    showLoading() {
        // Show the feedback container
        this.feedbackContainer.classList.remove('hidden');
        
        // Show loading, hide content
        this.feedbackLoading.classList.remove('hidden');
        this.feedbackContent.classList.add('hidden');
    }
    
    // Hide the feedback container
    hideFeedback() {
        this.feedbackContainer.classList.add('hidden');
    }
    
    // Show the correct example without evaluation
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
    }
}

// Export the FeedbackUI class
window.FeedbackUI = FeedbackUI;
