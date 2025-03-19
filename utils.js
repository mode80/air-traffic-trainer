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
                    <!-- Primary runway (main runway) -->
                    <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) rotate(45deg); background-color:${runwayColor}; width:80%; height:16px;">
                        <!-- Runway heading labels with counter-rotation to keep them upright -->
                        <div style="position:absolute; top:50%; left:0; transform:translate(-120%, -50%) rotate(${-(airportRotation + 45)}deg); color:${textColor}; font-size:10px; font-weight:bold; text-align:center;">
                            ${activeRunway ? activeRunway + (runwaySuffix ? runwaySuffix : '') : '33'}
                        </div>
                        <div style="position:absolute; top:50%; right:0; transform:translate(120%, -50%) rotate(${-(airportRotation + 45)}deg); color:${textColor}; font-size:10px; font-weight:bold; text-align:center;">
                            ${oppositeRunway ? oppositeRunway + (oppositeSuffix ? oppositeSuffix : '') : '15'}
                        </div>
                    </div>
                    
                    ${isTowered ? 
                    `<!-- Secondary runway (towered) - perpendicular to the main runway -->
                    <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background-color:${runwayColor}; width:70%; height:12px;">
                        <!-- No labels for secondary runway -->
                    </div>` : ''}
                    
                    <!-- Taxiway positioned to intersect with the main runway -->
                    <!-- Taxiway is horizontal before rotation -->
                    <div style="position:absolute; top:67%; left:20%; width:90%; height:8px; background-color:${taxiwayColor}; transform:rotate(-45deg); z-index:2;"></div>
                    
                    <!-- Ramp area on the left side of the taxiway -->
                    <div style="position:absolute; top:75%; left:33%; transform:rotate(-45deg); width:15%; height:15%; background-color:${isDarkMode ? '#888888' : '#BBBBBB'}; border-radius:3px; z-index:1;"></div>
                </div>
            </div>
    `;
    
    // Add aircraft icon
    if (aircraftPosition.valid) {
        // Position the aircraft based on the parsed location
        const { x, y, rotation, isOnGround } = aircraftPosition;
        
        // Determine if aircraft should be part of the airport rotation
        // Aircraft should be in the rotatable group if:
        // 1. It's on the ground (runway, taxiway, ramp), or
        // 2. It's in the pattern (downwind, base, final, upwind, crosswind)
        const inPattern = aircraftPosition.label && 
                         (aircraftPosition.label.toLowerCase().includes('downwind') || 
                          aircraftPosition.label.toLowerCase().includes('base') || 
                          aircraftPosition.label.toLowerCase().includes('final') || 
                          aircraftPosition.label.toLowerCase().includes('upwind') || 
                          aircraftPosition.label.toLowerCase().includes('crosswind'));
        
        const shouldRotateWithAirport = isOnGround || inPattern;
        
        if (shouldRotateWithAirport) {
            // For aircraft on the ground or in the pattern, add to the airport-elements group
            diagramHTML = diagramHTML.replace('</div>\n            </div>', `
                <!-- Aircraft icon (rotates with airport) -->
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
            // For aircraft on approach or in transit, add outside the airport-elements group
            // These aircraft don't rotate with the airport
            diagramHTML += `
                <!-- Aircraft icon (fixed position) -->
                <div style="position:absolute; top:${y}%; left:${x}%; transform:translate(-50%, -50%); z-index:500;">
                    <div style="transform:rotate(${rotation}deg);">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="${aircraftColor}" style="filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));">
                            <polygon points="12,0 0,24 24,24" />
                        </svg>
                    </div>
                </div>
            `;
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
    
    // Determine direction from position info
    let directionRotation = null;
    if (positionLower.includes('northbound')) {
        directionRotation = 0; // Facing north
    } else if (positionLower.includes('southbound')) {
        directionRotation = 180; // Facing south
    } else if (positionLower.includes('eastbound')) {
        directionRotation = 90; // Facing east
    } else if (positionLower.includes('westbound')) {
        directionRotation = 270; // Facing west
    } else if (positionLower.includes('northeast bound')) {
        directionRotation = 45; // Facing northeast
    } else if (positionLower.includes('northwest bound')) {
        directionRotation = 315; // Facing northwest
    } else if (positionLower.includes('southeast bound')) {
        directionRotation = 135; // Facing southeast
    } else if (positionLower.includes('southwest bound')) {
        directionRotation = 225; // Facing southwest
    }
    
    // Check for common position patterns
    
    // On the ground at a specific location (ramp, terminal, etc.)
    if (positionLower.includes('ramp') || 
        positionLower.includes('terminal') || 
        positionLower.includes('fbo') || 
        positionLower.includes('parked') ||
        positionLower.includes('general aviation') ||
        positionLower.includes('parking')) {
        
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
        
        // Position on the ramp area
        result = {
            valid: true,
            x: 41, // Center of the ramp area
            y: 82, // Center of the ramp area
            rotation: directionRotation !== null ? directionRotation : 45, // Use direction rotation if available
            label: positionDescription,
            isOnGround: true // Aircraft is on the ground
        };
    }
    // Holding short of runway
    else if (positionLower.includes('holding short')) {
        // Extract runway number if available
        let runwayMatch = positionLower.match(/runway\s+(\d+)/i);
        let runway = runwayMatch ? runwayMatch[1] : '';
        
        // Position the aircraft on the taxiway
        let y = 73; // Taxiway's y-coordinate 
        
        // Calculate the center of the taxiway and offset leftward by one plane width
        // The taxiway starts at left:20% and has width:90%
        // So the center is at 20% + (90% / 2) = 65%
        // Offset leftward by approximately 5% (one plane width)
        let x = 60; // Center of the taxiway (65%) offset leftward by 5%
        
        // Set rotation to face the runway (90 degrees clockwise from the taxiway orientation)
        // The taxiway is rotated -45 degrees, so to face the runway:
        // -45 + 90 = 45 degrees
        let rotation = -45; // with -45 degrees rotation of taxiway 
        
        result = {
            valid: true,
            x,
            y,
            rotation: directionRotation !== null ? directionRotation : rotation,
            label: `Holding short RWY ${runway}`,
            isOnGround: true // Aircraft is on the ground
        };
    }
    // On a specific taxiway
    else if (positionLower.includes('taxiway') || positionLower.match(/taxiway\s+[a-z]/i)) {
        let taxiwayMatch = positionLower.match(/taxiway\s+([a-z])/i);
        let taxiway = taxiwayMatch ? taxiwayMatch[1].toUpperCase() : '';
        
        // Position somewhere along the horizontal taxiway
        const x = 20 + Math.random() * 40; // Random position along the taxiway
        
        result = {
            valid: true,
            x,
            y: 73, // At the height of the horizontal taxiway
            rotation: directionRotation !== null ? directionRotation : 90, 
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
        
        // Determine if it's a left or right pattern
        const isRightPattern = positionLower.includes('right');
        const isLeftPattern = positionLower.includes('left') || (!isRightPattern && !positionLower.includes('straight'));
        
        // Aircraft width as percentage of diagram for offset calculations
        const aircraftWidth = 5; // Approximately 5% of the container width
        
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
            // For a 45-degree runway, the downwind leg should be parallel but offset
            
            if (isRightPattern) {
                // Right downwind - offset to the right of the runway
                x = 65; // Right side of the runway
                y = 35; // Parallel to the runway
                rotation = 225; // Parallel to diagonal runway, opposite direction
                approachType = 'Right Downwind';
            } else {
                // Left downwind (default) - offset to the left of the runway
                x = 35; // Left side of the runway
                y = 35; // Parallel to the runway
                rotation = 225; // Parallel to diagonal runway, opposite direction
                approachType = isLeftPattern ? 'Left Downwind' : 'Downwind';
            }
        } else if (positionLower.includes('base')) {
            // Base - perpendicular to the runway, transitioning from downwind to final
            
            if (isRightPattern) {
                // Right base - coming from right downwind
                x = 75; // Right side of the runway
                y = 55; // Transitioning to final
                rotation = 315; // Perpendicular to diagonal runway
                approachType = 'Right Base';
            } else {
                // Left base (default) - coming from left downwind
                x = 25; // Left side of the runway
                y = 65; // Transitioning to final
                rotation = 315; // Perpendicular to diagonal runway
                approachType = isLeftPattern ? 'Left Base' : 'Base';
            }
        } else if (positionLower.includes('upwind')) {
            // Upwind - parallel to the runway in the same direction
            
            if (isRightPattern) {
                // Right upwind - offset to the right of the runway
                x = 65; // Right side of the runway
                y = 65; // Parallel to the runway
                rotation = 45; // Same direction as the diagonal runway
                approachType = 'Right Upwind';
            } else {
                // Left upwind (default) - offset to the left of the runway
                x = 35; // Left side of the runway
                y = 65; // Parallel to the runway
                rotation = 45; // Same direction as the diagonal runway
                approachType = isLeftPattern ? 'Left Upwind' : 'Upwind';
            }
        } else if (positionLower.includes('crosswind')) {
            // Crosswind - perpendicular to the runway, transitioning from upwind to downwind
            
            if (isRightPattern) {
                // Right crosswind - transitioning to right downwind
                x = 75; // Right side of the runway
                y = 45; // Transitioning to downwind
                rotation = 135; // Perpendicular to diagonal runway
                approachType = 'Right Crosswind';
            } else {
                // Left crosswind (default) - transitioning to left downwind
                x = 25; // Left side of the runway
                y = 45; // Transitioning to downwind
                rotation = 135; // Perpendicular to diagonal runway
                approachType = isLeftPattern ? 'Left Crosswind' : 'Crosswind';
            }
        }
        
        result = {
            valid: true,
            x,
            y,
            rotation: directionRotation !== null ? directionRotation : rotation, 
            label: approachType,
            isOnGround: false // Aircraft is in the air (pattern)
        };
    }
    // Exiting or departing airspace in a specific direction
    else if (positionLower.match(/exiting|departing|leaving|exit|depart|leave/) && 
             (positionLower.includes('north') || 
              positionLower.includes('south') || 
              positionLower.includes('east') || 
              positionLower.includes('west') ||
              positionLower.includes('northeast') ||
              positionLower.includes('northwest') ||
              positionLower.includes('southeast') ||
              positionLower.includes('southwest'))) {
        
        let x = 50, y = 50, rotation = 0;
        let directionLabel = '';
        
        // Position the aircraft at the edge of the diagram based on direction
        if (positionLower.includes('north')) {
            // North edge
            x = 50;
            y = 15; // Near the top edge
            rotation = 180; // Facing north
            directionLabel = 'North';
        } else if (positionLower.includes('northeast')) {
            // Northeast corner
            x = 85;
            y = 15;
            rotation = 45; // Facing northeast
            directionLabel = 'Northeast';
        } else if (positionLower.includes('east')) {
            // East edge
            x = 85; // Near the right edge
            y = 50;
            rotation = 270; // Facing east
            directionLabel = 'East';
        } else if (positionLower.includes('southeast')) {
            // Southeast corner
            x = 85;
            y = 85;
            rotation = 135; // Facing southeast
            directionLabel = 'Southeast';
        } else if (positionLower.includes('south')) {
            // South edge
            x = 50;
            y = 85; // Near the bottom edge
            rotation = 0; // Facing south
            directionLabel = 'South';
        } else if (positionLower.includes('southwest')) {
            // Southwest corner
            x = 15;
            y = 85;
            rotation = 225; // Facing southwest
            directionLabel = 'Southwest';
        } else if (positionLower.includes('west')) {
            // West edge
            x = 15; // Near the left edge
            y = 50;
            rotation = 90; // Facing west
            directionLabel = 'West';
        } else if (positionLower.includes('northwest')) {
            // Northwest corner
            x = 15;
            y = 15;
            rotation = 315; // Facing northwest
            directionLabel = 'Northwest';
        }
        
        // Extract altitude if available
        let altitudeText = '';
        const altMatch = positionLower.match(/at\s+(\d+,?\d*)\s*feet/i);
        if (altMatch) {
            altitudeText = `, ${altMatch[1].replace(',', '')} ft`;
        }
        
        result = {
            valid: true,
            x,
            y,
            rotation: directionRotation !== null ? directionRotation : rotation, 
            label: `Exiting to ${directionLabel}${altitudeText}`,
            isOnGround: false // Aircraft is in the air (exiting airspace)
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
        let x = 50, y = 50; // Default to center
        
        // Calculate aircraft width as a percentage of the container
        // Aircraft SVG is 14px wide, container is the full diagram width
        const aircraftWidth = 2; // Approximately 2% of the container width
        
        switch (direction) {
            case 'north':
                x = 50; 
                y = 0 + aircraftWidth; // At the top border, moved inward by one aircraft width
                rotation = 180; 
                break;
            case 'south':
                x = 50; 
                y = 100 - aircraftWidth; // At the bottom border, moved inward by one aircraft width
                rotation = 0; 
                break;
            case 'east':
                x = 100 - aircraftWidth; y = 50; rotation = 270; break;
            case 'west':
                x = 0 + aircraftWidth; y = 50; rotation = 90; break;
            case 'northeast':
                x = 100 - aircraftWidth; y = 0 + aircraftWidth; rotation = 225; break;
            case 'northwest':
                x = 0 + aircraftWidth; y = 0 + aircraftWidth; rotation = 135; break;
            case 'southeast':
                x = 100 - aircraftWidth; y = 100 - aircraftWidth; rotation = 315; break;
            case 'southwest':
                x = 0 + aircraftWidth; y = 100 - aircraftWidth; rotation = 45; break;
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
            rotation: directionRotation !== null ? directionRotation : rotation, 
            label: `${distance} mi ${direction}${altitude}`,
            isOnGround: false // Aircraft is in the air (miles from airport)
        };
    }
    // Just landed or on the runway
    else if (positionLower.includes('landed') || positionLower.includes('runway')) {
        let runwayMatch = positionLower.match(/runway\s+(\d+)/i);
        let runway = runwayMatch ? runwayMatch[1] : '';
        
        // Convert runway number to heading (runway 36 = 360 degrees, runway 9 = 90 degrees)
        let runwayHeading = runway ? parseInt(runway, 10) * 10 : 0;
        if (runwayHeading === 0) runwayHeading = 360; // Convert runway 0 to 360 degrees
        
        // Calculate rotation based on runway heading
        // We need to convert the heading to a rotation angle (0 degrees is North)
        let rotation = runwayHeading % 360;
        
        // In our airport diagram:
        // - The main runway is diagonal at 45 degrees (NE/SW) before any rotation
        // - For runway 33/15, the aircraft should be on this diagonal runway
        
        // Position the aircraft on the appropriate runway
        let x = 50, y = 50; // Default to center of the runway
        
        // For the main diagonal runway (33/15 by default)
        if (runway === '33' || runway === '15') {
            // On the main diagonal runway
            if (runway === '33') {
                rotation = 330; // Northwest heading
            } else { // runway 15
                rotation = 150; // Southeast heading
            }
        }
        // For the scenario-specific runway numbers
        else if (runway === '05' || runway === '23') {
            // On the main diagonal runway (rotated to match scenario)
            if (runway === '05') {
                rotation = 50; // Northeast heading
            } else { // runway 23
                rotation = 230; // Southwest heading
            }
        } else if (runway === '14' || runway === '32') {
            // On the main diagonal runway (rotated to match scenario)
            if (runway === '14') {
                rotation = 140; // Southeast heading
            } else { // runway 32
                rotation = 320; // Northwest heading
            }
        } else if (runway === '18' || runway === '36') {
            // North/South runway (secondary runway in towered airports)
            if (runway === '18') {
                rotation = 180; // South heading
            } else { // runway 36
                rotation = 0; // North heading
            }
        } else if (runway === '09' || runway === '27') {
            // East/West runway (secondary runway in towered airports)
            if (runway === '09') {
                rotation = 90; // East heading
            } else { // runway 27
                rotation = 270; // West heading
            }
        } else if (runway) {
            // For any other runway number, calculate the heading
            rotation = runwayHeading % 360;
        }
        
        result = {
            valid: true,
            x: 50, // Center of the runway
            y: 50,
            rotation: directionRotation !== null ? directionRotation : rotation, 
            label: runway ? `On RWY ${runway}` : 'On Runway',
            isOnGround: true // Aircraft is on the ground (runway)
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
