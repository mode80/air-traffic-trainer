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
        
        // Extended sample scenarios for more comprehensive training based on VFR communications taxonomy
        this.manyShotSamples = [
            // 1. Pre-Departure (VFR at a Controlled Field)
            // 1.1 Contacting Ground
            {
                description: "Request taxi clearance for VFR departure from controlled field",
                position: "Parked at main ramp, destination Springfield",
                atcCall: "",
                aircraft: "Cessna 172",
                tailNumber: "N123AB",
                airport: "KXYZ - Centerville Airport",
                isTowered: true,
                weatherInfo: "Centerville Airport, information Alpha. Winds 270 at 10 knots. Visibility 10 miles. Clear. Temperature 22, dew point 14. Altimeter 29.92. Landing and departing runway 27.",
                correctResponse: "Centerville Ground, Cessna One Two Three Alpha Bravo, at the main ramp with information Alpha, VFR to Springfield, request taxi."
            },
            {
                description: "Request taxi clearance for local VFR flight",
                position: "At the FBO, destination local practice area north",
                atcCall: "",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KMET - Metro Airport",
                isTowered: true,
                weatherInfo: "Metro Airport, information Charlie. Winds 180 at 8 knots. Visibility 10 miles. Few clouds at 5,000. Temperature 25, dew point 18. Altimeter 30.01. Landing and departing runway 18.",
                correctResponse: "Metro Ground, Cherokee Four Five X-ray, at the FBO with information Charlie, VFR to the north, ready to taxi."
            },
            // 1.2 VFR Clearance or Specific Instructions
            {
                description: "Request flight following during taxi",
                position: "Holding short of runway, destination Riverside",
                atcCall: "",
                aircraft: "Cessna 172",
                tailNumber: "N3412Z",
                airport: "KSKY - Skyhawk Airport",
                isTowered: true,
                weatherInfo: "Skyhawk Airport, information Delta. Winds 120 at 5 knots. Visibility 8 miles. Scattered clouds at 4,500. Temperature 23, dew point 15. Altimeter 29.95. Landing and departing runway 12.",
                correctResponse: "Skyhawk Ground, Cessna Three Four One Two Zulu, VFR to Riverside, request flight following."
            },
            {
                description: "Request taxi for local VFR flight without additional services",
                position: "At the main terminal, destination local practice area",
                atcCall: "",
                aircraft: "Piper Archer",
                tailNumber: "N7HP",
                airport: "KPPR - Piper Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Piper Ground, Archer Seven Hotel Papa, ready to taxi, VFR to local practice area."
            },
            
            // 2. Taxi and Run-Up
            // 2.1 Taxiing to Runway
            {
                description: "Respond to runway crossing instruction during taxi",
                position: "Taxiing on Taxiway Alpha",
                atcCall: "Cessna 123AB, cross Runway 15 at Alpha, hold short of Runway 25.",
                aircraft: "Cessna 172",
                tailNumber: "N123AB",
                airport: "KXYZ - Centerville Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Cross Runway One Five at Alpha, hold short Runway Two Five, One Two Three Alpha Bravo."
            },
            {
                description: "Respond to traffic avoidance instruction during taxi",
                position: "Taxiing on Taxiway Bravo",
                atcCall: "Cherokee 45X, give way to the King Air from your left, then continue to Runway 18 via Bravo.",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KMET - Metro Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Give way to King Air, then Runway One Eight via Bravo, Cherokee Four Five X-ray."
            },
            // 2.2 Run-Up Area / Final Checks
            {
                description: "Report ready for departure after run-up",
                position: "Holding short of Runway 25 after completing run-up",
                atcCall: "",
                aircraft: "Cessna 172",
                tailNumber: "N123AB",
                airport: "KXYZ - Centerville Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Centerville Tower, Cessna One Two Three Alpha Bravo, run-up complete, holding short Runway Two Five, ready for departure."
            },
            {
                description: "Request intersection departure after run-up",
                position: "At Taxiway Delta intersection with Runway 18",
                atcCall: "",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KMET - Metro Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Metro Tower, Cherokee Four Five X-ray, request intersection departure from Taxiway Delta, if able."
            },
            
            // 3. Takeoff / Departure Phase
            // 3.1 Contacting Tower for Takeoff
            {
                description: "Request takeoff with direction of flight",
                position: "Holding short of Runway 27, destination southbound",
                atcCall: "",
                aircraft: "Cessna 172",
                tailNumber: "N3412Z",
                airport: "KMET - Metro Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Metro Tower, Cessna Three Four One Two Zulu, ready for departure, Runway Two Seven, VFR southbound."
            },
            {
                description: "Respond to line up and wait instruction",
                position: "Holding short of Runway 10",
                atcCall: "Piper 78D, Runway 10, line up and wait.",
                aircraft: "Piper Warrior",
                tailNumber: "N78D",
                airport: "KTWD - Townsend Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Runway One Zero, line up and wait, Seven Eight Delta."
            },
            // 3.2 Departure Direction / Staying with Tower
            {
                description: "Respond to departure instructions to remain with tower",
                position: "On Runway 27, ready for takeoff",
                atcCall: "Cessna 123AB, after departure fly runway heading, remain on my frequency.",
                aircraft: "Cessna 172",
                tailNumber: "N123AB",
                airport: "KXYZ - Centerville Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Runway heading, remain with Tower, One Two Three Alpha Bravo."
            },
            {
                description: "Respond to frequency change instruction after takeoff",
                position: "Climbing through 1,000 feet after takeoff from Runway 18",
                atcCall: "Cherokee 45X, contact Departure on 120.5, have a good flight.",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KMET - Metro Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Contact Departure on One Two Zero point Five, Four Five X-ray."
            },
            
            // 4. En Route (VFR Flight Following or Self-Navigation)
            // 4.1 Requesting Flight Following
            {
                description: "Request VFR flight following en route",
                position: "10 miles west of ACT VOR at 4,500 feet, destination College Station",
                atcCall: "Cessna 3412Z, Fort Worth Center, go ahead.",
                aircraft: "Cessna 172",
                tailNumber: "N3412Z",
                airport: "KACT - Waco Regional Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Three Four One Two Zulu is a Cessna One Seven Two, Ten miles west of ACT VOR at Four Thousand Five Hundred, request flight following to College Station."
            },
            {
                description: "Request VFR advisories while inbound to an airport",
                position: "20 miles north of Addison Airport at 3,500 feet, destination Addison Airport",
                atcCall: "",
                aircraft: "Piper Archer",
                tailNumber: "N78D",
                airport: "KADS - Addison Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Approach, Piper Seven Eight Delta, Two Zero miles north of the field at Three Thousand Five Hundred, request VFR advisories, landing Addison."
            },
            // 4.2 Altitude / Route Changes
            {
                description: "Request altitude change due to clouds",
                position: "En route at 4,500 feet with clouds ahead",
                atcCall: "",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KCTR - Center City Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Center, Cherokee Four Five X-ray, request climb to Six Thousand Five Hundred for clouds."
            },
            {
                description: "Request route deviation for weather avoidance",
                position: "En route at 5,500 feet with weather ahead, destination Lake City Airport",
                atcCall: "",
                aircraft: "Cessna 172",
                tailNumber: "N123AB",
                airport: "KLKE - Lake City Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Approach, Cessna One Two Three Alpha Bravo, requesting direct Lake City VOR to avoid weather."
            },
            // 4.3 Leaving Frequency
            {
                description: "Respond to termination of radar services",
                position: "30 miles from destination at 4,500 feet, destination Easterwood Field",
                atcCall: "Cessna 3412Z, radar service terminated, squawk VFR, frequency change approved.",
                aircraft: "Cessna 172",
                tailNumber: "N3412Z",
                airport: "KCLL - Easterwood Field",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Squawk VFR, frequency change approved, Three Four One Two Zulu."
            },
            {
                description: "Cancel flight following when airport is in sight",
                position: "15 miles from destination at 3,000 feet with airport in sight, destination Fort Worth Spinks Airport",
                atcCall: "",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KFWS - Fort Worth Spinks Airport",
                isTowered: false,
                weatherInfo: "",
                correctResponse: "Center, Cherokee Four Five X-ray, we have the field in sight, cancel flight following."
            },
            
            // 5. Transitioning Controlled Airspace En Route
            // 5.1 Class C or Class D Airspace Overflight
            {
                description: "Request transition through Class D airspace",
                position: "5 miles north of Class D airport at 2,500 feet",
                atcCall: "",
                aircraft: "Cessna 172",
                tailNumber: "N123AB",
                airport: "KCTY - City Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "City Tower, Cessna One Two Three Alpha Bravo, Five miles north at Two Thousand Five Hundred, request transition through your Class Delta."
            },
            {
                description: "Request transition through Class C airspace",
                position: "10 miles west of Class C airport at 3,000 feet",
                atcCall: "",
                aircraft: "Piper Archer",
                tailNumber: "N78D",
                airport: "KMET - Metro Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Metro Approach, Piper Seven Eight Delta, One Zero miles west at Three Thousand, request transition through Class Charlie."
            },
            // 5.2 Class B Airspace
            {
                description: "Request transition through Class B airspace",
                position: "15 miles east of Class B airport at 3,500 feet",
                atcCall: "",
                aircraft: "Cessna 172",
                tailNumber: "N3412Z",
                airport: "KMET - Metro Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Metro Approach, Cessna Three Four One Two Zulu, One Five miles east at Three Thousand Five Hundred, request Class Bravo transition."
            },
            {
                description: "Respond to Class B clearance",
                position: "10 miles east of Class B airport at 3,500 feet",
                atcCall: "Cessna 3412Z, you are cleared through the Bravo airspace, maintain VFR at or below 3,500.",
                aircraft: "Cessna 172",
                tailNumber: "N3412Z",
                airport: "KMET - Metro Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Cleared through Bravo, at or below Three Thousand Five Hundred, Three Four One Two Zulu."
            },
            
            // 6. Arrival at Controlled Field
            // 6.1 Contact Approach or Tower
            {
                description: "Initial call to tower when inbound for landing",
                position: "10 miles south at 2,500 feet, destination Metro Airport",
                atcCall: "",
                aircraft: "Cessna 172",
                tailNumber: "N123AB",
                airport: "KMET - Metro Airport",
                isTowered: true,
                weatherInfo: "Metro Airport, information Delta. Winds 270 at 8 knots. Visibility 10 miles. Clear. Temperature 22, dew point 14. Altimeter 29.92. Landing and departing runway 27.",
                correctResponse: "Metro Tower, Cessna One Two Three Alpha Bravo, One Zero miles south at Two Thousand Five Hundred, inbound full stop with Information Delta."
            },
            {
                description: "Initial call to approach when inbound for landing",
                position: "15 miles east at 3,000 feet, destination Metro Airport",
                atcCall: "",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KMET - Metro Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Metro Approach, Cherokee Four Five X-ray, One Five miles east at Three Thousand, inbound for full stop at Metro."
            },
            // 6.2 Traffic Pattern Entry / Sequencing
            {
                description: "Respond to traffic sequencing instruction",
                position: "Entering downwind for Runway 27",
                atcCall: "Cherokee 45X, you're number 2 following a Skyhawk on left base.",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KMET - Metro Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Number Two following Skyhawk, Four Five X-ray."
            },
            {
                description: "Respond to straight-in approach instruction",
                position: "5 miles east of the airport at 2,000 feet",
                atcCall: "Cessna 3412Z, enter straight-in Runway 9, report 3-mile final.",
                aircraft: "Cessna 172",
                tailNumber: "N3412Z",
                airport: "KSKY - Skyhawk Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Straight-in Runway Niner, will report Three-mile final, Three Four One Two Zulu."
            },
            // 6.3 Landing Clearance
            {
                description: "Respond to landing clearance",
                position: "On final approach for Runway 27",
                atcCall: "Cessna 123AB, Runway 27, cleared to land.",
                aircraft: "Cessna 172",
                tailNumber: "N123AB",
                airport: "KXYZ - Centerville Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Runway Two Seven, cleared to land, One Two Three Alpha Bravo."
            },
            {
                description: "Respond to stop-and-go clearance",
                position: "On final approach for Runway 18",
                atcCall: "Cherokee 45X, Runway 18, cleared stop-and-go.",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KMET - Metro Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Cleared stop-and-go Runway One Eight, Four Five X-ray."
            },
            // 6.4 Go-Around / Missed Approach
            {
                description: "Report going around due to unstable approach",
                position: "On short final for Runway 27",
                atcCall: "",
                aircraft: "Cessna 172",
                tailNumber: "N123AB",
                airport: "KXYZ - Centerville Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Tower, One Two Three Alpha Bravo going around."
            },
            {
                description: "Respond to go-around instruction due to traffic on runway",
                position: "On short final for Runway 18",
                atcCall: "Cherokee 45X, traffic on the runway, go around.",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KMET - Metro Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Going around, Cherokee Four Five X-ray."
            },
            
            // 7. After Landing / Taxi to Parking
            // 7.1 Vacate Runway
            {
                description: "Respond to exit and frequency change instruction after landing",
                position: "Just landed on Runway 18",
                atcCall: "Cherokee 45X, exit right at Charlie, contact Ground 121.7.",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KMET - Metro Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Right at Charlie, then One Two One point Seven, Four Five X-ray."
            },
            {
                description: "Report clear of runway after landing",
                position: "Exiting Runway 27 at Taxiway Delta",
                atcCall: "",
                aircraft: "Cessna 172",
                tailNumber: "N123AB",
                airport: "KXYZ - Centerville Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Tower, Cessna One Two Three Alpha Bravo, clear of Runway Two Seven at Delta."
            },
            // 7.2 Contact Ground Control
            {
                description: "Request taxi to FBO after landing",
                position: "Clear of Runway 27 at Taxiway Delta",
                atcCall: "",
                aircraft: "Cessna 172",
                tailNumber: "N123AB",
                airport: "KXYZ - Centerville Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Ground, Cessna One Two Three Alpha Bravo, clear of Two Seven at Delta, taxi to FBO."
            },
            {
                description: "Request taxi to transient parking after landing",
                position: "At Taxiway Charlie 2 after landing",
                atcCall: "",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KMET - Metro Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Ground, Cherokee Four Five X-ray, at Charlie Two, request taxi to transient parking."
            },
            
            // 8. Special Requests / Situational Variations
            // 8.1 Practice Approaches
            {
                description: "Request practice instrument approach while VFR",
                position: "15 miles east of airport at 4,000 feet, destination Centerville Airport",
                atcCall: "",
                aircraft: "Cessna 172",
                tailNumber: "N3412Z",
                airport: "KXYZ - Centerville Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Centerville Approach, Cessna Three Four One Two Zulu, request practice ILS Runway Two Seven, VFR, full stop."
            },
            {
                description: "Request practice RNAV approach while in the pattern",
                position: "In the traffic pattern at pattern altitude",
                atcCall: "",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KMET - Metro Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Metro Tower, Cherokee Four Five X-ray, request VFR practice RNAV approach, option."
            },
            // 8.2 Emergency Calls
            {
                description: "Declare an emergency due to engine failure",
                position: "5 miles east of airport at 2,000 feet",
                atcCall: "",
                aircraft: "Cessna 172",
                tailNumber: "N123AB",
                airport: "KXYZ - Centerville Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Mayday, Mayday, Mayday, Cessna One Two Three Alpha Bravo, engine failure, Five miles east, Two Thousand feet."
            },
            {
                description: "Declare urgency situation due to partial power loss",
                position: "10 miles from airport at 3,500 feet, destination San Francisco International Airport",
                atcCall: "",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KSFO - San Francisco International Airport",
                isTowered: true,
                weatherInfo: "",
                correctResponse: "Pan-Pan, Pan-Pan, Pan-Pan, Piper Four Five X-ray, partial power loss, we need immediate return to airport."
            },
            // 8.3 SVFR (Special VFR)
            {
                description: "Request Special VFR departure in marginal weather",
                position: "At the main ramp, destination north",
                atcCall: "",
                aircraft: "Cessna 172",
                tailNumber: "N3412Z",
                airport: "KMET - Metro Airport",
                isTowered: true,
                weatherInfo: "Ceiling 1,200 overcast, visibility 3 miles in light rain",
                correctResponse: "Metro Tower, Cessna Three Four One Two Zulu, request Special VFR to depart to the north."
            },
            {
                description: "Respond to denial of Special VFR request",
                position: "5 miles south of airport at 2,000 feet",
                atcCall: "Cherokee 45X, negative Special VFR, IFR traffic inbound. Remain clear of Class D.",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KMET - Metro Airport",
                isTowered: true,
                weatherInfo: "Ceiling 900 overcast, visibility 2 miles in mist",
                correctResponse: "Remain clear, Four Five X-ray."
            },
            
            // Additional scenarios for uncontrolled airports
            {
                description: "Make position report at uncontrolled airport",
                position: "10 miles south at 2,500 feet, destination Uncontrolled Airport",
                atcCall: "",
                aircraft: "Cessna 172",
                tailNumber: "N123AB",
                airport: "KUNX - Uncontrolled Airport",
                isTowered: false,
                weatherInfo: "Automated weather: Wind 270 at 5 knots, visibility 10 miles, clear, altimeter 30.01",
                correctResponse: "Uncontrolled traffic, Cessna One Two Three Alpha Bravo, One Zero miles south, inbound for landing, Uncontrolled."
            },
            {
                description: "Report entering downwind at uncontrolled airport",
                position: "Entering left downwind for Runway 27",
                atcCall: "",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KUNX - Uncontrolled Airport",
                isTowered: false,
                weatherInfo: "",
                correctResponse: "Uncontrolled traffic, Cherokee Four Five X-ray, entering left downwind for Runway Two Seven, Uncontrolled."
            },
            {
                description: "Report final approach at uncontrolled airport",
                position: "On final approach for Runway 18",
                atcCall: "",
                aircraft: "Cessna 172",
                tailNumber: "N3412Z",
                airport: "KUNX - Uncontrolled Airport",
                isTowered: false,
                weatherInfo: "",
                correctResponse: "Uncontrolled traffic, Cessna Three Four One Two Zulu, final Runway One Eight, full stop, Uncontrolled."
            },
            {
                description: "Report clear of runway at uncontrolled airport",
                position: "Just exited Runway 27 after landing",
                atcCall: "",
                aircraft: "Cessna 172",
                tailNumber: "N123AB",
                airport: "KUNX - Uncontrolled Airport",
                isTowered: false,
                weatherInfo: "",
                correctResponse: "Uncontrolled traffic, Cessna One Two Three Alpha Bravo, clear of Runway Two Seven, taxiing to parking, Uncontrolled."
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
            // Reset the flag to track whether the user has peeked or made a radio call
            window.hasPeekedOrMadeFirstCall = false;
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
        
        // Position information
        const positionInfoEl = document.getElementById('position-info');
        const positionContainer = document.getElementById('position-container');
        if (positionInfoEl) {
            const positionText = scenario.position || "Unknown position";
            positionInfoEl.textContent = positionText;
            
            // Always show the position container when we have a valid position
            if (positionContainer) {
                if (positionText === "Unknown position") {
                    positionContainer.classList.add('hidden');
                } else {
                    positionContainer.classList.remove('hidden');
                }
            }
        }
        
        // Generate airport diagram with position information
        window.generateAirportDiagram(this.airportDiagramEl, scenario.isTowered, scenario.position, scenario.weatherInfo || '');
        
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
        
        // Sample scenario objects to use as examples - limit to 10 random examples to keep prompt size manageable
        const sampleSize = 10;
        const randomSamples = [...this.manyShotSamples].sort(() => 0.5 - Math.random()).slice(0, sampleSize);
        const examples = JSON.stringify(randomSamples, null, 2);
        
        try {
            // Get API key
            const apiKey = localStorage.getItem('openai_api_key');
            if (!apiKey) {
                window.showToast("OpenAI API key required. Please add your API key in the settings section below.", true);
                // Scroll to settings section
                document.getElementById('api-key-container').scrollIntoView({ behavior: 'smooth' });
                // Fall back to a random sample scenario
                this.currentScenario = this.manyShotSamples[Math.floor(Math.random() * this.manyShotSamples.length)];
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
8. ALWAYS include every field in the JSON object above (description, position, atcCall, aircraft, tailNumber, airport, isTowered, weatherInfo, correctResponse) 
9. The generated scenario should be realistic, and educational

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
                    // Log the raw response for debugging
                    console.log("Raw API response content:", responseContent);
                    
                    // Parse the JSON response
                    let generatedScenario;
                    try {
                        generatedScenario = JSON.parse(responseContent);
                        console.log("Parsed scenario:", generatedScenario);
                    } catch (parseError) {
                        console.error("JSON Parse Error:", parseError);
                        console.error("Failed to parse response:", responseContent);
                        throw new Error(`JSON parsing failed: ${parseError.message}`);
                    }
                    
                    // Validate the scenario object
                    const validationResult = this.validateScenario(generatedScenario);
                    if (!validationResult.isValid) {
                        console.error("Scenario validation failed:", validationResult.errors);
                        console.error("Invalid scenario object:", generatedScenario);
                        throw new Error(`Invalid scenario format: ${validationResult.errors.join(', ')}`);
                    }
                    
                    // Use the generated scenario
                    this.currentScenario = generatedScenario;
                    
                    // Update UI
                    this.displayScenario(this.currentScenario);
                } catch (e) {
                    console.error("Scenario generation error:", e);
                    // Fall back to a random sample scenario
                    console.log("Falling back to sample scenario");
                    this.currentScenario = this.manyShotSamples[Math.floor(Math.random() * this.manyShotSamples.length)];
                    this.displayScenario(this.currentScenario);
                    window.showToast(`Error generating scenario: ${e.message}. Using sample scenario instead.`, true);
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
                this.currentScenario = this.manyShotSamples[Math.floor(Math.random() * this.manyShotSamples.length)];
                this.displayScenario(this.currentScenario);
            }
        } catch (err) {
            console.error("Error generating scenario:", err);
            // Fall back to a random sample scenario
            this.currentScenario = this.manyShotSamples[Math.floor(Math.random() * this.manyShotSamples.length)];
            this.displayScenario(this.currentScenario);
            window.showToast(`Error: ${err.message}`, true);
        }
    }
    
    // Validate a scenario object
    validateScenario(scenario) {
        const errors = [];
        
        // First check if scenario is an object
        if (!scenario || typeof scenario !== 'object') {
            return { isValid: false, errors: ['Scenario is not a valid object'] };
        }
        
        // Check for required fields
        const requiredFields = ['description', 'position', 'aircraft', 'tailNumber', 'airport', 'isTowered', 'correctResponse'];
        for (const field of requiredFields) {
            if (scenario[field] === undefined || scenario[field] === null || scenario[field] === '') {
                errors.push(`Missing required field: ${field}`);
            }
        }
        
        // Check for optional fields format
        const optionalFields = ['atcCall', 'weatherInfo'];
        for (const field of optionalFields) {
            if (scenario[field] !== undefined && typeof scenario[field] !== 'string') {
                errors.push(`Field ${field} must be a string`);
            }
        }
        
        // Check isTowered is boolean
        if (scenario.isTowered !== undefined && typeof scenario.isTowered !== 'boolean') {
            errors.push('Field isTowered must be a boolean');
        }
        
        return { 
            isValid: errors.length === 0, 
            errors: errors 
        };
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
        
        // Create the scenario text with proper null check - don't include ATC call since it will be in the Interaction panel
        let scenarioText = `<p>${scenario.description || "No scenario description available"}</p>`;
        
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
        
        // Initialize the interaction panel
        if (window.evaluationManager && typeof window.evaluationManager.initializeInteraction === 'function') {
            window.evaluationManager.initializeInteraction();
        }
    }
    
    // Get the current scenario
    getCurrentScenario() {
        return this.currentScenario;
    }
}

// Export the ScenarioManager class
window.ScenarioManager = ScenarioManager;
