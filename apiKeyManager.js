// API Key Management for Air Traffic Trainer

class ApiKeyManager {
    constructor() {
        // DOM Elements
        this.apiKeyInput = document.getElementById('groq-api-key');
        this.saveApiKeyBtn = document.getElementById('save-groq-api-key');
        this.apiKeyForm = document.getElementById('api-key-form');
        this.apiKeyStatus = document.getElementById('api-key-status');
        this.clearApiKeyBtn = document.getElementById('clear-api-key');
        this.apiKeyInfoBtn = document.getElementById('groq-api-key-info-btn');
        this.apiKeyContainer = document.getElementById('api-key-container');
        
        // Initialize
        this.init();
    }
    
    init() {
        // Load saved API key
        const savedApiKey = localStorage.getItem('groq_api_key');
        if (savedApiKey) {
            this.apiKeyInput.value = savedApiKey;
        }
        
        // Update UI based on API key presence
        this.updateApiKeyUI();
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Function to save the API key
        const saveApiKey = () => {
            const apiKey = this.apiKeyInput.value.trim();
            if (apiKey) {
                localStorage.setItem('groq_api_key', apiKey);
                window.showToast('Groq API key saved successfully');
                this.updateApiKeyUI();
            } else {
                localStorage.removeItem('groq_api_key');
                window.showToast('Groq API key removed');
                this.updateApiKeyUI();
            }
        };
        
        // Add save button event listener for Groq API key
        this.saveApiKeyBtn.addEventListener('click', saveApiKey);
        
        // Add keydown event listener to the input field to handle Enter key
        this.apiKeyInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault(); // Prevent default form submission
                saveApiKey();
            }
        });
        
        // Add clear API key button event listener
        this.clearApiKeyBtn.addEventListener('click', () => {
            localStorage.removeItem('groq_api_key');
            this.apiKeyInput.value = '';
            window.showToast('API key removed');
            this.updateApiKeyUI();
        });
        
        // Add info button event listener for Groq
        this.apiKeyInfoBtn.addEventListener('click', () => {
            window.showApiKeyInfo('groq');
        });
    }
    
    // Update UI based on API key presence
    updateApiKeyUI() {
        const hasGroqKey = localStorage.getItem('groq_api_key') !== null;
        
        if (hasGroqKey) {
            // Hide the form, show the minimal clear button
            this.apiKeyForm.classList.add('hidden');
            this.apiKeyStatus.classList.remove('hidden');
            
            // Make the container extremely minimal
            this.apiKeyContainer.classList.remove('bg-[var(--light-card)]', 'dark:bg-[var(--dark-card)]', 'shadow-md', 'p-5');
            this.apiKeyContainer.classList.add('p-2', 'mt-4');
        } else {
            // Show the form, hide the status
            this.apiKeyForm.classList.remove('hidden');
            this.apiKeyStatus.classList.add('hidden');
            
            // Restore the container styling
            this.apiKeyContainer.classList.add('bg-[var(--light-card)]', 'dark:bg-[var(--dark-card)]', 'shadow-md', 'p-5');
            this.apiKeyContainer.classList.remove('p-2', 'mt-4');
        }
    }
}

// Export the ApiKeyManager class
window.ApiKeyManager = ApiKeyManager;

// Show API key info based on provider
window.showApiKeyInfo = function(provider = 'groq') {
    if (provider === 'groq') {
        alert('To use speech recognition and text-to-speech features, you need a Groq API key.\n\n1. Go to https://console.groq.com/keys \n2. Create an account or sign in\n3. Create a new API key\n4. Copy and paste it here\n\nYour API key is stored only in your browser and is never sent to our servers.');
    }
};
