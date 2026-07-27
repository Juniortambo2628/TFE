/**
 * FIFA World Cup 2026 Official Match Data
 * All 104 fixtures with verified stadium and team information
 */

const WorldCup2026Data = {
    // Tournament Info
    tournament: {
        name: "FIFA World Cup 2026",
        countries: ["USA", "Mexico", "Canada"],
        startDate: "2026-06-11",
        endDate: "2026-07-19",
        totalMatches: 104,
        totalTeams: 48
    },

    // Official Stadium Information
    stadiums: {
        "Mexico City Stadium": {
            officialName: "Estadio Azteca",
            city: "Mexico City",
            country: "Mexico",
            capacity: 87523,
            image: "Estadio_Azteca_desde_el_aire_1.webp"
        },
        "Estadio Guadalajara": {
            officialName: "Estadio Akron",
            city: "Guadalajara",
            country: "Mexico",
            capacity: 44330,
            image: "Estadio_Akron_02-07-2022_cabecera_sur_lado_derecho.webp"
        },
        "Estadio Monterrey": {
            officialName: "Estadio BBVA",
            city: "Monterrey",
            country: "Mexico",
            capacity: 53500,
            image: "Estadio_BBVA.webp"
        },
        "Toronto Stadium": {
            officialName: "BMO Field",
            city: "Toronto",
            country: "Canada",
            capacity: 45736,
            image: "BMO_Field.webp"
        },
        "BC Place Vancouver": {
            officialName: "BC Place",
            city: "Vancouver",
            country: "Canada",
            capacity: 48821,
            image: "BC_Place_Opening_Day_2011-09-30.webp"
        },
        "Los Angeles Stadium": {
            officialName: "SoFi Stadium",
            city: "Los Angeles",
            country: "USA",
            capacity: 70000,
            image: "sofi_stadium.webp"
        },
        "New York New Jersey Stadium": {
            officialName: "MetLife Stadium",
            city: "East Rutherford",
            country: "USA",
            capacity: 78576,
            image: "Metlife_stadium.webp"
        },
        "Dallas Stadium": {
            officialName: "AT&T Stadium",
            city: "Arlington",
            country: "USA",
            capacity: 92000,
            image: "Arlington_June_2020_2_(AT&T_Stadium).webp"
        },
        "Atlanta Stadium": {
            officialName: "Mercedes-Benz Stadium",
            city: "Atlanta",
            country: "USA",
            capacity: 67382,
            image: "mercedes_benz_stadium.webp"
        },
        "Houston Stadium": {
            officialName: "NRG Stadium",
            city: "Houston",
            country: "USA",
            capacity: 68311,
            image: "Nrgstadium0.webp"
        },
        "Philadelphia Stadium": {
            officialName: "Lincoln Financial Field",
            city: "Philadelphia",
            country: "USA",
            capacity: 69176,
            image: "Lincoln_Financial_Field.webp"
        },
        "Miami Stadium": {
            officialName: "Hard Rock Stadium",
            city: "Miami Gardens",
            country: "USA",
            capacity: 65000,
            image: "Hard_Rock_Stadium_2017.webp"
        },
        "Seattle Stadium": {
            officialName: "Lumen Field",
            city: "Seattle",
            country: "USA",
            capacity: 69000,
            image: "CenturyLink_Field_&_Safeco_Field.webp"
        },
        "San Francisco Bay Area Stadium": {
            officialName: "Levi's Stadium",
            city: "Santa Clara",
            country: "USA",
            capacity: 70909,
            image: "Levis_Stadium.webp"
        },
        "Boston Stadium": {
            officialName: "Gillette Stadium",
            city: "Foxborough",
            country: "USA",
            capacity: 65878,
            image: "Gillette_Stadium_entrance_and_lighthouse.webp"
        },
        "Kansas City Stadium": {
            officialName: "GEHA Field at Arrowhead Stadium",
            city: "Kansas City",
            country: "USA",
            capacity: 76000,
            image: "Arrowhead_Stadium_(October_27,_2019_-_2).webp"
        }
    },

    // Group Definitions
    groups: {
        "A": { teams: ["Mexico", "South Africa", "Korea Republic", "TBD (Playoff)"], hostCity: "Mexico/USA" },
        "B": { teams: ["Canada", "Qatar", "Switzerland", "TBD (Playoff)"], hostCity: "Canada/USA" },
        "C": { teams: ["Brazil", "Morocco", "Haiti", "Scotland"], hostCity: "USA" },
        "D": { teams: ["USA", "Paraguay", "Australia", "TBD (Playoff)"], hostCity: "USA" },
        "E": { teams: ["Germany", "Côte d'Ivoire", "Ecuador", "Curaçao"], hostCity: "USA" },
        "F": { teams: ["Netherlands", "Japan", "Tunisia", "TBD (Playoff)"], hostCity: "USA/Mexico" },
        "G": { teams: ["Belgium", "Egypt", "IR Iran", "New Zealand"], hostCity: "USA/Canada" },
        "H": { teams: ["Spain", "Saudi Arabia", "Uruguay", "Cabo Verde"], hostCity: "USA/Mexico" },
        "I": { teams: ["France", "Senegal", "Norway", "TBD (Playoff)"], hostCity: "USA" },
        "J": { teams: ["Argentina", "Austria", "Jordan", "Algeria"], hostCity: "USA" },
        "K": { teams: ["Portugal", "Colombia", "Uzbekistan", "TBD (Playoff)"], hostCity: "USA/Mexico" },
        "L": { teams: ["England", "Croatia", "Ghana", "Panama"], hostCity: "USA/Canada" }
    },

    // Verified Qualified Teams
    qualifiedTeams: [
        // Hosts
        "USA", "Canada", "Mexico",
        // Asia (AFC)
        "Australia", "IR Iran", "Japan", "Jordan", "Qatar", "Saudi Arabia", "Korea Republic", "Uzbekistan",
        // N. America (CONCACAF)
        "Curaçao", "Haiti", "Panama",
        // Oceania (OFC)
        "New Zealand",
        // S. America (CONMEBOL)
        "Argentina", "Brazil", "Colombia", "Ecuador", "Paraguay", "Uruguay",
        // Africa (CAF)
        "Algeria", "Cabo Verde", "Egypt", "Ghana", "Côte d'Ivoire", "Morocco", "Senegal", "South Africa", "Tunisia",
        // Europe (UEFA)
        "Austria", "Belgium", "Croatia", "England", "France", "Germany", "Netherlands", "Norway", "Portugal", "Scotland", "Spain", "Switzerland"
    ],

    // All Matches (104 Tournament Games)
    matches: [
        // ============ GROUP STAGE - MATCHDAY 1 ============
        // June 11, 2026 (Thursday)
        { id: 1, date: "2026-06-11", time: "12:00", homeTeam: "Mexico", awayTeam: "South Africa", group: "A", venue: "Mexico City Stadium", stage: "Group Stage", matchday: 1 },
        { id: 2, date: "2026-06-11", time: "18:00", homeTeam: "Korea Republic", awayTeam: "TBD (Playoff A)", group: "A", venue: "Estadio Guadalajara", stage: "Group Stage", matchday: 1 },
        
        // June 12, 2026 (Friday)
        { id: 3, date: "2026-06-12", time: "12:00", homeTeam: "Canada", awayTeam: "TBD (Playoff B)", group: "B", venue: "Toronto Stadium", stage: "Group Stage", matchday: 1 },
        { id: 4, date: "2026-06-12", time: "18:00", homeTeam: "USA", awayTeam: "Paraguay", group: "D", venue: "Los Angeles Stadium", stage: "Group Stage", matchday: 1 },
        
        // June 13, 2026 (Saturday)
        { id: 5, date: "2026-06-13", time: "10:00", homeTeam: "Haiti", awayTeam: "Scotland", group: "C", venue: "Boston Stadium", stage: "Group Stage", matchday: 1 },
        { id: 6, date: "2026-06-13", time: "13:00", homeTeam: "Australia", awayTeam: "TBD (Playoff D)", group: "D", venue: "BC Place Vancouver", stage: "Group Stage", matchday: 1 },
        { id: 7, date: "2026-06-13", time: "16:00", homeTeam: "Brazil", awayTeam: "Morocco", group: "C", venue: "New York New Jersey Stadium", stage: "Group Stage", matchday: 1 },
        { id: 8, date: "2026-06-13", time: "19:00", homeTeam: "Qatar", awayTeam: "Switzerland", group: "B", venue: "San Francisco Bay Area Stadium", stage: "Group Stage", matchday: 1 },
        
        // June 14, 2026 (Sunday)
        { id: 9, date: "2026-06-14", time: "10:00", homeTeam: "Côte d'Ivoire", awayTeam: "Ecuador", group: "E", venue: "Philadelphia Stadium", stage: "Group Stage", matchday: 1 },
        { id: 10, date: "2026-06-14", time: "13:00", homeTeam: "Germany", awayTeam: "Curaçao", group: "E", venue: "Houston Stadium", stage: "Group Stage", matchday: 1 },
        { id: 11, date: "2026-06-14", time: "16:00", homeTeam: "Netherlands", awayTeam: "Japan", group: "F", venue: "Dallas Stadium", stage: "Group Stage", matchday: 1 },
        { id: 12, date: "2026-06-14", time: "19:00", homeTeam: "TBD (Playoff F)", awayTeam: "Tunisia", group: "F", venue: "Estadio Monterrey", stage: "Group Stage", matchday: 1 },
        
        // June 15, 2026 (Monday)
        { id: 13, date: "2026-06-15", time: "10:00", homeTeam: "Saudi Arabia", awayTeam: "Uruguay", group: "H", venue: "Miami Stadium", stage: "Group Stage", matchday: 1 },
        { id: 14, date: "2026-06-15", time: "13:00", homeTeam: "Spain", awayTeam: "Cabo Verde", group: "H", venue: "Atlanta Stadium", stage: "Group Stage", matchday: 1 },
        { id: 15, date: "2026-06-15", time: "16:00", homeTeam: "IR Iran", awayTeam: "New Zealand", group: "G", venue: "Los Angeles Stadium", stage: "Group Stage", matchday: 1 },
        { id: 16, date: "2026-06-15", time: "19:00", homeTeam: "Belgium", awayTeam: "Egypt", group: "G", venue: "Seattle Stadium", stage: "Group Stage", matchday: 1 },
        
        // June 16, 2026 (Tuesday)
        { id: 17, date: "2026-06-16", time: "10:00", homeTeam: "France", awayTeam: "Senegal", group: "I", venue: "New York New Jersey Stadium", stage: "Group Stage", matchday: 1 },
        { id: 18, date: "2026-06-16", time: "13:00", homeTeam: "TBD (Playoff I)", awayTeam: "Norway", group: "I", venue: "Boston Stadium", stage: "Group Stage", matchday: 1 },
        { id: 19, date: "2026-06-16", time: "16:00", homeTeam: "Argentina", awayTeam: "Algeria", group: "J", venue: "Kansas City Stadium", stage: "Group Stage", matchday: 1 },
        { id: 20, date: "2026-06-16", time: "19:00", homeTeam: "Austria", awayTeam: "Jordan", group: "J", venue: "San Francisco Bay Area Stadium", stage: "Group Stage", matchday: 1 },
        
        // June 17, 2026 (Wednesday)
        { id: 21, date: "2026-06-17", time: "10:00", homeTeam: "Ghana", awayTeam: "Panama", group: "L", venue: "Toronto Stadium", stage: "Group Stage", matchday: 1 },
        { id: 22, date: "2026-06-17", time: "13:00", homeTeam: "England", awayTeam: "Croatia", group: "L", venue: "Dallas Stadium", stage: "Group Stage", matchday: 1 },
        { id: 23, date: "2026-06-17", time: "16:00", homeTeam: "Portugal", awayTeam: "TBD (Playoff K)", group: "K", venue: "Houston Stadium", stage: "Group Stage", matchday: 1 },
        { id: 24, date: "2026-06-17", time: "19:00", homeTeam: "Uzbekistan", awayTeam: "Colombia", group: "K", venue: "Mexico City Stadium", stage: "Group Stage", matchday: 1 },

        // ============ GROUP STAGE - MATCHDAY 2 ============
        // June 18, 2026 (Thursday)
        { id: 25, date: "2026-06-18", time: "10:00", homeTeam: "TBD (Playoff A)", awayTeam: "South Africa", group: "A", venue: "Atlanta Stadium", stage: "Group Stage", matchday: 2 },
        { id: 26, date: "2026-06-18", time: "13:00", homeTeam: "Switzerland", awayTeam: "TBD (Playoff B)", group: "B", venue: "Los Angeles Stadium", stage: "Group Stage", matchday: 2 },
        { id: 27, date: "2026-06-18", time: "16:00", homeTeam: "Canada", awayTeam: "Qatar", group: "B", venue: "BC Place Vancouver", stage: "Group Stage", matchday: 2 },
        { id: 28, date: "2026-06-18", time: "19:00", homeTeam: "Mexico", awayTeam: "Korea Republic", group: "A", venue: "Estadio Guadalajara", stage: "Group Stage", matchday: 2 },
        
        // June 19, 2026 (Friday)
        { id: 29, date: "2026-06-19", time: "10:00", homeTeam: "Brazil", awayTeam: "Haiti", group: "C", venue: "Philadelphia Stadium", stage: "Group Stage", matchday: 2 },
        { id: 30, date: "2026-06-19", time: "13:00", homeTeam: "Scotland", awayTeam: "Morocco", group: "C", venue: "Boston Stadium", stage: "Group Stage", matchday: 2 },
        { id: 31, date: "2026-06-19", time: "16:00", homeTeam: "TBD (Playoff D)", awayTeam: "Paraguay", group: "D", venue: "San Francisco Bay Area Stadium", stage: "Group Stage", matchday: 2 },
        { id: 32, date: "2026-06-19", time: "19:00", homeTeam: "USA", awayTeam: "Australia", group: "D", venue: "Seattle Stadium", stage: "Group Stage", matchday: 2 },
        
        // June 20, 2026 (Saturday)
        { id: 33, date: "2026-06-20", time: "10:00", homeTeam: "Germany", awayTeam: "Côte d'Ivoire", group: "E", venue: "Toronto Stadium", stage: "Group Stage", matchday: 2 },
        { id: 34, date: "2026-06-20", time: "13:00", homeTeam: "Ecuador", awayTeam: "Curaçao", group: "E", venue: "Kansas City Stadium", stage: "Group Stage", matchday: 2 },
        { id: 35, date: "2026-06-20", time: "16:00", homeTeam: "Netherlands", awayTeam: "TBD (Playoff F)", group: "F", venue: "Houston Stadium", stage: "Group Stage", matchday: 2 },
        { id: 36, date: "2026-06-20", time: "19:00", homeTeam: "Tunisia", awayTeam: "Japan", group: "F", venue: "Estadio Monterrey", stage: "Group Stage", matchday: 2 },
        
        // June 21, 2026 (Sunday)
        { id: 37, date: "2026-06-21", time: "10:00", homeTeam: "Uruguay", awayTeam: "Cabo Verde", group: "H", venue: "Miami Stadium", stage: "Group Stage", matchday: 2 },
        { id: 38, date: "2026-06-21", time: "13:00", homeTeam: "Spain", awayTeam: "Saudi Arabia", group: "H", venue: "Atlanta Stadium", stage: "Group Stage", matchday: 2 },
        { id: 39, date: "2026-06-21", time: "16:00", homeTeam: "Belgium", awayTeam: "IR Iran", group: "G", venue: "Los Angeles Stadium", stage: "Group Stage", matchday: 2 },
        { id: 40, date: "2026-06-21", time: "19:00", homeTeam: "New Zealand", awayTeam: "Egypt", group: "G", venue: "BC Place Vancouver", stage: "Group Stage", matchday: 2 },
        
        // June 22, 2026 (Monday)
        { id: 41, date: "2026-06-22", time: "10:00", homeTeam: "Norway", awayTeam: "Senegal", group: "I", venue: "New York New Jersey Stadium", stage: "Group Stage", matchday: 2 },
        { id: 42, date: "2026-06-22", time: "13:00", homeTeam: "France", awayTeam: "TBD (Playoff I)", group: "I", venue: "Philadelphia Stadium", stage: "Group Stage", matchday: 2 },
        { id: 43, date: "2026-06-22", time: "16:00", homeTeam: "Argentina", awayTeam: "Austria", group: "J", venue: "Dallas Stadium", stage: "Group Stage", matchday: 2 },
        { id: 44, date: "2026-06-22", time: "19:00", homeTeam: "Jordan", awayTeam: "Algeria", group: "J", venue: "San Francisco Bay Area Stadium", stage: "Group Stage", matchday: 2 },
        
        // June 23, 2026 (Tuesday)
        { id: 45, date: "2026-06-23", time: "10:00", homeTeam: "England", awayTeam: "Ghana", group: "L", venue: "Boston Stadium", stage: "Group Stage", matchday: 2 },
        { id: 46, date: "2026-06-23", time: "13:00", homeTeam: "Panama", awayTeam: "Croatia", group: "L", venue: "Toronto Stadium", stage: "Group Stage", matchday: 2 },
        { id: 47, date: "2026-06-23", time: "16:00", homeTeam: "Portugal", awayTeam: "Uzbekistan", group: "K", venue: "Houston Stadium", stage: "Group Stage", matchday: 2 },
        { id: 48, date: "2026-06-23", time: "19:00", homeTeam: "Colombia", awayTeam: "TBD (Playoff K)", group: "K", venue: "Estadio Guadalajara", stage: "Group Stage", matchday: 2 },

        // ============ GROUP STAGE - MATCHDAY 3 ============
        // June 24, 2026 (Wednesday)
        { id: 49, date: "2026-06-24", time: "10:00", homeTeam: "Scotland", awayTeam: "Brazil", group: "C", venue: "Miami Stadium", stage: "Group Stage", matchday: 3 },
        { id: 50, date: "2026-06-24", time: "10:00", homeTeam: "Morocco", awayTeam: "Haiti", group: "C", venue: "Atlanta Stadium", stage: "Group Stage", matchday: 3 },
        { id: 51, date: "2026-06-24", time: "16:00", homeTeam: "Switzerland", awayTeam: "Canada", group: "B", venue: "BC Place Vancouver", stage: "Group Stage", matchday: 3 },
        { id: 52, date: "2026-06-24", time: "16:00", homeTeam: "TBD (Playoff B)", awayTeam: "Qatar", group: "B", venue: "Seattle Stadium", stage: "Group Stage", matchday: 3 },
        { id: 53, date: "2026-06-24", time: "19:00", homeTeam: "TBD (Playoff A)", awayTeam: "Mexico", group: "A", venue: "Mexico City Stadium", stage: "Group Stage", matchday: 3 },
        { id: 54, date: "2026-06-24", time: "19:00", homeTeam: "South Africa", awayTeam: "Korea Republic", group: "A", venue: "Estadio Monterrey", stage: "Group Stage", matchday: 3 },
        
        // June 25, 2026 (Thursday)
        { id: 55, date: "2026-06-25", time: "10:00", homeTeam: "Curaçao", awayTeam: "Côte d'Ivoire", group: "E", venue: "Philadelphia Stadium", stage: "Group Stage", matchday: 3 },
        { id: 56, date: "2026-06-25", time: "10:00", homeTeam: "Ecuador", awayTeam: "Germany", group: "E", venue: "New York New Jersey Stadium", stage: "Group Stage", matchday: 3 },
        { id: 57, date: "2026-06-25", time: "16:00", homeTeam: "Japan", awayTeam: "TBD (Playoff F)", group: "F", venue: "Dallas Stadium", stage: "Group Stage", matchday: 3 },
        { id: 58, date: "2026-06-25", time: "16:00", homeTeam: "Tunisia", awayTeam: "Netherlands", group: "F", venue: "Kansas City Stadium", stage: "Group Stage", matchday: 3 },
        { id: 59, date: "2026-06-25", time: "19:00", homeTeam: "TBD (Playoff D)", awayTeam: "USA", group: "D", venue: "Los Angeles Stadium", stage: "Group Stage", matchday: 3 },
        { id: 60, date: "2026-06-25", time: "19:00", homeTeam: "Paraguay", awayTeam: "Australia", group: "D", venue: "San Francisco Bay Area Stadium", stage: "Group Stage", matchday: 3 },
        
        // June 26, 2026 (Friday)
        { id: 61, date: "2026-06-26", time: "10:00", homeTeam: "Norway", awayTeam: "France", group: "I", venue: "Boston Stadium", stage: "Group Stage", matchday: 3 },
        { id: 62, date: "2026-06-26", time: "10:00", homeTeam: "Senegal", awayTeam: "TBD (Playoff I)", group: "I", venue: "Toronto Stadium", stage: "Group Stage", matchday: 3 },
        { id: 63, date: "2026-06-26", time: "16:00", homeTeam: "Egypt", awayTeam: "IR Iran", group: "G", venue: "Seattle Stadium", stage: "Group Stage", matchday: 3 },
        { id: 64, date: "2026-06-26", time: "16:00", homeTeam: "New Zealand", awayTeam: "Belgium", group: "G", venue: "BC Place Vancouver", stage: "Group Stage", matchday: 3 },
        { id: 65, date: "2026-06-26", time: "19:00", homeTeam: "Cabo Verde", awayTeam: "Saudi Arabia", group: "H", venue: "Houston Stadium", stage: "Group Stage", matchday: 3 },
        { id: 66, date: "2026-06-26", time: "19:00", homeTeam: "Uruguay", awayTeam: "Spain", group: "H", venue: "Estadio Guadalajara", stage: "Group Stage", matchday: 3 },
        
        // June 27, 2026 (Saturday)
        { id: 67, date: "2026-06-27", time: "10:00", homeTeam: "Panama", awayTeam: "England", group: "L", venue: "New York New Jersey Stadium", stage: "Group Stage", matchday: 3 },
        { id: 68, date: "2026-06-27", time: "10:00", homeTeam: "Croatia", awayTeam: "Ghana", group: "L", venue: "Philadelphia Stadium", stage: "Group Stage", matchday: 3 },
        { id: 69, date: "2026-06-27", time: "16:00", homeTeam: "Algeria", awayTeam: "Austria", group: "J", venue: "Kansas City Stadium", stage: "Group Stage", matchday: 3 },
        { id: 70, date: "2026-06-27", time: "16:00", homeTeam: "Jordan", awayTeam: "Argentina", group: "J", venue: "Dallas Stadium", stage: "Group Stage", matchday: 3 },
        { id: 71, date: "2026-06-27", time: "19:00", homeTeam: "Colombia", awayTeam: "Portugal", group: "K", venue: "Miami Stadium", stage: "Group Stage", matchday: 3 },
        { id: 72, date: "2026-06-27", time: "19:00", homeTeam: "TBD (Playoff K)", awayTeam: "Uzbekistan", group: "K", venue: "Atlanta Stadium", stage: "Group Stage", matchday: 3 },

        // ============ ROUND OF 32 ============
        { id: 73, date: "2026-06-28", time: "16:00", homeTeam: "Runner-up Group A", awayTeam: "Runner-up Group B", group: null, venue: "Los Angeles Stadium", stage: "Round of 32", matchday: null },
        { id: 74, date: "2026-06-29", time: "10:00", homeTeam: "Winner Group E", awayTeam: "3rd Place (A/B/C/D/F)", group: null, venue: "Boston Stadium", stage: "Round of 32", matchday: null },
        { id: 75, date: "2026-06-29", time: "13:00", homeTeam: "Winner Group F", awayTeam: "Runner-up Group C", group: null, venue: "Estadio Monterrey", stage: "Round of 32", matchday: null },
        { id: 76, date: "2026-06-29", time: "16:00", homeTeam: "Winner Group C", awayTeam: "Runner-up Group F", group: null, venue: "Houston Stadium", stage: "Round of 32", matchday: null },
        { id: 77, date: "2026-06-30", time: "10:00", homeTeam: "Winner Group I", awayTeam: "3rd Place (C/D/F/G/H)", group: null, venue: "New York New Jersey Stadium", stage: "Round of 32", matchday: null },
        { id: 78, date: "2026-06-30", time: "13:00", homeTeam: "Runner-up Group E", awayTeam: "Runner-up Group I", group: null, venue: "Dallas Stadium", stage: "Round of 32", matchday: null },
        { id: 79, date: "2026-06-30", time: "16:00", homeTeam: "Winner Group A", awayTeam: "3rd Place (C/E/F/H/I)", group: null, venue: "Mexico City Stadium", stage: "Round of 32", matchday: null },
        { id: 80, date: "2026-07-01", time: "10:00", homeTeam: "Winner Group L", awayTeam: "3rd Place (E/H/I/J/K)", group: null, venue: "Atlanta Stadium", stage: "Round of 32", matchday: null },
        { id: 81, date: "2026-07-01", time: "13:00", homeTeam: "Winner Group D", awayTeam: "3rd Place (B/E/F/I/J)", group: null, venue: "San Francisco Bay Area Stadium", stage: "Round of 32", matchday: null },
        { id: 82, date: "2026-07-01", time: "16:00", homeTeam: "Winner Group G", awayTeam: "3rd Place (A/E/H/I/J)", group: null, venue: "Seattle Stadium", stage: "Round of 32", matchday: null },
        { id: 83, date: "2026-07-02", time: "10:00", homeTeam: "Runner-up Group K", awayTeam: "Runner-up Group L", group: null, venue: "Toronto Stadium", stage: "Round of 32", matchday: null },
        { id: 84, date: "2026-07-02", time: "13:00", homeTeam: "Winner Group H", awayTeam: "Runner-up Group J", group: null, venue: "Los Angeles Stadium", stage: "Round of 32", matchday: null },
        { id: 85, date: "2026-07-02", time: "16:00", homeTeam: "Winner Group B", awayTeam: "3rd Place (E/F/G/I/J)", group: null, venue: "BC Place Vancouver", stage: "Round of 32", matchday: null },
        { id: 86, date: "2026-07-03", time: "10:00", homeTeam: "Winner Group J", awayTeam: "Runner-up Group H", group: null, venue: "Miami Stadium", stage: "Round of 32", matchday: null },
        { id: 87, date: "2026-07-03", time: "13:00", homeTeam: "Winner Group K", awayTeam: "3rd Place (D/E/I/J/L)", group: null, venue: "Kansas City Stadium", stage: "Round of 32", matchday: null },
        { id: 88, date: "2026-07-03", time: "16:00", homeTeam: "Runner-up Group D", awayTeam: "Runner-up Group G", group: null, venue: "Dallas Stadium", stage: "Round of 32", matchday: null },

        // ============ ROUND OF 16 ============
        { id: 89, date: "2026-07-04", time: "13:00", homeTeam: "Winner Match 74", awayTeam: "Winner Match 77", group: null, venue: "Philadelphia Stadium", stage: "Round of 16", matchday: null },
        { id: 90, date: "2026-07-04", time: "16:00", homeTeam: "Winner Match 73", awayTeam: "Winner Match 75", group: null, venue: "Houston Stadium", stage: "Round of 16", matchday: null },
        { id: 91, date: "2026-07-05", time: "13:00", homeTeam: "Winner Match 76", awayTeam: "Winner Match 78", group: null, venue: "New York New Jersey Stadium", stage: "Round of 16", matchday: null },
        { id: 92, date: "2026-07-05", time: "16:00", homeTeam: "Winner Match 79", awayTeam: "Winner Match 80", group: null, venue: "Mexico City Stadium", stage: "Round of 16", matchday: null },
        { id: 93, date: "2026-07-06", time: "13:00", homeTeam: "Winner Match 83", awayTeam: "Winner Match 84", group: null, venue: "Dallas Stadium", stage: "Round of 16", matchday: null },
        { id: 94, date: "2026-07-06", time: "16:00", homeTeam: "Winner Match 81", awayTeam: "Winner Match 82", group: null, venue: "Seattle Stadium", stage: "Round of 16", matchday: null },
        { id: 95, date: "2026-07-07", time: "13:00", homeTeam: "Winner Match 86", awayTeam: "Winner Match 88", group: null, venue: "Atlanta Stadium", stage: "Round of 16", matchday: null },
        { id: 96, date: "2026-07-07", time: "16:00", homeTeam: "Winner Match 85", awayTeam: "Winner Match 87", group: null, venue: "BC Place Vancouver", stage: "Round of 16", matchday: null },

        // ============ QUARTER-FINALS ============
        { id: 97, date: "2026-07-09", time: "16:00", homeTeam: "Winner Match 89", awayTeam: "Winner Match 90", group: null, venue: "Boston Stadium", stage: "Quarter-finals", matchday: null },
        { id: 98, date: "2026-07-10", time: "16:00", homeTeam: "Winner Match 93", awayTeam: "Winner Match 94", group: null, venue: "Los Angeles Stadium", stage: "Quarter-finals", matchday: null },
        { id: 99, date: "2026-07-11", time: "13:00", homeTeam: "Winner Match 91", awayTeam: "Winner Match 92", group: null, venue: "Miami Stadium", stage: "Quarter-finals", matchday: null },
        { id: 100, date: "2026-07-11", time: "16:00", homeTeam: "Winner Match 95", awayTeam: "Winner Match 96", group: null, venue: "Kansas City Stadium", stage: "Quarter-finals", matchday: null },

        // ============ SEMI-FINALS ============
        { id: 101, date: "2026-07-14", time: "16:00", homeTeam: "Winner Match 97", awayTeam: "Winner Match 98", group: null, venue: "Dallas Stadium", stage: "Semi-finals", matchday: null },
        { id: 102, date: "2026-07-15", time: "16:00", homeTeam: "Winner Match 99", awayTeam: "Winner Match 100", group: null, venue: "Atlanta Stadium", stage: "Semi-finals", matchday: null },

        // ============ BRONZE FINAL ============
        { id: 103, date: "2026-07-18", time: "16:00", homeTeam: "Runner-up Match 101", awayTeam: "Runner-up Match 102", group: null, venue: "Miami Stadium", stage: "Third Place", matchday: null },

        // ============ FINAL ============
        { id: 104, date: "2026-07-19", time: "16:00", homeTeam: "Winner Match 101", awayTeam: "Winner Match 102", group: null, venue: "New York New Jersey Stadium", stage: "Final", matchday: null }
    ],

    // Helper methods
    getMatchesByGroup(groupLetter) {
        return this.matches.filter(m => m.group === groupLetter);
    },

    getMatchesByStage(stageName) {
        return this.matches.filter(m => m.stage === stageName);
    },

    getMatchesByVenue(venueName) {
        return this.matches.filter(m => m.venue === venueName);
    },

    getMatchesByDate(dateString) {
        return this.matches.filter(m => m.date === dateString);
    },

    getStadiumInfo(venueName) {
        return this.stadiums[venueName] || null;
    },

    getAllVenues() {
        return Object.keys(this.stadiums);
    },

    getAllStages() {
        return [...new Set(this.matches.map(m => m.stage))];
    },

    getAllGroups() {
        return Object.keys(this.groups);
    }
};

// Export for ES modules (React)
export default WorldCup2026Data;

// Make available globally for browser (legacy support)
if (typeof window !== 'undefined') {
    window.WorldCup2026Data = WorldCup2026Data;
}
