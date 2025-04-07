// Scenario Management for Air Traffic Trainer

class ScenarioManager {
    constructor() {
        // DOM Elements
        this.scenarioDescription = document.getElementById('scenario-description');
        this.scenarioLoading = document.getElementById('scenario-loading');
        this.weatherInfo = document.getElementById('weather-info');
        this.weatherContainer = document.getElementById('weather-container');
        this.newScenarioBtn = document.getElementById('new-scenario-btn');
        
        // Flight info elements
        this.aircraftTypeEl = document.getElementById('aircraft-type');
        this.tailNumberEl = document.getElementById('tail-number');
        this.airportTypeEl = document.getElementById('airport-type');
        this.airportEl = document.getElementById('airport');
        this.airportDiagramEl = document.getElementById('airport-diagram');
        
        // Current scenario
        this.currentScenario = null;
        
        // Sample scenarios array - loaded from manyShotSamples.js global variable
        this.manyShotSamples = window.manyShotSamples || [];

        // Initialize
        this.init();
    }
    
    init() {
        // Set up event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // New scenario button
        this.newScenarioBtn.addEventListener('click', () => {
            this.generateScenario();
            // Reset both input modes
            document.getElementById('user-response').value = '';
            window.resetAudioRecording();
            document.getElementById('feedback-container').classList.add('hidden');
            // Reset the flag to track whether the user has peeked or made a radio call
            window.hasPeekedOrMadeFirstCall = false;
        });
    }
    
    // Helper method to update basic aircraft and airport information
    updateBasicInfo(scenario) {
        this.aircraftTypeEl.textContent = scenario.aircraft || '';
        this.tailNumberEl.textContent = scenario.tailNumber || '';
        this.airportEl.textContent = scenario.airport || '';
        this.airportTypeEl.textContent = scenario.isTowered !== undefined ? 
            (scenario.isTowered ? 'Towered' : 'Uncontrolled') : '';
    }
    
    // Helper method to update position information
    updatePositionInfo(scenario) {
        const positionInfoEl = document.getElementById('position-info');
        const positionContainer = document.getElementById('position-container');
        
        if (!positionInfoEl) return;
        
        const positionText = scenario.position || '';
        positionInfoEl.textContent = positionText;
        
        // Toggle visibility of position container based on content
        if (positionContainer) {
            positionContainer.classList.toggle('hidden', positionText === '');
        }
    }
    
    // Helper method to update weather information
    updateWeatherInfo(scenario) {
        const weatherText = scenario.weatherInfo || '';
        
        // Update weather info and toggle visibility
        this.weatherInfo.textContent = weatherText;
        this.weatherContainer.classList.toggle('hidden', !weatherText.trim());
    }
    
    // Update flight information display
    updateFlightInfoDisplay(scenario) {
        // Safety check - ensure we have a valid scenario
        if (!scenario) {
            console.error('No scenario object provided to updateFlightInfoDisplay');
            return;
        }
        
        // Update all components with scenario information
        this.updateBasicInfo(scenario);
        this.updatePositionInfo(scenario);
        this.updateWeatherInfo(scenario);
        
        // Generate airport diagram with position information
        window.generateAirportDiagram(
            this.airportDiagramEl, 
            scenario.isTowered, 
            scenario.position, 
            scenario.weatherInfo || ''
        );
    }
    
    // Helper method to select a random voice for the scenario
    selectRandomVoice(logPrefix = 'new scenario') {
        if (window.textToSpeechManager) {
            const randomVoice = window.textToSpeechManager.getRandomVoice();
            window.textToSpeechManager.setScenarioVoice(randomVoice);
            console.log(`Selected random voice for ${logPrefix}: ${randomVoice}`);
            return randomVoice;
        }
        return null;
    }
    
    // Helper method to load a fallback scenario when generation fails
    loadFallbackScenario(errorMessage = null) {
        if (!this.manyShotSamples || this.manyShotSamples.length === 0) {
            console.error('No sample scenarios available for fallback');
            window.showToast('Error: No sample scenarios available', true);
            return null;
        }
        
        console.log('Falling back to sample scenario');
        const fallbackScenario = this.manyShotSamples[Math.floor(Math.random() * this.manyShotSamples.length)];
        
        // Select a random voice for the fallback scenario
        this.selectRandomVoice('fallback scenario');
        
        // Show error message if provided
        if (errorMessage) {
            window.showToast(errorMessage, true);
        }
        
        return fallbackScenario;
    }
    
    // Helper method to reset UI elements to loading state
    setUILoadingState() {
        // Show loading indicator and disable buttons
        this.scenarioLoading.classList.remove('hidden');
        this.scenarioDescription.classList.add('hidden');
        this.newScenarioBtn.disabled = true;
        document.getElementById('submit-response-btn').disabled = true;
        
        // Reset flight information
        this.aircraftTypeEl.textContent = '';
        this.tailNumberEl.textContent = '';
        this.airportEl.textContent = '';
        this.airportTypeEl.textContent = '';
        
        // Reset position information
        const positionInfoEl = document.getElementById('position-info');
        if (positionInfoEl) {
            positionInfoEl.textContent = '';
        }
        
        // Hide position container during loading
        const positionContainer = document.getElementById('position-container');
        if (positionContainer) {
            positionContainer.classList.add('hidden');
        }
        
        // Hide weather container during loading
        this.weatherContainer.classList.add('hidden');
    }
    
    // Generate a new scenario using Groq's LLM model
    async generateScenario() {
        // Set UI to loading state
        this.setUILoadingState();
        
        // Select a random voice for this new scenario
        this.selectRandomVoice();
        
        // Sample scenario objects to use as examples - limit to 10 random examples to keep prompt size manageable
        const sampleSize = 10;
        const randomSamples = [...this.manyShotSamples].sort(() => 0.5 - Math.random()).slice(0, sampleSize);
        const examples = JSON.stringify(randomSamples, null, 2);
        
        try {
            // Get API key
            const apiKey = localStorage.getItem('groq_api_key');
            if (!apiKey) {
                window.showToast('Groq API key required. Please add your API key in the settings section below.', true);
                // Scroll to settings section
                document.getElementById('api-key-container').scrollIntoView({ behavior: 'smooth' });
                // Fall back to a random sample scenario
                this.currentScenario = this.loadFallbackScenario();
                this.displayScenario(this.currentScenario);
                return;
            }
            
            // Create prompt with instructions for scenario generation
            const prompt = `Generate one new detailed VFR aviation radio communication scenario object for a pilot training application. The scenario should be diverse, realistic, and educational. Each scenario should include enough details for a pilot to craft an appropriate radio call.

Here are some examples of the format and variety of scenarios:

${examples}

Your generated scenario MUST follow this exact JSON structure with all required fields:
{
  "description": "Brief description of the situation and task",
  "position": "Specific aircraft position in aviation terms, also including destination if relevant/required",
  "atcCall": "Initial ATC call, only for the scenario where ATC would be contacting the pilot first, otherwise empty string",
  "aircraft": "Aircraft type",
  "tailNumber": "Aircraft tail number",
  "airport": "Airport code and name",
  "isTowered": true or false,
  "weatherInfo": "Weather information in typical ATIS format or AWOS/ASOS format for untowered airports (or empty string)",
  "correctResponse": "Example of the pilot's proper radio call response"
}

Important requirements:
1. Keep the description concise and focused on the situation and task
2. Don't repeat position information in the description that's already in the position field
3. Don't mention ATIS code or airport details in the description if they're already in the weatherInfo or airport fields
4. Always include atcCall if an initial ATC call is relevant to the scenario (or empty string if not)
5. Always include weatherInfo when relevant (or empty string if not)
6. Choose appropriate aircraft types and real airports across the United States
7. Use proper aviation terminology and phraseology
7.1 correctResponse should have numbers written out in aviation digit pronounciation -- e.g. "runway one niner" instead of "runway 19", and "one one thousand feet" instead of "11,000 feet" 
8. ALWAYS include every field in the JSON object above (description, position, atcCall, aircraft, tailNumber, airport, isTowered, weatherInfo, correctResponse) 
9. The generated scenario should be realistic, and educational

Generate only ONE scenario object that strictly follows the given structure. Return ONLY valid JSON with no additional explanations or markdown formatting. The entire response should be parseable with JSON.parse().`;

            // Call Groq API
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'deepseek-r1-distill-llama-70b',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a specialized aviation training assistant that creates realistic VFR radio communication scenarios in JSON format.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7
                })
            });
            
            // Handle API response
            if (response.ok) {
                const data = await response.json();
                const responseContent = data.choices[0].message.content.trim();
                
                try {
                    // Log the raw response for debugging
                    console.log('Raw API response content:', responseContent);
                    
                    // Parse the JSON response
                    let generatedScenario;
                    try {
                        // First try direct JSON parsing
                        try {
                            generatedScenario = JSON.parse(responseContent);
                            console.log('Parsed scenario:', generatedScenario);
                            
                            // Handle case where API returns an array instead of a single object
                            if (Array.isArray(generatedScenario)) {
                                console.log('API returned an array, using first item');
                                if (generatedScenario.length > 0) {
                                    generatedScenario = generatedScenario[0];
                                } else {
                                    throw new Error('API returned an empty array');
                                }
                            }
                        } catch (initialParseError) {
                            console.log("Direct JSON parsing failed, attempting to extract JSON from response");
                            
                            // If direct parsing fails, try to extract JSON from the response
                            // Look for JSON-like patterns in the response
                            const jsonRegex = /\{[\s\S]*\}/;
                            const match = responseContent.match(jsonRegex);
                            
                            if (match) {
                                const jsonString = match[0];
                                console.log("Extracted potential JSON:", jsonString);
                                generatedScenario = JSON.parse(jsonString);
                                
                                // Handle case where API returns an array instead of a single object
                                if (Array.isArray(generatedScenario)) {
                                    console.log('API returned an array, using first item');
                                    if (generatedScenario.length > 0) {
                                        generatedScenario = generatedScenario[0];
                                    } else {
                                        throw new Error('API returned an empty array');
                                    }
                                }
                            } else {
                                throw initialParseError; // Re-throw if no JSON pattern found
                            }
                        }
                    } catch (parseError) {
                        console.error('JSON Parse Error:', parseError);
                        console.error('Failed to parse response:', responseContent);
                        throw new Error(`JSON parsing failed: ${parseError.message}`);
                    }
                    
                    // Validate the scenario object
                    const validationResult = this.validateScenario(generatedScenario);
                    if (!validationResult.isValid) {
                        console.error('Scenario validation failed:', validationResult.errors);
                        console.error('Invalid scenario object:', generatedScenario);
                        throw new Error(`Invalid scenario format: ${validationResult.errors.join(', ')}`);
                    }
                    
                    // Remove commas from atcCall field if it exists - do this once after successful validation
                    if (generatedScenario.atcCall && typeof generatedScenario.atcCall === 'string') {
                        generatedScenario.atcCall = generatedScenario.atcCall.replace(/,/g, '');
                    }
                    
                    // Use the generated scenario
                    this.currentScenario = generatedScenario;
                    
                    // Update UI
                    this.displayScenario(this.currentScenario);
                } catch (e) {
                    console.error('Scenario generation error:', e);
                    // Fall back to a random sample scenario
                    this.currentScenario = this.loadFallbackScenario(`Error generating scenario: ${e.message}. Using sample scenario instead.`);
                    this.displayScenario(this.currentScenario);
                }
            } else {
                // Handle error response
                const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error occurred' } }));
                console.error('Groq API error:', errorData);
                
                let errorMessage = `Error generating scenario: ${errorData.error?.message || 'Unknown error'}`;
                
                // Handle API key errors
                if (response.status === 401) {
                    localStorage.removeItem('groq_api_key');
                    errorMessage = 'Invalid Groq API key. Please check your settings.';
                }
                
                window.showToast(errorMessage, true);
                
                // Fall back to a random sample scenario
                this.currentScenario = this.loadFallbackScenario();
                this.displayScenario(this.currentScenario);
            }
        } catch (err) {
            console.error('Error generating scenario:', err);
            // Fall back to a random sample scenario
            this.currentScenario = this.loadFallbackScenario(`Error: ${err.message}`);
            this.displayScenario(this.currentScenario);
        }
    }
    
    // Validate a scenario object
    validateScenario(scenario) {
        // First check if scenario is an object
        if (!scenario || typeof scenario !== 'object') {
            return { isValid: false, errors: ['Scenario is not a valid object'] };
        }
        
        const errors = [];
        
        // Check for required fields
        const requiredFields = ['description', 'position', 'aircraft', 'tailNumber', 'airport', 'isTowered', 'correctResponse'];
        requiredFields.forEach(field => {
            if (scenario[field] === undefined || scenario[field] === null || scenario[field] === '') {
                errors.push(`Missing required field: ${field}`);
            }
        });
        
        // Check for optional fields format
        const optionalFields = ['atcCall', 'weatherInfo'];
        optionalFields.forEach(field => {
            if (scenario[field] !== undefined && typeof scenario[field] !== 'string') {
                errors.push(`Field ${field} must be a string`);
            }
        });
        
        // Check isTowered is boolean
        if (scenario.isTowered !== undefined && typeof scenario.isTowered !== 'boolean') {
            errors.push('Field isTowered must be a boolean');
        }
        
        return { 
            isValid: errors.length === 0, 
            errors: errors 
        };
    }
    
    // Helper method to setup speech buttons for ATC calls
    setupSpeechButtons() {
        const playButtons = this.scenarioDescription.querySelectorAll('.play-atc-speech');
        playButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const speechText = button.getAttribute('data-speech');
                if (speechText && window.textToSpeechManager) {
                    window.textToSpeechManager.playATCSpeech(speechText, button);
                }
            });
        });
    }
    
    // Helper method to reset the interaction panel
    resetInteractionPanel() {
        // Reset input
        document.getElementById('user-response').value = '';
        window.resetAudioRecording();
        document.getElementById('feedback-container').classList.add('hidden');
        
        // Initialize the interaction panel
        if (window.evaluationManager && typeof window.evaluationManager.initializeInteraction === 'function') {
            window.evaluationManager.initializeInteraction();
        }
    }
    
    // Display the scenario in the UI
    displayScenario(scenario) {
        // Safety check - ensure we have a valid scenario
        if (!scenario) {
            console.error('No scenario object provided to displayScenario');
            window.showToast('Error displaying scenario', true);
            return;
        }
        
        // Show the scenario UI
        this.scenarioLoading.classList.add('hidden');
        this.scenarioDescription.classList.remove('hidden');
        this.newScenarioBtn.disabled = false;
        document.getElementById('submit-response-btn').disabled = false;
        
        // Create the scenario text with proper null check
        let scenarioText = `<p>${scenario.description || ''}</p>`;
        this.scenarioDescription.innerHTML = scenarioText;
        
        // Setup speech buttons
        this.setupSpeechButtons();
        
        // Update the flight information display
        this.updateFlightInfoDisplay(scenario);
        
        // Reset the interaction panel
        this.resetInteractionPanel();
    }
    
    // Get the current scenario
    getCurrentScenario() {
        return this.currentScenario;
    }
}

// Export the ScenarioManager class
window.ScenarioManager = ScenarioManager;
