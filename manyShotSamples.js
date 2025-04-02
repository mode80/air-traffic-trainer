// Extended sample scenarios for more comprehensive training based on VFR communications taxonomy
const manyShotSamples = [
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
        correctResponse: "Center, Cherokee Four Five X-ray, request descent to three thousand five hundred due to clouds."
    },
    {
        description: "Respond to traffic advisory and request vector",
        position: "En route at 5,500 feet",
        atcCall: "Cessna 12Z, traffic 10 o'clock, 3 miles, opposite direction, altitude indicates 5,000.",
        aircraft: "Cessna 172",
        tailNumber: "N3412Z",
        airport: "KMAP - Mapleton Muni",
        isTowered: false,
        weatherInfo: "",
        correctResponse: "Looking for traffic, Twelve Zulu. Traffic in sight. Request vector around traffic."
    },
    
    // 5. Arrival / Approach (VFR at a Controlled Field)
    // 5.1 Contacting Approach Control
    {
        description: "Initial contact with approach control for VFR landing",
        position: "20 miles south of Springfield Muni at 6,500 feet, with information Bravo",
        atcCall: "",
        aircraft: "Cessna 172",
        tailNumber: "N123AB",
        airport: "KSPI - Springfield Muni",
        isTowered: true,
        weatherInfo: "Springfield Muni, information Bravo. Winds 090 at 12 knots. Visibility 10 miles. Sky clear. Temperature 28, dew point 12. Altimeter 29.98. Landing runway 09.",
        correctResponse: "Springfield Approach, Cessna One Two Three Alpha Bravo, Two Zero miles south at Six Thousand Five Hundred, VFR landing Springfield with information Bravo."
    },
    {
        description: "Respond to squawk code and altitude instruction from Approach",
        position: "Inbound to Denton",
        atcCall: "Archer 78D, squawk 0432, report reaching 3,000.",
        aircraft: "Piper Archer",
        tailNumber: "N78D",
        airport: "KDTO - Denton Enterprise",
        isTowered: true,
        weatherInfo: "",
        correctResponse: "Squawk Zero Four Three Two, report three thousand, Seven Eight Delta."
    },
    // 5.2 Contacting Tower
    {
        description: "Contact Tower when instructed by Approach",
        position: "5 miles west of the field, inbound",
        atcCall: "Cessna 3AB, contact Tower on 118.7.",
        aircraft: "Cessna 172",
        tailNumber: "N123AB",
        airport: "KSPI - Springfield Muni",
        isTowered: true,
        weatherInfo: "",
        correctResponse: "One Eighteen Point Seven, Three Alpha Bravo. Springfield Tower, Cessna One Two Three Alpha Bravo, Five miles west, inbound for landing."
    },
    {
        description: "Respond to pattern entry instruction from Tower",
        position: "Entering the pattern",
        atcCall: "Cherokee 45X, enter left downwind for Runway 18.",
        aircraft: "Piper Cherokee",
        tailNumber: "N45X",
        airport: "KMET - Metro Airport",
        isTowered: true,
        weatherInfo: "",
        correctResponse: "Enter left downwind, Runway One Eight, Cherokee Four Five X-ray."
    },
    
    // 6. Landing and Taxi-In
    // 6.1 Clearance to Land
    {
        description: "Respond to landing clearance",
        position: "On final approach for Runway 09",
        atcCall: "Cessna 3AB, Runway 09, cleared to land. Wind 090 at 12.",
        aircraft: "Cessna 172",
        tailNumber: "N123AB",
        airport: "KSPI - Springfield Muni",
        isTowered: true,
        weatherInfo: "",
        correctResponse: "Cleared to land, Runway Zero Nine, Three Alpha Bravo."
    },
    {
        description: "Respond to go-around instruction",
        position: "Short final for Runway 18",
        atcCall: "Cherokee 45X, go around. Traffic on the runway.",
        aircraft: "Piper Cherokee",
        tailNumber: "N45X",
        airport: "KMET - Metro Airport",
        isTowered: true,
        weatherInfo: "",
        correctResponse: "Going around, Four Five X-ray."
    },
    // 6.2 Taxi to Parking
    {
        description: "Request taxi to parking after landing",
        position: "Clear of Runway 09 at Taxiway Charlie",
        atcCall: "",
        aircraft: "Cessna 172",
        tailNumber: "N123AB",
        airport: "KSPI - Springfield Muni",
        isTowered: true,
        weatherInfo: "",
        correctResponse: "Springfield Ground, Cessna One Two Three Alpha Bravo, clear of Runway Zero Nine at Charlie, request taxi to the FBO."
    },
    {
        description: "Respond to taxi instructions to parking",
        position: "Holding short of Taxiway Bravo after clearing runway",
        atcCall: "Cherokee 45X, taxi to the ramp via Bravo, remain this frequency.",
        aircraft: "Piper Cherokee",
        tailNumber: "N45X",
        airport: "KMET - Metro Airport",
        isTowered: true,
        weatherInfo: "",
        correctResponse: "Taxi to the ramp via Bravo, remain this frequency, Four Five X-ray."
    },
    
    // 7. VFR at an Uncontrolled Field
    // 7.1 Announcing Position and Intentions (Departure)
    {
        description: "Announce taxi intentions at uncontrolled field",
        position: "Parked at the ramp, destination nearby town",
        atcCall: "",
        aircraft: "Cessna 152",
        tailNumber: "N5678Y",
        airport: "F22 - Podunk Airfield",
        isTowered: false,
        weatherInfo: "AWOS: Winds 140 at 7 knots. Visibility 10 miles. Sky clear. Temperature 24, dew point 16. Altimeter 30.05.",
        correctResponse: "Podunk traffic, Cessna Five Six Seven Eight Yankee taxiing to Runway 14, Podunk."
    },
    {
        description: "Announce taking the active runway for departure",
        position: "Holding short of Runway 14",
        atcCall: "",
        aircraft: "Cessna 152",
        tailNumber: "N5678Y",
        airport: "F22 - Podunk Airfield",
        isTowered: false,
        weatherInfo: "",
        correctResponse: "Podunk traffic, Cessna Five Six Seven Eight Yankee taking Runway 14 for departure, departing to the south, Podunk."
    },
    // 7.2 Announcing Position and Intentions (Arrival)
    {
        description: "Initial call inbound to uncontrolled field",
        position: "10 miles west at 3,000 feet, inbound for landing",
        atcCall: "",
        aircraft: "Piper Warrior",
        tailNumber: "N91WK",
        airport: "F22 - Podunk Airfield",
        isTowered: false,
        weatherInfo: "AWOS: Winds 140 at 7 knots. Visibility 10 miles. Sky clear. Temperature 24, dew point 16. Altimeter 30.05.",
        correctResponse: "Podunk traffic, Warrior Nine One Whiskey Kilo, ten miles west at three thousand, inbound for landing, Podunk."
    },
    {
        description: "Announce pattern entry at uncontrolled field",
        position: "Entering 45 for left downwind Runway 14",
        atcCall: "",
        aircraft: "Piper Warrior",
        tailNumber: "N91WK",
        airport: "F22 - Podunk Airfield",
        isTowered: false,
        weatherInfo: "",
        correctResponse: "Podunk traffic, Warrior Nine One Whiskey Kilo entering left downwind Runway 14, Podunk."
    },
    {
        description: "Announce turning final at uncontrolled field",
        position: "Turning final for Runway 14",
        atcCall: "",
        aircraft: "Piper Warrior",
        tailNumber: "N91WK",
        airport: "F22 - Podunk Airfield",
        isTowered: false,
        weatherInfo: "",
        correctResponse: "Podunk traffic, Warrior Nine One Whiskey Kilo turning final Runway 14, Podunk."
    },
    {
        description: "Announce clear of runway after landing at uncontrolled field",
        position: "Clear of Runway 14",
        atcCall: "",
        aircraft: "Piper Warrior",
        tailNumber: "N91WK",
        airport: "F22 - Podunk Airfield",
        isTowered: false,
        weatherInfo: "",
        correctResponse: "Podunk traffic, Warrior Nine One Whiskey Kilo clear of Runway 14, Podunk."
    },

    // 8. Miscellaneous / Special Scenarios
    // 8.1 Requesting Special VFR
    {
        description: "Request Special VFR clearance to depart",
        position: "Holding short of Runway 5",
        atcCall: "",
        aircraft: "Cessna 172",
        tailNumber: "N451GH",
        airport: "KBFI - Boeing Field",
        isTowered: true,
        weatherInfo: "Boeing Field, METAR: KBFI 011453Z 05004KT 1 1/2SM BR SCT005 OVC010 10/09 A2985 RMK AO2 SLP109",
        correctResponse: "Boeing Ground, Cessna Four Five One Golf Hotel, holding short Runway 5, request Special VFR departure to the north."
    },
    // 8.2 Handling Emergencies (Simulated)
    {
        description: "Declare simulated engine failure after takeoff",
        position: "Climbing through 800 feet, just after takeoff Runway 27",
        atcCall: "",
        aircraft: "Cessna 172",
        tailNumber: "N123AB",
        airport: "KXYZ - Centerville Airport",
        isTowered: true,
        weatherInfo: "",
        correctResponse: "Mayday, Mayday, Mayday, Centerville Tower, Cessna One Two Three Alpha Bravo, simulated engine failure, returning to land."
    },
    // 8.3 Practice Approaches (under VFR)
    {
        description: "Request practice VOR approach",
        position: "15 miles south of GGG VOR at 5,000 feet",
        atcCall: "",
        aircraft: "Mooney M20",
        tailNumber: "N201MJ",
        airport: "KGGG - East Texas Regional",
        isTowered: true,
        weatherInfo: "East Texas Regional, information Foxtrot. Winds calm. Visibility 10. Clear. Temperature 26, dew point 15. Altimeter 30.10. ILS Runway 18 approach in use.",
        correctResponse: "Longview Approach, Mooney Two Zero One Mike Juliet, Fifteen miles south GGG VOR, Five Thousand, request practice VOR Alpha approach, full stop East Texas Regional."
    },
    // 8.4 Position Reports
    {
        description: "Provide unsolicited position report while on flight following",
        position: "Over Lakeview VOR at 7,500 feet",
        atcCall: "",
        aircraft: "Beechcraft Bonanza",
        tailNumber: "N35BE",
        airport: "KLKV - Lake County Airport",
        isTowered: false,
        weatherInfo: "",
        correctResponse: "Center, Bonanza Three Five Bravo Echo, over Lakeview VOR at Seven Thousand Five Hundred."
    },
];
