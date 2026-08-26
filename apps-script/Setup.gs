/**
 * Setup.gs — run setup() once from the Apps Script editor.
 *
 * It creates the sheets, seeds the company list, installs the daily trigger
 * and does a first fetch so there is something to look at immediately.
 */

function setup() {
  var ss;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) { ss = null; }

  if (!ss) {
    ss = SpreadsheetApp.create("Daily Jobs — Thaddeus");
    PropertiesService.getScriptProperties().setProperty("SHEET_ID", ss.getId());
  } else {
    PropertiesService.getScriptProperties().setProperty("SHEET_ID", ss.getId());
  }

  sheet_(SHEETS.COMPANIES, COMPANY_COLS);
  sheet_(SHEETS.JOBS, JOB_COLS);
  sheet_(SHEETS.PICKS, PICK_COLS);
  sheet_(SHEETS.EVENTS, EVENT_COLS);
  sheet_(SHEETS.RESUMES, RESUME_COLS);
  sheet_(SHEETS.LOG, LOG_COLS);

  getCompanies_();          // seeds the company list on first run
  getResumes_();            // seeds one resume per role family
  installTrigger_();
  runDaily();

  Logger.log("Setup complete. Spreadsheet: " + ss.getUrl());
  return ss.getUrl();
}

function installTrigger_() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "runDaily") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("runDaily")
    .timeBased()
    .atHour(CONFIG.DAILY_RUN_HOUR)
    .everyDays(1)
    .inTimezone(CONFIG.TIMEZONE)
    .create();
}

/** Wipe jobs and picks but keep the company list and his decision history. */
function resetJobs() {
  [SHEETS.JOBS, SHEETS.PICKS].forEach(function (name) {
    var s = ss_().getSheetByName(name);
    if (s && s.getLastRow() > 1) {
      s.deleteRows(2, s.getLastRow() - 1);
    }
  });
}

/** Re-seed the resumes from Resumes.gs. Discards every edit made in the sheet. */
function reseedResumes() {
  var s = ss_().getSheetByName(SHEETS.RESUMES);
  if (s && s.getLastRow() > 1) s.deleteRows(2, s.getLastRow() - 1);
  getResumes_();
}

/** Re-seed the company list from Companies.gs, discarding sheet edits. */
function reseedCompanies() {
  var s = ss_().getSheetByName(SHEETS.COMPANIES);
  if (s && s.getLastRow() > 1) s.deleteRows(2, s.getLastRow() - 1);
  getCompanies_();
}
