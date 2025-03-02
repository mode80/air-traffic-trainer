// API Key Management for Air Traffic Trainer

class ApiKeyManager {
    constructor() {
        // DOM Elements
        this.apiKeyInput = document.getElementById('openai-api-key');
        this.apiKeyForm = document.getElementById('api-key-form');
        this.apiKeyStatus = document.getElementById('api-key-status');
        this.clearApiKeyBtn = document.getElementById('clear-api-key');
        this.saveApiKeyBtn = document.getElementById('save-api-key');
        this.apiKeyInfoBtn = document.getElementById('api-key-info-btn');
        this.apiKeyContainer = document.getElementById('api-key-container');
        
        // Initialize
        this.init();
    }
    
    init() {
        // Load saved API key
        const savedApiKey = localStorage.getItem('openai_api_key');
        if (savedApiKey) {
            this.apiKeyInput.value = savedApiKey;
        }
        
        // Update UI based on API key presence
        this.updateApiKeyUI();
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Add save button event listener
        this.saveApiKeyBtn.addEventListener('click', () => {
            const apiKey = this.apiKeyInput.value.trim();
            if (apiKey) {
                localStorage.setItem('openai_api_key', apiKey);
                window.showToast('API key saved successfully');
                this.updateApiKeyUI();
            } else {
                localStorage.removeItem('openai_api_key');
                window.showToast('API key removed');
                this.updateApiKeyUI();
            }
        });
        
        // Add clear API key button event listener
        this.clearApiKeyBtn.addEventListener('click', () => {
            localStorage.removeItem('openai_api_key');
            this.apiKeyInput.value = '';
            window.showToast('API key removed');
            this.updateApiKeyUI();
        });
        
        // Add info button event listener
        this.apiKeyInfoBtn.addEventListener('click', () => {
            window.showApiKeyInfo();
        });
    }
    
    // Update UI based on API key presence
    updateApiKeyUI() {
        const hasApiKey = localStorage.getItem('openai_api_key') !== null;
        
        if (hasApiKey) {
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
