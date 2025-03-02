// Main JavaScript file for Air Traffic Trainer

// Initialize all components when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize dark mode
    initializeDarkMode();
    
    // Initialize components
    window.scenarioManager = new ScenarioManager();
    window.audioRecorder = new AudioRecorder();
    window.evaluationManager = new EvaluationManager();
    window.apiKeyManager = new ApiKeyManager();
    
    // No input mode toggle needed with the new UI design
    
    // Generate initial scenario
    window.scenarioManager.generateScenario();
});

// Initialize dark mode functionality
function initializeDarkMode() {
    // Check for dark mode preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark');
    }

    // Listen for changes in color scheme preference
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        if (event.matches) {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    });
}
