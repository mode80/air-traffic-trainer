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
window.generateAirportDiagram = function(container, isTowered, positionInfo = '') {
    const isDarkMode = document.body.classList.contains('dark');
    const bgColor = isDarkMode ? '#262626' : '#F0F0F0';
    const runwayColor = isDarkMode ? '#505050' : '#333333';
    const taxiwayColor = isDarkMode ? '#364968' : '#6B8CCF';
    const textColor = isDarkMode ? '#E0E0E0' : '#333333';
    const aircraftColor = isDarkMode ? '#E0E0E0' : '#D32F2F';
    
    // Parse the position information to determine aircraft location
    const aircraftPosition = parseAircraftPosition(positionInfo);
    
    // Create a square container with proper padding
    let diagramHTML = `
        <div style="width:100%; height:100%; background-color:${bgColor}; position:relative; border-radius:0.5rem; overflow:hidden;">
            <!-- North indicator -->
            <div style="position:absolute; top:15px; left:15px; color:${textColor}; border:1px solid ${textColor}; width:24px; height:24px; border-radius:50%; text-align:center; line-height:22px; z-index:20;">
                N
            </div>
            
            <!-- Create a square container with padding -->
            <div id="airport-container" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:70%; height:70%; max-width:70%; max-height:70%;">
                <!-- Primary runway - doubled height from 8px to 16px -->
                <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) rotate(45deg); background-color:${runwayColor}; width:80%; height:16px;"></div>
                
                ${isTowered ? 
                `<!-- Secondary runway (towered) - doubled height from 6px to 12px -->
                <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) rotate(90deg); background-color:${runwayColor}; width:70%; height:12px;"></div>` : ''}
                
                <!-- Horizontal taxiway - doubled height from 4px to 8px -->
                <div style="position:absolute; top:70%; left:20%; width:65%; height:8px; background-color:${taxiwayColor}; z-index:2;"></div>
                
                <!-- Ramp area on the left side of the diagram -->
                <div style="position:absolute; top:70%; left:20%; width:15%; height:15%; background-color:${isDarkMode ? '#888888' : '#BBBBBB'}; border-radius:3px; z-index:1;"></div>
            </div>
    `;
    
    // Add aircraft icon and position label if position info is available
    if (aircraftPosition.valid) {
        // Position the aircraft based on the parsed location
        // We need to map from the original 0-100% coordinate system to our new padded system
        const { x, y, rotation, label } = aircraftPosition;
        
        // Map coordinates from original 0-100 range to our new padded system
        // Original coordinates are in 0-100 range, we need to map them to the 15-85 range (70% usable space)
        // Formula: newPos = 15 + (originalPos * 0.7)
        
        // For south direction, we want to position at the very bottom edge
        let mappedX, mappedY;
        
        if (label && label.toLowerCase().includes('south')) {
            // For south direction, position at the bottom edge
            mappedX = 15 + (x * 0.7);
            mappedY = 85; // Bottom edge
        } else if (label && label.toLowerCase().includes('north')) {
            // For north direction, position at the top edge
            mappedX = 15 + (x * 0.7);
            mappedY = 15; // Top edge
        } else {
            // Normal mapping for other positions
            mappedX = 15 + (x * 0.7);
            mappedY = 15 + (y * 0.7);
        }
        
        // Make the aircraft icon slightly larger for better visibility with the thicker runways
        diagramHTML += `
            <!-- Aircraft icon -->
            <div style="position:absolute; top:${mappedY}%; left:${mappedX}%; transform:translate(-50%, -50%);">
                <div style="transform:rotate(${rotation}deg);">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="${aircraftColor}" style="filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));">
                        <polygon points="12,0 0,24 24,24" />
                    </svg>
                </div>
                <div style="position:absolute; top:19px; left:50%; transform:translateX(-50%); background-color:rgba(0,0,0,0.7); color:white; padding:3px 8px; border-radius:4px; font-size:11px; white-space:nowrap; z-index:30;">
                    ${label}
                </div>
            </div>
        `;
    }
    
    // Close the container div
    diagramHTML += `</div>`;
    
    container.innerHTML = diagramHTML;
    
    // Ensure the airport container is square after rendering
    const airportContainer = container.querySelector('#airport-container');
    if (airportContainer) {
        // Get the smaller dimension (width or height) of the parent container
        const parentWidth = container.clientWidth;
        const parentHeight = container.clientHeight;
        const smallerDimension = Math.min(parentWidth, parentHeight);
        
        // Set the airport container to 70% of the smaller dimension to maintain square aspect ratio
        const containerSize = smallerDimension * 0.7;
        airportContainer.style.width = containerSize + 'px';
        airportContainer.style.height = containerSize + 'px';
    }
    
    return container;
};

/**
 * Parse aircraft position information to determine location on the airport diagram
 * @param {string} positionInfo - The position information from the scenario
 * @returns {object} - Position data for rendering on the diagram
 */
function parseAircraftPosition(positionInfo) {
    if (!positionInfo) {
        return { valid: false };
    }
    
    // Default position (invalid)
    let result = { valid: false };
    
    // Convert to lowercase for easier matching
    const positionLower = positionInfo.toLowerCase();
    
    // Check for common position patterns
    
    // On the ground at a specific location (ramp, terminal, etc.)
    if (positionLower.includes('ramp') || 
        positionLower.includes('terminal') || 
        positionLower.includes('fbo') || 
        positionLower.includes('parked')) {
        
        // Extract the position description without adding redundant "At"
        let positionDescription = positionInfo.split(',')[0];
        
        // If the position already starts with "At", "On", "In", "Parked", etc., don't add another prefix
        if (positionDescription.match(/^(At|On|In|Parked|Holding|Taxiing)/i)) {
            // Use the description as is
            positionDescription = positionDescription.trim();
        } else {
            // Add "At" prefix only if needed
            positionDescription = 'At ' + positionDescription;
        }
        
        result = {
            valid: true,
            x: 32, // Moved further to the right on the ramp area
            y: 72, // Moved slightly downward
            rotation: 90, // Facing the taxiway (east)
            label: positionDescription
        };
    }
    // Holding short of runway
    else if (positionLower.includes('holding short')) {
        let runwayMatch = positionLower.match(/runway\s+(\d+)/i);
        let runway = runwayMatch ? runwayMatch[1] : '';
        
        // Position based on runway number
        let x = 50, y = 50;
        let rotation = 0;
        
        // Determine position based on runway number
        if (runway) {
            const runwayNum = parseInt(runway, 10);
            if (runwayNum <= 9) {  // Runways 1-9
                x = 30;
                y = 50;
                rotation = 90;  // Facing east
            } else if (runwayNum <= 18) {  // Runways 10-18
                // For runway 14, position at the intersection of taxiway and vertical runway
                if (runwayNum === 14) {
                    x = 50;
                    y = 70;
                    rotation = 0;  // Facing north
                } else {
                    x = 50;
                    y = 35;
                    rotation = 180;  // Facing south
                }
            } else if (runwayNum <= 27) {  // Runways 19-27
                x = 70;
                y = 50;
                rotation = 270;  // Facing west
            } else {  // Runways 28-36
                // For runway 32, position at the intersection of taxiway and diagonal runway
                if (runwayNum === 32) {
                    x = 60;
                    y = 70;
                    rotation = 45;  // Facing northeast
                } else {
                    x = 50;
                    y = 65;
                    rotation = 0;  // Facing north
                }
            }
        }
        
        result = {
            valid: true,
            x,
            y,
            rotation,
            label: `Holding short RWY ${runway}`
        };
    }
    // On a specific taxiway
    else if (positionLower.includes('taxiway') || positionLower.match(/taxiway\s+[a-z]/i)) {
        let taxiwayMatch = positionLower.match(/taxiway\s+([a-z])/i);
        let taxiway = taxiwayMatch ? taxiwayMatch[1].toUpperCase() : '';
        
        // Position somewhere along the horizontal taxiway
        const x = 40 + Math.random() * 40; // Random position along the taxiway
        
        result = {
            valid: true,
            x,
            y: 70, // At the height of the horizontal taxiway
            rotation: 90, // Facing along the taxiway (east)
            label: `On Taxiway ${taxiway}`
        };
    }
    // On final approach or on a specific leg of the pattern
    else if (positionLower.includes('final') || 
             positionLower.includes('downwind') || 
             positionLower.includes('base')) {
        
        let x = 50, y = 50, rotation = 0;
        let approachType = '';
        
        if (positionLower.includes('final')) {
            // Final approach - coming in from the edge toward the runway
            // Check if approaching from a specific direction
            if (positionLower.includes('south')) {
                // Approaching from the south - position at the bottom edge
                x = 50;
                y = 85; // Position near the bottom edge
                rotation = 180; // Approaching from the south (facing north)
                approachType = 'Final from South';
            } else if (positionLower.includes('north')) {
                // Approaching from the north - position at the top edge
                x = 50;
                y = 15; // Position near the top edge
                rotation = 0; // Approaching from the north (facing south)
                approachType = 'Final from North';
            } else {
                // Default final approach (from southeast)
                x = 75;
                y = 75;
                rotation = 225; // Approaching from the southeast
                approachType = 'Final';
            }
        } else if (positionLower.includes('downwind')) {
            // Downwind - parallel to the runway in the opposite direction
            x = 25;
            y = 25;
            rotation = 45; // Parallel to runway, opposite direction
            approachType = 'Downwind';
        } else if (positionLower.includes('base')) {
            // Base - perpendicular to the runway, transitioning from downwind to final
            x = 25;
            y = 75;
            rotation = 135; // Perpendicular to runway
            approachType = 'Base';
        }
        
        result = {
            valid: true,
            x,
            y,
            rotation,
            label: `On ${approachType}`
        };
    }
    // Miles from the airport in a specific direction
    else if (positionLower.match(/(\d+)\s*miles?\s+(north|south|east|west|northeast|northwest|southeast|southwest)/i)) {
        const matches = positionLower.match(/(\d+)\s*miles?\s+(north|south|east|west|northeast|northwest|southeast|southwest)/i);
        const distance = parseInt(matches[1], 10);
        const direction = matches[2].toLowerCase();
        
        // Calculate position based on distance and direction
        // Use a more aggressive scaling to push distant aircraft further to the edges
        // A distance of 5 miles or more will be near the edge of the container
        const distanceFactor = Math.min(distance / 5, 1);
        
        // Determine position based on direction and scaled distance
        let x = 50, y = 50, rotation = 0;
        const offset = 40 * distanceFactor; // Maximum offset from center (40% of container)
        
        switch (direction) {
            case 'north':
                x = 50; 
                y = 15; // Position closer to the top edge (was 10 + (1 - distanceFactor) * 40)
                rotation = 180; 
                break;
            case 'south':
                x = 50; 
                y = 85; // Position closer to the bottom edge (was 90 - (1 - distanceFactor) * 40)
                rotation = 0; 
                break;
            case 'east':
                x = 90 - (1 - distanceFactor) * 40; y = 50; rotation = 270; break;
            case 'west':
                x = 10 + (1 - distanceFactor) * 40; y = 50; rotation = 90; break;
            case 'northeast':
                x = 85 - (1 - distanceFactor) * 35; y = 15 + (1 - distanceFactor) * 35; rotation = 225; break;
            case 'northwest':
                x = 15 + (1 - distanceFactor) * 35; y = 15 + (1 - distanceFactor) * 35; rotation = 135; break;
            case 'southeast':
                x = 85 - (1 - distanceFactor) * 35; y = 85 - (1 - distanceFactor) * 35; rotation = 315; break;
            case 'southwest':
                x = 15 + (1 - distanceFactor) * 35; y = 85 - (1 - distanceFactor) * 35; rotation = 45; break;
        }
        
        // Extract altitude if available
        let altitude = '';
        const altMatch = positionLower.match(/at\s+(\d+,?\d*)\s*feet/i);
        if (altMatch) {
            altitude = `, ${altMatch[1].replace(',', '')} ft`;
        }
        
        result = {
            valid: true,
            x,
            y,
            rotation,
            label: `${distance} mi ${direction}${altitude}`
        };
    }
    // Just landed or on the runway
    else if (positionLower.includes('landed') || positionLower.includes('runway')) {
        let runwayMatch = positionLower.match(/runway\s+(\d+)/i);
        let runway = runwayMatch ? runwayMatch[1] : '';
        
        result = {
            valid: true,
            x: 50, // Center of the runway
            y: 50,
            rotation: 45, // Aligned with the runway
            label: runway ? `On RWY ${runway}` : 'On Runway'
        };
    }
    // If we can't determine a specific position, but we have some info
    else {
        result = {
            valid: true,
            x: 50,
            y: 50,
            rotation: 0,
            label: positionInfo.split(',')[0]
        };
    }
    
    return result;
}

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
