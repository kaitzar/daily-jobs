/**
 * Config.gs — every tunable knob lives here.
 *
 * Nothing in this file needs code changes to adjust: edit the numbers,
 * save, and the next daily run picks them up.
 */

var CONFIG = {
  // ---- Daily feed behaviour -------------------------------------------
  DAILY_PICKS: 5,

  // Undecided picks from earlier days go back into the general pool rather
  // than stacking up. Each day is a fresh 5, never "you owe 10 today".
  ROLL_OVER_UNDECIDED: false,

  // The backlog stays locked until all 5 of today's jobs are decided
  // (applied or skipped). Set false to always allow digging deeper.
  BACKLOG_REQUIRES_TODAY_DONE: true,
  BACKLOG_SIZE: 25,

  // A posting older than this is dropped from the pool. Old reqs are
  // usually stale or already filled.
  MAX_POSTING_AGE_DAYS: 45,

  // ---- Company filter --------------------------------------------------
  HEADCOUNT_MIN: 50,
  HEADCOUNT_MAX: 200,

  // Tier B is the safety valve. Companies between HEADCOUNT_MAX and this
  // number are fetched too, but their jobs are scored 12 points lower and
  // labelled "stretch" in the UI. They exist so a thin day still yields five
  // jobs instead of two. Set to HEADCOUNT_MAX to switch tier B off entirely.
  TIER_B_MAX: 500,

  // ---- Scoring ---------------------------------------------------------
  // A job must clear this to ever be shown.
  MIN_SCORE: 40,

  // How hard the skip history pushes down role families and companies he
  // keeps rejecting. 0 disables learning entirely.
  LEARNING_STRENGTH: 1.0,
  LEARNING_MIN_SAMPLES: 4,

  // ---- Compensation ----------------------------------------------------
  // He said he would take a pay cut for the right work, so the floor came down
  // from 60k and the ranking bonus for high pay was halved. The floor is still
  // a hard exclusion — it exists to catch part-time and hourly postings, not to
  // rank jobs.
  SALARY_FLOOR: 55000,
  SALARY_TARGET: 80000,     // at or above this, a small ranking bonus
  PENALIZE_COMMISSION: true, // he wants flat salary, not OTE

  // ---- Cover letters (Anthropic API) ----
  // The API key is NOT here on purpose — it lives in Script Properties so it
  // never reaches the GitHub repo. Set ANTHROPIC_API_KEY there.
  LETTERS_ENABLED: true,
  LETTER_MODEL: "claude-sonnet-5",   // claude-haiku-4-5-20251001 is cheaper and faster
  LETTER_MAX_TOKENS: 1000,

  // ---- Access ----------------------------------------------------------
  // Optional shared secret. Leave "" for a fully public URL, or set a
  // random string and append &key=THATSTRING to the site's API calls.
  API_KEY: "",

  // ---- Ops -------------------------------------------------------------
  TIMEZONE: "America/Los_Angeles",
  DAILY_RUN_HOUR: 5,        // 5am local
  FETCH_TIMEOUT_MS: 20000,
  MAX_COMPANIES_PER_RUN: 200
};

/** Sheet names. */
var SHEETS = {
  COMPANIES: "Companies",
  JOBS: "Jobs",
  PICKS: "DailyPicks",
  EVENTS: "Events",
  LOG: "RunLog"
};
