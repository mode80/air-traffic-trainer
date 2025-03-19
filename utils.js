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
    
    // Determine airport rotation based on scenario
    // Default rotation is 45 degrees (NE/SW runway)
    let airportRotation = 45;
    
    // Extract runway information if available
    let runwayHeading = null;
    if (positionInfo.toLowerCase().includes('runway')) {
        const runwayMatch = positionInfo.match(/runway\s+(\d+)/i);
        if (runwayMatch) {
            const runwayNumber = parseInt(runwayMatch[1], 10);
            // Convert runway number to heading (runway 36 = 360 degrees, runway 9 = 90 degrees)
            runwayHeading = runwayNumber * 10;
            // Adjust airport rotation to match runway heading
            // Subtract 45 because our default diagonal runway is at 45 degrees
            airportRotation = runwayHeading - 45;
        }
    }
    
    // Create a square container with proper padding
    let diagramHTML = `
        <div style="width:100%; height:100%; background-color:${bgColor}; position:relative; border-radius:0.5rem; overflow:hidden;">
            <!-- North indicator -->
            <div style="position:absolute; top:15px; left:15px; color:${textColor}; border:1px solid ${textColor}; width:24px; height:24px; border-radius:50%; text-align:center; line-height:22px; z-index:20;">
                N
            </div>
            
            <!-- Position caption at the top of the diagram -->
            ${aircraftPosition.valid ? 
            `<div style="position:absolute; top:15px; left:50%; transform:translateX(-50%); background-color:rgba(0,0,0,0.7); color:white; padding:5px 12px; border-radius:4px; font-size:12px; white-space:nowrap; z-index:1000; pointer-events:none; text-align:center;">
                ${aircraftPosition.label || 'Aircraft Position'}
            </div>` : ''}
            
            <!-- Create a square container with padding -->
            <div id="airport-container" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:70%; height:70%; max-width:70%; max-height:70%;">
                <!-- Airport elements group that will be rotated together -->
                <div id="airport-elements" style="position:relative; width:100%; height:100%; transform:rotate(${airportRotation}deg);">
                    <!-- Primary diagonal runway - doubled height from 8px to 16px -->
                    <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) rotate(45deg); background-color:${runwayColor}; width:80%; height:16px;">
                        <!-- Runway heading labels -->
                        <div style="position:absolute; top:50%; left:0; transform:translate(-120%, -50%) rotate(-45deg); color:${textColor}; font-size:10px; font-weight:bold; text-align:center;">
                            ${runwayHeading ? Math.floor(((runwayHeading + 180) % 360) / 10) : ''}
                        </div>
                        <div style="position:absolute; top:50%; right:0; transform:translate(120%, -50%) rotate(-45deg); color:${textColor}; font-size:10px; font-weight:bold; text-align:center;">
                            ${runwayHeading || ''}
                        </div>
                    </div>
                    
                    ${isTowered ? 
                    `<!-- Secondary runway (towered) -->
                    <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background-color:${runwayColor}; width:70%; height:12px;">
                        <!-- No labels for secondary runway -->
                    </div>` : ''}
                    
                    <!-- Taxiway and ramp positioned to intersect with the runways -->
                    <!-- Rotate the taxiway 45 degrees counterclockwise to intersect both runways -->
                    <!-- Taxiway - doubled height from 4px to 8px -->
                    <div style="position:absolute; top:67%; left:65%; transform:translate(-50%, 0) rotate(-45deg); width:90%; height:8px; background-color:${taxiwayColor}; z-index:2;"></div>
                    
                    <!-- Ramp area on the left side of the taxiway, also rotated -->
                    <div style="position:absolute; top:74%; left:33%; transform:rotate(-45deg); width:15%; height:15%; background-color:${isDarkMode ? '#888888' : '#BBBBBB'}; border-radius:3px; z-index:1;"></div>
                </div>
            </div>
    `;
    
    // Add aircraft icon
    if (aircraftPosition.valid) {
        // Position the aircraft based on the parsed location
        const { x, y, rotation, isOnGround } = aircraftPosition;
        
        // Map coordinates from original 0-100 range to our new padded system
        // Original coordinates are in 0-100 range, we need to map them to the 15-85 range (70% usable space)
        // Formula: newPos = 15 + (originalPos * 0.7)
        
        // For south direction, we want to position at the very bottom edge
        let mappedX, mappedY;
        
        if (aircraftPosition.label && aircraftPosition.label.toLowerCase().includes('south')) {
            // For south direction, position at the bottom edge
            mappedX = 15 + (x * 0.7);
            mappedY = 85; // Bottom edge
        } else if (aircraftPosition.label && aircraftPosition.label.toLowerCase().includes('north')) {
            // For north direction, position at the top edge
            mappedX = 15 + (x * 0.7);
            mappedY = 15; // Top edge
        } else {
            // Normal mapping for other positions
            mappedX = 15 + (x * 0.7);
            mappedY = 15 + (y * 0.7);
        }
        
        // Determine if aircraft should be part of the airport rotation
        if (isOnGround) {
            // For aircraft on the ground (runway, taxiway, ramp), add to the airport-elements group
            diagramHTML = diagramHTML.replace('</div>\n            </div>', `
                <!-- Aircraft icon (on ground) -->
                <div style="position:absolute; top:${y + (aircraftPosition.label && (aircraftPosition.label.toLowerCase().includes('park') || aircraftPosition.label.toLowerCase().includes('ramp') || aircraftPosition.label.toLowerCase().includes('general aviation')) ? 6 : 0)}%; left:${x}%; transform:translate(-50%, -50%); z-index:500;">
                    <div style="transform:rotate(${rotation - airportRotation}deg);">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="${aircraftColor}" style="filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));">
                            <polygon points="12,0 0,24 24,24" />
                        </svg>
                    </div>
                </div>
            </div>
            </div>`);
        } else {
            // Check if the aircraft is in the pattern (downwind, base, final, upwind, crosswind)
            const inPattern = aircraftPosition.label && 
                             (aircraftPosition.label.toLowerCase().includes('downwind') || 
                              aircraftPosition.label.toLowerCase().includes('base') || 
                              aircraftPosition.label.toLowerCase().includes('final') || 
                              aircraftPosition.label.toLowerCase().includes('upwind') || 
                              aircraftPosition.label.toLowerCase().includes('crosswind'));
            
            if (inPattern) {
                // For aircraft in the pattern, add to the airport-elements group to rotate with the airport
                diagramHTML = diagramHTML.replace('</div>\n            </div>', `
                    <!-- Aircraft icon (in pattern) -->
                    <div style="position:absolute; top:${y}%; left:${x}%; transform:translate(-50%, -50%); z-index:500;">
                        <div style="transform:rotate(${rotation - airportRotation}deg);">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="${aircraftColor}" style="filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));">
                                <polygon points="12,0 0,24 24,24" />
                            </svg>
                        </div>
                    </div>
                </div>
                </div>`);
            } else {
                // For aircraft on approach (not in pattern), add outside the airport-elements group
                // These aircraft don't rotate with the airport
                diagramHTML += `
                    <!-- Aircraft icon (on approach) -->
                    <div style="position:absolute; top:${mappedY}%; left:${mappedX}%; transform:translate(-50%, -50%); z-index:500;">
                        <div style="transform:rotate(${rotation}deg);">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="${aircraftColor}" style="filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));">
                                <polygon points="12,0 0,24 24,24" />
                            </svg>
                        </div>
                    </div>
                `;
            }
        }
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
            y: 76, // Moved further down by 2 aircraft heights (from 72 to 76)
            rotation: 90, // Facing the taxiway (east)
            label: positionDescription,
            isOnGround: true // Aircraft is on the ground
        };
    }
    // Holding short of runway
    else if (positionLower.includes('holding short')) {
        // Extract runway number if available
        let runwayMatch = positionLower.match(/runway\s+(\d+)/i);
        let runway = runwayMatch ? runwayMatch[1] : '';
        
        // Position at the intersection of taxiway and runway
        let x = 50, y = 60;
        let rotation = 90; // Facing along the taxiway
        
        result = {
            valid: true,
            x,
            y,
            rotation,
            label: `Holding short RWY ${runway}`,
            isOnGround: true // Aircraft is on the ground
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
            label: `On Taxiway ${taxiway}`,
            isOnGround: true // Aircraft is on the ground
        };
    }
    // On final approach or on a specific leg of the pattern
    else if (positionLower.includes('final') || 
             positionLower.includes('downwind') || 
             positionLower.includes('base') ||
             positionLower.includes('upwind') ||
             positionLower.includes('crosswind')) {
        
        let x = 50, y = 50, rotation = 0;
        let approachType = '';
        
        // Calculate positions relative to the diagonal runway (which is our primary runway)
        // The runway is oriented at 45 degrees (NE/SW) before any rotation
        
        if (positionLower.includes('final')) {
            // Check if approaching from a specific direction
            if (positionLower.includes('south')) {
                // Approaching from the south - position at the bottom edge
                x = 35; // Approach from southwest (for the diagonal runway)
                y = 85; // Position near the bottom edge
                rotation = 225; // Approaching from the southwest (for diagonal runway)
                approachType = 'Final from South';
            } else if (positionLower.includes('north')) {
                // Approaching from the north - position at the top edge
                x = 65; // Approach from northeast (for the diagonal runway)
                y = 15; // Position near the top edge
                rotation = 45; // Approaching from the northeast (for diagonal runway)
                approachType = 'Final from North';
            } else {
                // Default final approach (from southeast)
                x = 65;
                y = 65;
                rotation = 225; // Approaching from the southwest for diagonal runway
                approachType = 'Final';
            }
        } else if (positionLower.includes('downwind')) {
            // Downwind - parallel to the runway in the opposite direction
            x = 35;
            y = 35;
            rotation = 225; // Parallel to diagonal runway, opposite direction
            approachType = 'Downwind';
        } else if (positionLower.includes('base')) {
            // Base - perpendicular to the runway, transitioning from downwind to final
            x = 25;
            y = 65;
            rotation = 315; // Perpendicular to diagonal runway
            approachType = 'Base';
        } else if (positionLower.includes('upwind')) {
            // Upwind - parallel to the runway in the same direction
            x = 65;
            y = 35;
            rotation = 45; // Same direction as the diagonal runway
            approachType = 'Upwind';
        } else if (positionLower.includes('crosswind')) {
            // Crosswind - perpendicular to the runway, transitioning from upwind to downwind
            x = 75;
            y = 35;
            rotation = 135; // Perpendicular to diagonal runway
            approachType = 'Crosswind';
        }
        
        result = {
            valid: true,
            x,
            y,
            rotation,
            label: `On ${approachType}`,
            isOnGround: false // Aircraft is in the air
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
                y = 15; // Position closer to the top edge
                rotation = 180; 
                break;
            case 'south':
                x = 50; 
                y = 85; // Position closer to the bottom edge
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
            label: `${distance} mi ${direction}${altitude}`,
            isOnGround: false // Aircraft is in the air
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
            label: runway ? `On RWY ${runway}` : 'On Runway',
            isOnGround: true // Aircraft is on the ground
        };
    }
    // Default to center of diagram if no pattern matches
    else {
        result = {
            valid: true,
            x: 50,
            y: 50,
            rotation: 0,
            label: positionInfo,
            isOnGround: false // Assume aircraft is in the air if we can't determine
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
