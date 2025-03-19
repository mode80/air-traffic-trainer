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
    const rampColor = isDarkMode ? '#404040' : '#B0B0B0';
    const textColor = isDarkMode ? '#E0E0E0' : '#333333';
    const aircraftColor = isDarkMode ? '#E0E0E0' : '#D32F2F';
    
    // Parse the position information to determine aircraft location
    const aircraftPosition = parseAircraftPosition(positionInfo);
    
    // Determine the active runway from the scenario
    let activeRunway = null;
    let runwayHeading = null;
    let runwaySuffix = ''; // For L/R/C designations
    
    // Convert position info to lowercase for case-insensitive matching
    const positionLower = positionInfo.toLowerCase();
    
    // First, check for explicit runway mentions in the position info
    const runwayMatch = positionInfo.match(/runway\s+(\d+)([LRC])?/i);
    if (runwayMatch) {
        activeRunway = runwayMatch[1];
        runwaySuffix = runwayMatch[2] || '';
        // Convert runway number to heading (runway 36 = 360 degrees, runway 9 = 90 degrees)
        runwayHeading = parseInt(activeRunway, 10) * 10;
        if (runwayHeading === 0) runwayHeading = 360; // Convert runway 0 to 360 degrees
    }
    
    // If no runway found in position, check if there's a weather info element with runway information
    if (!activeRunway) {
        const weatherInfo = document.getElementById('weather-info');
        if (weatherInfo) {
            const weatherText = weatherInfo.textContent;
            // Look for runway information in ATIS (e.g., "Landing and departing runway 17L")
            const atisRunwayMatch = weatherText.match(/runway\s+(\d+)([LRC])?/i);
            if (atisRunwayMatch) {
                activeRunway = atisRunwayMatch[1];
                runwaySuffix = atisRunwayMatch[2] || '';
                // Convert runway number to heading
                runwayHeading = parseInt(activeRunway, 10) * 10;
                if (runwayHeading === 0) runwayHeading = 360;
            }
        }
    }
    
    // Check for runway mentions in the position info without the word "runway"
    // This handles cases like "Holding short RWY 14"
    if (!activeRunway) {
        const rwyMatch = positionLower.match(/\bRWY\s+(\d+)([LRC])?/i);
        if (rwyMatch) {
            activeRunway = rwyMatch[1];
            runwaySuffix = rwyMatch[2] || '';
            // Convert runway number to heading
            runwayHeading = parseInt(activeRunway, 10) * 10;
            if (runwayHeading === 0) runwayHeading = 360;
        }
    }
    
    // Calculate the rotation needed for the entire airport diagram
    // The entire airport (runways, taxiway, ramp) will rotate as a single unit
    
    // Default rotation (no rotation)
    let airportRotation = 0;
    
    if (runwayHeading) {
        // For proper orientation:
        // - Runway 36 (360°) should point to the top (North, 0°)
        // - Runway 09 (90°) should point to the right (East, 90°)
        // - Runway 18 (180°) should point to the bottom (South, 180°)
        // - Runway 27 (270°) should point to the left (West, 270°)
        
        // In our default diagram, the runway with label "33" is at 330° (NW)
        // We need to rotate the entire diagram so that the runway with the scenario-mentioned
        // runway number is positioned correctly relative to compass orientation
        
        // Calculate rotation: 
        // If runway is 33, no rotation needed (0°)
        // For any other runway X, we need to rotate so that X is positioned at X*10 degrees
        
        // Formula: runway heading - 330° (the default heading of the "33" runway)
        airportRotation = (runwayHeading - 330) % 360;
        
        // Normalize to -180 to 180 range for easier visualization
        if (airportRotation > 180) {
            airportRotation -= 360;
        }
    }
    
    // Determine the opposite runway number (the other end of the runway)
    // For example, if runway is 09, the opposite is 27
    // If runway is 36, the opposite is 18
    let oppositeRunway = null;
    let oppositeSuffix = '';
    
    if (activeRunway) {
        // Calculate the opposite runway number
        oppositeRunway = (Math.floor(((parseInt(activeRunway, 10) * 10 + 180) % 360) / 10) || 36).toString().padStart(2, '0');
        
        // Handle the opposite runway suffix (L becomes R, R becomes L, C stays C)
        // Only if the original runway had a suffix
        if (runwaySuffix === 'L') {
            oppositeSuffix = 'R';
        } else if (runwaySuffix === 'R') {
            oppositeSuffix = 'L';
        } else if (runwaySuffix === 'C') {
            oppositeSuffix = 'C';
        }
    }
    
    // Define key locations in the airport for positioning
    // The airport elements will be centered in the middle 60% of the SVG (20% margin on top and bottom)
    // For a 100x100 viewBox, this means coordinates from 20 to 80 vertically
    const airportLocations = {
        runway: { x: 50, y: 50 },
        taxiway: { x: 50, y: 62 },
        ramp: { x: 42, y: 68 },
        holdingShort: { x: 50, y: 58 },
        approaching: {
            north: { x: 50, y: 10, rotation: 0 },
            south: { x: 50, y: 90, rotation: 180 },
            east: { x: 90, y: 50, rotation: 270 },
            west: { x: 10, y: 50, rotation: 90 }
        },
        departing: {
            north: { x: 50, y: 20, rotation: 0 },
            south: { x: 50, y: 80, rotation: 180 },
            east: { x: 80, y: 50, rotation: 90 },
            west: { x: 20, y: 50, rotation: 270 }
        },
        pattern: {
            downwind: { x: 65, y: 35, rotation: 225 },
            base: { x: 65, y: 65, rotation: 315 },
            final: { x: 35, y: 65, rotation: 45 },
            crosswind: { x: 35, y: 35, rotation: 135 },
            upwind: { x: 35, y: 50, rotation: 45 }
        },
        away: [
            { x: 25, y: 25, rotation: 135 },
            { x: 75, y: 25, rotation: 225 },
            { x: 75, y: 75, rotation: 315 },
            { x: 25, y: 75, rotation: 45 }
        ]
    };
    
    // Update the flight information panel with the aircraft position
    if (aircraftPosition.valid && aircraftPosition.label) {
        // Find the position-info element in the Flight Information panel
        const positionInfo = document.getElementById('position-info');
        if (positionInfo) {
            // Update the position text
            positionInfo.textContent = aircraftPosition.label;
            positionInfo.style.display = 'block';
            
            // Make sure the position container is visible
            const positionContainer = document.getElementById('position-container');
            if (positionContainer) {
                positionContainer.style.display = 'block';
            }
        }
    }
    
    // Create a container with proper padding
    let diagramHTML = `
        <div style="width:100%; height:100%; background-color:${bgColor}; position:relative; border-radius:0.5rem; overflow:hidden;">
            <!-- North indicator -->
            <div style="position:absolute; top:15px; left:15px; color:${textColor}; border:1px solid ${textColor}; width:24px; height:24px; border-radius:50%; text-align:center; line-height:22px; z-index:20;">
                N
            </div>
            
            <!-- SVG container for the entire diagram -->
            <svg id="airport-svg" width="100%" height="100%" viewBox="0 0 100 100" style="position:absolute; top:0; left:0; width:100%; height:100%;">
                <!-- Rotatable airport elements group - occupying the middle 60% of the SVG -->
                <g id="airport-elements" transform="rotate(${airportRotation}, 50, 50)">
                    <!-- Primary runway (main runway) - sized to occupy approximately 60% of vertical space, but thinner -->
                    <rect x="20" y="47.5" width="60" height="5" transform="rotate(45, 50, 50)" fill="${runwayColor}" />
                    
                    ${isTowered ? 
                    `<!-- Secondary runway (towered) - perpendicular to the main runway -->
                    <rect x="30" y="48" width="40" height="4" fill="${runwayColor}" />` : ''}
                    
                    <!-- Taxiway positioned to intersect with the main runway -->
                    <rect x="20" y="60" width="60" height="4" transform="rotate(-45, 50, 50)" fill="${taxiwayColor}" />
                    
                    <!-- Ramp area on the left side of the taxiway -->
                    <rect x="35" y="65" width="14" height="8" transform="rotate(-45, 42, 68)" fill="${rampColor}" rx="1" ry="1" />
                    
                    <!-- Runway heading labels with counter-rotation to keep them upright -->
                    <g transform="rotate(-${airportRotation}, 30, 30)">
                        <text x="30" y="30" fill="${textColor}" font-size="4" text-anchor="middle" dominant-baseline="middle" font-weight="bold">
                            ${activeRunway || '33'}${runwaySuffix}
                        </text>
                    </g>
                    
                    <g transform="rotate(-${airportRotation}, 70, 70)">
                        <text x="70" y="70" fill="${textColor}" font-size="4" text-anchor="middle" dominant-baseline="middle" font-weight="bold">
                            ${oppositeRunway || '15'}${oppositeSuffix}
                        </text>
                    </g>
                    
                    <!-- Aircraft on ground or in pattern (part of the rotatable airport) -->
                    ${aircraftPosition.valid && aircraftPosition.isOnGround ? `
                    <g class="aircraft-icon" transform="translate(${aircraftPosition.x}, ${aircraftPosition.y}) rotate(${aircraftPosition.rotation - airportRotation})">
                        <polygon points="0,-4 -3,4 0,2 3,4" fill="${aircraftColor}" stroke="black" stroke-width="0.5" />
                    </g>
                    ` : ''}
                </g>
                
                <!-- Aircraft approaching or departing (outside the rotatable airport) -->
                ${aircraftPosition.valid && !aircraftPosition.isOnGround ? `
                <g class="aircraft-icon" transform="translate(${aircraftPosition.x}, ${aircraftPosition.y}) rotate(${aircraftPosition.rotation})">
                    <polygon points="0,-4 -3,4 0,2 3,4" fill="${aircraftColor}" stroke="black" stroke-width="0.5" />
                </g>
                ` : ''}
            </svg>
        </div>
    `;
    
    // Set the HTML content of the container
    container.innerHTML = diagramHTML;
};

/**
 * Parse aircraft position information to determine location on the airport diagram
 * @param {string} positionInfo - The position information from the scenario
 * @returns {object} - Position data for rendering on the diagram
 */
function parseAircraftPosition(positionInfo) {
    // Default result (invalid position)
    let result = {
        valid: false,
        x: 0,
        y: 0,
        rotation: 0,
        label: '',
        isOnGround: false
    };
    
    // If no position info provided, return invalid result
    if (!positionInfo) {
        return result;
    }
    
    // Convert to lowercase for case-insensitive matching
    const positionLower = positionInfo.toLowerCase();
    
    // Check for direction information
    let directionRotation = null;
    
    // Check for specific direction keywords and set rotation accordingly
    if (positionLower.includes('facing north') || positionLower.includes('heading north')) {
        directionRotation = 0; // North = 0 degrees
    } else if (positionLower.includes('facing east') || positionLower.includes('heading east')) {
        directionRotation = 90; // East = 90 degrees
    } else if (positionLower.includes('facing south') || positionLower.includes('heading south')) {
        directionRotation = 180; // South = 180 degrees
    } else if (positionLower.includes('facing west') || positionLower.includes('heading west')) {
        directionRotation = 270; // West = 270 degrees
    } else if (positionLower.includes('facing northeast') || positionLower.includes('heading northeast')) {
        directionRotation = 45; // Northeast = 45 degrees
    } else if (positionLower.includes('facing southeast') || positionLower.includes('heading southeast')) {
        directionRotation = 135; // Southeast = 135 degrees
    } else if (positionLower.includes('facing southwest') || positionLower.includes('heading southwest')) {
        directionRotation = 225; // Southwest = 225 degrees
    } else if (positionLower.includes('facing northwest') || positionLower.includes('heading northwest')) {
        directionRotation = 315; // Northwest = 315 degrees
    }
    
    // Define key locations in the airport for positioning
    const airportLocations = {
        runway: { x: 50, y: 50 },
        taxiway: { x: 50, y: 62 },
        ramp: { x: 42, y: 68 },
        holdingShort: { x: 50, y: 58 },
        approaching: {
            north: { x: 50, y: 10, rotation: 0 },
            south: { x: 50, y: 90, rotation: 180 },
            east: { x: 90, y: 50, rotation: 270 },
            west: { x: 10, y: 50, rotation: 90 }
        },
        departing: {
            north: { x: 50, y: 20, rotation: 0 },
            south: { x: 50, y: 80, rotation: 180 },
            east: { x: 80, y: 50, rotation: 90 },
            west: { x: 20, y: 50, rotation: 270 }
        },
        pattern: {
            downwind: { x: 65, y: 35, rotation: 225 },
            base: { x: 65, y: 65, rotation: 315 },
            final: { x: 35, y: 65, rotation: 45 },
            crosswind: { x: 35, y: 35, rotation: 135 },
            upwind: { x: 35, y: 50, rotation: 45 }
        },
        away: [
            { x: 25, y: 25, rotation: 135 },
            { x: 75, y: 25, rotation: 225 },
            { x: 75, y: 75, rotation: 315 },
            { x: 25, y: 75, rotation: 45 }
        ]
    };
    
    // Extract runway number if mentioned
    const runwayMatch = positionLower.match(/runway\s+(\d+[LRC]?)/i) || positionLower.match(/\brwy\s+(\d+[LRC]?)/i);
    let runway = runwayMatch ? runwayMatch[1] : '';
    
    // Extract altitude if available
    let altitude = '';
    const altMatch = positionLower.match(/at\s+(\d+,?\d*)\s*feet/i);
    if (altMatch) {
        altitude = `, ${altMatch[1].replace(',', '')} ft`;
    }
    
    // Check for "on the ramp" or "at the ramp" position
    if (positionLower.includes('on the ramp') || positionLower.includes('at the ramp')) {
        const positionDescription = positionLower.includes('on the ramp') ? 'On the ramp' : 'At the ramp';
        
        result = {
            valid: true,
            x: airportLocations.ramp.x,
            y: airportLocations.ramp.y,
            rotation: directionRotation !== null ? directionRotation : 45,
            label: positionDescription,
            isOnGround: true
        };
    }
    // Check for "holding short" position
    else if (positionLower.includes('holding short')) {
        result = {
            valid: true,
            x: airportLocations.holdingShort.x,
            y: airportLocations.holdingShort.y,
            rotation: directionRotation !== null ? directionRotation : -45,
            label: runway ? `Holding short RWY ${runway}` : 'Holding short',
            isOnGround: true
        };
    }
    // Check for taxiway position
    else if (positionLower.includes('taxiway') || positionLower.includes('taxi')) {
        result = {
            valid: true,
            x: airportLocations.taxiway.x,
            y: airportLocations.taxiway.y,
            rotation: directionRotation !== null ? directionRotation : -45,
            label: 'On taxiway',
            isOnGround: true
        };
    }
    // Check for runway position
    else if (positionLower.includes('runway') || positionLower.match(/\brwy\b/i)) {
        // Determine if the aircraft is taking off, landing, or just on the runway
        let rotation = 45; // Default rotation for the main runway
        
        if (positionLower.includes('taking off') || positionLower.includes('takeoff')) {
            rotation = 45; // Aircraft is aligned with the runway for takeoff
        } else if (positionLower.includes('landing') || positionLower.includes('on approach')) {
            rotation = 225; // Aircraft is aligned with the runway for landing (opposite direction)
        }
        
        result = {
            valid: true,
            x: airportLocations.runway.x,
            y: airportLocations.runway.y,
            rotation: directionRotation !== null ? directionRotation : rotation,
            label: runway ? `On RWY ${runway}` : 'On Runway',
            isOnGround: true
        };
    }
    // Check for approaching from a specific direction
    else if (positionLower.includes('approach') || positionLower.includes('arriving')) {
        let direction = 'north'; // Default direction
        let position = airportLocations.approaching.north;
        
        if (positionLower.includes('north')) {
            direction = 'north';
            position = airportLocations.approaching.north;
        } else if (positionLower.includes('south')) {
            direction = 'south';
            position = airportLocations.approaching.south;
        } else if (positionLower.includes('east')) {
            direction = 'east';
            position = airportLocations.approaching.east;
        } else if (positionLower.includes('west')) {
            direction = 'west';
            position = airportLocations.approaching.west;
        }
        
        result = {
            valid: true,
            x: position.x,
            y: position.y,
            rotation: directionRotation !== null ? directionRotation : position.rotation,
            label: `Approaching from ${direction}${runway ? ` RWY ${runway}` : ''}${altitude}`,
            isOnGround: false
        };
    }
    // Check for departing in a specific direction
    else if (positionLower.includes('depart') || positionLower.includes('departure')) {
        let direction = 'north'; // Default direction
        let position = airportLocations.departing.north;
        
        if (positionLower.includes('north')) {
            direction = 'north';
            position = airportLocations.departing.north;
        } else if (positionLower.includes('south')) {
            direction = 'south';
            position = airportLocations.departing.south;
        } else if (positionLower.includes('east')) {
            direction = 'east';
            position = airportLocations.departing.east;
        } else if (positionLower.includes('west')) {
            direction = 'west';
            position = airportLocations.departing.west;
        }
        
        result = {
            valid: true,
            x: position.x,
            y: position.y,
            rotation: directionRotation !== null ? directionRotation : position.rotation,
            label: `Departing to ${direction}${runway ? ` RWY ${runway}` : ''}${altitude}`,
            isOnGround: false
        };
    }
    // Check for pattern positions
    else if (positionLower.includes('downwind') || positionLower.includes('base') || 
             positionLower.includes('final') || positionLower.includes('crosswind') || 
             positionLower.includes('upwind')) {
        
        let patternLeg = '';
        let position = airportLocations.pattern.downwind; // Default position
        
        if (positionLower.includes('downwind')) {
            patternLeg = 'Downwind';
            position = airportLocations.pattern.downwind;
        } else if (positionLower.includes('base')) {
            patternLeg = 'Base';
            position = airportLocations.pattern.base;
        } else if (positionLower.includes('final')) {
            patternLeg = 'Final';
            position = airportLocations.pattern.final;
        } else if (positionLower.includes('crosswind')) {
            patternLeg = 'Crosswind';
            position = airportLocations.pattern.crosswind;
        } else if (positionLower.includes('upwind')) {
            patternLeg = 'Upwind';
            position = airportLocations.pattern.upwind;
        }
        
        result = {
            valid: true,
            x: position.x,
            y: position.y,
            rotation: directionRotation !== null ? directionRotation : position.rotation,
            label: `${patternLeg}${runway ? ` RWY ${runway}` : ''}${altitude}`,
            isOnGround: false
        };
    }
    // Check for exiting airspace
    else if (positionLower.includes('exit') || positionLower.includes('leaving')) {
        let direction = 'north'; // Default direction
        let position = airportLocations.approaching.north; // Reuse approaching positions for exiting
        
        if (positionLower.includes('north')) {
            direction = 'north';
            position = airportLocations.approaching.north;
        } else if (positionLower.includes('south')) {
            direction = 'south';
            position = airportLocations.approaching.south;
        } else if (positionLower.includes('east')) {
            direction = 'east';
            position = airportLocations.approaching.east;
        } else if (positionLower.includes('west')) {
            direction = 'west';
            position = airportLocations.approaching.west;
        }
        
        result = {
            valid: true,
            x: position.x,
            y: position.y,
            rotation: directionRotation !== null ? directionRotation : position.rotation,
            label: `Exiting to ${direction}${altitude}`,
            isOnGround: false
        };
    }
    // Default to a random "away" position for any other description
    else if (positionInfo.trim() !== '') {
        // Pick a random position from the away array
        const randomIndex = Math.floor(Math.random() * airportLocations.away.length);
        const position = airportLocations.away[randomIndex];
        
        result = {
            valid: true,
            x: position.x,
            y: position.y,
            rotation: directionRotation !== null ? directionRotation : position.rotation,
            label: positionInfo,
            isOnGround: false
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
