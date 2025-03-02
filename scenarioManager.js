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
        
        // Sample scenarios for few-shot learning prompt (simplified structure)
        this.fewShotSamples = [
            {
                title: "Pre-departure Taxi at Palo Alto Airport",
                description: "You are parked at the main ramp and need to request taxi clearance from ground control for departure to the east on runway 31.",
                atcCall: null,
                weatherInfo: "Palo Alto Airport, information Alpha. Winds 310 at 8 knots. Visibility 10 miles. Clear below 12,000. Temperature 22, dew point 14. Altimeter 29.92. Landing and departing runway 31. Advise on initial contact you have information Alpha.",
                aircraft: "Cessna 172 Skyhawk",
                tailNumber: "N5678P",
                airport: "KPAO - Palo Alto Airport",
                isTowered: true,
                correctResponse: "Palo Alto Ground, Skyhawk Five Six Seven Eight Papa at the main ramp with information Alpha, request taxi for eastbound departure."
            },
            {
                title: "Traffic Advisory Response",
                description: "You are flying 15 miles east at 4,500 feet MSL, heading 270°. You have received the following traffic advisory from Approach. Respond appropriately.",
                atcCall: "Cessna Seven One Two Three Four, traffic, two o'clock, five miles, eastbound, altitude indicates three thousand five hundred.",
                weatherInfo: "",
                aircraft: "Cessna 172 Skyhawk",
                tailNumber: "N71234",
                airport: "KOAK - Oakland International Airport",
                isTowered: true,
                correctResponse: "Oakland Approach, Cessna Seven One Two Three Four, looking for traffic."
            },
            {
                title: "Position Report at Uncontrolled Airport",
                description: "You are flying the downwind leg in the traffic pattern for runway 27 at traffic pattern altitude. You need to make your position report on CTAF.",
                atcCall: null,
                weatherInfo: "Reid-Hillview Automated Weather Observation, 1845 Zulu. Wind 250 at 6 knots. Visibility 10 miles. Clear below 12,000. Temperature 23 Celsius, dew point 14 Celsius. Altimeter 29.92. Runway 31L in use.",
                aircraft: "Cessna 152",
                tailNumber: "N98765",
                airport: "KRHV - Reid-Hillview Airport", 
                isTowered: false,
                correctResponse: "Reid-Hillview traffic, Cessna Niner Eight Seven Six Five, midfield downwind for runway two seven, Reid-Hillview."
            },
            {
                title: "Emergency Declaration",
                description: "You are flying 20 miles south at 5,500 feet MSL. Your engine has started running rough and you suspect carburetor icing. You need to declare an emergency to ATC.",
                atcCall: null,
                weatherInfo: "",
                aircraft: "Piper Cherokee",
                tailNumber: "N4567A",
                airport: "KSFO - San Francisco International Airport",
                isTowered: true,
                correctResponse: "San Francisco Center, Piper Four Five Six Seven Alpha, declaring an emergency, engine running rough due to suspected carburetor icing, twenty miles south of San Francisco at five thousand five hundred feet, request vectors to nearest suitable airport."
            }
        ];
        
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
        });
    }
    
    // Update flight information display
    updateFlightInfoDisplay(scenario) {
        // Safety check - ensure we have a valid scenario
        if (!scenario) {
            console.error("No scenario object provided to updateFlightInfoDisplay");
            return;
        }
        
        // Basic aircraft and airport information
        this.aircraftTypeEl.textContent = scenario.aircraft || "Unknown aircraft";
        this.tailNumberEl.textContent = scenario.tailNumber || "Unknown registration";
        this.airportEl.textContent = scenario.airport || "Unknown airport";
        this.airportTypeEl.textContent = scenario.isTowered !== undefined ? 
            (scenario.isTowered ? "Towered" : "Uncontrolled") : "Unknown";
        
        // Generate airport diagram
        window.generateAirportDiagram(this.airportDiagramEl, scenario.isTowered);
        
        // Weather information - only show if there's weather info available
        if (scenario.weatherInfo && scenario.weatherInfo.trim() !== '') {
            this.weatherInfo.textContent = scenario.weatherInfo;
            this.weatherContainer.classList.remove('hidden');
        } else {
            this.weatherContainer.classList.add('hidden');
        }
    }
    
    // Generate a new scenario using OpenAI's GPT-4o model
    async generateScenario() {
        // Show loading indicator
        this.scenarioLoading.classList.remove('hidden');
        this.scenarioDescription.classList.add('hidden');
        this.newScenarioBtn.disabled = true;
        document.getElementById('submit-response-btn').disabled = true;
        
        // Sample scenario objects to use as examples
        const examples = JSON.stringify(this.fewShotSamples, null, 2);
        
        try {
            // Get API key
            const apiKey = localStorage.getItem('openai_api_key');
            if (!apiKey) {
                window.showToast("OpenAI API key required. Please add your API key in the settings section below.", true);
                // Scroll to settings section
                document.getElementById('api-key-container').scrollIntoView({ behavior: 'smooth' });
                // Fall back to a random sample scenario
                this.currentScenario = this.fewShotSamples[Math.floor(Math.random() * this.fewShotSamples.length)];
                this.displayScenario(this.currentScenario);
                return;
            }
            
            // Create prompt with instructions for scenario generation
            const prompt = `Generate one new detailed VFR aviation radio communication scenario object for a pilot training application. The scenario should be diverse, realistic, and educational. Each scenario should include enough details for a pilot to craft an appropriate radio call.

Here are some examples of the format and variety of scenarios:

${examples}

Focus on creating scenarios that cover a wide range of common VFR communications, including:
- Initial contact with different ATC facilities (Ground, Tower, Approach, Center)
- Position reporting at towered and uncontrolled airports
- Taxi, takeoff, and landing requests
- Frequency changes
- Flight following requests
- Navigating through different airspaces
- Traffic advisories
- Weather information requests
- Emergency or abnormal situations (occasionally)

Your generated scenario should match this exact JSON structure with all fields. Make sure to:
1. Provide a clear, descriptive title
2. Keep the description concise and focused on the situation and task
3. Don't repeat information in the description that's already present in other fields
   - Don't mention ATIS code or airport details in the description if they're already in the weatherInfo or airport fields
   - The user will see the weatherInfo and airport fields separately alongside the description
4. Always include atcCall if an initial ATC call is relevant to the scenario 
5. Always include weatherInfo when relevant 
6. Choose appropriate aircraft types and real airports across the United States
7. Use proper aviation terminology and phraseology
8. ALWAYS include a correctResponse field with an example of the proper radio call for this scenario

Generate only ONE scenario object that strictly follows the given structure. Return ONLY valid JSON with no additional explanations or markdown formatting. The entire response should be parseable with JSON.parse().`;

            // Call OpenAI API
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
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
                    // Parse the JSON response
                    const generatedScenario = JSON.parse(responseContent);
                    
                    // Validate the scenario object
                    if (!this.validateScenario(generatedScenario)) {
                        console.error("Generated scenario is missing required fields");
                        throw new Error("Invalid scenario format");
                    }
                    
                    // Use the generated scenario
                    this.currentScenario = generatedScenario;
                    
                    // Update UI
                    this.displayScenario(this.currentScenario);
                } catch (e) {
                    console.error("Failed to parse scenario JSON:", e);
                    // Fall back to a random sample scenario
                    this.currentScenario = this.fewShotSamples[Math.floor(Math.random() * this.fewShotSamples.length)];
                    this.displayScenario(this.currentScenario);
                    window.showToast("Error parsing generated scenario. Using sample scenario instead.", true);
                }
            } else {
                // Handle error response
                const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error occurred' } }));
                console.error("OpenAI API error:", errorData);
                
                // Handle API key errors
                if (response.status === 401) {
                    localStorage.removeItem('openai_api_key');
                    window.showToast("Invalid OpenAI API key. Please check your settings.", true);
                } else {
                    window.showToast(`Error generating scenario: ${errorData.error?.message || 'Unknown error'}`, true);
                }
                
                // Fall back to a random sample scenario
                this.currentScenario = this.fewShotSamples[Math.floor(Math.random() * this.fewShotSamples.length)];
                this.displayScenario(this.currentScenario);
            }
        } catch (err) {
            console.error("Error generating scenario:", err);
            // Fall back to a random sample scenario
            this.currentScenario = this.fewShotSamples[Math.floor(Math.random() * this.fewShotSamples.length)];
            this.displayScenario(this.currentScenario);
            window.showToast(`Error: ${err.message}`, true);
        }
    }
    
    // Validate a scenario object
    validateScenario(scenario) {
        // Check for required fields
        const requiredFields = ['title', 'description', 'aircraft', 'tailNumber', 'airport', 'isTowered', 'correctResponse'];
        for (const field of requiredFields) {
            if (!scenario[field]) {
                return false;
            }
        }
        
        // Check for optional fields
        const optionalFields = ['atcCall', 'weatherInfo'];
        for (const field of optionalFields) {
            if (scenario[field] && typeof scenario[field] !== 'string') {
                return false;
            }
        }
        
        return true;
    }
    
    // Display the scenario in the UI
    displayScenario(scenario) {
        // Safety check - ensure we have a valid scenario
        if (!scenario) {
            console.error("No scenario object provided to displayScenario");
            window.showToast("Error displaying scenario", true);
            return;
        }
        
        // Hide loading indicator
        this.scenarioLoading.classList.add('hidden');
        this.scenarioDescription.classList.remove('hidden');
        this.newScenarioBtn.disabled = false;
        document.getElementById('submit-response-btn').disabled = false;
        
        // Create the scenario text with proper null check
        let scenarioText = `<p>${scenario.description || "No scenario description available"}</p>`;
        
        // Add ATC communication if present
        if (scenario.atcCall) {
            scenarioText += `
                <div class="mt-3 bg-[var(--light-border)] dark:bg-[var(--dark-border)] p-2 rounded-md font-medium relative">
                    <button class="play-atc-speech absolute left-1 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-8 h-8 text-[var(--primary)] hover:text-[var(--accent)] rounded-full transition-colors" 
                            data-speech="${scenario.atcCall.replace(/"/g, '&quot;')}" 
                            title="Play ATC speech">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                        </svg>
                    </button>
                    <div class="pl-8">
                        "${scenario.atcCall}"
                    </div>
                </div>`;
        }
        
        // Display the scenario
        this.scenarioDescription.innerHTML = scenarioText;
        
        // Add event listeners to play buttons
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
        
        // Update the flight information display
        this.updateFlightInfoDisplay(scenario);
        
        // Reset input
        document.getElementById('user-response').value = '';
        window.resetAudioRecording();
        document.getElementById('feedback-container').classList.add('hidden');
    }
    
    // Get the current scenario
    getCurrentScenario() {
        return this.currentScenario;
    }
}

// Export the ScenarioManager class
window.ScenarioManager = ScenarioManager;
