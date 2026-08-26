/**
 * Companies.gs — the curated universe.
 *
 * There is no free API that returns "every company with 50-200 employees", so
 * the headcount requirement is enforced by curating the list itself. Every
 * token below was verified against the live ATS API before being added.
 *
 * The industry keys match INDUSTRY_SCORES in Scoring.gs and come straight from
 * the 62 industries Thaddeus marked Yes on the checklist. The 58 he marked No
 * are enforced twice: those companies are simply absent from this list, and
 * EXCLUDED_INDUSTRY_PATTERNS in Scoring.gs catches stragglers.
 *
 * headcount values are estimates. They are seeded into the Companies sheet
 * where they can be corrected by hand — the sheet wins over this file after
 * first setup, so a correction there is permanent.
 *
 * always_allow = true bypasses the headcount filter. Reserved for companies he
 * named as dream employers.
 *
 * Columns: token, source, display name, industry, est. headcount, active, always_allow
 */
function seedCompanies_() {
  return [

    // ---- solar ----
    ["avantus",                 "greenhouse",   "Avantus",                     "solar",               200, true,  false],
    ["exowatt",                 "lever",        "Exowatt",                     "solar",               70, true,  false],
    ["nexamp",                  "greenhouse",   "Nexamp",                      "solar",               450, true,  false],
    ["omnidian",                "lever",        "Omnidian",                    "solar",               200, true,  false],
    ["palmetto",                "greenhouse",   "Palmetto",                    "solar",               400, true,  false],
    ["pivotenergy",             "lever",        "Pivot Energy",                "solar",               150, true,  false],
    ["solstice",                "ashby",        "Solstice",                    "solar",               85, true,  false],

    // ---- geothermal ----
    ["Zanskar",                 "lever",        "Zanskar",                     "geothermal",          60, true,  false],
    ["dandelion",               "ashby",        "Dandelion Energy",            "geothermal",          220, true,  false],
    ["quaise",                  "greenhouse",   "Quaise Energy",               "geothermal",          110, true,  false],

    // ---- nuclear ----
    ["kairospower",             "greenhouse",   "Kairos Power",                "nuclear",             400, true,  false],
    ["oklo",                    "greenhouse",   "Oklo",                        "nuclear",             300, true,  false],

    // ---- fusion ----
    ["helion",                  "ashby",        "Helion Energy",               "fusion",              500, true,  false],
    ["xcimer",                  "lever",        "Xcimer Energy",               "fusion",              100, true,  false],

    // ---- hydrogen ----
    ["eh2",                     "greenhouse",   "Electric Hydrogen",           "hydrogen",            350, true,  false],
    ["hysata",                  "greenhouse",   "Hysata",                      "hydrogen",            150, true,  false],
    ["utilityglobal",           "lever",        "Utility Global",              "hydrogen",            70, true,  false],

    // ---- storage ----
    ["antora",                  "greenhouse",   "Antora Energy",               "storage",             150, true,  false],
    ["peakenergy",              "greenhouse",   "Peak Energy",                 "storage",             150, true,  false],
    ["tyba",                    "ashby",        "Tyba Energy",                 "storage",             55, true,  false],

    // ---- grid ----
    ["amperon",                 "greenhouse",   "Amperon",                     "grid",                55, true,  false],
    ["arcadia",                 "lever",        "Arcadia",                     "grid",                450, true,  false],
    ["enode",                   "ashby",        "Enode",                       "grid",                60, true,  false],
    ["gridware",                "lever",        "Gridware",                    "grid",                120, true,  false],
    ["kaluza",                  "greenhouse",   "Kaluza",                      "grid",                500, true,  false],
    ["leap",                    "ashby",        "Leap",                        "grid",                65, true,  false],
    ["verse",                   "greenhouse",   "Verse",                       "grid",                60, true,  false],

    // ---- efficiency ----
    ["bidgely-inc",             "ashby",        "Bidgely",                     "efficiency",          350, true,  false],
    ["budderfly",               "greenhouse",   "Budderfly",                   "efficiency",          450, true,  false],
    ["energyhub",               "greenhouse",   "EnergyHub",                   "efficiency",          300, true,  false],
    ["mainspringenergy",        "lever",        "Mainspring Energy",           "efficiency",          300, true,  false],
    ["phaidra",                 "greenhouse",   "Phaidra",                     "efficiency",          90, true,  false],
    ["rondoenergy",             "greenhouse",   "Rondo Energy",                "efficiency",          150, true,  false],
    ["runwise",                 "greenhouse",   "Runwise",                     "efficiency",          200, true,  false],
    ["voltus",                  "lever",        "Voltus",                      "efficiency",          160, true,  false],

    // ---- electrification ----
    ["copperhome",              "greenhouse",   "Copper",                      "electrification",     65, true,  false],
    ["lunarenergy",             "greenhouse",   "Lunar Energy",                "electrification",     190, true,  false],
    ["quilt",                   "greenhouse",   "Quilt",                       "electrification",     150, true,  false],
    ["span",                    "ashby",        "SPAN",                        "electrification",     300, true,  false],
    ["zerohomes",               "lever",        "Zero Homes",                  "electrification",     55, true,  false],

    // ---- ev ----
    ["harbingermotors",         "greenhouse",   "Harbinger Motors",            "ev",                  200, true,  false],

    // ---- ev_charging ----
    ["beam",                    "greenhouse",   "Beam Global",                 "ev_charging",         150, true,  false],
    ["highlandfleets-2",        "lever",        "Highland Electric Fleets",    "ev_charging",         300, true,  false],
    ["inchargeenergy",          "greenhouse",   "InCharge Energy",             "ev_charging",         250, true,  false],
    ["powerdot",                "greenhouse",   "Power Dot",                   "ev_charging",         250, true,  false],
    ["revel",                   "ashby",        "Revel",                       "ev_charging",         400, true,  false],
    ["terawattinfrastructure",  "lever",        "TeraWatt Infrastructure",     "ev_charging",         150, true,  false],
    ["volterapower",            "greenhouse",   "Voltera",                     "ev_charging",         150, true,  false],

    // ---- carbon_removal ----
    ["aircapture",              "greenhouse",   "Aircapture",                  "carbon_removal",      60, true,  false],
    ["arborenergy",             "greenhouse",   "Arbor",                       "carbon_removal",      70, true,  false],
    ["avnos",                   "greenhouse",   "Avnos",                       "carbon_removal",      70, true,  false],
    ["charmindustrial",         "lever",        "Charm Industrial",            "carbon_removal",      120, true,  false],
    ["deepsky",                 "lever",        "Deep Sky",                    "carbon_removal",      90, true,  false],
    ["graphyte",                "ashby",        "Graphyte",                    "carbon_removal",      70, true,  false],
    ["heirloomcarbon",          "ashby",        "Heirloom",                    "carbon_removal",      150, true,  false],
    ["phlair",                  "ashby",        "Phlair",                      "carbon_removal",      70, true,  false],
    ["travertine",              "lever",        "Travertine",                  "carbon_removal",      60, true,  false],

    // ---- carbon_markets ----
    ["carbondirect",            "greenhouse",   "Carbon Direct",               "carbon_markets",      170, true,  false],
    ["ceezer",                  "ashby",        "Ceezer",                      "carbon_markets",      60, true,  false],
    ["chooose",                 "lever",        "Chooose",                     "carbon_markets",      90, true,  false],
    ["climateimpactx",          "greenhouse",   "Climate Impact X",            "carbon_markets",      100, true,  false],
    ["cloverly",                "greenhouse",   "Cloverly",                    "carbon_markets",      55, true,  false],
    ["isometric",               "ashby",        "Isometric",                   "carbon_markets",      70, true,  false],
    ["patch",                   "greenhouse",   "Patch",                       "carbon_markets",      85, true,  false],
    ["sylvera",                 "ashby",        "Sylvera",                     "carbon_markets",      180, true,  false],

    // ---- climate_risk ----
    ["climatex",                "greenhouse",   "Climate X",                   "climate_risk",        100, true,  false],
    ["firststreet",             "ashby",        "First Street",                "climate_risk",        110, true,  false],
    ["jupiterintel",            "lever",        "Jupiter Intelligence",        "climate_risk",        90, true,  false],
    ["tomorrow",                "greenhouse",   "Tomorrow.io",                 "climate_risk",        300, true,  false],

    // ---- air_quality ----
    ["orbitalsidekick",         "lever",        "Orbital Sidekick",            "air_quality",         100, true,  false],
    ["picarroinc",              "greenhouse",   "Picarro",                     "air_quality",         350, true,  false],

    // ---- env_consulting ----
    ["eaengineering",           "greenhouse",   "EA Engineering",              "env_consulting",      480, true,  false],

    // ---- circular ----
    ["ampsortation",            "greenhouse",   "AMP",                         "circular",            250, true,  false],
    ["archive",                 "ashby",        "Archive",                     "circular",            130, true,  false],
    ["cambium",                 "ashby",        "Cambium",                     "circular",            90, true,  false],
    ["glacier",                 "ashby",        "Glacier",                     "circular",            100, true,  false],
    ["recycleye",               "greenhouse",   "Recycleye",                   "circular",            70, true,  false],
    ["refurbed",                "greenhouse",   "Refurbed",                    "circular",            450, true,  false],

    // ---- waste ----
    ["mill",                    "greenhouse",   "Mill",                        "waste",               180, true,  false],
    ["roadrunner",              "greenhouse",   "RoadRunner Recycling",        "waste",               300, true,  false],

    // ---- forestry ----
    ["frontlinewildfire",       "greenhouse",   "Frontline Wildfire Defense",  "forestry",            90, true,  false],
    ["overstory",               "greenhouse",   "Overstory",                   "forestry",            70, true,  false],
    ["pano-ai",                 "ashby",        "Pano AI",                     "forestry",            130, true,  false],
    ["treeswift",               "ashby",        "Treeswift",                   "forestry",            65, true,  false],

    // ---- conservation ----
    ["globalfishingwatch",      "greenhouse",   "Global Fishing Watch",        "conservation",        140, true,  false],
    ["oceanx",                  "greenhouse",   "OceanX",                      "conservation",        150, true,  false],

    // ---- desal ----
    ["viaseparations",          "lever",        "Via Separations",             "desal",               60, true,  false],

    // ---- precision_ag ----
    ["arable",                  "lever",        "Arable",                      "precision_ag",        100, true,  false],

    // ---- ag_robotics ----
    ["agtonomy",                "lever",        "Agtonomy",                    "ag_robotics",         55, true,  false],
    ["carbonrobotics",          "greenhouse",   "Carbon Robotics",             "ag_robotics",         250, true,  false],

    // ---- regen_ag ----
    ["agreena",                 "ashby",        "Agreena",                     "regen_ag",            200, true,  false],

    // ---- ag_biotech ----
    ["ohalogenetics",           "greenhouse",   "Ohalo Genetics",              "ag_biotech",          150, true,  false],
    ["pivotbio",                "greenhouse",   "Pivot Bio",                   "ag_biotech",          400, true,  false],
    ["soundagriculture",        "greenhouse",   "Sound Agriculture",           "ag_biotech",          110, true,  false],

    // ---- ocean_data ----
    ["bedrockocean",            "ashby",        "Bedrock Ocean",               "ocean_data",          60, true,  false],
    ["sofarocean",              "ashby",        "Sofar Ocean",                 "ocean_data",          120, true,  false],

    // ---- marine_cdr ----
    ["captura",                 "greenhouse",   "Captura",                     "marine_cdr",          70, true,  false],

    // ---- satellites ----
    ["albedo",                  "greenhouse",   "Albedo",                      "satellites",          85, true,  false],
    ["apex",                    "greenhouse",   "Apex Space",                  "satellites",          150, true,  false],
    ["muonspace",               "greenhouse",   "Muon Space",                  "satellites",          170, true,  false],
    ["slingshotaerospace",      "greenhouse",   "Slingshot Aerospace",         "satellites",          200, true,  false],
    ["solestial",               "lever",        "Solestial",                   "satellites",          70, true,  false],
    ["spire",                   "greenhouse",   "Spire Global",                "satellites",          400, true,  false],

    // ---- in_space ----
    ["epsilon3",                "lever",        "Epsilon3",                    "in_space",            60, true,  false],
    ["inversionspace",          "greenhouse",   "Inversion Space",             "in_space",            110, true,  false],
    ["vardaspace",              "greenhouse",   "Varda Space",                 "in_space",            200, true,  false],
    ["vast",                    "greenhouse",   "Vast",                        "in_space",            800, true,  true],

    // ---- satcom ----
    ["astranis",                "greenhouse",   "Astranis",                    "satcom",              400, true,  false],

    // ---- eVTOL ----
    ["electraaero",             "greenhouse",   "Electra.aero",                "eVTOL",               250, true,  false],
    ["heartaerospace",          "greenhouse",   "Heart Aerospace",             "eVTOL",               200, true,  false],
    ["regent",                  "ashby",        "REGENT Craft",                "eVTOL",               200, true,  false],
    ["vaeridion",               "ashby",        "Vaeridion",                   "eVTOL",               90, true,  false],
    ["vertical-aerospace",      "ashby",        "Vertical Aerospace",          "eVTOL",               400, true,  false],

    // ---- saf ----
    ["aircompany",              "greenhouse",   "Air Company",                 "saf",                 100, true,  false],
    ["skynrg",                  "ashby",        "SkyNRG",                      "saf",                 110, true,  false],
    ["twelve",                  "ashby",        "Twelve",                      "saf",                 300, true,  false],

    // ---- aviation ----
    ["jetzero",                 "greenhouse",   "JetZero",                     "aviation",            400, true,  false],
    ["reliable-robotics",       "ashby",        "Reliable Robotics",           "aviation",            200, true,  false],
    ["skyryse",                 "greenhouse",   "Skyryse",                     "aviation",            200, true,  false],

    // ---- drones ----
    ["dronedeploy",             "lever",        "DroneDeploy",                 "drones",              250, true,  false],
    ["gatherai",                "greenhouse",   "Gather AI",                   "drones",              80, true,  false],
    ["pyka",                    "lever",        "Pyka",                        "drones",              160, true,  false],

    // ---- ai_labs ----
    ["datologyai",              "ashby",        "Datology AI",                 "ai_labs",             60, true,  false],
    ["imbue",                   "greenhouse",   "Imbue",                       "ai_labs",             55, true,  false],
    ["poolside",                "ashby",        "Poolside",                    "ai_labs",             200, true,  false],
    ["reflectionai",            "ashby",        "Reflection AI",               "ai_labs",             100, true,  false],

    // ---- ai_products ----
    ["cognition",               "ashby",        "Cognition",                   "ai_products",         200, true,  false],
    ["cresta",                  "greenhouse",   "Cresta",                      "ai_products",         400, true,  false],
    ["decagon",                 "ashby",        "Decagon",                     "ai_products",         200, true,  false],
    ["labelbox",                "greenhouse",   "Labelbox",                    "ai_products",         200, true,  false],
    ["mercor",                  "ashby",        "Mercor",                      "ai_products",         200, true,  false],
    ["runway",                  "ashby",        "Runway",                      "ai_products",         400, true,  false],
    ["sierra",                  "ashby",        "Sierra",                      "ai_products",         350, true,  false],
    ["snorkelai",               "greenhouse",   "Snorkel AI",                  "ai_products",         200, true,  false],
    ["unify",                   "ashby",        "Unify",                       "ai_products",         60, true,  false],

    // ---- devtools ----
    ["arizeai",                 "greenhouse",   "Arize AI",                    "devtools",            150, true,  false],
    ["assemblyai",              "greenhouse",   "AssemblyAI",                  "devtools",            150, true,  false],
    ["braintrust",              "ashby",        "Braintrust",                  "devtools",            55, true,  false],
    ["deepgram",                "ashby",        "Deepgram",                    "devtools",            160, true,  false],
    ["galileo",                 "greenhouse",   "Galileo",                     "devtools",            85, true,  false],
    ["graphite",                "ashby",        "Graphite",                    "devtools",            60, true,  false],
    ["greptile",                "ashby",        "Greptile",                    "devtools",            55, true,  false],
    ["honeycomb",               "greenhouse",   "Honeycomb",                   "devtools",            150, true,  false],
    ["incident",                "ashby",        "incident.io",                 "devtools",            100, true,  false],
    ["knock",                   "ashby",        "Knock",                       "devtools",            55, true,  false],
    ["langchain",               "ashby",        "LangChain",                   "devtools",            150, true,  false],
    ["launchdarkly",            "greenhouse",   "LaunchDarkly",                "devtools",            500, true,  false],
    ["lightning",               "ashby",        "Lightning AI",                "devtools",            150, true,  false],
    ["logrocket",               "lever",        "LogRocket",                   "devtools",            150, true,  false],
    ["porter",                  "lever",        "Porter",                      "devtools",            60, true,  false],
    ["render",                  "ashby",        "Render",                      "devtools",            100, true,  false],
    ["replit",                  "ashby",        "Replit",                      "devtools",            160, true,  false],
    ["resend",                  "ashby",        "Resend",                      "devtools",            55, true,  false],
    ["sentry",                  "ashby",        "Sentry",                      "devtools",            400, true,  false],
    ["supabase",                "ashby",        "Supabase",                    "devtools",            140, true,  false],
    ["temporal",                "ashby",        "Temporal",                    "devtools",            300, true,  false],
    ["warp",                    "ashby",        "Warp",                        "devtools",            85, true,  false],
    ["zed",                     "ashby",        "Zed",                         "devtools",            55, true,  false],

    // ---- data_infra ----
    ["airbyte",                 "ashby",        "Airbyte",                     "data_infra",          150, true,  false],
    ["astronomer",              "ashby",        "Astronomer",                  "data_infra",          300, true,  false],
    ["clickhouse",              "ashby",        "ClickHouse",                  "data_infra",          400, true,  false],
    ["cribl",                   "greenhouse",   "Cribl",                       "data_infra",          500, true,  false],
    ["cube",                    "ashby",        "Cube",                        "data_infra",          100, true,  false],
    ["hex",                     "ashby",        "Hex",                         "data_infra",          200, true,  false],
    ["hightouch",               "greenhouse",   "Hightouch",                   "data_infra",          200, true,  false],
    ["lightdash",               "ashby",        "Lightdash",                   "data_infra",          55, true,  false],
    ["materialize",             "ashby",        "Materialize",                 "data_infra",          80, true,  false],
    ["metabase",                "lever",        "Metabase",                    "data_infra",          200, true,  false],
    ["mixpanel",                "greenhouse",   "Mixpanel",                    "data_infra",          400, true,  false],
    ["motherduck",              "ashby",        "MotherDuck",                  "data_infra",          100, true,  false],
    ["neon",                    "ashby",        "Neon",                        "data_infra",          120, true,  false],
    ["omni",                    "ashby",        "Omni",                        "data_infra",          100, true,  false],
    ["pinecone",                "ashby",        "Pinecone",                    "data_infra",          150, true,  false],
    ["planetscale",             "greenhouse",   "PlanetScale",                 "data_infra",          100, true,  false],
    ["posthog",                 "ashby",        "PostHog",                     "data_infra",          95, true,  false],
    ["prefect",                 "ashby",        "Prefect",                     "data_infra",          100, true,  false],
    ["sigmacomputing",          "greenhouse",   "Sigma Computing",             "data_infra",          400, true,  false],
    ["starburst",               "greenhouse",   "Starburst",                   "data_infra",          400, true,  false],
    ["union",                   "ashby",        "Union AI",                    "data_infra",          60, true,  false],
    ["weaviate",                "ashby",        "Weaviate",                    "data_infra",          150, true,  false],

    // ---- compute ----
    ["anyscale",                "ashby",        "Anyscale",                    "compute",             200, true,  false],
    ["baseten",                 "ashby",        "Baseten",                     "compute",             150, true,  false],
    ["hyperbolic",              "ashby",        "Hyperbolic",                  "compute",             60, true,  false],
    ["modal",                   "ashby",        "Modal",                       "compute",             100, true,  false],
    ["primeintellect",          "ashby",        "Prime Intellect",             "compute",             60, true,  false],
    ["runpod",                  "ashby",        "RunPod",                      "compute",             100, true,  false],
    ["togetherai",              "greenhouse",   "Together AI",                 "compute",             350, true,  false],
    ["vastai",                  "ashby",        "Vast.ai",                     "compute",             60, true,  false],
    ["volta",                   "ashby",        "Volta",                       "compute",             200, true,  false],

    // ---- robotics ----
    ["1x",                      "ashby",        "1X Technologies",             "robotics",            300, true,  false],
    ["agilityrobotics",         "greenhouse",   "Agility Robotics",            "robotics",            250, true,  false],
    ["apptronik",               "greenhouse",   "Apptronik",                   "robotics",            250, true,  false],
    ["cobot",                   "ashby",        "Collaborative Robotics",      "robotics",            110, true,  false],
    ["dexory",                  "greenhouse",   "Dexory",                      "robotics",            200, true,  false],
    ["dexterity",               "lever",        "Dexterity",                   "robotics",            250, true,  false],
    ["figureai",                "greenhouse",   "Figure AI",                   "robotics",            400, true,  false],
    ["gecko-robotics",          "ashby",        "Gecko Robotics",              "robotics",            450, true,  false],
    ["locusrobotics",           "greenhouse",   "Locus Robotics",              "robotics",            450, true,  false],
    ["nimblerobotics",          "greenhouse",   "Nimble Robotics",             "robotics",            250, true,  false],
    ["physicalintelligence",    "ashby",        "Physical Intelligence",       "robotics",            150, true,  false],
    ["serverobotics",           "ashby",        "Serve Robotics",              "robotics",            150, true,  false],
    ["standardbots",            "ashby",        "Standard Bots",               "robotics",            110, true,  false],
    ["thirdwaveautomation",     "greenhouse",   "Third Wave Automation",       "robotics",            100, true,  false],

    // ---- semis ----
    ["asteralabs",              "greenhouse",   "Astera Labs",                 "semis",               450, true,  false],
    ["atomcomputing",           "lever",        "Atom Computing",              "semis",               100, true,  false],
    ["axelera",                 "ashby",        "Axelera AI",                  "semis",               250, true,  false],
    ["d-matrix",                "ashby",        "d-Matrix",                    "semis",               250, true,  false],
    ["etched",                  "ashby",        "Etched",                      "semis",               150, true,  false],
    ["lightmatter",             "greenhouse",   "Lightmatter",                 "semis",               250, true,  false],
    ["normalcomputing",         "ashby",        "Normal Computing",            "semis",               70, true,  false],
    ["psiquantum",              "greenhouse",   "PsiQuantum",                  "semis",               450, true,  false],
    ["rigetti",                 "lever",        "Rigetti Computing",           "semis",               180, true,  false],
    ["tenstorrent",             "greenhouse",   "Tenstorrent",                 "semis",               500, true,  false],

    // ---- manufacturing ----
    ["augury",                  "greenhouse",   "Augury",                      "manufacturing",       400, true,  false],
    ["brightmachines",          "lever",        "Bright Machines",             "manufacturing",       300, true,  false],
    ["divergent",               "greenhouse",   "Divergent Technologies",      "manufacturing",       450, true,  false],
    ["fictiv",                  "greenhouse",   "Fictiv",                      "manufacturing",       430, true,  false],
    ["first-resonance",         "ashby",        "First Resonance",             "manufacturing",       70, true,  false],
    ["formic",                  "greenhouse",   "Formic",                      "manufacturing",       110, true,  false],
    ["lumafield",               "lever",        "Lumafield",                   "manufacturing",       150, true,  false],
    ["paperlessparts",          "greenhouse",   "Paperless Parts",             "manufacturing",       180, true,  false],
    ["tulip",                   "greenhouse",   "Tulip Interfaces",            "manufacturing",       250, true,  false],

    // ---- constructiontech ----
    ["buildops",                "greenhouse",   "BuildOps",                    "constructiontech",    400, true,  false],
    ["doxel",                   "lever",        "Doxel",                       "constructiontech",    130, true,  false],
    ["higharc",                 "ashby",        "Higharc",                     "constructiontech",    100, true,  false],
    ["kojo",                    "ashby",        "Kojo",                        "constructiontech",    150, true,  false],
    ["openspace",               "greenhouse",   "OpenSpace",                   "constructiontech",    200, true,  false],
    ["parspec",                 "ashby",        "Parspec",                     "constructiontech",    110, true,  false],
    ["sitetracker",             "lever",        "Sitetracker",                 "constructiontech",    300, true,  false],

    // ---- materials ----
    ["bluecurrent",             "greenhouse",   "Blue Current",                "materials",           120, true,  false],
    ["brimstone",               "ashby",        "Brimstone",                   "materials",           120, true,  false],
    ["electrasteel",            "greenhouse",   "Electra",                     "materials",           180, true,  false],
    ["group14",                 "greenhouse",   "Group14 Technologies",        "materials",           380, true,  false],
    ["lilasciences",            "greenhouse",   "Lila Sciences",               "materials",           250, true,  false],
    ["solidpower",              "greenhouse",   "Solid Power",                 "materials",           300, true,  false],

    // ---- printing ----
    ["alloyenterprises",        "ashby",        "Alloy Enterprises",           "printing",            60, true,  false],
    ["markforged",              "greenhouse",   "Markforged",                  "printing",            330, true,  false],
    ["seurat",                  "greenhouse",   "Seurat Technologies",         "printing",            150, true,  false],
    ["velo3d",                  "lever",        "Velo3D",                      "printing",            200, true,  false],

    // ---- av ----
    ["aeva",                    "lever",        "Aeva",                        "av",                  300, true,  false],
    ["avride",                  "greenhouse",   "Avride",                      "av",                  350, true,  false],
    ["bedrock-robotics",        "ashby",        "Bedrock Robotics",            "av",                  90, true,  false],
    ["botauto",                 "greenhouse",   "Bot Auto",                    "av",                  70, true,  false],
    ["helm-ai",                 "ashby",        "Helm.ai",                     "av",                  80, true,  false],
    ["kodiak",                  "greenhouse",   "Kodiak Robotics",             "av",                  250, true,  false],
    ["maymobility",             "greenhouse",   "May Mobility",                "av",                  400, true,  false],
    ["outrider",                "greenhouse",   "Outrider",                    "av",                  200, true,  false],
    ["seyond",                  "greenhouse",   "Seyond",                      "av",                  300, true,  false],
    ["stackav",                 "greenhouse",   "Stack AV",                    "av",                  250, true,  false],
    ["teleo",                   "lever",        "Teleo",                       "av",                  60, true,  false],
    ["waabi",                   "lever",        "Waabi",                       "av",                  250, true,  false],

    // ---- synbio ----
    ["arcaea",                  "greenhouse",   "Arcaea",                      "synbio",              70, true,  false],
    ["colossalbiosciences",     "greenhouse",   "Colossal Biosciences",        "synbio",              180, true,  false],
    ["culturebiosciences",      "greenhouse",   "Culture Biosciences",         "synbio",              90, true,  false],
    ["theeverycompany",         "greenhouse",   "The EVERY Company",           "synbio",              90, true,  false],

    // ---- industrial_bio ----
    ["avantium",                "greenhouse",   "Avantium",                    "industrial_bio",      250, true,  false],
    ["prolific-machines",       "lever",        "Prolific Machines",           "industrial_bio",      70, true,  false],

    // ---- bioinformatics ----
    ["basecamp-research",       "ashby",        "Basecamp Research",           "bioinformatics",      150, true,  false],
    ["cradlebio",               "ashby",        "Cradle",                      "bioinformatics",      110, true,  false],
    ["latchbio",                "ashby",        "LatchBio",                    "bioinformatics",      60, true,  false],
    ["seqera.io",               "ashby",        "Seqera",                      "bioinformatics",      150, true,  false],

    // ---- meddev ----
    ["butterflynetwork",        "greenhouse",   "Butterfly Network",           "meddev",              420, true,  false],
    ["calahealth",              "greenhouse",   "Cala Health",                 "meddev",              150, true,  false],
    ["ceribell",                "greenhouse",   "Ceribell",                    "meddev",              450, true,  false],
    ["ekohealth",               "lever",        "Eko Health",                  "meddev",              150, true,  false],
    ["elementscience",          "greenhouse",   "Element Science",             "meddev",              200, true,  false],
    ["neptunemedical",          "greenhouse",   "Neptune Medical",             "meddev",              150, true,  false],
    ["noahmedical",             "greenhouse",   "Noah Medical",                "meddev",              300, true,  false],
    ["pulsebiosciences",        "greenhouse",   "Pulse Biosciences",           "meddev",              120, true,  false],
    ["sequel-med-tech",         "lever",        "Sequel Med Tech",             "meddev",              250, true,  false],
    ["willowinnovations",       "greenhouse",   "Willow Innovations",          "meddev",              180, true,  false],

    // ---- outdoor ----
    ["alltrails",               "lever",        "AllTrails",                   "outdoor",             200, true,  false],
    ["aventon",                 "lever",        "Aventon Bikes",               "outdoor",             300, true,  false],
    ["bruntworkwear",           "greenhouse",   "BRUNT Workwear",              "outdoor",             120, true,  false],
    ["chromeindustries",        "greenhouse",   "Chrome Industries",           "outdoor",             100, true,  false],
    ["filson",                  "greenhouse",   "Filson",                      "outdoor",             350, true,  false],
    ["goodr",                   "greenhouse",   "goodr",                       "outdoor",             150, true,  false],
    ["keenfootwear",            "greenhouse",   "KEEN Footwear",               "outdoor",             500, true,  false],
    ["onxmaps",                 "greenhouse",   "onX Maps",                    "outdoor",             400, true,  false],
    ["peakdesign",              "greenhouse",   "Peak Design",                 "outdoor",             120, true,  false],
    ["quadlock",                "lever",        "Quad Lock",                   "outdoor",             250, true,  false],
    ["roka",                    "greenhouse",   "ROKA",                        "outdoor",             150, true,  false],
    ["trovebrands",             "greenhouse",   "Trove Brands",                "outdoor",             400, true,  false],

    // ---- sustainable_brands ----
    ["bellroy",                 "greenhouse",   "Bellroy",                     "sustainable_brands",  300, true,  false],
    ["blueland",                "lever",        "Blueland",                    "sustainable_brands",  60, true,  false],
    ["bombas",                  "greenhouse",   "Bombas",                      "sustainable_brands",  200, true,  false],
    ["liquiddeath",             "greenhouse",   "Liquid Death",                "sustainable_brands",  250, true,  false],
    ["olipop",                  "greenhouse",   "OLIPOP",                      "sustainable_brands",  250, true,  false],
    ["vitalfarms",              "greenhouse",   "Vital Farms",                 "sustainable_brands",  450, true,  false],
    ["whogivesacrap",           "greenhouse",   "Who Gives A Crap",            "sustainable_brands",  150, true,  false],

    // ---- fitness ----
    ["eightsleep",              "ashby",        "Eight Sleep",                 "fitness",             250, true,  false],
    ["ladder",                  "ashby",        "Ladder",                      "fitness",             80, true,  false],
    ["myfitnesspal",            "greenhouse",   "MyFitnessPal",                "fitness",             250, true,  false],
    ["runna",                   "ashby",        "Runna",                       "fitness",             120, true,  false],
    ["strava",                  "ashby",        "Strava",                      "fitness",             350, true,  false],
    ["tonal",                   "ashby",        "Tonal",                       "fitness",             400, true,  false],

    // ---- consulting ----
    ["keystone",                "greenhouse",   "Keystone Strategy",           "consulting",          500, true,  false],
    ["propellerconsulting",     "greenhouse",   "Propeller",                   "consulting",          200, true,  false],
    ["sypartners",              "lever",        "SYPartners",                  "consulting",          150, true,  false],

    // ---- esg_consulting ----
    ["systemiq",                "greenhouse",   "Systemiq",                    "esg_consulting",      400, true,  false],

    // ---- market_research ----
    ["cbinsights",              "greenhouse",   "CB Insights",                 "market_research",     350, true,  false],
    ["dscout",                  "greenhouse",   "dscout",                      "market_research",     200, true,  false],
    ["morningconsult",          "ashby",        "Morning Consult",             "market_research",     500, true,  false],
    ["prolific",                "greenhouse",   "Prolific",                    "market_research",     150, true,  false],
    ["sensor-tower",            "ashby",        "Sensor Tower",                "market_research",     350, true,  false],
    ["spins",                   "greenhouse",   "SPINS",                       "market_research",     450, true,  false],

    // ---- nonprofit ----
    ["activate",                "greenhouse",   "Activate",                    "nonprofit",           55, true,  false],
    ["charitywater",            "lever",        "charity: water",              "nonprofit",           100, true,  false],
    ["donorschoose",            "greenhouse",   "DonorsChoose",                "nonprofit",           150, true,  false],
    ["elementalimpact",         "greenhouse",   "Elemental Impact",            "nonprofit",           60, true,  false],
    ["givewell",                "greenhouse",   "GiveWell",                    "nonprofit",           80, true,  false],
    ["propublica",              "greenhouse",   "ProPublica",                  "nonprofit",           200, true,  false],
    ["recidiviz",               "greenhouse",   "Recidiviz",                   "nonprofit",           80, true,  false],
    ["socialfinance",           "greenhouse",   "Social Finance",              "nonprofit",           150, true,  false],
    ["teamrubicon",             "greenhouse",   "Team Rubicon",                "nonprofit",           400, true,  false],
    ["thorn",                   "greenhouse",   "Thorn",                       "nonprofit",           150, true,  false],

    // ---- intl_dev ----
    ["acumen",                  "greenhouse",   "Acumen",                      "intl_dev",            200, true,  false],
    ["dimagi",                  "greenhouse",   "Dimagi",                      "intl_dev",            300, true,  false],
    ["educate",                 "greenhouse",   "Educate!",                    "intl_dev",            300, true,  false],
    ["givedirectly",            "greenhouse",   "GiveDirectly",                "intl_dev",            500, true,  false]
  ];
}
