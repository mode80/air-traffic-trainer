/**
 * Airport Diagram Module
 * Handles the generation of airport diagrams and aircraft positioning
 */

// Define key locations in the airport for positioning
const airportLocations = {
    // Core airport elements - these will be rotated with the airport
    runway: { x: 50, y: 50 },
    taxiway: { x: 42, y: 62 },
    ramp: { x: 42, y: 68 },
    holdingShort: { x: 42, y: 58 }, // Default holding short position
    runwayEnds: {
        north: { x: 50, y: 20 }, // North end of runway (for runways 18-36, where 36 is at the north end)
        south: { x: 50, y: 80 }  // South end of runway (for runways 18-36, where 18 is at the south end)
    },
    
    // Fixed positions that don't rotate with the airport
    fixedPositions: {
        north: { x: 50, y: 8 },
        northeast: { x: 92, y: 8 },
        east: { x: 92, y: 50 },
        southeast: { x: 92, y: 92 },
        south: { x: 50, y: 90 },
        southwest: { x: 8, y: 90 },
        west: { x: 8, y: 50 },
        northwest: { x: 8, y: 8 }
    },
    
    // Aircraft positions relative to the airport - these will be rotated with the airport when on the ground
    // For aircraft in the air, their absolute positions will be maintained
    approaching: {
        north: { x: 50, y: 8, rotation: 180 }, // Approaching from north, heading south
        south: { x: 50, y: 90, rotation: 0 },   // Approaching from south, heading north
        east: { x: 92, y: 8, rotation: 270 },  // Approaching from east, heading west
        west: { x: 8, y: 50, rotation: 90 }    // Approaching from west, heading east
    },
    departing: {
        north: { x: 50, y: 8, rotation: 0 },   // Departing to north, heading north
        south: { x: 50, y: 90, rotation: 180 }, // Departing to south, heading south
        east: { x: 92, y: 50, rotation: 90 },   // Departing to east, heading east
        west: { x: 8, y: 50, rotation: 270 }   // Departing to west, heading west
    },
    pattern: {
        downwind: { x: 65, y: 8, rotation: 0 },   // Parallel to runway, opposite direction
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

/**
 * Detects direction from position text
 * @param {string} text - Position text
 * @returns {string|null} - Direction or null if not found
 */
const detectDirection = (text) => {
    const directions = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
    
    // First check for exact direction matches
    for (const dir of directions) {
        if (text.includes(dir)) {
            return dir;
        }
    }
    
    // Then check for directional terms with "bound" suffix
    const boundDirections = {
        'northbound': 'north',
        'eastbound': 'east',
        'southbound': 'south',
        'westbound': 'west',
        'northeast bound': 'northeast',
        'southeast bound': 'southeast',
        'southwest bound': 'southwest',
        'northwest bound': 'northwest'
    };
    
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
    
    // Directional terms with "bound" suffix map to their corresponding directions
    const boundRotationMap = {
        'northbound': 0,
        'eastbound': 90,
        'southbound': 180,
        'westbound': 270,
        'northeast bound': 45,
        'southeast bound': 135,
        'southwest bound': 225,
        'northwest bound': 315
    };
    
    // Check for bound directions first
    for (const [bound, rot] of Object.entries(boundRotationMap)) {
        if (text.includes(bound)) {
            return rot;
        }
    }
    
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
 * @param {string} direction - Direction (north, south, etc.)
 * @returns {number} - Rotation in degrees
 */
const getInboundRotation = (direction) => {
    const inboundMap = {
        'north': 180,    // Coming from north, facing south
        'northeast': 225, // Coming from northeast, facing southwest
        'east': 270,     // Coming from east, facing west
        'southeast': 315, // Coming from southeast, facing northwest
        'south': 0,      // Coming from south, facing north
        'southwest': 45,  // Coming from southwest, facing northeast
        'west': 90,      // Coming from west, facing east
        'northwest': 135  // Coming from northwest, facing southeast
    };
    return inboundMap[direction] || 0;
};

/**
 * Gets outbound rotation based on direction
 * @param {string} direction - Direction (north, south, etc.)
 * @returns {number} - Rotation in degrees
 */
const getOutboundRotation = (direction) => {
    const outboundMap = {
        'north': 0,      // Going to north, facing north
        'northeast': 45,  // Going to northeast, facing northeast
        'east': 90,      // Going to east, facing east
        'southeast': 135, // Going to southeast, facing southeast
        'south': 180,    // Going to south, facing south
        'southwest': 225, // Going to southwest, facing southwest
        'west': 270,     // Going to west, facing west
        'northwest': 315  // Going to northwest, facing northwest
    };
    return outboundMap[direction] || 0;
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
            label: '',
            isOnGround: false
        };
    }
    
    // Convert to lowercase for case-insensitive matching
    const positionLower = positionInfo.toLowerCase();
    
    // Helper function to create position result object
    const createPositionResult = (x, y, rotation, label, isOnGround) => {
        return {
            valid: true,
            x: x,
            y: y,
            rotation: rotation,
            label: label,
            isOnGround: isOnGround
        };
    };
    
    // Extract runway number if mentioned
    const runway = extractRunwayNumber(positionLower);
    
    // Extract altitude if available
    const altMatch = positionLower.match(/at\s+(\d+,?\d*)\s*feet/i);
    const altitude = altMatch ? `, ${altMatch[1].replace(',', '')} ft` : '';
    
    // Get explicit rotation from direction keywords - only for airborne aircraft
    const explicitRotation = getExplicitRotation(positionLower);
    
    // Check for positions like "X miles [direction]"
    const milesDirectionMatch = positionLower.match(/(\d+)\s+miles?\s+(north|south|east|west|northeast|northwest|southeast|southwest)/i);
    if (milesDirectionMatch) {
        const miles = milesDirectionMatch[1];
        const direction = milesDirectionMatch[2].toLowerCase();
        
        // Place aircraft at the border based on direction
        let x = 50, y = 50; // Default center
        
        // Position the aircraft at the border based on direction
        switch(direction) {
            case 'north':
                x = 50;
                y = 1;
                break;
            case 'northeast':
                x = 99;
                y = 1;
                break;
            case 'east':
                x = 99;
                y = 50;
                break;
            case 'southeast':
                x = 99;
                y = 99;
                break;
            case 'south':
                x = 50;
                y = 99;
                break;
            case 'southwest':
                x = 1;
                y = 99;
                break;
            case 'west':
                x = 1;
                y = 50;
                break;
            case 'northwest':
                x = 1;
                y = 1;
                break;
        }
        
        // Determine rotation based on keywords
        let rotation = explicitRotation;
        
        if (rotation === null) {
            if (positionLower.includes('inbound') || positionLower.includes('approaching') || positionLower.includes('for landing')) {
                // If a runway number is specified, use it to determine the approach direction
                if (runway) {
                    const runwayNum = parseInt(runway.replace(/[LRC]/g, ''), 10);
                    // Runway numbers correspond to magnetic heading in tens of degrees
                    // For example, runway 27 is oriented at 270 degrees (west)
                    // Aircraft approaching runway 27 should be heading west (270 degrees)
                    rotation = ((runwayNum * 10) + 180) % 360;
                } else {
                    // If no runway specified, use the default inbound rotation based on position
                    rotation = getInboundRotation(direction);
                }
            } else if (positionLower.includes('outbound') || positionLower.includes('departing')) {
                // If a runway number is specified, use it to determine the departure direction
                if (runway) {
                    const runwayNum = parseInt(runway.replace(/[LRC]/g, ''), 10);
                    // Aircraft departing runway 27 should be heading west (270 degrees)
                    rotation = (runwayNum * 10) % 360;
                } else {
                    // If no runway specified, use the default outbound rotation based on position
                    rotation = getOutboundRotation(direction);
                }
            } else {
                rotation = 0; // Default rotation
            }
        }
        
        return createPositionResult(
            x,
            y,
            rotation,
            `${miles} miles ${direction}${altitude}`,
            false // Not on ground
        );
    }
    
    // Check for directional position relative to airport (e.g., "north of", "west of")
    const directionalMatch = positionLower.match(/(north|south|east|west|northeast|northwest|southeast|southwest)\s+of/i);
    if (directionalMatch) {
        const direction = directionalMatch[1].toLowerCase();
        
        // Place aircraft at the border based on direction
        let x = 50, y = 50; // Default center
        
        // Position the aircraft at the border based on direction
        switch(direction) {
            case 'north':
                x = 50;
                y = 1;
                break;
            case 'northeast':
                x = 99;
                y = 1;
                break;
            case 'east':
                x = 99;
                y = 50;
                break;
            case 'southeast':
                x = 99;
                y = 99;
                break;
            case 'south':
                x = 50;
                y = 99;
                break;
            case 'southwest':
                x = 1;
                y = 99;
                break;
            case 'west':
                x = 1;
                y = 50;
                break;
            case 'northwest':
                x = 1;
                y = 1;
                break;
        }
        
        // Determine rotation based on keywords
        let rotation = explicitRotation;
        
        if (rotation === null) {
            if (positionLower.includes('inbound') || positionLower.includes('approaching') || positionLower.includes('landing')) {
                // If a runway number is specified, use it to determine the approach direction
                if (runway) {
                    const runwayNum = parseInt(runway.replace(/[LRC]/g, ''), 10);
                    // Runway numbers correspond to compass headings in tens of degrees
                    // For example, runway 15 is oriented at approximately 150 degrees
                    // Aircraft approaching runway 15 should be heading 330 degrees (northwest)
                    rotation = ((runwayNum * 10) + 180) % 360;
                } else {
                    // If no runway specified, use the default inbound rotation based on position
                    rotation = getInboundRotation(direction);
                }
            } else if (positionLower.includes('outbound') || positionLower.includes('departing')) {
                // If a runway number is specified, use it to determine the departure direction
                if (runway) {
                    const runwayNum = parseInt(runway.replace(/[LRC]/g, ''), 10);
                    // Aircraft departing runway 27 should be heading west (270 degrees)
                    rotation = (runwayNum * 10) % 360;
                } else {
                    // If no runway specified, use the default outbound rotation based on position
                    rotation = getOutboundRotation(direction);
                }
            } else {
                rotation = 0; // Default rotation
            }
        }
        
        return createPositionResult(
            x,
            y,
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
        positionLower.includes('parked') ||
        positionLower.includes('general aviation') ||
        positionLower.includes('parking area')) {
        
        let label = 'On the ramp';
        
        if (positionLower.includes('terminal')) {
            label = 'At terminal';
        } else if (positionLower.includes('apron')) {
            label = 'On apron';
        } else if (positionLower.includes('parked')) {
            label = 'Parked';
        } else if (positionLower.includes('general aviation') || positionLower.includes('parking area')) {
            label = 'GA parking';
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
        // Always position the aircraft at the bottom (y=80) where the relevant runway is labeled
        // The airport rotation will handle the proper orientation based on the runway heading
        let holdingY = 80; // Bottom position where the runway number is labeled
        let holdingRotation = 90; // Default rotation (facing the runway)
        
        // Allow explicit facing direction to override the default rotation
        const facingMatch = positionLower.match(/facing\s+(north|south|east|west|northeast|northwest|southeast|southwest)/i);
        if (facingMatch) {
            holdingRotation = getExplicitRotation(`facing ${facingMatch[1]}`);
        }
        
        return createPositionResult(
            42, // Use the exact taxiway x-coordinate from the SVG
            holdingY, // Y position at the bottom where the runway number is labeled
            holdingRotation, // Default to facing the runway, but allow explicit facing override
            runway ? `Holding short RWY ${runway}` : 'Holding short',
            true // On ground
        );
    }
    
    // Check for taxiway position
    if (positionLower.includes('taxiway') || positionLower.includes('taxi')) {
        // For taxiway positions, use default rotation (0 unless explicitly overridden with "facing" keyword
        const facingMatch = positionLower.match(/facing\s+(north|south|east|west|northeast|northwest|southeast|southwest)/i);
        const taxiRotation = facingMatch ? getExplicitRotation(`facing ${facingMatch[1]}`) : 0;
        
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
    
    // Check for pattern positions
    for (const [pattern, position] of Object.entries(airportLocations.pattern)) {
        if (positionLower.includes(pattern)) {
            return createPositionResult(
                position.x,
                position.y,
                explicitRotation !== null ? explicitRotation : position.rotation,
                `In ${pattern} leg${altitude}`,
                false // Not on ground
            );
        }
    }
    
    // Check for approach/departure positions
    if (positionLower.includes('approach') || positionLower.includes('final')) {
        // Try to determine the direction of approach
        let direction = detectDirection(positionLower) || 'south'; // Default approach from south
        
        // If a runway number is specified, use it to determine the approach direction
        if (runway) {
            const runwayNum = parseInt(runway.replace(/[LRC]/g, ''), 10);
            // Calculate the opposite direction of the runway heading (aircraft approach from opposite direction)
            const approachHeading = (runwayNum * 10 + 180) % 360;
            
            // Map the approach heading to a cardinal direction
            if (approachHeading >= 337.5 || approachHeading < 22.5) {
                direction = 'north';
            } else if (approachHeading >= 22.5 && approachHeading < 67.5) {
                direction = 'northeast';
            } else if (approachHeading >= 67.5 && approachHeading < 112.5) {
                direction = 'east';
            } else if (approachHeading >= 112.5 && approachHeading < 157.5) {
                direction = 'southeast';
            } else if (approachHeading >= 157.5 && approachHeading < 202.5) {
                direction = 'south';
            } else if (approachHeading >= 202.5 && approachHeading < 247.5) {
                direction = 'southwest';
            } else if (approachHeading >= 247.5 && approachHeading < 292.5) {
                direction = 'west';
            } else if (approachHeading >= 292.5 && approachHeading < 337.5) {
                direction = 'northwest';
            }
        }
        
        const position = airportLocations.approaching[direction];
        
        if (position) {
            let rotation = explicitRotation;
            
            // If no explicit rotation and runway is specified, use runway heading
            if (rotation === null && runway) {
                const runwayNum = parseInt(runway.replace(/[LRC]/g, ''), 10);
                // Aircraft approaching runway 27 should be heading west (270 degrees)
                rotation = ((runwayNum * 10) + 180) % 360;
            } else if (rotation === null) {
                // Use the default rotation for this approach direction
                rotation = position.rotation;
            }
            
            return createPositionResult(
                position.x,
                position.y,
                rotation,
                runway ? `Approaching RWY ${runway}${altitude}` : `Approaching${altitude}`,
                false // Not on ground
            );
        }
    }
    
    if (positionLower.includes('depart') || positionLower.includes('takeoff')) {
        // Try to determine the direction of departure
        let direction = detectDirection(positionLower) || 'north'; // Default departure to north
        
        // If a runway number is specified, use it to determine the departure direction
        if (runway) {
            const runwayNum = parseInt(runway.replace(/[LRC]/g, ''), 10);
            // Calculate the direction of the runway heading (aircraft depart in runway heading)
            const departureHeading = (runwayNum * 10) % 360;
            
            // Map the departure heading to a cardinal direction
            if (departureHeading >= 337.5 || departureHeading < 22.5) {
                direction = 'north';
            } else if (departureHeading >= 22.5 && departureHeading < 67.5) {
                direction = 'northeast';
            } else if (departureHeading >= 67.5 && departureHeading < 112.5) {
                direction = 'east';
            } else if (departureHeading >= 112.5 && departureHeading < 157.5) {
                direction = 'southeast';
            } else if (departureHeading >= 157.5 && departureHeading < 202.5) {
                direction = 'south';
            } else if (departureHeading >= 202.5 && departureHeading < 247.5) {
                direction = 'southwest';
            } else if (departureHeading >= 247.5 && departureHeading < 292.5) {
                direction = 'west';
            } else if (departureHeading >= 292.5 && departureHeading < 337.5) {
                direction = 'northwest';
            }
        }
        
        const position = airportLocations.departing[direction];
        
        if (position) {
            let rotation = explicitRotation;
            
            // If no explicit rotation and runway is specified, use runway heading
            if (rotation === null && runway) {
                const runwayNum = parseInt(runway.replace(/[LRC]/g, ''), 10);
                // Aircraft departing runway 27 should be heading west (270 degrees)
                rotation = (runwayNum * 10) % 360;
            } else if (rotation === null) {
                // Use the default rotation for this departure direction
                rotation = position.rotation;
            }
            
            return createPositionResult(
                position.x,
                position.y,
                rotation,
                runway ? `Departing RWY ${runway}${altitude}` : `Departing${altitude}`,
                false // Not on ground
            );
        }
    }
    
    // Default position - pick a random position away from the airport
    const randomIndex = Math.floor(Math.random() * airportLocations.away.length);
    const randomPosition = airportLocations.away[randomIndex];
    
    return createPositionResult(
        randomPosition.x,
        randomPosition.y,
        explicitRotation !== null ? explicitRotation : randomPosition.rotation,
        positionInfo,
        false // Not on ground
    );
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
