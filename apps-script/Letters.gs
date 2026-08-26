/**
 * Letters.gs — cover letter drafting via the Anthropic API, plus PDF output
 * for both the letter and the role-family resume.
 *
 * The API key lives in Script Properties, never in this repo. Set it once:
 *   Apps Script editor -> Project Settings -> Script Properties
 *   Property: ANTHROPIC_API_KEY   Value: sk-ant-...
 *
 * A letter is generated once per job and stored. Opening the same job again
 * returns the stored copy — including his edits — rather than paying for and
 * receiving a different letter each time. "Regenerate" is the explicit escape
 * hatch.
 */

function anthropicKey_() {
  var k = PropertiesService.getScriptProperties().getProperty("ANTHROPIC_API_KEY");
  if (!k) throw new Error("No ANTHROPIC_API_KEY set in Script Properties.");
  return k;
}

/** The resume attached to a given role family, from the Resumes sheet. */
function resumeFor_(family) {
  var rows = readObjects_(SHEETS.RESUMES, RESUME_COLS);
  var match = null, fallback = null;
  rows.forEach(function (r) {
    if (r.role_family === family) match = r;
    if (r.role_family === "bizops") fallback = r;
  });
  if (!match && fallback) {
    // A silent fallback here would attach a business-ops resume to a sales job
    // and nobody would notice. Leave a trail.
    appendObjects_(SHEETS.LOG, LOG_COLS, [{
      timestamp: new Date(), companies: "", jobs_seen: "", jobs_matched: "", picks: "",
      notes: "No resume for role family '" + family + "' — fell back to bizops."
    }]);
  }
  var chosen = match || fallback;
  if (!chosen) throw new Error("No resume found. Run setup() to seed the Resumes sheet.");
  return { family: chosen.role_family, label: chosen.label, text: chosen.resume_text,
           fallback: !match };
}

var LETTER_SYSTEM = [
"You write cover letters for one specific person: Thaddeus Ziarkowski. He holds a BS in",
"Business Administration from Cal Poly San Luis Obispo and has since worked in startup",
"operations, small-business operations and field logistics. Treat him as an operator with a",
"short track record, not as a student. You will be given his resume and one job posting.",
"",
"Write the letter he would send.",
"",
"OPENING",
"- The first sentence must contain a fact that appears nowhere except in this posting: a named",
"  product, a customer, a number, a system, a constraint, a specific thing the team ships. Not",
"  the company's mission statement, not its funding, not its industry. If the posting contains",
"  no such fact, open instead with the specific problem this role exists to solve, stated plainly.",
"- The first sentence may not begin with \"I\", and may not be any variant of: \"I am writing to",
"  apply\", \"I am excited to apply\", \"I came across\", \"When I read your posting\", \"As a...\",",
"  \"Your mission to...\". Do not describe his enthusiasm anywhere in the first paragraph.",
"",
"EVIDENCE",
"- The two middle paragraphs each carry one concrete piece of evidence, with its real numbers,",
"  chosen because it answers something the posting explicitly asks for. Name the requirement it",
"  answers, in your own words, in the same paragraph — if you cannot name what it answers, you",
"  picked the wrong evidence.",
"- Take the evidence from the Experience section unless a Projects entry is a closer match to a",
"  stated requirement. Never use both the Sequoia tree-planting and the Kenya & Hawaii meals",
"  bullets in the same letter; at most one, and only if the posting makes it relevant.",
"- Do not paraphrase a resume bullet without adding the reason it matters here.",
"",
"TRUTH",
"- Every proper noun, number, date, place, tool and employer in the letter must appear in the",
"  resume as written. This includes locations: if the resume gives two places for one experience",
"  (\"Kenya & Hawaii\"), name both or name neither. Never pick one.",
"- Do not join two separate resume bullets with a causal claim the resume does not make. If the",
"  resume lists \"built the online channel\" and \"handled inbound inquiries\" as separate bullets,",
"  you may not write \"handled the inquiries it created\".",
"- Do not describe him as \"comfortable with\", \"experienced in\", \"fluent in\" or \"skilled at\"",
"  anything the resume does not list, even when the posting asks for it.",
"- Every fact about the company must come from the posting text in this message. Do not add",
"  anything you know or assume about the company, its products, its missions, its funding or its",
"  history. If the posting says a spacecraft flew, do not say it returned.",
"",
"GAPS",
"- If the posting names a hard requirement he does not have — a system, a certification, a domain,",
"  a number of years — do exactly one of two things: say in a single clause that he hasn't done it",
"  and name the nearest real thing he has done, or leave it out entirely. Never imply coverage",
"  with hedges like \"familiar with\" or \"exposure to\". Do this at most once per letter: one honest",
"  gap reads as candour, two reads as a disqualification.",
"",
"SHAPE AND VOICE",
"- Four paragraphs. Between 220 and 280 words total, and no paragraph over 70 words. Count before",
"  you finish. If you are under 220, add a second piece of evidence, not adjectives; if you are",
"  over 280, cut a sentence, not a number.",
"- No header, no address block, no date, no salutation, no signature line — the template adds those.",
"- Plain, direct, warm. Contractions are fine.",
"- Never use: passionate, thrilled, excited, delighted, eager, leverage, synergy, dynamic,",
"  fast-paced, resonate, \"great fit\", \"perfect fit\", \"strong fit\", \"I would love to\", \"caught my",
"  eye\", \"drew me to\", \"at the intersection of\", \"hit the ground running\", \"wear many hats\",",
"  \"proven track record\". Do not swap in a synonym to satisfy this rule — rewrite the sentence so",
"  it makes a checkable claim instead of expressing a feeling.",
"- Do not mention his degree, his GPA, his graduation year, \"recent graduate\", \"early in my",
"  career\", or his years of experience anywhere. The resume states all of it. Never apologise for",
"  his experience level and never pre-empt an objection nobody raised.",
"",
"CLOSING",
"- Close with one sentence naming something specific this job in particular would teach him, or",
"  something specific he would take off someone's plate. \"I'd like to learn how you operate\" and",
"  \"I'd love to contribute to your mission\" are both failures — name the system, the constraint",
"  or the person.",
"",
"Before you output, check silently and fix any failure:",
"1. Does the first sentence contain a fact unique to this posting, and not begin with \"I\"?",
"2. Is every number, proper noun, place and employer in the letter present in the resume?",
"3. Is every fact about the company present in the posting text above?",
"4. Is the total between 220 and 280 words, in four paragraphs, none over 70?",
"5. Does any banned word or phrase appear?",
"",
"Output the letter body only. No preamble, no explanation, no markdown formatting."
].join("\n");

/**
 * The prompt has rules; this checks whether they were followed. A letter that
 * fails is retried once with the failures named, which is far cheaper than a
 * bad letter reaching an employer.
 */
function validateLetter_(text) {
  var errs = [];
  var t = String(text).trim();
  var words = t.split(/\s+/).length;
  if (words < 200 || words > 300) errs.push("word count is " + words + ", needs 220-280");
  var paras = t.split(/\n\s*\n/);
  if (paras.length < 3 || paras.length > 4) {
    errs.push("paragraph count is " + paras.length + ", needs 4");
  }
  for (var i = 0; i < paras.length; i++) {
    var pw = paras[i].trim().split(/\s+/).length;
    if (pw > 80) errs.push("paragraph " + (i + 1) + " is " + pw + " words, max 70");
  }
  var banned = t.match(/passionate|thrilled|excited|delighted|\beager\b|leverage|synerg|dynamic|fast.paced|resonate|(?:great|perfect|strong) fit|would love to|caught my eye|drew me to|at the intersection of|hit the ground running|wear many hats|proven track record/i);
  if (banned) errs.push("uses banned phrase \"" + banned[0] + "\"");
  if (/^\s*(I am writing|I'm writing|Dear |As a )/i.test(t)) errs.push("forbidden opener");
  if (/^\s*I\b/.test(t)) errs.push("opens with \"I\"");
  if (/sincerely|best regards|yours truly/i.test(t)) errs.push("includes a signature block");
  return errs;
}

function generateLetter_(job, resume, retryNote) {
  var posting = [
    "Company: " + job.company,
    "Role: " + job.title,
    "Location: " + job.location,
    "Industry: " + job.industry,
    "",
    "Posting:",
    String(job.excerpt || "").slice(0, 6000)
  ].join("\n");

  var payload = {
    model: CONFIG.LETTER_MODEL,
    max_tokens: CONFIG.LETTER_MAX_TOKENS,
    system: LETTER_SYSTEM,
    messages: [{
      role: "user",
      content: "Here is his resume:\n\n<resume>\n" + resume.text + "\n</resume>\n\n" +
               "Here is the job:\n\n<job>\n" + posting + "\n</job>\n\n" +
               "Write the cover letter." + (retryNote ? "\n\n" + retryNote : "")
    }]
  };

  var res = UrlFetchApp.fetch("https://api.anthropic.com/v1/messages", {
    method: "post",
    contentType: "application/json",
    headers: {
      "x-api-key": anthropicKey_(),
      "anthropic-version": "2023-06-01"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  var code = res.getResponseCode();
  var body = res.getContentText();
  if (code !== 200) {
    var msg = "Anthropic API returned " + code;
    try { msg += ": " + JSON.parse(body).error.message; } catch (e) {}
    throw new Error(msg);
  }
  var data = JSON.parse(body);
  var text = (data.content || []).filter(function (c) { return c.type === "text"; })
    .map(function (c) { return c.text; }).join("\n").trim();
  if (!text) throw new Error("Anthropic returned an empty letter.");
  return text;
}

/**
 * Draft, check, and retry once naming what went wrong. If the second attempt
 * still fails the checks we keep it anyway — a slightly-long letter he can
 * trim beats an error message — but the failures are logged.
 */
function draftLetter_(job, resume) {
  var text = generateLetter_(job, resume);
  var errs = validateLetter_(text);
  if (!errs.length) return text;

  var retry = generateLetter_(job, resume, 
    "Your previous draft failed these checks: " + errs.join("; ") +
    ". Write it again, fixing every one of them. Same rules as before.");
  var errs2 = validateLetter_(retry);
  if (errs2.length) {
    appendObjects_(SHEETS.LOG, LOG_COLS, [{
      timestamp: new Date(), companies: "", jobs_seen: "", jobs_matched: "", picks: "",
      notes: "Letter for " + job.job_id + " still failed after retry: " + errs2.join("; ")
    }]);
  }
  return errs2.length < errs.length ? retry : text;
}

// ---------------------------------------------------------------------------
// PDF output
// ---------------------------------------------------------------------------

function esc_(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

var PDF_CSS =
  "@page { size: Letter; margin: 0.58in 0.72in; }" +
  "body { font-family: Georgia, 'Times New Roman', serif; font-size: 9.4pt;" +
  "       line-height: 1.26; color: #1a1a1a; }" +
  "h1 { font-family: Helvetica, Arial, sans-serif; font-size: 17.5pt; margin: 0 0 2pt;" +
  "     letter-spacing: -0.4pt; }" +
  ".contact { font-family: Helvetica, Arial, sans-serif; font-size: 8.8pt; color: #4a4a4a;" +
  "           margin: 0 0 9pt; padding-bottom: 6pt; border-bottom: 0.7pt solid #c8c8c8; }" +
  "h2 { font-family: Helvetica, Arial, sans-serif; font-size: 8.4pt; text-transform: uppercase;" +
  "     letter-spacing: 1pt; color: #2a2a2a; margin: 9pt 0 4pt;" +
  "     border-bottom: 0.7pt solid #d8d8d8; padding-bottom: 3pt; }" +
  "h3 { font-family: Helvetica, Arial, sans-serif; font-size: 9.6pt; margin: 6pt 0 1pt; }" +
  ".dates { font-family: Helvetica, Arial, sans-serif; font-size: 8.8pt; color: #5a5a5a;" +
  "         margin: 0 0 4pt; }" +
  "ul { margin: 4pt 0 0; padding-left: 15pt; }" +
  "li { margin-bottom: 1.5pt; }" +
  "p { margin: 0 0 9pt; }";

/** Turn the stored resume markdown into print HTML. */
function resumeHtml_(text) {
  var lines = String(text).replace(/\r/g, "").split("\n");
  var out = [], inList = false;

  function closeList() { if (inList) { out.push("</ul>"); inList = false; } }

  for (var i = 0; i < lines.length; i++) {
    var l = lines[i];
    var t = l.trim();
    if (!t) { continue; }
    if (t.indexOf("# ") === 0 && t.indexOf("## ") !== 0) {
      closeList(); out.push("<h1>" + esc_(t.slice(2)) + "</h1>");
      // the line straight after the name is the contact row
      var next = (lines[i + 1] || "").trim();
      if (next && next.indexOf("#") !== 0 && next.indexOf("-") !== 0) {
        out.push('<div class="contact">' + esc_(next) + "</div>"); i++;
      }
    } else if (t.indexOf("### ") === 0) {
      closeList(); out.push("<h3>" + esc_(t.slice(4)) + "</h3>");
      var d = (lines[i + 1] || "").trim();
      if (d && d.indexOf("#") !== 0 && d.indexOf("-") !== 0) {
        out.push('<div class="dates">' + esc_(d) + "</div>"); i++;
      }
    } else if (t.indexOf("## ") === 0) {
      closeList(); out.push("<h2>" + esc_(t.slice(3)) + "</h2>");
    } else if (t.indexOf("- ") === 0) {
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push("<li>" + esc_(t.slice(2)) + "</li>");
    } else {
      closeList(); out.push("<p>" + esc_(t) + "</p>");
    }
  }
  closeList();
  return "<html><head><meta charset='utf-8'><style>" + PDF_CSS + "</style></head><body>" +
    out.join("") + "</body></html>";
}

/** Letter body plus the header block the model was told not to write. */
function letterHtml_(body, job) {
  var today = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "MMMM d, yyyy");
  var paras = String(body).replace(/\r/g, "").split(/\n\s*\n/)
    .map(function (p) { return "<p>" + esc_(p.trim()).replace(/\n/g, "<br>") + "</p>"; })
    .join("");
  return "<html><head><meta charset='utf-8'><style>" + PDF_CSS +
    " .meta { font-family: Helvetica, Arial, sans-serif; font-size: 9.5pt; color: #4a4a4a;" +
    "         margin: 0 0 16pt; }" +
    "</style></head><body>" +
    "<h1>Thaddeus Ziarkowski</h1>" +
    "<div class='contact'>California | (530) 906-1940 | thaddeusziarkowski@gmail.com | " +
    "linkedin.com/in/thaddeus-ziarkowski-7990071b8</div>" +
    "<div class='meta'>" + esc_(today) + "<br>" + esc_(job.company) +
    "<br>Re: " + esc_(job.title) + "</div>" +
    paras +
    "<p>Sincerely,<br>Thaddeus Ziarkowski</p>" +
    "</body></html>";
}

function htmlToPdfBase64_(html, filename) {
  var blob = Utilities.newBlob(html, "text/html", filename + ".html");
  var pdf = blob.getAs("application/pdf").setName(filename + ".pdf");
  return Utilities.base64Encode(pdf.getBytes());
}

function safeName_(s) {
  return String(s).replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}
