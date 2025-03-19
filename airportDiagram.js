/**
 * Airport Diagram Module
 * Handles the generation of airport diagrams and aircraft positioning
 */

// Define cardinal directions and their corresponding angles
const DIRECTIONS = {
    north: { angle: 0, opposite: 'south' },
    northeast: { angle: 45, opposite: 'southwest' },
    east: { angle: 90, opposite: 'west' },
    southeast: { angle: 135, opposite: 'northwest' },
    south: { angle: 180, opposite: 'north' },
    southwest: { angle: 225, opposite: 'northeast' },
    west: { angle: 270, opposite: 'east' },
    northwest: { angle: 315, opposite: 'southeast' }
};

// Helper function to create a position object
const createPosition = (x, y, rotation = null) => {
    return rotation !== null ? { x, y, rotation } : { x, y };
};

// Define key locations in the airport for positioning
const airportLocations = {
    // Core airport elements - these will be rotated with the airport
    runway: createPosition(50, 50),
    taxiway: createPosition(42, 62),
    ramp: createPosition(42, 68),
    holdingShort: createPosition(42, 58), // Default holding short position
    runwayEnds: {
        north: createPosition(50, 20), // North end of runway (for runways 18-36, where 36 is at the north end)
        south: createPosition(50, 80)  // South end of runway (for runways 18-36, where 18 is at the south end)
    },
    
    // Border positions for aircraft outside the airport
    borderPositions: {
        north: createPosition(50, 1),
        northeast: createPosition(99, 1),
        east: createPosition(99, 50),
        southeast: createPosition(99, 99),
        south: createPosition(50, 99),
        southwest: createPosition(1, 99),
        west: createPosition(1, 50),
        northwest: createPosition(1, 1)
    },
    
    // Pattern positions
    pattern: {
        downwind: createPosition(65, 8, 0),   // Parallel to runway, opposite direction
        base: createPosition(65, 65, 90),      // Perpendicular to downwind, turning to final
        final: createPosition(35, 65, 180),    // Aligned with runway for landing
        crosswind: createPosition(35, 35, 270), // Perpendicular to upwind
        upwind: createPosition(35, 50, 180)    // Parallel to runway, same direction
    },
    
    // Random positions away from the airport
    away: [
        createPosition(25, 25, 135),
        createPosition(75, 25, 225),
        createPosition(75, 75, 315),
        createPosition(25, 75, 45)
    ]
};

// Generate approaching and departing positions based on border positions
airportLocations.approaching = {};
airportLocations.departing = {};

Object.entries(DIRECTIONS).forEach(([direction, { angle }]) => {
    // For approaching aircraft, use the border position but with rotation pointing inward (opposite of direction)
    airportLocations.approaching[direction] = {
        ...airportLocations.borderPositions[direction],
        rotation: (angle + 180) % 360
    };
    
    // For departing aircraft, use the border position with rotation pointing outward (same as direction)
    airportLocations.departing[direction] = {
        ...airportLocations.borderPositions[direction],
        rotation: angle
    };
});

/**
 * Detects direction from position text
 * @param {string} text - Position text
 * @returns {string|null} - Direction or null if not found
 */
const detectDirection = (text) => {
    // First check for exact direction matches
    for (const dir of Object.keys(DIRECTIONS)) {
        if (text.includes(dir)) {
            return dir;
        }
    }
    
    // Then check for directional terms with "bound" suffix
    const boundDirections = {};
    Object.keys(DIRECTIONS).forEach(dir => {
        boundDirections[`${dir}bound`] = dir;
        boundDirections[`${dir} bound`] = dir;
    });
    
    for (const [bound, dir] of Object.entries(boundDirections)) {
        if (text.includes(bound)) {
            return dir;
        }
    }
    
    return null;
};

/**
 * Extracts the runway number from a position text
 * @param {string} text - Position text
 * @returns {string|null} - Runway number or null if not found
 */
const extractRunwayNumber = (text) => {
    const textLower = text.toLowerCase();
    const runwayMatch = textLower.match(/runway\s+(\d+)([LRC]?)/i) || textLower.match(/\brwy\s+(\d+)([LRC]?)/i);
    return runwayMatch ? runwayMatch[1] + (runwayMatch[2] || '') : null;
};

/**
 * Gets rotation based on explicit direction in text
 * @param {string} text - Position text
 * @returns {number|null} - Rotation in degrees or null if not found
 */
const getExplicitRotation = (text) => {
    // Create bound rotation map from DIRECTIONS
    const boundRotationMap = {};
    Object.entries(DIRECTIONS).forEach(([dir, { angle }]) => {
        boundRotationMap[`${dir}bound`] = angle;
        boundRotationMap[`${dir} bound`] = angle;
    });
    
    // Check for bound directions first
    for (const [bound, rot] of Object.entries(boundRotationMap)) {
        if (text.includes(bound)) {
            return rot;
        }
    }
    
    // Check for explicit direction phrases with prefixes like "facing" or "heading"
    for (const [dir, { angle }] of Object.entries(DIRECTIONS)) {
        if (text.includes(`facing ${dir}`) || text.includes(`heading ${dir}`)) {
            return angle;
        }
    }
    
    // Also check for standalone directional keywords
    const words = text.toLowerCase().split(/\s+/);
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (word === 'heading' || word === 'facing') {
            // Check if the next word is a direction
            const nextWord = words[i + 1];
            if (nextWord && DIRECTIONS[nextWord]) {
                return DIRECTIONS[nextWord].angle;
            }
        }
    }
    
    return null;
};

/**
 * Gets inbound rotation based on direction
 * @param {string} direction - Direction (north, south, etc.)
 * @returns {number} - Rotation in degrees
 */
const getInboundRotation = (direction) => {
    if (!DIRECTIONS[direction]) return 0;
    return (DIRECTIONS[direction].angle + 180) % 360;
};

/**
 * Gets outbound rotation based on direction
 * @param {string} direction - Direction (north, south, etc.)
 * @returns {number} - Rotation in degrees
 */
const getOutboundRotation = (direction) => {
    if (!DIRECTIONS[direction]) return 0;
    return DIRECTIONS[direction].angle;
};

/**
 * Parses aircraft position information to determine coordinates and rotation
 * @param {string} positionInfo - Position information text
 * @returns {Object} - Position result with coordinates, rotation, and validity
 */
function parseAircraftPosition(positionInfo) {
    // Default invalid position
    if (!positionInfo || positionInfo.trim() === '') {
        return {
            valid: false,
            x: 0,
            y: 0,
            rotation: 0,
            isOnGround: false
        };
    }
    
    // Convert to lowercase for case-insensitive matching
    const positionLower = positionInfo.toLowerCase();
    
    // Helper function to create position result object
    const createPositionResult = (x, y, rotation, isOnGround) => {
        return {
            valid: true,
            x: x,
            y: y,
            rotation: rotation,
            isOnGround: isOnGround
        };
    };
    
    // Extract runway number if mentioned
    const runway = extractRunwayNumber(positionLower);
    
    // Extract altitude if available - no longer needed for label generation
    // but keeping the detection for possible future use
    const altMatch = positionLower.match(/at\s+(\d+,?\d*)\s*feet/i);
    
    // Get explicit rotation from direction keywords - only for airborne aircraft
    const explicitRotation = getExplicitRotation(positionLower);
    
    /**
     * Helper function to determine rotation based on context and runway
     * @param {string} direction - Cardinal direction
     * @param {string} context - Position context text
     * @param {string} runway - Runway number if available
     * @param {number|null} explicitRot - Explicit rotation if specified
     * @returns {number} - Calculated rotation in degrees
     */
    const determineRotation = (direction, context, runway, explicitRot) => {
        if (explicitRot !== null) return explicitRot;
        
        const isInbound = context.includes('inbound') || 
                          context.includes('approaching') || 
                          context.includes('landing') || 
                          context.includes('for landing');
                          
        const isOutbound = context.includes('outbound') || 
                           context.includes('departing') || 
                           context.includes('takeoff');
        
        // If runway is specified, use it to determine direction
        if (runway) {
            const runwayNum = parseInt(runway.replace(/[LRC]/g, ''), 10);
            if (isInbound) {
                // Aircraft approaching runway 27 should be heading west (270 degrees)
                return ((runwayNum * 10) + 180) % 360;
            } else if (isOutbound) {
                // Aircraft departing runway 27 should be heading west (270 degrees)
                return (runwayNum * 10) % 360;
            }
        }
        
        // If no runway specified, use the default rotation based on position
        if (isInbound) {
            return getInboundRotation(direction);
        } else if (isOutbound) {
            return getOutboundRotation(direction);
        }
        
        return 0; // Default rotation
    };
    
    /**
     * Helper function to handle directional positions
     * @param {string} direction - Cardinal direction
     * @returns {Object} - Position result object
     */
    const handleDirectionalPosition = (direction) => {
        // Get border position based on direction
        const borderPosition = airportLocations.borderPositions[direction] || { x: 50, y: 50 };
        
        // Calculate rotation based on context
        const rotation = determineRotation(direction, positionLower, runway, explicitRotation);
        
        return createPositionResult(
            borderPosition.x,
            borderPosition.y,
            rotation,
            false // Not on ground
        );
    };
    
    // Check for positions like "X miles [direction]"
    const milesDirectionMatch = positionLower.match(/(\d+)\s+miles?\s+(north|south|east|west|northeast|northwest|southeast|southwest)/i);
    if (milesDirectionMatch) {
        const direction = milesDirectionMatch[2].toLowerCase();
        return handleDirectionalPosition(direction);
    }
    
    // Check for directional position relative to airport (e.g., "north of", "west of")
    const directionalMatch = positionLower.match(/(north|south|east|west|northeast|northwest|southeast|southwest)\s+of/i);
    if (directionalMatch) {
        const direction = directionalMatch[1].toLowerCase();
        return handleDirectionalPosition(direction);
    }
    
    /**
     * Helper function to handle ground positions
     * @param {string} positionType - Type of ground position (ramp, taxiway, runway, etc.)
     * @returns {Object|null} - Position result object or null if not applicable
     */
    const handleGroundPosition = (positionType) => {
        // Extract facing direction if specified
        const facingMatch = positionLower.match(/facing\s+(north|south|east|west|northeast|northwest|southeast|southwest)/i);
        let defaultRotation = 0;
        let position;
        
        switch(positionType) {
            case 'ramp':
                position = airportLocations.ramp;
                break;
                
            case 'taxiway':
                position = airportLocations.taxiway;
                break;
                
            case 'runway':
                position = airportLocations.runway;
                // Determine if the aircraft is taking off, landing, or just on the runway
                if (positionLower.includes('taking off') || positionLower.includes('takeoff')) {
                    defaultRotation = 0; // Aircraft is aligned with the runway for takeoff (heading north by default)
                } else if (positionLower.includes('landing') || positionLower.includes('on approach')) {
                    defaultRotation = 180; // Aircraft is aligned with the runway for landing (heading south by default)
                }
                break;
                
            case 'holding short':
                // Always position the aircraft at the bottom where the relevant runway is labeled
                return createPositionResult(
                    42, // Use the exact taxiway x-coordinate from the SVG
                    80, // Bottom position where the runway number is labeled
                    facingMatch ? getExplicitRotation(`facing ${facingMatch[1]}`) : 90, // Default to facing the runway
                    true // On ground
                );
                
            default:
                return null;
        }
        
        // Apply explicit facing direction if specified, otherwise use default rotation
        const rotation = facingMatch ? getExplicitRotation(`facing ${facingMatch[1]}`) : defaultRotation;
        
        return createPositionResult(
            position.x,
            position.y,
            rotation,
            true // On ground
        );
    };
    
    // Check for ramp, terminal, or apron position
    if (positionLower.includes('ramp') || 
        positionLower.includes('terminal') || 
        positionLower.includes('apron') ||
        positionLower.includes('parked') ||
        positionLower.includes('general aviation') ||
        positionLower.includes('parking area')) {
        
        const result = handleGroundPosition('ramp');
        if (result) return result;
    }
    
    // Check for "holding short" position
    if (positionLower.includes('holding short')) {
        const result = handleGroundPosition('holding short');
        if (result) return result;
    }
    
    // Check for taxiway position
    if (positionLower.includes('taxiway') || positionLower.includes('taxi')) {
        const result = handleGroundPosition('taxiway');
        if (result) return result;
    }
    
    // Check for runway position
    if (positionLower.includes('runway') || positionLower.match(/\brwy\b/i)) {
        const result = handleGroundPosition('runway');
        if (result) return result;
    }
    
    // Check for air positions
    
    // Check for pattern positions
    for (const [pattern, position] of Object.entries(airportLocations.pattern)) {
        if (positionLower.includes(pattern)) {
            return createPositionResult(
                position.x,
                position.y,
                explicitRotation !== null ? explicitRotation : position.rotation,
                false // Not on ground
            );
        }
    }
    
    /**
     * Helper function to handle approach/departure positions
     * @param {boolean} isApproaching - Whether the aircraft is approaching (true) or departing (false)
     * @returns {Object|null} - Position result object or null if not applicable
     */
    const handleApproachDeparture = (isApproaching) => {
        // Determine direction based on context
        let direction;
        let defaultDirection = isApproaching ? 'south' : 'north'; // Default directions
        
        direction = detectDirection(positionLower) || defaultDirection;
        
        // If a runway number is specified, use it to determine the direction
        if (runway) {
            const runwayNum = parseInt(runway.replace(/[LRC]/g, ''), 10);
            // Calculate heading based on whether approaching or departing
            const heading = isApproaching 
                ? (runwayNum * 10 + 180) % 360  // Approach from opposite direction
                : (runwayNum * 10) % 360;       // Depart in runway direction
            
            // Map the heading to a cardinal direction
            direction = headingToDirection(heading);
        }
        
        // Get the appropriate position (approaching or departing)
        const positionMap = isApproaching ? airportLocations.approaching : airportLocations.departing;
        const position = positionMap[direction];
        
        if (position) {
            let rotation = explicitRotation;
            
            // If no explicit rotation and runway is specified, use runway heading
            if (rotation === null && runway) {
                const runwayNum = parseInt(runway.replace(/[LRC]/g, ''), 10);
                rotation = isApproaching 
                    ? ((runwayNum * 10) + 180) % 360  // Approach from opposite direction
                    : (runwayNum * 10) % 360;         // Depart in runway direction
            } else if (rotation === null) {
                // Use the default rotation for this direction
                rotation = position.rotation;
            }
            
            return createPositionResult(
                position.x,
                position.y,
                rotation,
                false // Not on ground
            );
        }
        
        return null;
    };
    
    // Check for approach positions
    if (positionLower.includes('approach') || positionLower.includes('final')) {
        const result = handleApproachDeparture(true); // true for approaching
        if (result) return result;
    }
    
    // Check for departure positions
    if (positionLower.includes('depart') || positionLower.includes('takeoff')) {
        const result = handleApproachDeparture(false); // false for departing
        if (result) return result;
    }
    
    // Default position - pick a random position away from the airport
    const randomIndex = Math.floor(Math.random() * airportLocations.away.length);
    const randomPosition = airportLocations.away[randomIndex];
    
    return createPositionResult(
        randomPosition.x,
        randomPosition.y,
        explicitRotation !== null ? explicitRotation : randomPosition.rotation,
        false // Not on ground
    );
}

/**
 * Converts a heading in degrees to the closest cardinal direction
 * @param {number} heading - Heading in degrees
 * @returns {string} - Cardinal direction
 */
function headingToDirection(heading) {
    // Normalize heading to 0-360 range
    heading = ((heading % 360) + 360) % 360;
    
    if (heading >= 337.5 || heading < 22.5) {
        return 'north';
    } else if (heading >= 22.5 && heading < 67.5) {
        return 'northeast';
    } else if (heading >= 67.5 && heading < 112.5) {
        return 'east';
    } else if (heading >= 112.5 && heading < 157.5) {
        return 'southeast';
    } else if (heading >= 157.5 && heading < 202.5) {
        return 'south';
    } else if (heading >= 202.5 && heading < 247.5) {
        return 'southwest';
    } else if (heading >= 247.5 && heading < 292.5) {
        return 'west';
    } else if (heading >= 292.5 && heading < 337.5) {
        return 'northwest';
    }
    
    return 'north'; // Default fallback
}

/**
 * Generate a simple airport diagram
 * @param {HTMLElement} container - Container element to render the diagram in
 * @param {boolean} isTowered - Whether the airport is towered
 * @param {string} positionInfo - Position information text
 * @param {string} weatherInfo - Weather information text
 */
function generateAirportDiagram(container, isTowered, positionInfo = '', weatherInfo = '') {
    // Convert position to lowercase for case-insensitive matching
    const positionLower = positionInfo.toLowerCase();
    const weatherLower = weatherInfo ? weatherInfo.toLowerCase() : '';
    
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
    
    // Extract runway information from position text or weather text if available
    let activeRunway = '';
    let runwaySuffix = '';
    
    // First try to extract from position text
    const positionRunwayMatch = positionLower.match(/runway\s+(\d+)([LRC]?)/i) || positionLower.match(/\brwy\s+(\d+)([LRC]?)/i);
    
    // If not found in position, try to extract from weather text (often contains active runway info)
    const weatherRunwayMatch = weatherLower.match(/runway\s+(\d+)([LRC]?)\s+in\s+use/i) || 
                              weatherLower.match(/\brwy\s+(\d+)([LRC]?)\s+in\s+use/i) ||
                              weatherLower.match(/landing\s+runway\s+(\d+)([LRC]?)/i) ||
                              weatherLower.match(/departing\s+runway\s+(\d+)([LRC]?)/i) ||
                              weatherLower.match(/expect\s+runway\s+(\d+)([LRC]?)/i);
    
    // Use the first match found
    const runwayMatch = positionRunwayMatch || weatherRunwayMatch;
    
    if (runwayMatch) {
        activeRunway = runwayMatch[1];
        runwaySuffix = runwayMatch[2];
    }
    
    // Calculate opposite runway
    let oppositeRunway = '';
    let oppositeSuffix = '';
    
    if (activeRunway) {
        // Convert runway number to integer
        const runwayNum = parseInt(activeRunway, 10);
        
        // Calculate opposite runway (difference from 36)
        if (runwayNum <= 18) {
            oppositeRunway = (runwayNum + 18).toString();
        } else {
            oppositeRunway = (runwayNum - 18).toString();
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
    
    // We no longer need to update the position text here
    // The original position text from the scenario is already set by ScenarioManager
    
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
                    ${runwaySuffix === 'L' || runwaySuffix === 'R' ? `
                    <!-- Parallel runways for L/R runways -->
                    <!-- Left runway -->
                    <rect x="42.5" y="20" width="5" height="60" fill="${runwayColor}" />
                    <!-- Right runway -->
                    <rect x="52.5" y="20" width="5" height="60" fill="${runwayColor}" />
                    
                    <!-- Left runway labels -->
                    <g transform="translate(45, 80) rotate(${airportRotation}, 0, 0)">
                        <text x="0" y="0" fill="${textColor}" font-size="4" text-anchor="middle" dominant-baseline="middle" font-weight="bold" transform="rotate(-${airportRotation})">
                            ${activeRunway || '36'}L
                        </text>
                    </g>
                    <g transform="translate(45, 20) rotate(${airportRotation + 180}, 0, 0)">
                        <text x="0" y="0" fill="${textColor}" font-size="4" text-anchor="middle" dominant-baseline="middle" font-weight="bold" transform="rotate(-${airportRotation})">
                            ${oppositeRunway || '18'}R
                        </text>
                    </g>
                    
                    <!-- Right runway labels -->
                    <g transform="translate(55, 80) rotate(${airportRotation}, 0, 0)">
                        <text x="0" y="0" fill="${textColor}" font-size="4" text-anchor="middle" dominant-baseline="middle" font-weight="bold" transform="rotate(-${airportRotation})">
                            ${activeRunway || '36'}R
                        </text>
                    </g>
                    <g transform="translate(55, 20) rotate(${airportRotation + 180}, 0, 0)">
                        <text x="0" y="0" fill="${textColor}" font-size="4" text-anchor="middle" dominant-baseline="middle" font-weight="bold" transform="rotate(-${airportRotation})">
                            ${oppositeRunway || '18'}L
                        </text>
                    </g>
                    ` : `
                    <!-- Single runway for non-L/R runways -->
                    <rect x="47.5" y="20" width="5" height="60" fill="${runwayColor}" />
                    
                    <!-- Runway labels -->
                    <g transform="translate(50, 80) rotate(${airportRotation}, 0, 0)">
                        <text x="0" y="0" fill="${textColor}" font-size="4" text-anchor="middle" dominant-baseline="middle" font-weight="bold" transform="rotate(-${airportRotation})">
                            ${activeRunway || '36'}${runwaySuffix}
                        </text>
                    </g>
                    <g transform="translate(50, 20) rotate(${airportRotation + 180}, 0, 0)">
                        <text x="0" y="0" fill="${textColor}" font-size="4" text-anchor="middle" dominant-baseline="middle" font-weight="bold" transform="rotate(-${airportRotation})">
                            ${oppositeRunway || '18'}${oppositeSuffix}
                        </text>
                    </g>
                    `}
                    
                    ${isTowered ? 
                    `<!-- Secondary runway (towered) - diagonal to the main runway -->
                    <rect x="20" y="47.5" width="60" height="5" transform="rotate(45, 50, 50)" fill="${runwayColor}" />` : ''}
                    
                    <!-- Taxiway positioned to intersect with the main runway -->
                    <rect x="42" y="25" width="4" height="55" fill="${taxiwayColor}" />
                    
                    <!-- Ramp area on the left side of the taxiway -->
                    <rect x="37" y="55" width="6" height="14" fill="${rampColor}" rx="1" ry="1" />
                    
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
    
    // Update the container with the diagram
    if (container) {
        container.innerHTML = diagramHTML;
    }
    
    return diagramHTML;
}

// Export the functions
window.parseAircraftPosition = parseAircraftPosition;
window.generateAirportDiagram = generateAirportDiagram;
