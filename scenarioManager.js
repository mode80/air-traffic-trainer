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
                description: "You need to request taxi clearance from ground control for departure to the east on runway 31.",
                position: "Parked at the main ramp",
                atcCall: null,
                weatherInfo: "Palo Alto Airport, information Alpha. Winds 310 at 8 knots. Visibility 10 miles. Clear below 12,000. Temperature 22, dew point 14. Altimeter 29.92. Landing and departing runway 31. Advise on initial contact you have information Alpha.",
                aircraft: "Cessna 172 Skyhawk",
                tailNumber: "N567AP",
                airport: "KPAO - Palo Alto Airport",
                isTowered: true,
                correctResponse: "Palo Alto Ground, Skyhawk Five Six Seven Eight Papa at the main ramp with information Alpha, request taxi for eastbound departure."
            },
            {
                description: "You have received the following traffic advisory from Approach. Respond appropriately.",
                position: "15 miles east at 4,500 feet MSL, heading 270°",
                atcCall: "Cessna Seven One Two Three Four, traffic, two o'clock, five miles, eastbound, altitude indicates three thousand five hundred.",
                weatherInfo: "",
                aircraft: "Cessna 172 Skyhawk",
                tailNumber: "N7123AB",
                airport: "KOAK - Oakland International Airport",
                isTowered: true,
                correctResponse: "Oakland Approach, Cessna Seven One Two Three Four, looking for traffic."
            },
            {
                description: "You need to make your position report on CTAF.",
                position: "Downwind leg in the traffic pattern for runway 27 at traffic pattern altitude",
                atcCall: null,
                weatherInfo: "Reid-Hillview Automated Weather Observation, 1845 Zulu. Wind 250 at 6 knots. Visibility 10 miles. Clear below 12,000. Temperature 23 Celsius, dew point 14 Celsius. Altimeter 29.92. Runway 31L in use.",
                aircraft: "Cessna 152",
                tailNumber: "N987TC",
                airport: "KRHV - Reid-Hillview Airport", 
                isTowered: false,
                correctResponse: "Reid-Hillview traffic, Cessna Niner Eight Seven Six Five, midfield downwind for runway two seven, Reid-Hillview."
            },
            {
                description: "Your engine has started running rough and you suspect carburetor icing. You need to declare an emergency to ATC.",
                position: "20 miles south at 5,500 feet MSL",
                atcCall: null,
                weatherInfo: "",
                aircraft: "Piper Cherokee",
                tailNumber: "N456VB",
                airport: "KSFO - San Francisco International Airport",
                isTowered: true,
                correctResponse: "San Francisco Center, Piper Four Five Six Seven Alpha, declaring an emergency, engine running rough due to suspected carburetor icing, twenty miles south of San Francisco at five thousand five hundred feet, request vectors to nearest suitable airport."
            }
        ];
        
        // Extended sample scenarios for more comprehensive training based on VFR communications taxonomy
        this.manyShotSamples = [
            // 1. Pre-Departure (VFR at a Controlled Field)
            // 1.1 Contacting Ground
            {
                description: "Request taxi clearance for VFR departure from controlled field",
                position: "Parked at main ramp",
                atcCall: null,
                weatherInfo: "Centerville Airport, information Alpha. Winds 270 at 10 knots. Visibility 10 miles. Clear. Temperature 22, dew point 14. Altimeter 29.92. Landing and departing runway 27.",
                aircraft: "Cessna 172",
                tailNumber: "N123AB",
                airport: "KXYZ - Centerville Airport",
                isTowered: true,
                correctResponse: "Centerville Ground, Cessna 123AB, at the main ramp with information Alpha, VFR to Springfield, request taxi."
            },
            {
                description: "Request taxi clearance for local VFR flight",
                position: "At the FBO",
                atcCall: null,
                weatherInfo: "Metro Airport, information Charlie. Winds 180 at 8 knots. Visibility 10 miles. Few clouds at 5,000. Temperature 25, dew point 18. Altimeter 30.01. Landing and departing runway 18.",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KMET - Metro Airport",
                isTowered: true,
                correctResponse: "Metro Ground, Cherokee 45X, at the FBO with information Charlie, VFR to the north, ready to taxi."
            },
            // 1.2 VFR Clearance or Specific Instructions
            {
                description: "Request flight following during taxi",
                position: "Holding short of runway",
                atcCall: null,
                weatherInfo: "Skyhawk Airport, information Delta. Winds 120 at 5 knots. Visibility 8 miles. Scattered clouds at 4,500. Temperature 23, dew point 15. Altimeter 29.95. Landing and departing runway 12.",
                aircraft: "Cessna 172",
                tailNumber: "N3412Z",
                airport: "KSKY - Skyhawk Airport",
                isTowered: true,
                correctResponse: "Skyhawk Ground, Cessna 3412Z, VFR to Riverside, request flight following."
            },
            {
                description: "Request taxi for local VFR flight without additional services",
                position: "At the main terminal",
                atcCall: null,
                weatherInfo: "",
                aircraft: "Piper Archer",
                tailNumber: "N7HP",
                airport: "KPPR - Piper Airport",
                isTowered: true,
                correctResponse: "Piper Ground, Archer 7HP, ready to taxi, VFR to local practice area."
            },
            
            // 2. Taxi and Run-Up
            // 2.1 Taxiing to Runway
            {
                description: "Respond to runway crossing instruction during taxi",
                position: "Taxiing on Taxiway Alpha",
                atcCall: "Cessna 123AB, cross Runway 15 at Alpha, hold short of Runway 25.",
                weatherInfo: "",
                aircraft: "Cessna 172",
                tailNumber: "N123AB",
                airport: "KXYZ - Centerville Airport",
                isTowered: true,
                correctResponse: "Cross Runway 15 at Alpha, hold short Runway 25, 123AB."
            },
            {
                description: "Respond to traffic avoidance instruction during taxi",
                position: "Taxiing on Taxiway Bravo",
                atcCall: "Cherokee 45X, give way to the King Air from your left, then continue to Runway 18 via Bravo.",
                weatherInfo: "",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KMET - Metro Airport",
                isTowered: true,
                correctResponse: "Give way to King Air, then Runway 18 via Bravo, Cherokee 45X."
            },
            // 2.2 Run-Up Area / Final Checks
            {
                description: "Report ready for departure after run-up",
                position: "Holding short of Runway 25 after completing run-up",
                atcCall: null,
                weatherInfo: "",
                aircraft: "Cessna 172",
                tailNumber: "N123AB",
                airport: "KXYZ - Centerville Airport",
                isTowered: true,
                correctResponse: "Centerville Tower, Cessna 123AB, run-up complete, holding short Runway 25, ready for departure."
            },
            {
                description: "Request intersection departure after run-up",
                position: "At Taxiway Delta intersection with Runway 18",
                atcCall: null,
                weatherInfo: "",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KMET - Metro Airport",
                isTowered: true,
                correctResponse: "Metro Tower, Cherokee 45X, request intersection departure from Taxiway Delta, if able."
            },
            
            // 3. Takeoff / Departure Phase
            // 3.1 Contacting Tower for Takeoff
            {
                description: "Request takeoff with direction of flight",
                position: "Holding short of Runway 27",
                atcCall: null,
                weatherInfo: "",
                aircraft: "Cessna 172",
                tailNumber: "N3412Z",
                airport: "KMET - Metro Airport",
                isTowered: true,
                correctResponse: "Metro Tower, Cessna 3412Z, ready for departure, Runway 27, VFR southbound."
            },
            {
                description: "Respond to line up and wait instruction",
                position: "Holding short of Runway 10",
                atcCall: "Piper 78D, Runway 10, line up and wait.",
                weatherInfo: "",
                aircraft: "Piper Warrior",
                tailNumber: "N78D",
                airport: "KTWD - Townsend Airport",
                isTowered: true,
                correctResponse: "Runway 10, line up and wait, 78D."
            },
            // 3.2 Departure Direction / Staying with Tower
            {
                description: "Respond to departure instructions to remain with tower",
                position: "On Runway 27, ready for takeoff",
                atcCall: "Cessna 123AB, after departure fly runway heading, remain on my frequency.",
                weatherInfo: "",
                aircraft: "Cessna 172",
                tailNumber: "N123AB",
                airport: "KXYZ - Centerville Airport",
                isTowered: true,
                correctResponse: "Runway heading, remain with Tower, 123AB."
            },
            {
                description: "Respond to frequency change instruction after takeoff",
                position: "Climbing through 1,000 feet after takeoff from Runway 18",
                atcCall: "Cherokee 45X, contact Departure on 120.5, have a good flight.",
                weatherInfo: "",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KMET - Metro Airport",
                isTowered: true,
                correctResponse: "Contact Departure on 120.5, 45X."
            },
            
            // 4. En Route (VFR Flight Following or Self-Navigation)
            // 4.1 Requesting Flight Following
            {
                description: "Request VFR flight following en route",
                position: "10 miles west of ACT VOR at 4,500 feet",
                atcCall: "Cessna 3412Z, Fort Worth Center, go ahead.",
                weatherInfo: "",
                aircraft: "Cessna 172",
                tailNumber: "N3412Z",
                airport: "KACT - Waco Regional Airport",
                isTowered: true,
                correctResponse: "3412Z is a Cessna 172, 10 miles west of ACT VOR at 4,500, request flight following to College Station."
            },
            {
                description: "Request VFR advisories while inbound to an airport",
                position: "20 miles north of Addison Airport at 3,500 feet",
                atcCall: null,
                weatherInfo: "",
                aircraft: "Piper Archer",
                tailNumber: "N78D",
                airport: "KADS - Addison Airport",
                isTowered: true,
                correctResponse: "Approach, Piper 78D, 20 miles north of the field at 3,500, request VFR advisories, landing Addison."
            },
            // 4.2 Altitude / Route Changes
            {
                description: "Request altitude change due to clouds",
                position: "En route at 4,500 feet with clouds ahead",
                atcCall: null,
                weatherInfo: "",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KCTR - Center City Airport",
                isTowered: true,
                correctResponse: "Center, Cherokee 45X, request climb to 6,500 for clouds."
            },
            {
                description: "Request route deviation for weather avoidance",
                position: "En route at 5,500 feet with weather ahead",
                atcCall: null,
                weatherInfo: "",
                aircraft: "Cessna 172",
                tailNumber: "N123AB",
                airport: "KLKE - Lake City Airport",
                isTowered: true,
                correctResponse: "Approach, Cessna 123AB, requesting direct Lake City VOR to avoid weather."
            },
            // 4.3 Leaving Frequency
            {
                description: "Respond to termination of radar services",
                position: "30 miles from destination at 4,500 feet",
                atcCall: "Cessna 3412Z, radar service terminated, squawk VFR, frequency change approved.",
                weatherInfo: "",
                aircraft: "Cessna 172",
                tailNumber: "N3412Z",
                airport: "KCLL - Easterwood Field",
                isTowered: true,
                correctResponse: "Squawk VFR, frequency change approved, 3412Z."
            },
            {
                description: "Cancel flight following when airport is in sight",
                position: "15 miles from destination at 3,000 feet with airport in sight",
                atcCall: null,
                weatherInfo: "",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KFWS - Fort Worth Spinks Airport",
                isTowered: false,
                correctResponse: "Center, Cherokee 45X, we have the field in sight, cancel flight following."
            },
            
            // 5. Transitioning Controlled Airspace En Route
            // 5.1 Class C or Class D Airspace Overflight
            {
                description: "Request transition through Class D airspace",
                position: "5 miles north of Class D airport at 2,500 feet",
                atcCall: null,
                weatherInfo: "",
                aircraft: "Cessna 172",
                tailNumber: "N123AB",
                airport: "KCTY - City Airport",
                isTowered: true,
                correctResponse: "City Tower, Cessna 123AB, 5 miles north at 2,500, request transition through your Class D."
            },
            {
                description: "Request transition through Class C airspace",
                position: "10 miles west of Class C airport at 3,000 feet",
                atcCall: null,
                weatherInfo: "",
                aircraft: "Piper Archer",
                tailNumber: "N78D",
                airport: "KMET - Metro Airport",
                isTowered: true,
                correctResponse: "Metro Approach, Piper 78D, 10 miles west at 3,000, request transition through Class C."
            },
            // 5.2 Class B Airspace
            {
                description: "Request transition through Class B airspace",
                position: "15 miles east of Class B airport at 3,500 feet",
                atcCall: null,
                weatherInfo: "",
                aircraft: "Cessna 172",
                tailNumber: "N3412Z",
                airport: "KMET - Metro Airport",
                isTowered: true,
                correctResponse: "Metro Approach, Cessna 3412Z, 15 miles east at 3,500, request Class B transition."
            },
            {
                description: "Respond to Class B clearance",
                position: "10 miles east of Class B airport at 3,500 feet",
                atcCall: "Cessna 3412Z, you are cleared through the Bravo airspace, maintain VFR at or below 3,500.",
                weatherInfo: "",
                aircraft: "Cessna 172",
                tailNumber: "N3412Z",
                airport: "KMET - Metro Airport",
                isTowered: true,
                correctResponse: "Cleared through Bravo, at or below 3,500, 3412Z."
            },
            
            // 6. Arrival at Controlled Field
            // 6.1 Contact Approach or Tower
            {
                description: "Initial call to tower when inbound for landing",
                position: "10 miles south at 2,500 feet",
                atcCall: null,
                weatherInfo: "Metro Airport, information Delta. Winds 270 at 8 knots. Visibility 10 miles. Clear. Temperature 22, dew point 14. Altimeter 29.92. Landing and departing runway 27.",
                aircraft: "Cessna 172",
                tailNumber: "N123AB",
                airport: "KMET - Metro Airport",
                isTowered: true,
                correctResponse: "Metro Tower, Cessna 123AB, 10 miles south at 2,500, inbound full stop with Information Delta."
            },
            {
                description: "Initial call to approach when inbound for landing",
                position: "15 miles east at 3,000 feet",
                atcCall: null,
                weatherInfo: "",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KMET - Metro Airport",
                isTowered: true,
                correctResponse: "Metro Approach, Cherokee 45X, 15 miles east at 3,000, inbound for full stop at Metro."
            },
            // 6.2 Traffic Pattern Entry / Sequencing
            {
                description: "Respond to traffic sequencing instruction",
                position: "Entering downwind for Runway 27",
                atcCall: "Cherokee 45X, you're number 2 following a Skyhawk on left base.",
                weatherInfo: "",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KMET - Metro Airport",
                isTowered: true,
                correctResponse: "Number 2 following Skyhawk, 45X."
            },
            {
                description: "Respond to straight-in approach instruction",
                position: "5 miles east of the airport at 2,000 feet",
                atcCall: "Cessna 3412Z, enter straight-in Runway 9, report 3-mile final.",
                weatherInfo: "",
                aircraft: "Cessna 172",
                tailNumber: "N3412Z",
                airport: "KSKY - Skyhawk Airport",
                isTowered: true,
                correctResponse: "Straight-in Runway 9, will report 3-mile final, 3412Z."
            },
            // 6.3 Landing Clearance
            {
                description: "Respond to landing clearance",
                position: "On final approach for Runway 27",
                atcCall: "Cessna 123AB, Runway 27, cleared to land.",
                weatherInfo: "",
                aircraft: "Cessna 172",
                tailNumber: "N123AB",
                airport: "KXYZ - Centerville Airport",
                isTowered: true,
                correctResponse: "Runway 27, cleared to land, 123AB."
            },
            {
                description: "Respond to stop-and-go clearance",
                position: "On final approach for Runway 18",
                atcCall: "Cherokee 45X, Runway 18, cleared stop-and-go.",
                weatherInfo: "",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KMET - Metro Airport",
                isTowered: true,
                correctResponse: "Cleared stop-and-go Runway 18, 45X."
            },
            // 6.4 Go-Around / Missed Approach
            {
                description: "Report going around due to unstable approach",
                position: "On short final for Runway 27",
                atcCall: null,
                weatherInfo: "",
                aircraft: "Cessna 172",
                tailNumber: "N123AB",
                airport: "KXYZ - Centerville Airport",
                isTowered: true,
                correctResponse: "Tower, 123AB going around."
            },
            {
                description: "Respond to go-around instruction due to traffic on runway",
                position: "On short final for Runway 18",
                atcCall: "Cherokee 45X, traffic on the runway, go around.",
                weatherInfo: "",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KMET - Metro Airport",
                isTowered: true,
                correctResponse: "Going around, Cherokee 45X."
            },
            
            // 7. After Landing / Taxi to Parking
            // 7.1 Vacate Runway
            {
                description: "Respond to exit and frequency change instruction after landing",
                position: "Just landed on Runway 18",
                atcCall: "Cherokee 45X, exit right at Charlie, contact Ground 121.7.",
                weatherInfo: "",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KMET - Metro Airport",
                isTowered: true,
                correctResponse: "Right at Charlie, then 121.7, 45X."
            },
            {
                description: "Report clear of runway after landing",
                position: "Exiting Runway 27 at Taxiway Delta",
                atcCall: null,
                weatherInfo: "",
                aircraft: "Cessna 172",
                tailNumber: "N123AB",
                airport: "KXYZ - Centerville Airport",
                isTowered: true,
                correctResponse: "Tower, Cessna 123AB, clear of Runway 27 at Delta."
            },
            // 7.2 Contact Ground Control
            {
                description: "Request taxi to FBO after landing",
                position: "Clear of Runway 27 at Taxiway Delta",
                atcCall: null,
                weatherInfo: "",
                aircraft: "Cessna 172",
                tailNumber: "N123AB",
                airport: "KXYZ - Centerville Airport",
                isTowered: true,
                correctResponse: "Ground, Cessna 123AB, clear of 27 at Delta, taxi to FBO."
            },
            {
                description: "Request taxi to transient parking after landing",
                position: "At Taxiway Charlie 2 after landing",
                atcCall: null,
                weatherInfo: "",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KMET - Metro Airport",
                isTowered: true,
                correctResponse: "Ground, Cherokee 45X, at Charlie 2, request taxi to transient parking."
            },
            
            // 8. Special Requests / Situational Variations
            // 8.1 Practice Approaches
            {
                description: "Request practice instrument approach while VFR",
                position: "15 miles east of airport at 4,000 feet",
                atcCall: null,
                weatherInfo: "",
                aircraft: "Cessna 172",
                tailNumber: "N3412Z",
                airport: "KXYZ - Centerville Airport",
                isTowered: true,
                correctResponse: "Centerville Approach, Cessna 3412Z, request practice ILS Runway 27, VFR, full stop."
            },
            {
                description: "Request practice RNAV approach while in the pattern",
                position: "In the traffic pattern at pattern altitude",
                atcCall: null,
                weatherInfo: "",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KMET - Metro Airport",
                isTowered: true,
                correctResponse: "Metro Tower, Cherokee 45X, request VFR practice RNAV approach, option."
            },
            // 8.2 Emergency Calls
            {
                description: "Declare an emergency due to engine failure",
                position: "5 miles east of airport at 2,000 feet",
                atcCall: null,
                weatherInfo: "",
                aircraft: "Cessna 172",
                tailNumber: "N123AB",
                airport: "KXYZ - Centerville Airport",
                isTowered: true,
                correctResponse: "Mayday, Mayday, Mayday, Cessna 123AB, engine failure, 5 miles east, 2,000 feet."
            },
            {
                description: "Declare urgency situation due to partial power loss",
                position: "10 miles from airport at 3,500 feet",
                atcCall: null,
                weatherInfo: "",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KSFO - San Francisco International Airport",
                isTowered: true,
                correctResponse: "Pan-Pan, Pan-Pan, Pan-Pan, Piper 45X, partial power loss, we need immediate return to airport."
            },
            // 8.3 SVFR (Special VFR)
            {
                description: "Request Special VFR departure in marginal weather",
                position: "At the main ramp",
                atcCall: null,
                weatherInfo: "Ceiling 1,200 overcast, visibility 3 miles in light rain",
                aircraft: "Cessna 172",
                tailNumber: "N3412Z",
                airport: "KMET - Metro Airport",
                isTowered: true,
                correctResponse: "Metro Tower, Cessna 3412Z, request Special VFR to depart to the north."
            },
            {
                description: "Respond to denial of Special VFR request",
                position: "5 miles south of airport at 2,000 feet",
                atcCall: "Cherokee 45X, negative Special VFR, IFR traffic inbound. Remain clear of Class D.",
                weatherInfo: "Ceiling 900 overcast, visibility 2 miles in mist",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KMET - Metro Airport",
                isTowered: true,
                correctResponse: "Remain clear, 45X."
            },
            
            // Additional scenarios for uncontrolled airports
            {
                description: "Make position report at uncontrolled airport",
                position: "10 miles south at 2,500 feet",
                atcCall: null,
                weatherInfo: "Automated weather: Wind 270 at 5 knots, visibility 10 miles, clear, altimeter 30.01",
                aircraft: "Cessna 172",
                tailNumber: "N123AB",
                airport: "KUNX - Uncontrolled Airport",
                isTowered: false,
                correctResponse: "Uncontrolled traffic, Cessna 123AB, 10 miles south, inbound for landing, Uncontrolled."
            },
            {
                description: "Report entering downwind at uncontrolled airport",
                position: "Entering left downwind for Runway 27",
                atcCall: null,
                weatherInfo: "",
                aircraft: "Piper Cherokee",
                tailNumber: "N45X",
                airport: "KUNX - Uncontrolled Airport",
                isTowered: false,
                correctResponse: "Uncontrolled traffic, Cherokee 45X, entering left downwind for Runway 27, Uncontrolled."
            },
            {
                description: "Report final approach at uncontrolled airport",
                position: "On final approach for Runway 18",
                atcCall: null,
                weatherInfo: "",
                aircraft: "Cessna 172",
                tailNumber: "N3412Z",
                airport: "KUNX - Uncontrolled Airport",
                isTowered: false,
                correctResponse: "Uncontrolled traffic, Cessna 3412Z, final Runway 18, full stop, Uncontrolled."
            },
            {
                description: "Report clear of runway at uncontrolled airport",
                position: "Just exited Runway 27 after landing",
                atcCall: null,
                weatherInfo: "",
                aircraft: "Cessna 172",
                tailNumber: "N123AB",
                airport: "KUNX - Uncontrolled Airport",
                isTowered: false,
                correctResponse: "Uncontrolled traffic, Cessna 123AB, clear of Runway 27, taxiing to parking, Uncontrolled."
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
        if (positionInfoEl) {
            positionInfoEl.textContent = scenario.position || "Unknown position";
        }
        
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

Your generated scenario MUST follow this exact JSON structure with all required fields:
{
  "description": "Brief description of the situation and task",
  "position": "Specific aircraft position in aviation terms",
  "atcCall": "Initial ATC call if relevant (or null)",
  "weatherInfo": "Weather information if relevant (or empty string)",
  "aircraft": "Aircraft type",
  "tailNumber": "Aircraft tail number",
  "airport": "Airport code and name",
  "isTowered": true or false,
  "correctResponse": "Example of the proper radio call"
}

Important requirements:
1. The 'position' field is REQUIRED and must clearly indicate the aircraft's location in appropriate aviation terms
2. Keep the description concise and focused on the situation and task
3. Don't repeat position information in the description that's already in the position field
4. Don't mention ATIS code or airport details in the description if they're already in the weatherInfo or airport fields
5. Always include atcCall if an initial ATC call is relevant to the scenario (or null if not)
6. Always include weatherInfo when relevant (or empty string if not)
7. Choose appropriate aircraft types and real airports across the United States
8. Use proper aviation terminology and phraseology
9. ALWAYS include a correctResponse field with an example of the proper radio call for this scenario

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
            if (scenario[field] !== undefined && scenario[field] !== null && typeof scenario[field] !== 'string') {
                errors.push(`Field ${field} must be a string or null`);
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
