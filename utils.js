// Utility functions for Air Traffic Trainer

// Show toast notification
window.showToast = function(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 ${isError ? 'bg-red-500' : 'bg-green-600'} text-white p-3 rounded-md shadow-lg z-50`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
};

// Helper function to convert digits to spoken aviation words
window.digitsToWords = function(digit) {
    const digitMap = {
        '0': 'zero',
        '1': 'one',
        '2': 'two',
        '3': 'tree',
        '4': 'four',
        '5': 'fife',
        '6': 'six',
        '7': 'seven',
        '8': 'eight',
        '9': 'niner'
    };
    return digitMap[digit] || digit;
};

// Helper function to generate a unique file name with timestamp
window.generateFileName = function(prefix, extension) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${prefix}-${timestamp}.${extension}`;
};

// Show a small info panel about the Groq API key
window.showApiKeyInfo = function(provider) {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modalOverlay.id = 'api-info-modal';
    
    // Create modal content
    modalOverlay.innerHTML = `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <div class="flex justify-between items-start mb-4">
                <h2 class="text-xl font-bold mb-4">About Groq API Key</h2>
                <button id="close-api-info" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div class="prose dark:prose-invert max-w-none">
                <p>
                    This application uses Groq's APIs for both speech-to-text (Whisper) and text generation (LLaMA).
                    To use these features, you need to provide your own Groq API key. The key is stored only in your browser's local storage and is never sent to our servers.
                </p>
                <p class="mt-4">
                    To get a Groq API key:
                </p>
                <ol class="list-decimal list-inside mt-2">
                    <li>Go to <a href="https://console.groq.com/keys" target="_blank" class="text-blue-500 hover:underline">https://console.groq.com/keys</a></li>
                    <li>Create an account or sign in</li>
                    <li>Generate a new API key</li>
                    <li>Copy and paste it into the API key field</li>
                </ol>
            </div>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(modalOverlay);
    
    // Add close event
    document.getElementById('close-api-info').addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
    });
    
    // Close on click outside
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            document.body.removeChild(modalOverlay);
        }
    });
};

// Format time in HH:MM format
window.formatTime = function(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

// Format date in Month DD, YYYY format
window.formatDate = function(date) {
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
};

// Generate a random integer between min and max (inclusive)
window.getRandomInt = function(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Generate a random aircraft callsign
window.generateRandomCallsign = function() {
    const airlines = ['AAL', 'DAL', 'UAL', 'SWA', 'JBU', 'ASA', 'FFT', 'SKW', 'AWE', 'NKS'];
    const randomAirline = airlines[Math.floor(Math.random() * airlines.length)];
    const randomNumber = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
    return `${randomAirline}${randomNumber}`;
};

// Generate a random N-number for general aviation aircraft
window.generateRandomNNumber = function() {
    const prefix = 'N';
    const randomNumber = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excluding I and O which can be confused with 1 and 0
    const randomLetter = letters.charAt(Math.floor(Math.random() * letters.length));
    
    // 50% chance to have a letter in the N-number
    if (Math.random() > 0.5) {
        const position = Math.floor(Math.random() * 5); // 0-4 position for the letter
        const numberString = randomNumber.toString();
        const parts = numberString.split('');
        parts.splice(position, 0, randomLetter);
        return `${prefix}${parts.join('')}`;
    } else {
        return `${prefix}${randomNumber}`;
    }
};

// Generate a random aircraft type
window.generateRandomAircraftType = function() {
    const aircraftTypes = ['C172', 'C182', 'PA28', 'PA32', 'BE36', 'SR22', 'B737', 'B738', 'A320', 'E170', 'CRJ7', 'CRJ9'];
    return aircraftTypes[Math.floor(Math.random() * aircraftTypes.length)];
};

// Show permission modal for microphone access
window.showMicrophonePermissionModal = function() {
    const permissionModal = document.getElementById('permission-modal');
    permissionModal.classList.remove('hidden');
};

// Helper function to check if a file format is supported by Groq's Speech-to-Text API
window.isGroqSupportedFormat = function(mimeType) {
    // List of supported formats by Groq's Whisper API (as of March 2025)
    const supportedFormats = [
        'audio/mp3',
        'audio/mpeg',
        'audio/mp4',
        'audio/mpeg4',
        'audio/m4a',
        'audio/wav',
        'audio/wave',
        'audio/x-wav',
        'audio/webm',
        'audio/ogg',
        'audio/flac'
    ];
    
    // Check if the MIME type is in the supported list
    return supportedFormats.some(format => 
        mimeType.toLowerCase().includes(format.toLowerCase()));
};

// Initialize dark mode functionality
window.initializeDarkMode = function() {
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
};
