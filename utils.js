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
    // Convert position to lowercase for case-insensitive matching
    const positionLower = positionInfo.toLowerCase();
    
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
    
    const runwayMatch = positionLower.match(/runway\s+(\d+)([LRC]?)/i) || positionLower.match(/\brwy\s+(\d+)([LRC]?)/i);
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
        taxiway: { x: 42, y: 62 },
        ramp: { x: 42, y: 68 },
        holdingShort: { x: 42, y: 58 }, // Default holding short position
        runwayEnds: {
            north: { x: 50, y: 20 }, // Top end of runway (lower numbers like 18)
            south: { x: 50, y: 80 }  // Bottom end of runway (higher numbers like 36)
        },
        
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
            north: { x: 50, y: 3, rotation: 180 }, // Approaching from north, heading south
            south: { x: 50, y: 97, rotation: 0 },   // Approaching from south, heading north
            east: { x: 97, y: 50, rotation: 270 },  // Approaching from east, heading west
            west: { x: 3, y: 50, rotation: 90 }    // Approaching from west, heading east
        },
        departing: {
            north: { x: 50, y: 3, rotation: 0 },   // Departing to north, heading north
            south: { x: 50, y: 97, rotation: 180 }, // Departing to south, heading south
            east: { x: 97, y: 50, rotation: 90 },   // Departing to east, heading east
            west: { x: 3, y: 50, rotation: 270 }   // Departing to west, heading west
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
            <!-- North indicator - fixed, never rotates -->
            <div style="position:absolute; top:15px; left:15px; color:${textColor}; border:1px solid ${textColor}; width:24px; height:24px; border-radius:50%; text-align:center; line-height:22px; z-index:20;">
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
                    
                    <!-- Aircraft on ground is rendered inside the airport-elements group to rotate with the airport -->
                    ${aircraftPosition.valid && aircraftPosition.isOnGround ? `
                    <g class="aircraft-icon" transform="translate(${aircraftPosition.x}, ${aircraftPosition.y}) rotate(${aircraftPosition.rotation})">
                        <polygon points="0,-4 -3,4 0,2 3,4" fill="${aircraftColor}" stroke="black" stroke-width="0.5" />
                    </g>
                    ` : ''}
                </g>
                
                <!-- Aircraft in the air is rendered separately to maintain absolute positioning -->
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
    if (!positionInfo || positionInfo.trim() === '') {
        return result;
    }
    
    // Convert to lowercase for case-insensitive matching
    const positionLower = positionInfo.toLowerCase();
    
    // Define key locations in the airport for positioning
    const airportLocations = {
        // Core airport elements - these will be rotated with the airport
        runway: { x: 50, y: 50 },
        taxiway: { x: 42, y: 62 },
        ramp: { x: 42, y: 68 },
        holdingShort: { x: 42, y: 58 }, // Default holding short position
        runwayEnds: {
            north: { x: 50, y: 20 }, // Top end of runway (lower numbers like 18)
            south: { x: 50, y: 80 }  // Bottom end of runway (higher numbers like 36)
        },
        
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
            north: { x: 50, y: 3, rotation: 180 }, // Approaching from north, heading south
            south: { x: 50, y: 97, rotation: 0 },   // Approaching from south, heading north
            east: { x: 97, y: 50, rotation: 270 },  // Approaching from east, heading west
            west: { x: 3, y: 50, rotation: 90 }    // Approaching from west, heading east
        },
        departing: {
            north: { x: 50, y: 3, rotation: 0 },   // Departing to north, heading north
            south: { x: 50, y: 97, rotation: 180 }, // Departing to south, heading south
            east: { x: 97, y: 50, rotation: 90 },   // Departing to east, heading east
            west: { x: 3, y: 50, rotation: 270 }   // Departing to west, heading west
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
    
    // Helper functions
    
    /**
     * Creates a valid position result object
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} rotation - Aircraft rotation
     * @param {string} label - Position label
     * @param {boolean} isOnGround - Whether aircraft is on the ground
     * @returns {object} - Position result object
     */
    const createPositionResult = (x, y, rotation, label, isOnGround) => {
        return {
            valid: true,
            x,
            y,
            rotation,
            label,
            isOnGround
        };
    };
    
    /**
     * Detects direction from position text
     * @param {string} text - Position text
     * @returns {string|null} - Direction or null if not found
     */
    const detectDirection = (text) => {
        const directions = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
        for (const dir of directions) {
            if (text.includes(dir)) {
                return dir;
            }
        }
        return null;
    };
    
    /**
     * Gets rotation based on explicit direction in text
     * @param {string} text - Position text
     * @returns {number|null} - Rotation in degrees or null if not found
     */
    const getExplicitRotation = (text) => {
        const rotationMap = {
            'north': 0,
            'northeast': 45,
            'east': 90,
            'southeast': 135,
            'south': 180,
            'southwest': 225,
            'west': 270,
            'northwest': 315
        };
        
        // Check for explicit direction phrases with prefixes like "facing" or "heading"
        for (const [dir, rot] of Object.entries(rotationMap)) {
            if (text.includes(`facing ${dir}`) || text.includes(`heading ${dir}`)) {
                return rot;
            }
        }
        
        // Also check for standalone directional keywords
        const words = text.toLowerCase().split(/\s+/);
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            if (word === 'heading' || word === 'facing') {
                // Check if the next word is a direction
                const nextWord = words[i + 1];
                if (nextWord && rotationMap[nextWord]) {
                    return rotationMap[nextWord];
                }
            }
        }
        
        return null;
    };
    
    /**
     * Gets inbound rotation based on direction
     * @param {string} direction - Direction from airport
     * @returns {number} - Rotation in degrees
     */
    const getInboundRotation = (direction) => {
        const rotationMap = {
            'north': 180,      // North of airport, heading south
            'northeast': 225,  // Northeast of airport, heading southwest
            'east': 270,       // East of airport, heading west
            'southeast': 315,  // Southeast of airport, heading northwest
            'south': 0,        // South of airport, heading north
            'southwest': 45,   // Southwest of airport, heading northeast
            'west': 90,        // West of airport, heading east
            'northwest': 135   // Northwest of airport, heading southeast
        };
        
        return rotationMap[direction] || 0;
    };
    
    /**
     * Gets outbound rotation based on direction
     * @param {string} direction - Direction from airport
     * @returns {number} - Rotation in degrees
     */
    const getOutboundRotation = (direction) => {
        const rotationMap = {
            'north': 0,        // North of airport, heading north
            'northeast': 45,   // Northeast of airport, heading northeast
            'east': 90,        // East of airport, heading east
            'southeast': 135,  // Southeast of airport, heading southeast
            'south': 180,      // South of airport, heading south
            'southwest': 225,  // Southwest of airport, heading southwest
            'west': 270,       // West of airport, heading west
            'northwest': 315   // Northwest of airport, heading northwest
        };
        
        return rotationMap[direction] || 0;
    };
    
    // Extract runway number if mentioned
    const runwayMatch = positionLower.match(/runway\s+(\d+)([LRC]?)/i) || positionLower.match(/\brwy\s+(\d+)([LRC]?)/i);
    const runway = runwayMatch ? runwayMatch[1] + (runwayMatch[2] || '') : '';
    
    // Extract altitude if available
    const altMatch = positionLower.match(/at\s+(\d+,?\d*)\s*feet/i);
    const altitude = altMatch ? `, ${altMatch[1].replace(',', '')} ft` : '';
    
    // Get explicit rotation from direction keywords - only for airborne aircraft
    const explicitRotation = getExplicitRotation(positionLower);
    
    // Check for directional position relative to airport (e.g., "north of", "west of")
    const directionalMatch = positionLower.match(/(north|south|east|west|northeast|northwest|southeast|southwest)\s+of/i);
    if (directionalMatch) {
        const direction = directionalMatch[1].toLowerCase();
        const position = airportLocations.fixedPositions[direction];
        
        // Determine rotation based on keywords
        let rotation = explicitRotation;
        
        if (rotation === null) {
            if (positionLower.includes('inbound') || positionLower.includes('approaching')) {
                rotation = getInboundRotation(direction);
            } else if (positionLower.includes('outbound') || positionLower.includes('departing')) {
                rotation = getOutboundRotation(direction);
            } else {
                rotation = 0; // Default rotation
            }
        }
        
        return createPositionResult(
            position.x,
            position.y,
            rotation,
            positionInfo,
            false // Not on ground
        );
    }
    
    // Check for ground positions
    
    // Check for ramp, terminal, or apron position
    if (positionLower.includes('ramp') || 
        positionLower.includes('terminal') || 
        positionLower.includes('apron') ||
        positionLower.includes('parked')) {
        
        let label = 'On the ramp';
        
        if (positionLower.includes('terminal')) {
            label = 'At terminal';
        } else if (positionLower.includes('apron')) {
            label = 'On apron';
        } else if (positionLower.includes('parked')) {
            label = 'Parked';
        }
        
        // For ground aircraft, use default rotation (0) unless explicitly overridden with "facing" keyword
        const facingMatch = positionLower.match(/facing\s+(north|south|east|west|northeast|northwest|southeast|southwest)/i);
        const groundRotation = facingMatch ? getExplicitRotation(`facing ${facingMatch[1]}`) : 0;
        
        return createPositionResult(
            airportLocations.ramp.x,
            airportLocations.ramp.y,
            groundRotation,
            label,
            true // On ground
        );
    }
    
    // Check for "holding short" position
    if (positionLower.includes('holding short')) {
        // Determine which runway end to position near based on the runway number
        let holdingY = airportLocations.holdingShort.y; // Default position
        
        if (runway) {
            // Extract the runway number without the L/R/C suffix
            const runwayNum = parseInt(runway.match(/\d+/)[0], 10);
            
            // If runway number is 1-18, position at the north end (lower numbers)
            // If runway number is 19-36, position at the south end (higher numbers)
            if (runwayNum <= 18) {
                holdingY = airportLocations.runwayEnds.north.y; // Exactly at the runway number position
            } else {
                holdingY = airportLocations.runwayEnds.south.y; // Exactly at the runway number position
            }
        }
        
        // For holding short positions, always face the runway (90 degrees) unless explicitly overridden with "facing" keyword
        const facingMatch = positionLower.match(/facing\s+(north|south|east|west|northeast|northwest|southeast|southwest)/i);
        const holdingRotation = facingMatch ? getExplicitRotation(`facing ${facingMatch[1]}`) : 90;
        
        return createPositionResult(
            42, // Use the exact taxiway x-coordinate from the SVG
            holdingY, // Y position matching the runway number
            holdingRotation, // Default to facing the runway (90 degrees), but allow explicit facing override
            runway ? `Holding short RWY ${runway}` : 'Holding short',
            true // On ground
        );
    }
    
    // Check for taxiway position
    if (positionLower.includes('taxiway') || positionLower.includes('taxi')) {
        // For taxiway positions, use default rotation (-45) unless explicitly overridden with "facing" keyword
        const facingMatch = positionLower.match(/facing\s+(north|south|east|west|northeast|northwest|southeast|southwest)/i);
        const taxiRotation = facingMatch ? getExplicitRotation(`facing ${facingMatch[1]}`) : -45;
        
        return createPositionResult(
            airportLocations.taxiway.x,
            airportLocations.taxiway.y,
            taxiRotation,
            'On taxiway',
            true // On ground
        );
    }
    
    // Check for runway position
    if (positionLower.includes('runway') || positionLower.match(/\brwy\b/i)) {
        // Determine if the aircraft is taking off, landing, or just on the runway
        let defaultRotation = 0; // Default rotation aligned with runway heading north
        
        if (positionLower.includes('taking off') || positionLower.includes('takeoff')) {
            defaultRotation = 0; // Aircraft is aligned with the runway for takeoff (heading north by default)
        } else if (positionLower.includes('landing') || positionLower.includes('on approach')) {
            defaultRotation = 180; // Aircraft is aligned with the runway for landing (heading south by default)
        }
        
        // For runway positions, use activity-based default rotation unless explicitly overridden with "facing" keyword
        const facingMatch = positionLower.match(/facing\s+(north|south|east|west|northeast|northwest|southeast|southwest)/i);
        const runwayRotation = facingMatch ? getExplicitRotation(`facing ${facingMatch[1]}`) : defaultRotation;
        
        return createPositionResult(
            airportLocations.runway.x,
            airportLocations.runway.y,
            runwayRotation,
            runway ? `On RWY ${runway}` : 'On Runway',
            true // On ground
        );
    }
    
    // Check for air positions
    
    // Check for approaching from a specific direction
    if (positionLower.includes('approach') || positionLower.includes('arriving') || positionLower.includes('inbound')) {
        const direction = detectDirection(positionLower) || 'north'; // Default direction
        const position = airportLocations.approaching[direction] || airportLocations.approaching.north;
        
        return createPositionResult(
            position.x,
            position.y,
            explicitRotation !== null ? explicitRotation : position.rotation,
            `Approaching from ${direction}${runway ? ` RWY ${runway}` : ''}${altitude}`,
            false // Not on ground
        );
    }
    
    // Check for departing in a specific direction
    if (positionLower.includes('depart') || positionLower.includes('departure') || positionLower.includes('outbound')) {
        const direction = detectDirection(positionLower) || 'north'; // Default direction
        const position = airportLocations.departing[direction] || airportLocations.departing.north;
        
        return createPositionResult(
            position.x,
            position.y,
            explicitRotation !== null ? explicitRotation : position.rotation,
            `Departing to ${direction}${runway ? ` RWY ${runway}` : ''}${altitude}`,
            false // Not on ground
        );
    }
    
    // Check for pattern positions
    if (positionLower.includes('downwind') || positionLower.includes('base') || 
        positionLower.includes('final') || positionLower.includes('crosswind') || 
        positionLower.includes('upwind')) {
        
        let patternLeg = 'Downwind'; // Default pattern leg
        let position = airportLocations.pattern.downwind; // Default position
        
        // Find which pattern leg is mentioned
        const patternLegs = [
            { name: 'downwind', key: 'downwind' },
            { name: 'base', key: 'base' },
            { name: 'final', key: 'final' },
            { name: 'crosswind', key: 'crosswind' },
            { name: 'upwind', key: 'upwind' }
        ];
        
        for (const leg of patternLegs) {
            if (positionLower.includes(leg.name)) {
                patternLeg = leg.name.charAt(0).toUpperCase() + leg.name.slice(1); // Capitalize
                position = airportLocations.pattern[leg.key];
                break;
            }
        }
        
        return createPositionResult(
            position.x,
            position.y,
            explicitRotation !== null ? explicitRotation : position.rotation,
            `${patternLeg}${runway ? ` RWY ${runway}` : ''}${altitude}`,
            false // Not on ground
        );
    }
    
    // Check for exiting airspace
    if (positionLower.includes('exit') || positionLower.includes('leaving')) {
        const direction = detectDirection(positionLower) || 'north'; // Default direction
        const position = airportLocations.approaching[direction] || airportLocations.approaching.north;
        
        return createPositionResult(
            position.x,
            position.y,
            explicitRotation !== null ? explicitRotation : position.rotation,
            `Exiting to ${direction}${altitude}`,
            false // Not on ground
        );
    }
    
    // Default to a random "away" position for any other description
    if (positionInfo.trim() !== '') {
        // Pick a random position from the away array
        const randomIndex = Math.floor(Math.random() * airportLocations.away.length);
        const position = airportLocations.away[randomIndex];
        
        return createPositionResult(
            position.x,
            position.y,
            explicitRotation !== null ? explicitRotation : position.rotation,
            positionInfo,
            false // Not on ground
        );
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
