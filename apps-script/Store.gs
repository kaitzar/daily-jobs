/**
 * Store.gs — the Google Sheet is the database. Thin helpers over it.
 */

var JOB_COLS = ["job_id","company","company_token","source","industry","title",
  "department","location","metro","remote","url","posted_at","first_seen","score",
  "role_family","family_label","reasons","salary_min","salary_max","salary_text",
  "status","served_date","decided_at","skip_reason","excerpt","tier","headcount",
  "letter","letter_at"];

var COMPANY_COLS = ["token","source","name","industry","est_headcount","active","always_allow"];
var PICK_COLS    = ["date","position","job_id"];
var EVENT_COLS   = ["timestamp","job_id","action","role_family","company_token","reason"];
var RESUME_COLS  = ["role_family","label","resume_text","updated_at"];
var LOG_COLS     = ["timestamp","companies","jobs_seen","jobs_matched","picks","notes"];

function ss_() {
  var id = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  if (id) return SpreadsheetApp.openById(id);
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  throw new Error("No spreadsheet bound. Run setup() first.");
}

function sheet_(name, cols) {
  var s = ss_().getSheetByName(name);
  if (!s) {
    s = ss_().insertSheet(name);
    s.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight("bold");
    s.setFrozenRows(1);
  }
  return s;
}

function readObjects_(name, cols) {
  var s = sheet_(name, cols);
  var last = s.getLastRow();
  if (last < 2) return [];
  var values = s.getRange(2, 1, last - 1, cols.length).getValues();
  return values.map(function (row, i) {
    var o = { _row: i + 2 };
    for (var c = 0; c < cols.length; c++) o[cols[c]] = row[c];
    return o;
  });
}

function appendObjects_(name, cols, objects) {
  if (!objects.length) return;
  var s = sheet_(name, cols);
  var rows = objects.map(function (o) {
    return cols.map(function (c) { return o[c] === undefined ? "" : o[c]; });
  });
  s.getRange(s.getLastRow() + 1, 1, rows.length, cols.length).setValues(rows);
}

function getCompanies_() {
  var s = sheet_(SHEETS.COMPANIES, COMPANY_COLS);
  if (s.getLastRow() < 2) {
    var rows = seedCompanies_();
    s.getRange(2, 1, rows.length, COMPANY_COLS.length).setValues(rows);
  }
  var out = [];
  readObjects_(SHEETS.COMPANIES, COMPANY_COLS).forEach(function (c) {
    if (!c.token) return;
    if (c.active === false || String(c.active).toUpperCase() === "FALSE") return;

    var hc = Number(c.est_headcount) || 0;
    var always = c.always_allow === true || String(c.always_allow).toUpperCase() === "TRUE";

    var tier = null;
    if (always) tier = "A";
    else if (hc >= CONFIG.HEADCOUNT_MIN && hc <= CONFIG.HEADCOUNT_MAX) tier = "A";
    else if (hc > CONFIG.HEADCOUNT_MAX && hc <= CONFIG.TIER_B_MAX) tier = "B";
    if (!tier) return;

    c.tier = tier;
    c.headcount = hc;
    out.push(c);
  });
  // Tier A first so a truncated run never drops the best companies.
  out.sort(function (a, b) { return a.tier === b.tier ? 0 : (a.tier === "A" ? -1 : 1); });
  return out;
}

function getJobs_() { return readObjects_(SHEETS.JOBS, JOB_COLS); }

function getResumes_() {
  var s = sheet_(SHEETS.RESUMES, RESUME_COLS);
  if (s.getLastRow() < 2) {
    var rows = seedResumes_();
    s.getRange(2, 1, rows.length, RESUME_COLS.length).setValues(rows);
    s.setColumnWidth(3, 520);
    for (var i = 2; i <= rows.length + 1; i++) s.setRowHeight(i, 21);
  }
  return readObjects_(SHEETS.RESUMES, RESUME_COLS);
}

function jobIdIndex_() {
  var idx = {};
  getJobs_().forEach(function (j) { idx[j.job_id] = j; });
  return idx;
}

function updateJobFields_(row, fields) {
  var s = sheet_(SHEETS.JOBS, JOB_COLS);
  Object.keys(fields).forEach(function (k) {
    var c = JOB_COLS.indexOf(k);
    if (c >= 0) s.getRange(row, c + 1).setValue(fields[k]);
  });
}

function logEvent_(job, action, reason) {
  appendObjects_(SHEETS.EVENTS, EVENT_COLS, [{
    timestamp: new Date(),
    job_id: job.job_id || "",
    action: action,
    role_family: job.role_family || "",
    company_token: job.company_token || "",
    reason: reason || ""
  }]);
}

/** Aggregate his decision history into the shape scoreJob_ expects. */
function buildLearning_() {
  var events = readObjects_(SHEETS.EVENTS, EVENT_COLS);
  var byFamily = {}, byCompany = {};
  events.forEach(function (e) {
    if (e.action !== "applied" && e.action !== "skipped") return;
    bump_(byFamily, e.role_family, e.action);
    bump_(byCompany, e.company_token, e.action);
  });
  return { byFamily: byFamily, byCompany: byCompany, total: events.length };

  function bump_(map, key, action) {
    if (!key) return;
    if (!map[key]) map[key] = { applied: 0, skipped: 0 };
    map[key][action] += 1;
  }
}

function todayKey_() {
  return Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");
}
