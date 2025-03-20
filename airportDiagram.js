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
        north: createPosition(50, 20), // North end of runway 
        south: createPosition(50, 80)  // South end of runway 
    },
    
    // Border positions for aircraft outside the airport
    borderPositions: {
        north: createPosition(50, 6),
        northeast: createPosition(94, 6),
        east: createPosition(94, 50),
        southeast: createPosition(94, 94),
        south: createPosition(50, 94),
        southwest: createPosition(3, 94), // Bottom-left corner
        west: createPosition(5, 50),
        northwest: createPosition(6, 6)
    },
    
    // Pattern positions
    pattern: {
        // Left traffic pattern (default)
        downwind: createPosition(30, 50, 180),   // Left downwind - parallel to runway, opposite direction, offset to the left
        base: createPosition(32, 85, 90),      // Perpendicular to downwind, turning to final
        final: createPosition(35, 85, 0),    // Aligned with runway for landing
        crosswind: createPosition(32, 15, 270), // Perpendicular to departure leg
        departure: createPosition(35, 15, 0),    // Parallel to runway, same heading (formerly "upwind")
        
        // Right traffic pattern
        rightDownwind: createPosition(70, 50, 0),   // Right downwind - parallel to runway, opposite direction, offset to the right
        rightBase: createPosition(38, 85, 270),      // Perpendicular to downwind, turning to final
        rightCrosswind: createPosition(38, 15, 90)  // Perpendicular to departure leg
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
 * @param {string} text - Position information text
 * @returns {string|null} - Runway number or null if not found
 */
const extractRunwayNumber = (text) => {
    const textLower = text.toLowerCase();
    const runwayMatch = textLower.match(/runway\s+(\d+)([LRC]?)/i) || textLower.match(/\brwy\s+(\d+)([LRC]?)/i);
    
    if (runwayMatch) {
        // Get the runway number and add leading zero if needed
        const runwayNum = parseInt(runwayMatch[1], 10);
        
        // Add the suffix if present
        const suffix = runwayMatch[2] ? runwayMatch[2].toUpperCase() : '';
        
        const formattedRunwayNum = runwayNum < 10 ? `0${runwayNum}` : runwayNum.toString();
        
        return formattedRunwayNum + suffix;
    }
    
    return null;
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
 * @returns {Object} - Position result with coordinates, rotation, validity, distance, and altitude
 */
function parseAircraftPosition(positionInfo) {
    // Default invalid position
    if (!positionInfo || positionInfo.trim() === '') {
        return { valid: false, x: 0, y: 0, rotation: 0, distance: 0, altitude: 0 };
    }
    
    // Convert to lowercase for case-insensitive matching
    const pos = positionInfo.toLowerCase();
    
    // Helper function to create position result object
    const createPositionResult = (x, y, rotation, distance = 0, altitude = 0) => {
        return { valid: true, x: x, y: y, rotation: rotation, distance: distance, altitude: altitude };
    };
    
    // Extract distance in miles if mentioned
    let distance = 0;
    const distanceMatch = pos.match(/(\d+)\s+miles?/i);
    if (distanceMatch) {
        distance = parseInt(distanceMatch[1], 10);
    }
    
    // Extract altitude in feet if mentioned
    let altitude = 0;
    const altitudeMatch = pos.match(/(\d+)[,]?(\d+)?\s+feet/i) || pos.match(/(\d+)[,]?(\d+)?\s+ft/i);
    if (altitudeMatch) {
        // Handle cases like "1,500 feet" or "1500 feet"
        if (altitudeMatch[2]) {
            altitude = parseInt(altitudeMatch[1] + altitudeMatch[2], 10);
        } else {
            altitude = parseInt(altitudeMatch[1], 10);
        }
    }
    
    // Extract runway number if mentioned
    const runway = extractRunwayNumber(pos);
    
    // Get explicit rotation from direction keywords - only for airborne aircraft
    const explicitRotation = getExplicitRotation(pos);
    
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
        const rotation = determineRotation(direction, pos, runway, explicitRotation);
        
        // Log for debugging
        console.log(`Positioning aircraft at ${direction} position: (${borderPosition.x}, ${borderPosition.y})`);
        
        return createPositionResult(
            borderPosition.x,
            borderPosition.y,
            rotation,
            distance || 2, // If no specific distance, use 2 miles for approach/departure
            altitude // Include the extracted altitude
        );
    };
    
    // Check for positions like "X miles [direction]"
    const milesDirectionMatch = pos.match(/(\d+)\s+miles?\s+(north|south|east|west|northeast|northwest|southeast|southwest)/i);
    if (milesDirectionMatch) {
        const direction = milesDirectionMatch[2].toLowerCase();
        return handleDirectionalPosition(direction);
    }
    
    // Check for directional position relative to airport (e.g., "north of", "west of")
    const directionalMatch = pos.match(/(north|south|east|west|northeast|northwest|southeast|southwest)\s+of/i);
    if (directionalMatch) {
        const direction = directionalMatch[1].toLowerCase();
        return handleDirectionalPosition(direction);
    }
    
    // Check for directional position with airport name (e.g., "southwest of Austin-Bergstrom")
    const airportDirectionalMatch = pos.match(/(north|south|east|west|northeast|northwest|southeast|southwest)\s+of\s+[\w\s-]+/i);
    if (airportDirectionalMatch) {
        const direction = airportDirectionalMatch[1].toLowerCase();
        return handleDirectionalPosition(direction);
    }
    
    /**
     * Helper function to handle ground positions
     * @param {string} positionType - Type of ground position (ramp, taxiway, runway, etc.)
     * @returns {Object|null} - Position result object or null if not applicable
     */
    const handleGroundPosition = (positionType) => {
        // Extract facing direction if specified
        const facingMatch = pos.match(/facing\s+(north|south|east|west|northeast|northwest|southeast|southwest)/i);
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
                if (pos.includes('taking off') || pos.includes('takeoff')) {
                    defaultRotation = 0; // Aircraft is aligned with the runway for takeoff (heading north by default)
                } else if (pos.includes('landing') || pos.includes('on approach')) {
                    defaultRotation = 180; // Aircraft is aligned with the runway for landing (heading south by default)
                }
                break;
                
            case 'holding short':
                // Always position the aircraft at the bottom where the relevant runway is labeled
                return createPositionResult(
                    42, // Use the exact taxiway x-coordinate from the SVG
                    80, // Bottom position where the runway number is labeled
                    facingMatch ? getExplicitRotation(`facing ${facingMatch[1]}`) : 90, // Default to facing the runway
                    0, // Aircraft on ground has distance 0
                    altitude // Include the extracted altitude
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
            0, // Aircraft on ground has distance 0
            altitude // Include the extracted altitude
        );
    };
    
    // Check for ramp, terminal, or apron position
    if (pos.includes('ramp') || 
        pos.includes('terminal') || 
        pos.includes('apron') ||
        pos.includes('parked') ||
        pos.includes('hangar') ||
        pos.includes('parking area')) {
        
        const result = handleGroundPosition('ramp');
        if (result) return result;
    }
    
    // Check for "holding short" position
    if (pos.includes('holding short')) {
        const result = handleGroundPosition('holding short');
        if (result) return result;
    }
    
    // Check for taxiway position
    if (pos.includes('taxiway') || pos.includes('taxi')) {
        const result = handleGroundPosition('taxiway');
        if (result) return result;
    }
    
    // Check for pattern positions
    for (const [pattern, position] of Object.entries(airportLocations.pattern)) {
        if (pos.includes(pattern)) {
            return createPositionResult(
                position.x,
                position.y,
                explicitRotation !== null ? explicitRotation : position.rotation,
                0, // Aircraft in pattern has distance 0
                altitude // Include the extracted altitude
            );
        }
    }
    
    // Special case for "right" pattern positions that don't match the object keys directly
    if (pos.includes('right downwind')) {
        const position = airportLocations.pattern.rightDownwind;
        return createPositionResult(
            position.x,
            position.y,
            explicitRotation !== null ? explicitRotation : position.rotation,
            0, // Aircraft in pattern has distance 0
            altitude // Include the extracted altitude
        );
    } else if (pos.includes('right base')) {
        const position = airportLocations.pattern.rightBase;
        return createPositionResult(
            position.x,
            position.y,
            explicitRotation !== null ? explicitRotation : position.rotation,
            0, // Aircraft in pattern has distance 0
            altitude // Include the extracted altitude
        );
    } else if (pos.includes('right crosswind')) {
        const position = airportLocations.pattern.rightCrosswind;
        return createPositionResult(
            position.x,
            position.y,
            explicitRotation !== null ? explicitRotation : position.rotation,
            0, // Aircraft in pattern has distance 0
            altitude // Include the extracted altitude
        );
    }
    
    // Special case for "final approach" - use the pattern.final position
    if (pos.includes('final approach')) {
        const finalPosition = airportLocations.pattern.final;
        // If runway is specified, adjust rotation based on runway heading
        let rotation = explicitRotation;
        
        if (rotation === null && runway) {
            const runwayNum = parseInt(runway.replace(/[LRC]/g, ''), 10);
            
            rotation = ((runwayNum * 10) + 180) % 360;  // Approach from opposite direction
        } else if (rotation === null) {
            rotation = finalPosition.rotation;
        }
        
        return createPositionResult(
            finalPosition.x,
            finalPosition.y,
            rotation,
            0, // Aircraft on final approach has distance 0
            altitude // Include the extracted altitude
        );
    }
    
    // Check if aircraft has departed - place in departure position
    if (pos.includes('departed')) {
        // Position the aircraft in the departure position, aligned with the runway and heading away from the airport
        const departurePosition = airportLocations.pattern.departure;
        return createPositionResult(
            departurePosition.x,
            departurePosition.y,
            explicitRotation !== null ? explicitRotation : departurePosition.rotation,
            0, // Aircraft just departed has distance 0
            altitude // Include the extracted altitude
        );
    }
    
    // Check for approach positions
    if ((pos.includes('approach') || pos.includes('final')) && !pos.includes('final approach')) {
        const result = handleApproachDeparture(true); // true for approaching
        if (result) return result;
    }
    
    // Check for departure positions
    if (pos.includes('depart') || pos.includes('takeoff')) {
        const result = handleApproachDeparture(false); // false for departing
        if (result) return result;
    }
    
    // Check for runway position last as many above include the word 'runway'
    if (pos.includes('runway') || pos.match(/\brwy\b/i)) {
        const result = handleGroundPosition('runway');
        if (result) return result;
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
        
        direction = detectDirection(pos) || defaultDirection;
        
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
                distance || 2, // If no specific distance, use 2 miles for approach/departure
                altitude // Include the extracted altitude
            );
        }
        
        return null;
    };
    
    // Default position - pick a random position away from the airport
    // If we have a direction in the text but didn't match earlier patterns, try to extract it now
    const anyDirectionMatch = pos.match(/(north|south|east|west|northeast|northwest|southeast|southwest)/i);
    if (anyDirectionMatch) {
        const direction = anyDirectionMatch[1].toLowerCase();
        return handleDirectionalPosition(direction);
    }
    
    const randomIndex = Math.floor(Math.random() * airportLocations.away.length);
    const randomPosition = airportLocations.away[randomIndex];
    
    return createPositionResult(
        randomPosition.x,
        randomPosition.y,
        explicitRotation !== null ? explicitRotation : randomPosition.rotation,
        distance || 3, // If no specific distance, use 3 miles for random positions
        altitude // Include the extracted altitude
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
    
    // Calculate scale factor based on distance
    let scaleFactor = 1;
    if (aircraftPosition.distance > 0) {
        // Scale down for each mile, with a minimum of 10%
        scaleFactor = Math.max(0.1, Math.pow(0.90, aircraftPosition.distance-1));
    } else {
        scaleFactor = 1.25;
    }

    
    // Set colors based on the current theme
    const isDarkMode = document.body.classList.contains('dark');
    const bgColor = isDarkMode ? '#262626' : '#F0F0F0';
    const textColor = isDarkMode ? '#E0E0E0' : '#333333';
    const runwayColor = isDarkMode ? '#505050' : '#505050';
    const runwayNumberColor = isDarkMode ? '#E0E0E0' : '#FFFFFF'; 
    const taxiwayColor = isDarkMode ? '#364968' : '#6B8CCF';
    const rampColor = isDarkMode ? '#364968' : '#6B8CCF';
    const aircraftColor = isDarkMode ? '#E0E0E0' : '#FFFFFF';
    
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
        runwaySuffix = runwayMatch[2] ? runwayMatch[2].toUpperCase() : '';
    }
    
    // Calculate opposite runway
    let oppositeRunway = '';
    let oppositeSuffix = '';
    
    if (activeRunway) {
        // Convert runway number to integer
        const runwayNum = parseInt(activeRunway, 10);
        
        // Calculate opposite runway (difference from 36)
        let oppositeRunwayNum;
        if (runwayNum <= 18) {
            oppositeRunwayNum = runwayNum + 18;
        } else {
            oppositeRunwayNum = runwayNum - 18;
        }
        
        // Format with leading zero for single digits
        oppositeRunway = oppositeRunwayNum < 10 ? `0${oppositeRunwayNum}` : oppositeRunwayNum.toString();
        
        // Format active runway with leading zero if it's a single digit
        activeRunway = runwayNum < 10 ? `0${runwayNum}` : activeRunway;
        
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
            <!-- Style for aircraft pulsing animation -->
            <style>
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
                .aircraft-pulse {
                    animation: pulse 3s infinite ease-in-out;
                    transform-box: fill-box;
                    transform-origin: center;
                }
            </style>
            
            <!-- North indicator - fixed, never rotates -->
            <div style="position:absolute; top:15px; left:15px; color:${textColor}; border:1px solid ${textColor}; width:24px; height:24px; border-radius:50%; text-align:center; line-height:22px; z-index:20;">
                N
            </div>
            
            <!-- SVG container for the entire diagram -->
            <svg id="airport-svg" width="100%" height="100%" viewBox="0 0 100 100" style="position:absolute; top:0; left:0; width:100%; height:100%;">
                <!-- Airport elements group - occupying the middle 60% of the SVG -->
                <g id="airport-elements" transform="rotate(${airportRotation}, 50, 50) translate(50, 50) scale(${scaleFactor}) translate(-50, -50)">
                    ${runwaySuffix === 'L' || runwaySuffix === 'R' ? `
                    <!-- Parallel runways for L/R runways -->
                    <!-- First runway (standard position) -->
                    <rect x="47.5" y="20" width="5" height="60" fill="${runwayColor}" />
                    <!-- Second runway (on the other side) -->
                    <rect x="57.5" y="20" width="5" height="60" fill="${runwayColor}" />
                    
                    <!-- First runway labels -->
                    <g transform="translate(50, 78) rotate(${airportRotation}, 0, 0)">
                        <text x="0" y="0" fill="${runwayNumberColor}" font-size="4" text-anchor="middle" dominant-baseline="middle" font-weight="bold" font-family="'Courier New', monospace" transform="rotate(-${airportRotation})">
                            ${activeRunway}${runwaySuffix}
                        </text>
                    </g>
                    <g transform="translate(50, 22) rotate(${airportRotation + 180}, 0, 0)">
                        <text x="0" y="0" fill="${runwayNumberColor}" font-size="4" text-anchor="middle" dominant-baseline="middle" font-weight="bold" font-family="'Courier New', monospace" transform="rotate(-${airportRotation})">
                            ${oppositeRunway}${oppositeSuffix}
                        </text>
                    </g>
                    
                    <!-- Second runway labels -->
                    <g transform="translate(60, 78) rotate(${airportRotation}, 0, 0)">
                        <text x="0" y="0" fill="${runwayNumberColor}" font-size="4" text-anchor="middle" dominant-baseline="middle" font-weight="bold" font-family="'Courier New', monospace" transform="rotate(-${airportRotation})">
                            ${activeRunway}${oppositeSuffix}
                        </text>
                    </g>
                    <g transform="translate(60, 22) rotate(${airportRotation + 180}, 0, 0)">
                        <text x="0" y="0" fill="${runwayNumberColor}" font-size="4" text-anchor="middle" dominant-baseline="middle" font-weight="bold" font-family="'Courier New', monospace" transform="rotate(-${airportRotation})">
                            ${oppositeRunway}${runwaySuffix}
                        </text>
                    </g>
                    ` : `
                    <!-- Single runway for non-L/R runways -->
                    <rect x="47.5" y="20" width="5" height="60" fill="${runwayColor}" />
                    
                    <!-- Runway labels -->
                    <g transform="translate(50, 78) rotate(${airportRotation}, 0, 0)">
                        <text x="0" y="0" fill="${runwayNumberColor}" font-size="4" text-anchor="middle" dominant-baseline="middle" font-weight="bold" font-family="'Courier New', monospace" transform="rotate(-${airportRotation})">
                            ${activeRunway ? activeRunway : '36'}${runwaySuffix}
                        </text>
                    </g>
                    <g transform="translate(50, 22) rotate(${airportRotation + 180}, 0, 0)">
                        <text x="0" y="0" fill="${runwayNumberColor}" font-size="4" text-anchor="middle" dominant-baseline="middle" font-weight="bold" font-family="'Courier New', monospace" transform="rotate(-${airportRotation})">
                            ${oppositeRunway ? oppositeRunway : '18'}${oppositeSuffix}
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
                    ${aircraftPosition.valid && aircraftPosition.distance <= 1.0 ? `
                    <g class="aircraft-icon" transform="translate(${aircraftPosition.x}, ${aircraftPosition.y}) rotate(${aircraftPosition.rotation})">
                        <g class="aircraft-pulse">
                            <polygon points="0,-4 -3,4 0,2 3,4" fill="${aircraftColor}" stroke="black" stroke-width="0.5" />
                        </g>
                        ${(aircraftPosition.distance > 0 || aircraftPosition.altitude > 0) ? `
                        <text x="0" y="5" fill="${textColor}" font-size="2" text-anchor="middle" dominant-baseline="middle" transform="rotate(-${aircraftPosition.rotation})">
                            ${aircraftPosition.distance > 0 ? `${aircraftPosition.distance}mi` : ''}${aircraftPosition.altitude > 0 ? ` ${aircraftPosition.altitude}ft` : ''}
                        </text>
                        ` : ''}
                    </g>
                    ` : ''}
                </g>
                
                <!-- Aircraft in the air is rendered separately to maintain absolute positioning -->
                ${aircraftPosition.valid && aircraftPosition.distance > 1.0 ? `
                <g class="aircraft-icon">
                    <g transform="translate(${aircraftPosition.x}, ${aircraftPosition.y}) rotate(${aircraftPosition.rotation})">
                        <g class="aircraft-pulse">
                            <polygon points="0,-4 -3,4 0,2 3,4" fill="${aircraftColor}" stroke="black" stroke-width="0.5" />
                        </g>
                        ${(aircraftPosition.distance > 0 || aircraftPosition.altitude > 0) ? `
                        <text x="0" y="5" fill="${textColor}" font-size="2" text-anchor="middle" dominant-baseline="middle" transform="rotate(-${aircraftPosition.rotation})">
                            ${aircraftPosition.distance > 0 ? `${aircraftPosition.distance}mi` : ''}${aircraftPosition.altitude > 0 ? ` ${aircraftPosition.altitude}ft` : ''}
                        </text>
                        ` : ''}
                    </g>
                </g>
                ` : ''}
                
                <!-- Remove the distance indicator from the top corner since it's now near the aircraft -->
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
