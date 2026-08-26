/**
 * Api.gs — the public JSON API the website calls.
 *
 * Everything is a GET so that browsers never fire a CORS preflight, which
 * Apps Script web apps cannot answer. Mutations are GETs on purpose.
 *
 *   ?action=today                          today's five
 *   ?action=backlog                        the next ranked jobs, once today is done
 *   ?action=decide&job_id=..&decision=applied|skipped[&reason=..]
 *   ?action=undo&job_id=..
 *   ?action=stats                          what he applies to vs skips
 *   ?action=refresh                        force a fetch (also runs daily on a trigger)
 *   ?action=letter&job_id=..[&force=1]     the cover letter, drafted on first ask
 *   ?action=pdf&job_id=..&kind=letter|resume
 *
 * Saving an edited letter is a POST (the body can be long) with content-type
 * text/plain, which is a "simple request" and so skips CORS preflight too.
 */

function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (CONFIG.API_KEY && p.key !== CONFIG.API_KEY) {
      return json_({ ok: false, error: "unauthorized" });
    }
    switch (p.action) {
      case "today":    return json_(apiToday_());
      case "backlog":  return json_(apiBacklog_(Number(p.limit) || CONFIG.BACKLOG_SIZE));
      case "decide":   return json_(apiDecide_(p.job_id, p.decision, p.reason));
      case "undo":     return json_(apiUndo_(p.job_id));
      case "stats":    return json_(apiStats_());
      case "refresh":  runDaily(); return json_(apiToday_());
      case "letter":   return json_(apiLetter_(p.job_id, p.force === "1"));
      case "pdf":      return json_(apiPdf_(p.job_id, p.kind));
      default:         return json_({ ok: true, service: "daily-jobs", actions:
        ["today","backlog","decide","undo","stats","refresh","letter","pdf"] });
    }
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

/** Saving an edited cover letter. POST because the body can be long. */
function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (CONFIG.API_KEY && body.key !== CONFIG.API_KEY) {
      return json_({ ok: false, error: "unauthorized" });
    }
    if (body.action !== "save_letter") return json_({ ok: false, error: "unknown action" });

    var jobs = getJobs_();
    for (var i = 0; i < jobs.length; i++) {
      if (jobs[i].job_id !== body.job_id) continue;
      updateJobFields_(jobs[i]._row, { letter: body.text || "" });
      logEvent_(jobs[i], "letter_edited", "");
      return json_({ ok: true, job_id: body.job_id });
    }
    return json_({ ok: false, error: "job not found" });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function shape_(j) {
  return {
    job_id: j.job_id,
    company: j.company,
    title: j.title,
    location: j.location,
    metro: j.metro,
    remote: String(j.remote).toUpperCase() === "TRUE",
    industry: j.industry,
    url: j.url,
    posted_at: fmtDate_(j.posted_at),
    score: Number(j.score),
    family: j.role_family,
    family_label: j.family_label,
    reasons: String(j.reasons || "").split(" · ").filter(Boolean),
    salary: j.salary_text || "",
    excerpt: String(j.excerpt || "").slice(0, 600),
    status: j.status,
    skip_reason: j.skip_reason || "",
    tier: j.tier || "A",
    headcount: j.headcount || "",
    has_letter: !!String(j.letter || "").trim()
  };
}

function apiToday_() {
  var today = todayKey_();
  var picks = readObjects_(SHEETS.PICKS, PICK_COLS)
    .filter(function (p) { return fmtDate_(p.date) === today; })
    .sort(function (a, b) { return Number(a.position) - Number(b.position); });

  // First visit of the day before the trigger fired — build the list now.
  if (!picks.length) {
    runDaily();
    picks = readObjects_(SHEETS.PICKS, PICK_COLS)
      .filter(function (p) { return fmtDate_(p.date) === today; })
      .sort(function (a, b) { return Number(a.position) - Number(b.position); });
  }

  var idx = jobIdIndex_();
  var jobs = picks.map(function (p) { return idx[p.job_id]; })
    .filter(Boolean).map(shape_);

  var undecided = jobs.filter(function (j) {
    return j.status !== "applied" && j.status !== "skipped";
  }).length;

  return {
    ok: true,
    date: today,
    jobs: jobs,
    remaining: undecided,
    all_decided: undecided === 0 && jobs.length > 0,
    backlog_unlocked: !CONFIG.BACKLOG_REQUIRES_TODAY_DONE || (undecided === 0 && jobs.length > 0),
    pool_size: countPool_()
  };
}

function countPool_() {
  return getJobs_().filter(function (j) { return j.status === "pool"; }).length;
}

function apiBacklog_(limit) {
  var today = apiToday_();
  if (!today.backlog_unlocked) {
    return { ok: true, locked: true, remaining: today.remaining, jobs: [] };
  }
  var jobs = getJobs_()
    .filter(function (j) { return j.status === "pool"; })
    .sort(function (a, b) { return Number(b.score) - Number(a.score); })
    .slice(0, limit).map(shape_);
  return { ok: true, locked: false, jobs: jobs };
}

function apiDecide_(jobId, decision, reason) {
  if (!jobId) return { ok: false, error: "missing job_id" };
  if (decision !== "applied" && decision !== "skipped") {
    return { ok: false, error: "decision must be applied or skipped" };
  }
  var jobs = getJobs_();
  for (var i = 0; i < jobs.length; i++) {
    if (jobs[i].job_id !== jobId) continue;
    updateJobFields_(jobs[i]._row, {
      status: decision,
      decided_at: new Date(),
      skip_reason: decision === "skipped" ? (reason || "") : ""
    });
    jobs[i].status = decision;
    logEvent_(jobs[i], decision, reason || "");
    return { ok: true, job_id: jobId, status: decision };
  }
  return { ok: false, error: "job not found" };
}

function apiUndo_(jobId) {
  var jobs = getJobs_();
  for (var i = 0; i < jobs.length; i++) {
    if (jobs[i].job_id !== jobId) continue;
    var back = fmtDate_(jobs[i].served_date) === todayKey_() ? "served" : "pool";
    updateJobFields_(jobs[i]._row, { status: back, decided_at: "", skip_reason: "" });
    logEvent_(jobs[i], "undo", "");
    return { ok: true, job_id: jobId, status: back };
  }
  return { ok: false, error: "job not found" };
}

/**
 * The cover letter for one job.
 *
 * Generated once and stored, so re-opening a job returns the same letter —
 * including his edits — rather than a different one each visit. force=1 is the
 * explicit "give me another draft" path, and it overwrites.
 */
function apiLetter_(jobId, force) {
  if (!CONFIG.LETTERS_ENABLED) return { ok: false, error: "letters are switched off" };
  if (!jobId) return { ok: false, error: "missing job_id" };

  var jobs = getJobs_();
  var job = null;
  for (var i = 0; i < jobs.length; i++) if (jobs[i].job_id === jobId) job = jobs[i];
  if (!job) return { ok: false, error: "job not found" };

  var resume = resumeFor_(job.role_family);
  var stored = String(job.letter || "").trim();

  if (stored && !force) {
    return {
      ok: true, job_id: jobId, letter: stored, cached: true,
      resume_family: resume.family, resume_label: resume.label
    };
  }

  var text;
  try {
    text = draftLetter_(job, resume);
  } catch (err) {
    return { ok: false, error: String(err && err.message || err) };
  }

  updateJobFields_(job._row, { letter: text, letter_at: new Date() });
  logEvent_(job, force ? "letter_regenerated" : "letter_generated", "");

  return {
    ok: true, job_id: jobId, letter: text, cached: false,
    resume_family: resume.family, resume_label: resume.label
  };
}

/**
 * A print-ready PDF, returned base64 so the static site can hand it to the
 * browser as a download without any server of its own.
 */
function apiPdf_(jobId, kind) {
  if (!jobId) return { ok: false, error: "missing job_id" };
  var jobs = getJobs_();
  var job = null;
  for (var i = 0; i < jobs.length; i++) if (jobs[i].job_id === jobId) job = jobs[i];
  if (!job) return { ok: false, error: "job not found" };

  var resume = resumeFor_(job.role_family);

  if (kind === "resume") {
    return {
      ok: true, kind: "resume",
      filename: "Thaddeus-Ziarkowski-Resume-" + safeName_(resume.label) + ".pdf",
      base64: htmlToPdfBase64_(resumeHtml_(resume.text), "resume")
    };
  }

  var letter = String(job.letter || "").trim();
  if (!letter) return { ok: false, error: "no letter yet — draft one first" };
  return {
    ok: true, kind: "letter",
    filename: "Thaddeus-Ziarkowski-Cover-Letter-" + safeName_(job.company) + ".pdf",
    base64: htmlToPdfBase64_(letterHtml_(letter, job), "cover-letter")
  };
}

/**
 * What the platform has learned so far. This is the data that lets the feed
 * get smarter — if a role family is being skipped every time, the scorer
 * pushes it down automatically once there are enough samples.
 */
function apiStats_() {
  var learning = buildLearning_();
  var out = { ok: true, by_family: [], by_company: [], totals: { applied: 0, skipped: 0 } };

  Object.keys(learning.byFamily).forEach(function (k) {
    var b = learning.byFamily[k];
    var t = b.applied + b.skipped;
    out.by_family.push({
      family: k, applied: b.applied, skipped: b.skipped,
      skip_rate: t ? Math.round((b.skipped / t) * 100) : 0,
      influencing: t >= CONFIG.LEARNING_MIN_SAMPLES
    });
    out.totals.applied += b.applied;
    out.totals.skipped += b.skipped;
  });
  Object.keys(learning.byCompany).forEach(function (k) {
    var b = learning.byCompany[k];
    out.by_company.push({ company: k, applied: b.applied, skipped: b.skipped });
  });
  out.by_family.sort(function (a, b) { return b.skipped - a.skipped; });
  return out;
}
