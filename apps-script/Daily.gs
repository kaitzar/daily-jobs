/**
 * Daily.gs — the once-a-day pipeline.
 *
 * fetch -> normalise -> filter -> score -> store -> pick 5
 */

function runDaily() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return;
  try {
    refreshJobPool_();
    pickToday_();
  } finally {
    lock.releaseLock();
  }
}

/** Fetch every active company and merge new postings into the Jobs sheet. */
function refreshJobPool_() {
  var companies = getCompanies_().slice(0, CONFIG.MAX_COMPANIES_PER_RUN);
  var learning = buildLearning_();
  var existing = jobIdIndex_();
  var seenNow = {};
  var newRows = [];
  var seenCount = 0, matchedCount = 0, errors = [];

  companies.forEach(function (co) {
    var jobs;
    try {
      jobs = fetchCompany_(co);
    } catch (e) {
      errors.push(co.token + ": " + e.message);
      return;
    }
    seenCount += jobs.length;

    jobs.forEach(function (job) {
      job.tier = co.tier;
      job.headcount = co.headcount;
      seenNow[job.id] = true;
      if (existing[job.id]) return;           // already known

      var res = scoreJob_(job, learning);
      if (!res.ok) return;
      matchedCount++;

      newRows.push({
        job_id: job.id,
        company: job.company,
        company_token: job.companyToken,
        source: job.source,
        industry: job.industry,
        title: job.title,
        department: job.department,
        location: job.location,
        metro: res.metro,
        remote: job.remote ? "TRUE" : "FALSE",
        url: job.url,
        posted_at: job.postedAt,
        first_seen: new Date(),
        score: res.score,
        role_family: res.family,
        family_label: res.familyLabel,
        reasons: res.reasons.join(" · "),
        salary_min: job.salaryMin || "",
        salary_max: job.salaryMax || "",
        salary_text: job.salaryText || "",
        status: "pool",
        served_date: "", decided_at: "", skip_reason: "",
        excerpt: String(job.description || "").slice(0, 12000),
        tier: res.tier,
        headcount: job.headcount || ""
      });
    });
  });

  appendObjects_(SHEETS.JOBS, JOB_COLS, newRows);
  markVanishedStale_(seenNow);

  appendObjects_(SHEETS.LOG, LOG_COLS, [{
    timestamp: new Date(),
    companies: companies.length,
    jobs_seen: seenCount,
    jobs_matched: matchedCount,
    picks: "",
    notes: errors.length ? errors.slice(0, 5).join("; ") : "ok"
  }]);
}

/** A posting that disappeared from its board has been filled or pulled. */
function markVanishedStale_(seenNow) {
  var jobs = getJobs_();
  jobs.forEach(function (j) {
    if (j.status !== "pool" && j.status !== "served") return;
    if (seenNow[j.job_id]) return;
    updateJobFields_(j._row, { status: "stale" });
  });
}

/**
 * Choose today's five.
 *
 * Yesterday's undecided picks return to the pool rather than stacking up —
 * each day is a fresh five, never a growing debt.
 */
function pickToday_() {
  var today = todayKey_();
  var picks = readObjects_(SHEETS.PICKS, PICK_COLS);
  var alreadyToday = picks.filter(function (p) { return fmtDate_(p.date) === today; });
  if (alreadyToday.length >= CONFIG.DAILY_PICKS) return;

  var jobs = getJobs_();

  if (!CONFIG.ROLL_OVER_UNDECIDED) {
    jobs.forEach(function (j) {
      if (j.status === "served" && fmtDate_(j.served_date) !== today) {
        updateJobFields_(j._row, { status: "pool", served_date: "" });
        j.status = "pool";
      }
    });
  }

  var pool = jobs.filter(function (j) { return j.status === "pool"; })
    .sort(function (a, b) { return Number(b.score) - Number(a.score); });

  var need = CONFIG.DAILY_PICKS - alreadyToday.length;
  var chosen = pool.slice(0, need);
  var startPos = alreadyToday.length + 1;

  chosen.forEach(function (j, i) {
    updateJobFields_(j._row, { status: "served", served_date: today });
    logEvent_(j, "served", "");
    appendObjects_(SHEETS.PICKS, PICK_COLS, [{
      date: today, position: startPos + i, job_id: j.job_id
    }]);
  });
}

function fmtDate_(v) {
  if (!v) return "";
  if (v instanceof Date) return Utilities.formatDate(v, CONFIG.TIMEZONE, "yyyy-MM-dd");
  return String(v).slice(0, 10);
}
