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
    // Parse the position information to determine aircraft location
    const aircraftPosition = parseAircraftPosition(positionInfo);
    
    // Set colors based on the current theme
    const isDarkMode = document.body.classList.contains('dark');
    const bgColor = isDarkMode ? '#262626' : '#F0F0F0';
    const textColor = isDarkMode ? '#E0E0E0' : '#333333';
    const runwayColor = isDarkMode ? '#505050' : '#333333';
    const taxiwayColor = isDarkMode ? '#364968' : '#6B8CCF';
    const rampColor = isDarkMode ? '#364968' : '#6B8CCF';
    const aircraftColor = isDarkMode ? '#E0E0E0' : '#D32F2F';
    
    // Extract runway information from position text if available
    let activeRunway = '';
    let runwaySuffix = '';
    
    const runwayMatch = positionInfo ? positionInfo.match(/runway\s+(\d+)([LRC]?)/i) : null;
    if (runwayMatch) {
        activeRunway = runwayMatch[1];
        runwaySuffix = runwayMatch[2];
    }
    
    // Calculate opposite runway
    let oppositeRunway = '';
    let oppositeSuffix = '';
    
    if (activeRunway) {
        // Convert runway number to integer
        let runwayNum = parseInt(activeRunway, 10);
        
        // Calculate opposite runway (180 degrees opposite)
        oppositeRunway = (runwayNum <= 18) ? (runwayNum + 18).toString() : (runwayNum - 18).toString();
        
        // Ensure it's formatted as a two-digit number
        if (oppositeRunway.length === 1) {
            oppositeRunway = '0' + oppositeRunway;
        }
        
        // Handle the suffix (L becomes R, R becomes L, C stays C)
        if (runwaySuffix === 'L') {
            oppositeSuffix = 'R';
        } else if (runwaySuffix === 'R') {
            oppositeSuffix = 'L';
        } else if (runwaySuffix === 'C') {
            oppositeSuffix = 'C';
        }
    }
    
    // Calculate rotation based on runway number
    let airportRotation = 0;
    if (activeRunway) {
        // Convert runway number to integer
        const runwayNum = parseInt(activeRunway, 10);
        
        // Calculate rotation: the current orientation is correct for runway 36
        // For other runways, rotate by (36 - runway_number) * 10 degrees
        airportRotation = (runwayNum - 36) * 10;
        
        // Normalize to keep within 0-360 range
        if (airportRotation < 0) {
            airportRotation += 360;
        }
        if (airportRotation >= 360) {
            airportRotation -= 360;
        }
    }
    
    // Define key locations in the airport for positioning
    const airportLocations = {
        // Core airport elements - these will be rotated with the airport
        runway: { x: 50, y: 50 },
        taxiway: { x: 50, y: 62 },
        ramp: { x: 42, y: 68 },
        holdingShort: { x: 50, y: 58 },
        
        // Fixed positions near the border of the SVG - these won't rotate with the airport
        fixedPositions: {
            north: { x: 50, y: 10 },
            northeast: { x: 80, y: 10 },
            east: { x: 90, y: 50 },
            southeast: { x: 80, y: 90 },
            south: { x: 50, y: 90 },
            southwest: { x: 20, y: 90 },
            west: { x: 10, y: 50 },
            northwest: { x: 20, y: 10 }
        },
        
        // Aircraft positions relative to the airport - these will be rotated with the airport when on the ground
        // For aircraft in the air, their absolute positions will be maintained
        approaching: {
            north: { x: 50, y: 10, rotation: 180 }, // Approaching from north, heading south
            south: { x: 50, y: 90, rotation: 0 },   // Approaching from south, heading north
            east: { x: 90, y: 50, rotation: 270 },  // Approaching from east, heading west
            west: { x: 10, y: 50, rotation: 90 }    // Approaching from west, heading east
        },
        departing: {
            north: { x: 50, y: 20, rotation: 0 },   // Departing to north, heading north
            south: { x: 50, y: 80, rotation: 180 }, // Departing to south, heading south
            east: { x: 80, y: 50, rotation: 90 },   // Departing to east, heading east
            west: { x: 20, y: 50, rotation: 270 }   // Departing to west, heading west
        },
        pattern: {
            downwind: { x: 65, y: 35, rotation: 0 },   // Parallel to runway, opposite direction
            base: { x: 65, y: 65, rotation: 90 },      // Perpendicular to downwind, turning to final
            final: { x: 35, y: 65, rotation: 180 },    // Aligned with runway for landing
            crosswind: { x: 35, y: 35, rotation: 270 }, // Perpendicular to upwind
            upwind: { x: 35, y: 50, rotation: 180 }    // Parallel to runway, same direction
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
            <div style="position:absolute; top:15px; left:15px; color:${textColor}; border:1px solid ${textColor}; width:24px; height:24px; border-radius:50%; text-align:center; line-height:22px; z-index:20; transform:rotate(-${airportRotation}deg);">
                N
            </div>
            
            <!-- SVG container for the entire diagram -->
            <svg id="airport-svg" width="100%" height="100%" viewBox="0 0 100 100" style="position:absolute; top:0; left:0; width:100%; height:100%;">
                <!-- Airport elements group - occupying the middle 60% of the SVG -->
                <g id="airport-elements" transform="rotate(${airportRotation}, 50, 50)">
                    <!-- Primary runway (main runway) - sized to occupy approximately 60% of vertical space, but thinner -->
                    <rect x="47.5" y="20" width="5" height="60" fill="${runwayColor}" />
                    
                    ${isTowered ? 
                    `<!-- Secondary runway (towered) - diagonal to the main runway -->
                    <rect x="20" y="47.5" width="60" height="5" transform="rotate(45, 50, 50)" fill="${runwayColor}" />` : ''}
                    
                    <!-- Taxiway positioned to intersect with the main runway -->
                    <rect x="42" y="25" width="4" height="55" fill="${taxiwayColor}" />
                    
                    <!-- Ramp area on the left side of the taxiway -->
                    <rect x="37" y="55" width="6" height="14" fill="${rampColor}" rx="1" ry="1" />
                    
                    <!-- Runway heading labels perpendicular to runway direction and facing outward -->
                    <!-- First runway end (bottom) - perpendicular to runway and facing outward -->
                    <g transform="translate(50, 80) rotate(${airportRotation}, 0, 0)">
                        <text x="0" y="0" fill="${textColor}" font-size="4" text-anchor="middle" dominant-baseline="middle" font-weight="bold" transform="rotate(-${airportRotation})">
                            ${activeRunway || '36'}${runwaySuffix}
                        </text>
                    </g>
                    
                    <!-- Second runway end (top) - perpendicular to runway and facing outward -->
                    <g transform="translate(50, 20) rotate(${airportRotation + 180}, 0, 0)">
                        <text x="0" y="0" fill="${textColor}" font-size="4" text-anchor="middle" dominant-baseline="middle" font-weight="bold" transform="rotate(-${airportRotation})">
                            ${oppositeRunway || '18'}${oppositeSuffix}
                        </text>
                    </g>
                </g>
                
                <!-- Aircraft is rendered separately to ensure proper positioning -->
                ${aircraftPosition.valid ? `
                <g class="aircraft-icon" transform="translate(${aircraftPosition.x}, ${aircraftPosition.y}) rotate(${aircraftPosition.isOnGround ? aircraftPosition.rotation + airportRotation : aircraftPosition.rotation})">
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
        // Core airport elements - these will be rotated with the airport
        runway: { x: 50, y: 50 },
        taxiway: { x: 50, y: 62 },
        ramp: { x: 42, y: 68 },
        holdingShort: { x: 50, y: 58 },
        
        // Fixed positions near the border of the SVG - these won't rotate with the airport
        fixedPositions: {
            north: { x: 50, y: 10 },
            northeast: { x: 80, y: 10 },
            east: { x: 90, y: 50 },
            southeast: { x: 80, y: 90 },
            south: { x: 50, y: 90 },
            southwest: { x: 20, y: 90 },
            west: { x: 10, y: 50 },
            northwest: { x: 20, y: 10 }
        },
        
        // Aircraft positions relative to the airport - these will be rotated with the airport when on the ground
        // For aircraft in the air, their absolute positions will be maintained
        approaching: {
            north: { x: 50, y: 10, rotation: 180 }, // Approaching from north, heading south
            south: { x: 50, y: 90, rotation: 0 },   // Approaching from south, heading north
            east: { x: 90, y: 50, rotation: 270 },  // Approaching from east, heading west
            west: { x: 10, y: 50, rotation: 90 }    // Approaching from west, heading east
        },
        departing: {
            north: { x: 50, y: 20, rotation: 0 },   // Departing to north, heading north
            south: { x: 50, y: 80, rotation: 180 }, // Departing to south, heading south
            east: { x: 80, y: 50, rotation: 90 },   // Departing to east, heading east
            west: { x: 20, y: 50, rotation: 270 }   // Departing to west, heading west
        },
        pattern: {
            downwind: { x: 65, y: 35, rotation: 0 },   // Parallel to runway, opposite direction
            base: { x: 65, y: 65, rotation: 90 },      // Perpendicular to downwind, turning to final
            final: { x: 35, y: 65, rotation: 180 },    // Aligned with runway for landing
            crosswind: { x: 35, y: 35, rotation: 270 }, // Perpendicular to upwind
            upwind: { x: 35, y: 50, rotation: 180 }    // Parallel to runway, same direction
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
    
    // Check for directional position relative to airport (e.g., "north of", "west of")
    const directionalMatch = positionLower.match(/(north|south|east|west|northeast|northwest|southeast|southwest)\s+of/i);
    if (directionalMatch) {
        const direction = directionalMatch[1].toLowerCase();
        const position = airportLocations.fixedPositions[direction];
        
        // Determine rotation based on keywords
        let rotation = 0;
        if (positionLower.includes('inbound') || positionLower.includes('approaching')) {
            // Inbound aircraft face toward the airport
            switch (direction) {
                case 'north': rotation = 180; break;     // North of airport, heading south
                case 'northeast': rotation = 225; break; // Northeast of airport, heading southwest
                case 'east': rotation = 270; break;      // East of airport, heading west
                case 'southeast': rotation = 315; break; // Southeast of airport, heading northwest
                case 'south': rotation = 0; break;       // South of airport, heading north
                case 'southwest': rotation = 45; break;  // Southwest of airport, heading northeast
                case 'west': rotation = 90; break;       // West of airport, heading east
                case 'northwest': rotation = 135; break; // Northwest of airport, heading southeast
            }
        } else if (positionLower.includes('outbound') || positionLower.includes('departing')) {
            // Outbound aircraft face away from the airport
            switch (direction) {
                case 'north': rotation = 0; break;       // North of airport, heading north
                case 'northeast': rotation = 45; break;  // Northeast of airport, heading northeast
                case 'east': rotation = 90; break;       // East of airport, heading east
                case 'southeast': rotation = 135; break; // Southeast of airport, heading southeast
                case 'south': rotation = 180; break;     // South of airport, heading south
                case 'southwest': rotation = 225; break; // Southwest of airport, heading southwest
                case 'west': rotation = 270; break;      // West of airport, heading west
                case 'northwest': rotation = 315; break; // Northwest of airport, heading northwest
            }
        } else {
            // Default rotation based on direction if no inbound/outbound specified
            rotation = directionRotation !== null ? directionRotation : 0;
        }
        
        result = {
            valid: true,
            x: position.x,
            y: position.y,
            rotation: rotation,
            label: positionInfo,
            isOnGround: false
        };
    }
    // Check for "on the ramp" or "at the ramp" position
    else if (positionLower.includes('on the ramp') || positionLower.includes('at the ramp') || 
             positionLower.includes('terminal') || positionLower.includes('apron')) {
        const positionDescription = positionLower.includes('terminal') ? 'At terminal' : 
                                   positionLower.includes('apron') ? 'On apron' : 
                                   positionLower.includes('on the ramp') ? 'On the ramp' : 'At the ramp';
        
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
        let rotation = 0; // Default rotation aligned with runway heading north
        
        if (positionLower.includes('taking off') || positionLower.includes('takeoff')) {
            rotation = 0; // Aircraft is aligned with the runway for takeoff (heading north by default)
        } else if (positionLower.includes('landing') || positionLower.includes('on approach')) {
            rotation = 180; // Aircraft is aligned with the runway for landing (heading south by default)
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
    else if (positionLower.includes('approach') || positionLower.includes('arriving') || positionLower.includes('inbound')) {
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
    else if (positionLower.includes('depart') || positionLower.includes('departure') || positionLower.includes('outbound')) {
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
