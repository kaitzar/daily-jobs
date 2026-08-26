/**
 * Scoring.gs — turns a raw posting into a score, a role family, and a
 * plain-English explanation of why it surfaced.
 *
 * Built directly from Thaddeus's questionnaire answers. Every constant here
 * traces back to something he said, and the comments say which.
 */

// ---------------------------------------------------------------------------
// Role families. Ranked exactly as he ranked them (1 = favourite).
// ---------------------------------------------------------------------------
var ROLE_FAMILIES = [
  { key: "revops", label: "Revenue / Sales Operations", weight: 78,
    patterns: [/revenue operations/i, /sales operations/i, /gtm operations/i,
      /rev\s?ops/i, /deal desk/i, /sales enablement/i, /go.to.market operations/i] },

  { key: "program", label: "Program / Project Coordination", weight: 96,
    patterns: [/program coordinator/i, /project coordinator/i, /program associate/i,
      /project associate/i, /program manager/i, /project manager/i,
      /implementation (?:coordinator|associate|specialist)/i,
      /operations project/i, /technical program/i, /program specialist/i,
      /project specialist/i, /deployment coordinator/i] },

  { key: "founders_assoc", label: "Founder's Associate / Chief of Staff", weight: 82,
    patterns: [/founder'?s? associate/i, /chief of staff/i, /business associate/i,
      /strategic associate/i, /special projects/i, /associate,? strategy/i] },

  { key: "sdr", label: "Sales Development", weight: 45,
    patterns: [/sales development/i, /business development representative/i,
      /\bbdr\b/i, /\bsdr\b/i, /outbound (?:associate|specialist)/i] },

  { key: "ae", label: "Account Executive", weight: 62,
    patterns: [/account executive/i, /inside sales/i, /sales associate/i,
      /sales representative/i] },

  { key: "bizdev", label: "Business Development", weight: 70,
    patterns: [/business development(?!\s+representative)/i, /partnerships associate/i,
      /partner development/i, /growth operations/i] },

  { key: "supplychain", label: "Supply Chain / Logistics Ops", weight: 52,
    patterns: [/supply chain/i, /logistics (?:coordinator|associate|analyst|specialist)/i,
      /procurement/i, /inventory (?:analyst|coordinator|specialist)/i,
      /fulfillment (?:coordinator|associate)/i, /demand planner/i, /materials planner/i] },

  { key: "bizops", label: "Business Ops / Strategy & Ops", weight: 100,
    patterns: [/business operations/i, /biz\s?ops/i, /strategy (?:&|and) operations/i,
      /strategic operations/i, /operations analyst/i, /business analyst/i,
      /operations associate/i, /operations specialist/i, /operations coordinator/i,
      /operations generalist/i, /\boperations\b.*\banalyst\b/i] }
];

// Roles he refused outright. Hard exclusion, no score.
var REFUSED_TITLE_PATTERNS = [
  /customer success/i, /client success/i, /account manag/i, /customer experience/i,
  /customer support/i, /client services/i, /technical support/i, /support specialist/i,
  /people operations/i, /people ops/i, /recruit/i, /talent acquisition/i,
  /human resources/i, /\bhr\b/i, /\bhrbp\b/i, /people partner/i, /people generalist/i,
  /talent operations/i, /people (?:&|and) culture/i, /employee experience/i,
  /executive assistant/i, /administrative assistant/i, /office manager/i,
  /office coordinator/i, /workplace (?:manager|coordinator|experience)/i
];

// Too senior for a first job out of college.
var SENIORITY_EXCLUDE = [
  /\bsenior\b/i, /\bsr\.?\b/i, /\bstaff\b/i, /\bprincipal\b/i, /\blead\b/i,
  /head of/i, /\bdirector\b/i, /\bvp\b/i, /vice president/i, /\bchief\b/i,
  /\bexecutive director\b/i, /\bmanager,? (?:ii|iii|iv)\b/i, /\b(?:ii|iii|iv|2|3)\b\s*$/i,
  /\bfellow\b/i, /\bexpert\b/i
];

// "Manager" titles are allowed but discounted — usually 3-5 years in.
var MANAGER_PATTERN = /\bmanager\b/i;
var JUNIOR_RESCUE = /\b(associate|assistant|junior|jr\.?|entry|coordinator|analyst i\b|new grad|university|early career|rotational)\b/i;

// ---------------------------------------------------------------------------
// Geography. His ranked metros, plus a 30-minute commute radius each.
// ---------------------------------------------------------------------------
var METROS = [
  { key: "sf",       label: "SF Bay Area", score: 100, patterns: [
    /san francisco/i, /bay area/i, /\boakland\b/i, /berkeley/i, /palo alto/i,
    /menlo park/i, /mountain view/i, /san mateo/i, /sunnyvale/i, /santa clara/i,
    /san jose/i, /redwood city/i, /emeryville/i, /alameda/i, /south san francisco/i,
    /burlingame/i, /foster city/i, /brisbane, ca/i, /\bsf\b/i] },
  { key: "seattle",  label: "Seattle", score: 92, patterns: [
    /seattle/i, /bellevue/i, /redmond/i, /kirkland/i, /tacoma/i] },
  { key: "santacruz",label: "Santa Cruz", score: 88, patterns: [
    /santa cruz/i, /scotts valley/i, /capitola/i, /watsonville/i] },
  { key: "slo",      label: "San Luis Obispo", score: 88, patterns: [
    /san luis obispo/i, /\bslo\b/i, /paso robles/i, /atascadero/i, /pismo/i,
    /arroyo grande/i, /grover beach/i] },
  { key: "sb",       label: "Santa Barbara", score: 85, patterns: [
    /santa barbara/i, /goleta/i, /carpinteria/i, /ventura/i, /ojai/i] },
  { key: "la",       label: "Los Angeles", score: 80, patterns: [
    /los angeles/i, /el segundo/i, /santa monica/i, /pasadena/i, /long beach/i,
    /torrance/i, /culver city/i, /burbank/i, /glendale, ca/i, /hawthorne/i,
    /inglewood/i, /marina del rey/i, /\bla,? ca\b/i, /van nuys/i, /downey/i] },
  { key: "sd",       label: "San Diego", score: 76, patterns: [
    /san diego/i, /la jolla/i, /carlsbad/i, /oceanside/i, /poway/i] },
  { key: "denver",   label: "Denver", score: 70, patterns: [
    /denver/i, /boulder/i, /golden, co/i, /louisville, co/i, /broomfield/i,
    /lakewood, co/i, /arvada/i] },
  { key: "nyc",      label: "New York", score: 65, patterns: [
    /new york/i, /brooklyn/i, /manhattan/i, /\bnyc\b/i, /jersey city/i, /queens, ny/i] },
  { key: "chicago",  label: "Chicago", score: 60, patterns: [
    /chicago/i, /evanston/i] }
];

var REMOTE_SCORE = 68;   // he ranked remote last, but it is still acceptable

// Locations that are outside his list. Present so a European or Texas role
// does not sneak in via a loose remote match.
var NON_US_PATTERNS = [
  /london/i, /united kingdom/i, /\buk\b/i, /berlin/i, /munich/i, /germany/i,
  /amsterdam/i, /netherlands/i, /paris/i, /france/i, /dublin/i, /ireland/i,
  /toronto/i, /vancouver/i, /canada/i, /bangalore/i, /bengaluru/i, /india/i,
  /singapore/i, /sydney/i, /australia/i, /tokyo/i, /japan/i, /tel aviv/i,
  /israel/i, /zurich/i, /switzerland/i, /stockholm/i, /sweden/i, /madrid/i,
  /barcelona/i, /spain/i, /lisbon/i, /portugal/i, /warsaw/i, /poland/i,
  /mexico city/i, /brazil/i, /\bemea\b/i, /\bapac\b/i, /\beurope\b/i,
  /\beu\b/i, /\bapj\b/i, /\blatam\b/i, /latin america/i, /\bglobal\b/i,
  /asia/i, /\bnordics?\b/i, /\bbenelux\b/i, /\bdach\b/i
];

// ---------------------------------------------------------------------------
// Industry. Every key here is an industry Thaddeus marked Yes on the checklist
// (62 of 120). The 58 he marked No are enforced by absence — no company in
// those industries is in Companies.gs — plus the keyword net further down for
// stragglers that slip in under a company that spans two markets.
//
// Weights reflect his stated priority order (clean tech, biotech, aerospace,
// AI, ag, ocean) with two adjustments: outdoor sits near the top because he
// named Patagonia as a dream employer, and fitness sits at the bottom as the
// weakest Yes in the set.
// ---------------------------------------------------------------------------
var INDUSTRY_SCORES = {
  // Energy and power
  solar: 100, geothermal: 100, nuclear: 98, fusion: 98, hydrogen: 96,
  storage: 100, grid: 98, efficiency: 96, electrification: 98,
  ev: 94, ev_charging: 96,

  // Climate and environment
  carbon_removal: 100, carbon_markets: 92, climate_risk: 90, air_quality: 90,
  env_consulting: 92, circular: 94, waste: 90, forestry: 96, conservation: 96,
  desal: 86, coastal: 92,

  // Food and agriculture
  precision_ag: 90, ag_robotics: 92, vertical_farming: 86, regen_ag: 92,
  ag_biotech: 86,

  // Ocean
  ocean_data: 96, marine_cdr: 96,

  // Aerospace and aviation
  launch: 94, satellites: 94, in_space: 94, satcom: 88, eVTOL: 92, saf: 94,
  aviation: 82, drones: 86,

  // AI and software
  ai_labs: 86, ai_products: 84, devtools: 80, data_infra: 80, compute: 82,
  robotics: 90, vision: 84, semis: 82,

  // Industrial and built environment
  manufacturing: 88, constructiontech: 90, materials: 90, printing: 84, av: 86,

  // Life sciences
  synbio: 88, industrial_bio: 88, bioinformatics: 82, meddev: 76,

  // Consumer
  outdoor: 96, sustainable_brands: 92, fitness: 72,

  // Services and institutions
  consulting: 84, esg_consulting: 90, market_research: 76, nonprofit: 84,
  intl_dev: 84,

  other: 60
};

// Industries he marked No. Checked against company name, title, department and
// the opening of the description — not the whole body, which throws false
// positives on any company that happens to mention the word "insurance".
var EXCLUDED_INDUSTRY_PATTERNS = [
  // Defense
  /\bdefen[cs]e\b/i, /\bmilitary\b/i, /\bwarfighter\b/i, /\bmissile\b/i,
  /\bweapons?\b/i, /\bdo[dD]\b/i, /national security/i, /\bcombat\b/i,
  // Finance
  /\binsurance\b/i, /\bunderwrit/i, /\bactuarial\b/i, /\bfintech\b/i,
  /\bneobank\b/i, /payments? platform/i, /\blending\b/i, /\bmortgage\b/i,
  /wealth management/i, /\bbrokerage\b/i, /venture capital/i, /private equity/i,
  // Gambling, tobacco, cannabis
  /\bcasino\b/i, /\bgambling\b/i, /sportsbook/i, /\bbetting\b/i, /\bigaming\b/i,
  /\bvape\b/i, /\bnicotine\b/i, /\btobacco\b/i, /\bcannabis\b/i,
  // Advertising and social
  /\badtech\b/i, /programmatic advertis/i, /ad (?:platform|network|exchange)/i,
  /social (?:media|network) (?:platform|app)/i,
  // Healthcare delivery, pharma, diagnostics, lab supply
  /electronic health record/i, /\behr\b/i, /health (?:system|plan|payer)/i,
  /patient care/i, /\bclinician/i, /care delivery/i, /revenue cycle/i,
  /drug discovery/i, /\bpharmaceutical/i, /clinical trial/i, /\btherapeutics\b/i,
  /\bdiagnostics\b/i, /reagents?\b/i,
  // Fossil fuels and extraction
  /\boil (?:and|&) gas\b/i, /\bupstream (?:oil|energy)\b/i, /\bpetroleum\b/i,
  /\bmining (?:company|operations)\b/i,
  // Sectors he ruled out that share vocabulary with ones he kept
  /\bcybersecurity\b/i, /freight brokerage/i, /last.mile delivery/i,
  /staffing agency/i, /\bproptech\b/i, /\bedtech\b/i
];

// ---------------------------------------------------------------------------

function classifyRole_(title, department) {
  // Title only. Department is far too coarse to establish a family — a
  // marketing role inside a "Business Development" department is still a
  // marketing role, and matching on it produced exactly that false positive.
  //
  // First match wins, and ROLE_FAMILIES is ordered most-specific first, so
  // "Revenue Operations Associate" lands in Revenue Ops rather than being
  // swallowed by the generic "operations associate" pattern in Business Ops.
  var t = title || "";
  for (var i = 0; i < ROLE_FAMILIES.length; i++) {
    var f = ROLE_FAMILIES[i];
    for (var p = 0; p < f.patterns.length; p++) {
      if (f.patterns[p].test(t)) return f;
    }
  }
  return null;
}

function matchMetro_(locationText, isRemote) {
  var loc = locationText || "";
  for (var i = 0; i < METROS.length; i++) {
    for (var p = 0; p < METROS[i].patterns.length; p++) {
      if (METROS[i].patterns[p].test(loc)) return METROS[i];
    }
  }
  if (isRemote || /remote|anywhere|distributed/i.test(loc)) {
    for (var n = 0; n < NON_US_PATTERNS.length; n++) {
      if (NON_US_PATTERNS[n].test(loc)) return null;   // remote, but wrong continent
    }
    return { key: "remote", label: "Remote", score: REMOTE_SCORE };
  }
  return null;
}

function minYearsRequired_(description) {
  if (!description) return 0;
  var re = /(\d{1,2})\s*\+?\s*(?:-\s*\d{1,2}\s*)?(?:years?|yrs?)\b[^.]{0,40}?(?:experience|exp\b)/gi;
  var m, best = 0;
  while ((m = re.exec(description)) !== null) {
    var y = parseInt(m[1], 10);
    if (y > 0 && y < 20) { if (best === 0 || y < best) best = y; }
  }
  return best;
}

function daysSince_(iso) {
  if (!iso) return 999;
  var t = Date.parse(iso);
  if (isNaN(t)) return 999;
  return Math.floor((Date.now() - t) / 86400000);
}

/**
 * Score one normalised job.
 * Returns {ok, score, family, familyLabel, metro, reasons[], rejectReason}
 */
function scoreJob_(job, learning) {
  var reasons = [];
  var title = job.title || "";

  // Industry exclusions are checked against what the COMPANY is, not who it
  // sells to. He was asked directly whether a company's customers being in an
  // excluded industry made the company itself a no, and said it does not. So
  // the posting body is deliberately not scanned here — "our customers include
  // leading insurance carriers" is a sentence about the customer list, and
  // scanning for it was throwing out good operations roles at good companies.
  // What the company actually does is handled by curation in Companies.gs.
  var head = (job.company || "") + " " + title + " " + (job.department || "");

  // --- Hard exclusions -----------------------------------------------------
  for (var r = 0; r < REFUSED_TITLE_PATTERNS.length; r++) {
    if (REFUSED_TITLE_PATTERNS[r].test(title)) {
      return { ok: false, rejectReason: "refused role type" };
    }
  }

  var family = classifyRole_(title, job.department);
  if (!family) return { ok: false, rejectReason: "not a target role family" };

  for (var s = 0; s < SENIORITY_EXCLUDE.length; s++) {
    if (SENIORITY_EXCLUDE[s].test(title)) {
      return { ok: false, rejectReason: "too senior" };
    }
  }

  // "Manager" means people management everywhere except program/project
  // management, where it is an individual-contributor title.
  if (MANAGER_PATTERN.test(title) && !JUNIOR_RESCUE.test(title) && family.key !== "program") {
    return { ok: false, rejectReason: "manager-level role" };
  }

  var metro = matchMetro_(job.location, job.remote);
  if (!metro) return { ok: false, rejectReason: "location not on his list" };

  for (var x = 0; x < EXCLUDED_INDUSTRY_PATTERNS.length; x++) {
    if (EXCLUDED_INDUSTRY_PATTERNS[x].test(head)) {
      return { ok: false, rejectReason: "excluded industry" };
    }
  }

  var age = daysSince_(job.postedAt);
  if (age > CONFIG.MAX_POSTING_AGE_DAYS) {
    return { ok: false, rejectReason: "posting too old" };
  }

  var years = minYearsRequired_(job.description);
  if (years >= 5) return { ok: false, rejectReason: years + "+ years required" };

  if (job.salaryMax && job.salaryMax > 0 && job.salaryMax < CONFIG.SALARY_FLOOR) {
    return { ok: false, rejectReason: "below his salary floor" };
  }

  // --- Weighted score ------------------------------------------------------
  var industryScore = INDUSTRY_SCORES[job.industry] || INDUSTRY_SCORES.other;
  var score = (family.weight * 0.45) + (metro.score * 0.30) + (industryScore * 0.25);

  reasons.push(family.label);
  reasons.push(metro.label);

  // Tier B companies sit outside the 50-200 headcount target. They exist so
  // that a thin day still produces five jobs rather than two, and they are
  // labelled as stretch picks in the UI.
  if (job.tier === "B") {
    score -= 12;
    reasons.push("stretch — company is ~" + job.headcount + " people");
  }

  // Experience requirement
  if (years === 0) { score += 4; reasons.push("no stated experience minimum"); }
  else if (years <= 2) { score += 8; reasons.push(years + "+ yrs — entry level"); }
  else if (years <= 3) { score += 2; }
  else { score -= 8; reasons.push(years + "+ yrs — a stretch"); }

  // Department is a soft signal — an ops title inside an ops org is a
  // better bet than the same title parked under Engineering.
  if (/operations|business|strategy|program|revenue|go.to.market|\bgtm\b/i
      .test(job.department || "")) {
    score += 3;
  }

  // Explicit early-career language
  if (JUNIOR_RESCUE.test(title)) { score += 6; }
  if (/new grad|recent grad|entry.level|early career|university (?:grad|program)/i
      .test(job.description || "")) {
    score += 7; reasons.push("explicitly open to new grads");
  }

  // Program/project manager titles survive the check above but still skew
  // a couple of years past entry level.
  if (MANAGER_PATTERN.test(title) && !JUNIOR_RESCUE.test(title)) { score -= 8; }

  // Compensation. He said he would take a pay cut for the right work, so pay is
  // a tiebreaker here rather than a driver — a well-matched conservation job at
  // $68k should not lose to a worse-matched AI job at $150k on comp alone. The
  // floor is still a hard exclusion further up; this is only the ranking nudge.
  if (job.salaryMin >= CONFIG.SALARY_TARGET) {
    score += 6; reasons.push("pays " + (job.salaryText || "at or above target"));
  } else if (job.salaryMin >= CONFIG.SALARY_FLOOR) {
    score += 3; reasons.push("pays " + (job.salaryText || "above floor"));
  }
  // No penalty for pay near the floor. That penalty was punishing exactly the
  // mission-driven work he said he would take a cut for.

  // Commission-heavy comp — he asked for flat salary.
  if (CONFIG.PENALIZE_COMMISSION) {
    var d = job.description || "";
    var commissionHits = (d.match(/\bOTE\b|on.target earnings|uncapped commission|commission plan|\bquota\b/gi) || []).length;
    if (commissionHits >= 1) {
      score -= 15;
      reasons.push("commission-based comp");
    }
  }

  // Cold-call intensity — the thing he explicitly refused.
  var coldCall = (String(job.description || "").match(/cold call|dials per day|\d{2,3}\+? (?:calls|dials)|high.volume outbound|outbound prospecting/gi) || []).length;
  if (coldCall >= 1) {
    score -= 18;
    reasons.push("heavy cold calling");
  }

  // Freshness
  if (age <= 7) { score += 8; reasons.push("posted this week"); }
  else if (age <= 14) { score += 4; }
  else if (age > 30) { score -= 6; }

  // Spanish is a plus, never a requirement — he will not take a full-time
  // Spanish-speaking role.
  if (/spanish/i.test(job.description || "")) {
    if (/spanish (?:fluency )?required|fluent in spanish|bilingual required/i.test(job.description)) {
      score -= 10; reasons.push("Spanish required");
    } else {
      score += 5; reasons.push("Spanish a plus — he is fluent");
    }
  }

  // Résumé keyword overlap — light touch, breaks ties.
  var overlap = resumeOverlap_(job.description);
  score += Math.min(overlap * 1.5, 9);

  // --- Learned adjustment from his own skip history ------------------------
  if (learning && CONFIG.LEARNING_STRENGTH > 0) {
    var adj = learningAdjustment_(learning, family.key, job.companyToken);
    if (adj !== 0) {
      score += adj;
      if (adj < -3) reasons.push("downweighted — he usually skips these");
      if (adj > 3) reasons.push("upweighted — he usually applies to these");
    }
  }

  return {
    ok: score >= CONFIG.MIN_SCORE,
    score: Math.round(score * 10) / 10,
    family: family.key,
    familyLabel: family.label,
    metro: metro.label,
    tier: job.tier || "A",
    reasons: reasons,
    rejectReason: score >= CONFIG.MIN_SCORE ? "" : "scored below threshold"
  };
}

// Terms drawn from his résumé — startup ops, process building, KPI tracking,
// vendor and budget work, cross-functional coordination.
var RESUME_TERMS = [
  /process (?:improvement|documentation|design)/i, /\bkpi\b/i, /cross.functional/i,
  /vendor/i, /budget/i, /forecast/i, /quickbooks/i, /\bcrm\b/i, /market research/i,
  /customer discovery/i, /go.to.market/i, /\broi\b/i, /financial model/i,
  /scheduling/i, /inventory/i, /startup/i, /early.stage/i, /founding team/i,
  /notion/i, /airtable/i, /google workspace/i, /excel/i, /dashboards?/i,
  /stakeholder/i, /project plan/i, /\bsql\b/i, /automation/i, /\bai tools?\b/i
];

function resumeOverlap_(description) {
  if (!description) return 0;
  var n = 0;
  for (var i = 0; i < RESUME_TERMS.length; i++) {
    if (RESUME_TERMS[i].test(description)) n++;
  }
  return n;
}

/**
 * Learned adjustment. Built from his applied/skipped history so the feed
 * stops offering things he never wants. Needs LEARNING_MIN_SAMPLES decisions
 * before it moves anything.
 */
function learningAdjustment_(learning, familyKey, companyToken) {
  var adj = 0;
  adj += bucketAdj_(learning.byFamily && learning.byFamily[familyKey], 25);
  adj += bucketAdj_(learning.byCompany && learning.byCompany[companyToken], 12);
  return adj * CONFIG.LEARNING_STRENGTH;

  function bucketAdj_(b, maxSwing) {
    if (!b) return 0;
    var total = (b.applied || 0) + (b.skipped || 0);
    if (total < CONFIG.LEARNING_MIN_SAMPLES) return 0;
    var skipRate = b.skipped / total;
    if (skipRate > 0.6) return -maxSwing * ((skipRate - 0.6) / 0.4);
    if (skipRate < 0.3) return  maxSwing * 0.4 * ((0.3 - skipRate) / 0.3);
    return 0;
  }
}
