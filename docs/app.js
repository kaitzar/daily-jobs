/**
 * app.js — the whole front end. No build step, no dependencies.
 *
 * Every call is a GET so the browser never fires a CORS preflight, which
 * Apps Script web apps cannot answer.
 */

const CFG = window.JOBS_CONFIG || {};
const $ = (sel, root = document) => root.querySelector(sel);

const SKIP_REASONS = [
  ["role", "Wrong kind of role"],
  ["location", "Wrong location"],
  ["pay", "Pay too low"],
  ["company", "Company isn't a fit"],
  ["experience", "Wants more experience"],
  ["applied", "Already applied"],
  ["other", "Something else"]
];

const FAMILY_LABELS = {
  bizops: "Business Ops / Strategy & Ops",
  program: "Program / Project Coordination",
  founders_assoc: "Founder's Associate / Chief of Staff",
  revops: "Revenue / Sales Operations",
  bizdev: "Business Development",
  ae: "Account Executive",
  sdr: "Sales Development",
  supplychain: "Supply Chain / Logistics Ops"
};

let state = { today: null, backlogShown: false };

// ---------------------------------------------------------------------------

function api(params) {
  const url = new URL(CFG.API_URL);
  if (CFG.API_KEY) params.key = CFG.API_KEY;
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return fetch(url, { method: "GET", redirect: "follow" })
    .then(r => r.json());
}

// text/plain keeps this a "simple" request, so the browser skips the CORS
// preflight that Apps Script web apps cannot answer.
function post(body) {
  if (CFG.API_KEY) body.key = CFG.API_KEY;
  return fetch(CFG.API_URL, {
    method: "POST", redirect: "follow",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body)
  }).then(r => r.json());
}

function downloadBase64Pdf(b64, filename) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function toast(msg) {
  let el = $(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 2200);
}

function prettyDate(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString(undefined,
    { weekday: "long", month: "long", day: "numeric" });
}

function daysAgo(iso) {
  if (!iso) return "";
  const d = Math.floor((Date.now() - Date.parse(iso + "T12:00:00")) / 86400000);
  if (isNaN(d)) return "";
  if (d <= 0) return "posted today";
  if (d === 1) return "posted yesterday";
  if (d < 7) return `posted ${d} days ago`;
  if (d < 14) return "posted last week";
  return `posted ${Math.floor(d / 7)} weeks ago`;
}

// ---------------------------------------------------------------------------

function buildCard(job, { isBacklog = false } = {}) {
  const node = $("#cardTemplate").content.cloneNode(true);
  const card = $(".card", node);
  card.dataset.jobId = job.job_id;

  $(".title", card).textContent = job.title;
  $(".company", card).textContent = job.company;
  $(".score", card).textContent = Math.round(job.score);

  const bits = [];
  bits.push(`<span>${job.remote && !job.location ? "Remote" : job.location}</span>`);
  if (job.salary) bits.push(`<span>${job.salary}</span>`);
  if (job.posted_at) bits.push(`<span>${daysAgo(job.posted_at)}</span>`);
  if (job.tier === "B" && job.headcount) {
    bits.push(`<span class="stretch">~${job.headcount} employees — stretch pick</span>`);
  }
  $(".meta", card).innerHTML = bits.join("");

  const flagged = /stretch|cold calling|commission|Spanish required|downweighted|a stretch/i;
  $(".chips", card).innerHTML = (job.reasons || [])
    .map(r => `<span class="chip${flagged.test(r) ? " flag" : ""}">${r}</span>`)
    .join("");

  const ex = $(".excerpt", card);
  const more = $(".more", card);
  if (job.excerpt) {
    const full = job.excerpt.trim();
    const teaser = full.replace(/\s+/g, " ").slice(0, 300) + (full.length > 300 ? "…" : "");
    ex.textContent = teaser;
    more.addEventListener("click", () => {
      const open = ex.classList.toggle("open");
      ex.textContent = open ? full : teaser;
      more.textContent = open ? "Show less" : "Read the full posting";
    });
  } else {
    ex.remove(); more.remove();
  }

  wireDocuments(card, job);

  const applyBtn = $(".apply", card);
  applyBtn.href = job.url;
  applyBtn.addEventListener("click", () => decide(card, job, "applied"));

  const skipBtn = $(".skip", card);
  const skipBox = $(".skipbox", card);
  skipBtn.addEventListener("click", () => {
    skipBox.hidden = !skipBox.hidden;
  });

  const reasons = $(".reasons", card);
  SKIP_REASONS.forEach(([key, label]) => {
    const b = document.createElement("button");
    b.className = "reason";
    b.textContent = label;
    b.addEventListener("click", () => decide(card, job, "skipped", key));
    reasons.appendChild(b);
  });

  if (job.status === "applied" || job.status === "skipped") {
    markDecided(card, job.status, isBacklog);
  }
  return card;
}

/**
 * The resume line and the cover letter panel.
 *
 * The resume is not generated per job — there is one per role family, chosen
 * by the same classifier that scored the job, so he never re-checks it. Only
 * the letter is drafted fresh, once per job, and stored with his edits.
 */
function wireDocuments(card, job) {
  const label = $(".resumelabel", card);
  label.innerHTML = "Resume: <strong>" + (job.family_label || "default") + "</strong>";

  $(".resumedl", card).addEventListener("click", () => {
    const btn = $(".resumedl", card);
    const was = btn.textContent;
    btn.textContent = "Building…";
    api({ action: "pdf", job_id: job.job_id, kind: "resume" }).then(res => {
      btn.textContent = was;
      if (!res.ok) { toast(res.error || "Couldn't build the PDF"); return; }
      downloadBase64Pdf(res.base64, res.filename);
    }).catch(() => { btn.textContent = was; toast("Couldn't reach the server"); });
  });

  const box = $(".letterbox", card);
  const status = $(".letterstatus", card);
  const area = $(".lettertext", card);
  const draftBtn = $(".draft", card);

  if (job.has_letter) draftBtn.textContent = "Cover letter";

  function load(force) {
    box.hidden = false;
    status.className = "letterstatus working";
    status.textContent = force ? "Rewriting…" : "Drafting…";
    area.value = "";
    api({ action: "letter", job_id: job.job_id, force: force ? 1 : 0 }).then(res => {
      status.className = "letterstatus";
      if (!res.ok) {
        status.className = "letterstatus err";
        status.textContent = res.error || "Couldn't draft it";
        return;
      }
      area.value = res.letter;
      status.textContent = res.cached ? "Your saved draft" : "Fresh draft — edit freely";
      draftBtn.textContent = "Cover letter";
      autosize(area);
    }).catch(() => {
      status.className = "letterstatus err";
      status.textContent = "Couldn't reach the server";
    });
  }

  draftBtn.addEventListener("click", () => {
    if (!box.hidden) { box.hidden = true; return; }
    if (area.value.trim()) { box.hidden = false; return; }
    load(false);
  });

  $(".regen", card).addEventListener("click", () => {
    if (!confirm("Replace this draft with a new one? Your edits will be lost.")) return;
    load(true);
  });

  $(".letterdl", card).addEventListener("click", () => {
    const btn = $(".letterdl", card);
    const was = btn.textContent;
    btn.textContent = "Building…";
    saveLetter(job, area.value)
      .then(() => api({ action: "pdf", job_id: job.job_id, kind: "letter" }))
      .then(res => {
        btn.textContent = was;
        if (!res.ok) { toast(res.error || "Couldn't build the PDF"); return; }
        downloadBase64Pdf(res.base64, res.filename);
      })
      .catch(() => { btn.textContent = was; toast("Couldn't reach the server"); });
  });

  const saved = $(".lettersaved", card);
  const save = debounce(() => {
    saved.textContent = "Saving…";
    saveLetter(job, area.value)
      .then(r => { saved.textContent = r.ok ? "Saved" : "Couldn't save"; })
      .catch(() => { saved.textContent = "Couldn't save"; });
  }, 900);

  area.addEventListener("input", () => { autosize(area); save(); });
}

function saveLetter(job, text) {
  return post({ action: "save_letter", job_id: job.job_id, text: text });
}

function autosize(el) {
  el.style.height = "auto";
  el.style.height = Math.max(260, el.scrollHeight + 4) + "px";
}

function markDecided(card, status, isBacklog) {
  card.classList.add("is-decided");
  $(".actions", card).hidden = true;
  $(".skipbox", card).hidden = true;
  $(".letterbox", card).hidden = true;
  $(".resumeline", card).hidden = true;
  const d = $(".decided", card);
  d.hidden = false;
  $(".decidedtext", d).textContent = status === "applied" ? "Applied ✓" : "Skipped";
  $(".undo", d).onclick = () => {
    api({ action: "undo", job_id: card.dataset.jobId }).then(() => {
      isBacklog ? loadBacklog(true) : load();
    });
  };
}

function decide(card, job, decision, reason) {
  markDecided(card, decision, false);
  api({ action: "decide", job_id: job.job_id, decision, reason: reason || "" })
    .then(res => {
      if (!res.ok) { toast("Couldn't save that — try again"); return; }
      toast(decision === "applied" ? "Marked as applied" : "Skipped");
      load({ quiet: true });
    })
    .catch(() => toast("Couldn't reach the server"));
}

// ---------------------------------------------------------------------------

function load({ quiet = false } = {}) {
  if (!CFG.API_URL || CFG.API_URL.startsWith("PASTE")) {
    $("#main").innerHTML = `<div class="empty">
      <h2>Not connected yet</h2>
      <p>Add your Apps Script web app URL to <code>config.js</code>.</p></div>`;
    $("#dateline").textContent = "Setup needed";
    return;
  }

  return api({ action: "today" }).then(data => {
    state.today = data;
    const main = $("#main");
    main.innerHTML = "";

    if (!data.ok) {
      main.innerHTML = `<div class="empty"><h2>Something went wrong</h2>
        <p>${data.error || "The backend returned an error."}</p></div>`;
      return;
    }

    $("#dateline").textContent = prettyDate(data.date);

    const total = data.jobs.length;
    const done = total - data.remaining;
    const prog = $("#progress");
    prog.hidden = total === 0;
    $("#progressText").textContent = `${done}/${total}`;
    $(".ring", prog).classList.toggle("done", data.all_decided);

    if (total === 0) {
      main.innerHTML = `<div class="empty">
        <h2>Nothing new today</h2>
        <p>Every matching job currently posted has already been seen.
           New postings get pulled in at 5am.</p></div>`;
    } else {
      data.jobs.forEach(job => main.appendChild(buildCard(job)));
      if (total < 5) {
        const n = document.createElement("p");
        n.className = "note";
        n.textContent = `Only ${total} job${total === 1 ? "" : "s"} cleared the bar today. ` +
          `That happens when the pool runs dry — the list refills as companies post.`;
        main.appendChild(n);
      }
    }

    $("#poolInfo").textContent = `${data.pool_size} matching jobs waiting in the pool`;

    // Backlog
    const sec = $("#backlogSection");
    sec.hidden = false;
    if (!data.backlog_unlocked) {
      $("#backlogHeading").textContent = "The backlog";
      $("#backlogNote").textContent =
        `Locked until today's ${total} are decided — ${data.remaining} to go.`;
      $("#backlogList").innerHTML = "";
      $("#backlogToggle").hidden = true;
    } else {
      $("#backlogNote").textContent = "Today's list is done. Here's what's next in the queue.";
      $("#backlogToggle").hidden = false;
      $("#backlogToggle").textContent = state.backlogShown ? "Hide the backlog" : "Show the backlog";
      if (state.backlogShown) loadBacklog();
    }
  }).catch(err => {
    if (!quiet) {
      $("#main").innerHTML = `<div class="empty"><h2>Couldn't reach the backend</h2>
        <p>Check that the Apps Script deployment is set to "Anyone".</p></div>`;
    }
  });
}

function loadBacklog(force) {
  return api({ action: "backlog" }).then(data => {
    const list = $("#backlogList");
    list.innerHTML = "";
    if (data.locked) { $("#backlogNote").textContent =
      `Locked until today's list is decided — ${data.remaining} to go.`; return; }
    if (!data.jobs.length) {
      list.innerHTML = `<div class="empty"><h2>The pool is empty</h2>
        <p>Everything currently posted has been seen. More arrive tomorrow.</p></div>`;
      return;
    }
    data.jobs.forEach(job => list.appendChild(buildCard(job, { isBacklog: true })));
  });
}

$("#backlogToggle").addEventListener("click", () => {
  state.backlogShown = !state.backlogShown;
  $("#backlogToggle").textContent = state.backlogShown ? "Hide the backlog" : "Show the backlog";
  if (state.backlogShown) loadBacklog();
  else $("#backlogList").innerHTML = "";
});

$("#statsBtn").addEventListener("click", () => {
  const dlg = $("#statsDialog");
  $("#statsBody").innerHTML = "<p class='note'>Loading…</p>";
  dlg.showModal();
  api({ action: "stats" }).then(data => {
    if (!data.by_family.length) {
      $("#statsBody").innerHTML = `<p class="note">Nothing yet. Once you've applied to
        or skipped a handful of jobs, the feed starts adjusting what it shows you.</p>`;
      return;
    }
    const rows = data.by_family.map(f => {
      const sinking = f.influencing && f.skip_rate > 60;
      return `
      <div class="statrow ${sinking ? "active" : ""}">
        <span>${FAMILY_LABELS[f.family] || f.family}</span>
        <span class="num">${f.applied} applied · ${f.skipped} skipped
          ${sinking ? " · sinking" : ""}</span>
      </div>`;
    }).join("");
    $("#statsBody").innerHTML = rows + `<p class="note" style="margin-top:14px">
      Once a role type reaches 4 decisions and you're skipping most of them,
      it starts sinking down the list automatically.</p>`;
  });
});

load();
