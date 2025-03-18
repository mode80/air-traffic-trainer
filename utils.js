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

// Show a small info panel about the OpenAI API key
window.showApiKeyInfo = function() {
    const infoHtml = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="api-key-info-modal">
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
                <h2 class="text-xl font-bold mb-4">About OpenAI API Key</h2>
                <p class="mb-4">
                    This application uses OpenAI's APIs for both speech-to-text (Whisper) and text generation (GPT-4o).
                </p>
                <p class="mb-4">
                    To use these features, you need to provide your own OpenAI API key. The key is stored only in your browser's local storage and is never sent to our servers.
                </p>
                <p class="mb-4">
                    You can get an API key by signing up at <a href="https://platform.openai.com/signup" target="_blank" class="text-blue-500 underline">platform.openai.com</a>.
                </p>
                <div class="flex justify-end">
                    <button id="close-api-info-btn" class="px-4 py-2 bg-[var(--primary)] text-white rounded-md">
                        Got it
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', infoHtml);
    
    document.getElementById('close-api-info-btn').addEventListener('click', () => {
        document.getElementById('api-key-info-modal').remove();
    });
};


// Generate a simple airport diagram
window.generateAirportDiagram = function(container, isTowered) {
    // Create a simpler airport diagram with HTML/CSS
    const isDarkMode = document.body.classList.contains('dark');
    const bgColor = isDarkMode ? '#262626' : '#F0F0F0';
    const runwayColor = isDarkMode ? '#505050' : '#333333';
    const taxiwayColor = isDarkMode ? '#364968' : '#6B8CCF';
    const textColor = isDarkMode ? '#E0E0E0' : '#333333';
    
    container.innerHTML = `
        <div style="width:100%; height:100%; background-color:${bgColor}; position:relative; border-radius:0.5rem; overflow:hidden;">
            <!-- North indicator -->
            <div style="position:absolute; top:15px; left:15px; color:${textColor}; border:1px solid ${textColor}; width:24px; height:24px; border-radius:50%; text-align:center; line-height:22px;">
                N
            </div>
            
            <!-- Primary runway -->
            <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) rotate(45deg); background-color:${runwayColor}; width:70%; height:20px;"></div>
            
            ${isTowered ? 
            `<!-- Secondary runway (towered) -->
            <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) rotate(90deg); background-color:${runwayColor}; width:60%; height:16px;"></div>` : ''}
            
            <!-- Terminal area -->
            <div style="position:absolute; bottom:20px; left:50%; transform:translateX(-50%); background-color:${isDarkMode ? '#888888' : '#BBBBBB'}; width:120px; height:20px;"></div>
            
            <!-- Taxiway -->
            <div style="position:absolute; bottom:50px; left:50%; transform:translateX(-50%); background-color:${taxiwayColor}; width:70%; height:8px;"></div>
        </div>
    `;
    
    return container;
};

// Show permission modal for microphone access
window.showMicrophonePermissionModal = function() {
    const permissionModal = document.getElementById('permission-modal');
    permissionModal.classList.remove('hidden');
};

// Helper function to check if a file format is supported by OpenAI's Speech-to-Text API
window.isOpenAISupportedFormat = function(mimeType) {
    if (!mimeType) return false;
    
    // List of supported formats by OpenAI's Whisper API (as of March 2025)
    const supportedFormats = [
        'audio/flac', 
        'audio/m4a', 
        'audio/mp3', 
        'audio/mp4', 
        'audio/mpeg', 
        'audio/mpga', 
        'audio/oga', 
        'audio/ogg', 
        'audio/wav', 
        'audio/webm'
    ];
    
    // Check if the mime type is directly supported
    if (supportedFormats.includes(mimeType.toLowerCase())) {
        return true;
    }
    
    // Check for partial matches (e.g., 'audio/x-m4a' should match 'audio/m4a')
    for (const format of supportedFormats) {
        const formatBase = format.split('/')[1];
        if (mimeType.toLowerCase().includes(formatBase)) {
            return true;
        }
    }
    
    return false;
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
