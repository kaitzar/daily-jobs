# Setup

Two halves: the backend (Google Apps Script) and the site (GitHub Pages).
Budget about 20 minutes. You need a Google account and a GitHub account.

---

## Part 1 — the backend

### 1. Create the spreadsheet

Go to [sheets.new](https://sheets.new) and name it something like
**Daily Jobs — Thaddeus**. Leave it empty; the script builds its own tabs.

### 2. Open the script editor

In that spreadsheet: **Extensions → Apps Script**. A new tab opens with a file
called `Code.gs` containing an empty `myFunction`.

### 3. Paste in the code

Delete everything in `Code.gs`. Then, for each file in this repo's
`apps-script/` folder, click the **+** next to "Files" → **Script**, name it
exactly as below (Apps Script adds the `.gs` itself), and paste the contents:

| Create a file named | Paste from |
|---|---|
| `Config` | `apps-script/Config.gs` |
| `Companies` | `apps-script/Companies.gs` |
| `Sources` | `apps-script/Sources.gs` |
| `Scoring` | `apps-script/Scoring.gs` |
| `Resumes` | `apps-script/Resumes.gs` |
| `Letters` | `apps-script/Letters.gs` |
| `Store` | `apps-script/Store.gs` |
| `Daily` | `apps-script/Daily.gs` |
| `Api` | `apps-script/Api.gs` |
| `Setup` | `apps-script/Setup.gs` |

You can delete the empty `Code.gs` once the others exist.

Then click the gear icon (**Project Settings**) and tick **Show
"appsscript.json" manifest file in editor**. Go back to the editor, open
`appsscript.json`, and replace its contents with `apps-script/appsscript.json`
from this repo.

### 4. Add the Anthropic API key

The cover letter drafting needs an Anthropic API key. It goes in Script
Properties, **not** in any file in this repo — that way it never reaches GitHub.

1. Get a key at [console.anthropic.com](https://console.anthropic.com) → API Keys.
   Put $5–10 of credit on the account; see the cost note below.
2. In the Apps Script editor: **Project Settings** (gear icon) → scroll to
   **Script Properties** → **Add script property**.
3. Property: `ANTHROPIC_API_KEY`   Value: your `sk-ant-...` key. Save.

**What this costs.** One letter is roughly 4,000 input tokens (his resume plus
the job posting) and 400 output. At five jobs a day, drafting a letter for every
single one, that lands around **$2–4 a month** on Claude Sonnet. A letter is
generated once per job and stored, so re-opening a job costs nothing; only
"Rewrite" spends again. To cut it further, set `LETTER_MODEL` in `Config.gs` to
`claude-haiku-4-5-20251001` — roughly a fifth the price, noticeably less good at
the opening sentence.

To turn letters off entirely, set `LETTERS_ENABLED: false` in `Config.gs`. The
rest of the site works without a key.

### 5. Run setup

In the toolbar, pick **setup** from the function dropdown and click **Run**.

Google will ask for authorisation. It will warn that the app isn't verified —
that's expected for a personal script. Click **Advanced → Go to [project name]
(unsafe) → Allow**. You're granting your own script access to your own
spreadsheet.

The first run takes 2-4 minutes because it fetches every company board. When it
finishes, go back to the spreadsheet: you should see `Companies`, `Jobs`,
`DailyPicks`, `Events` and `RunLog` tabs, with the Jobs tab populated.

If `Jobs` is empty, open `RunLog` — the `notes` column will say what failed.

You should also see a `Resumes` tab with eight rows, one per role family. Those
are drafts — see "The resumes" below.

### 6. Deploy the web app

**Deploy → New deployment → gear icon → Web app.**

| Field | Value |
|---|---|
| Description | `v1` |
| Execute as | **Me** |
| Who has access | **Anyone** |

"Anyone" is what makes it work without a Google login. The URL is unguessable,
but it is technically public — see the note at the bottom if that matters to you.

Click **Deploy** and copy the **Web app URL**. It looks like:

```
https://script.google.com/macros/s/AKfycbx...../exec
```

Paste that URL into your browser with `?action=today` on the end. You should
get JSON with five jobs in it. If you do, the backend is done.

### 7. Confirm the daily trigger

`setup()` installs it, but verify: click the clock icon (**Triggers**) in the
left sidebar. There should be one, running `runDaily`, day timer, 5am-6am.

---

## Part 2 — the site

### 1. Create the repo

On GitHub, create a new **public** repository — `daily-jobs` works. Public is
required for free GitHub Pages.

### 2. Push the code

```bash
git clone https://github.com/YOUR_USERNAME/daily-jobs.git
cd daily-jobs
# copy the contents of this project in, then:
git add .
git commit -m "Daily job feed"
git push
```

### 3. Add your web app URL

Open `web/config.js` and replace the placeholder:

```js
window.JOBS_CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbx...../exec",
  API_KEY: ""
};
```

Commit and push.

### 4. Turn on Pages

**Settings → Pages.** Under "Build and deployment", set Source to **Deploy from
a branch**, branch **main**, folder **/web**. Save.

Give it a minute, then visit:

```
https://YOUR_USERNAME.github.io/daily-jobs/
```

Five jobs should be sitting there. Send Thaddeus the link and tell him to add
it to his phone's home screen.

---

## Tuning it

Everything adjustable lives in `Config.gs`. After changing anything, save, then
**re-deploy**: Deploy → Manage deployments → pencil icon → Version: **New
version** → Deploy. Editing code alone does not update the live URL.

| Setting | Does what |
|---|---|
| `DAILY_PICKS` | How many jobs a day. Currently 5 |
| `MIN_SCORE` | The bar a job must clear. Lower means more jobs, lower quality |
| `HEADCOUNT_MAX` / `TIER_B_MAX` | The 50-200 target band, and how far past it stretch picks may go |
| `MAX_POSTING_AGE_DAYS` | How stale a posting may be |
| `SALARY_FLOOR` / `SALARY_TARGET` | $55k and $80k. Pay only breaks ties — he said he'd take a cut for the right work |
| `LEARNING_STRENGTH` | How hard his skip history reshapes the feed. 0 turns it off |
| `BACKLOG_REQUIRES_TODAY_DONE` | Whether the backlog stays locked until the day's five are decided |

To adjust which companies are in play, edit the **Companies sheet** directly —
set `active` to FALSE to mute one, or fix an `est_headcount` estimate. Sheet
edits survive; they are not overwritten by the daily run.

That `active` column is also the blocklist. He named no companies to rule out,
but if one comes up later — a bad interview, someone he'd rather not work with —
set its `active` cell to FALSE and it never appears again.

## The resumes

There is one resume per role family, and the site attaches the right one
automatically based on how the scorer classified the job. He never picks a
resume and never re-checks one.

The eight seeded versions are all built from the same true facts — same jobs,
same numbers, same dates. What changes between them is the summary and which
evidence leads. The business ops version opens on process design and financial
modelling; the program version opens on the 50-day Sequoia deployment; the
sales development version opens on outreach volume.

**Edit them in the `Resumes` sheet, not in the code.** Column C holds the text.
Changes take effect on the very next job — no redeploy. The format is simple:

```
# Name
Contact line
## Section
### Job title - Company
Dates
- bullet
```

Two things worth fixing before he sends any of these:

1. **The Sequoia dates.** They are seeded as "Early 2026". Put the real months in.
2. **Read all eight once.** They are drafts built from his old resume, not gospel.

`reseedResumes()` in the Apps Script editor restores the seeded versions and
**discards every edit in the sheet** — only run it if that's what you want.

## Cover letters

He clicks "Cover letter" on a job, gets a draft in about ten seconds, edits it
in the box, and downloads it as a PDF. Edits save automatically as he types.

A letter is drafted once per job and stored with his edits. Re-opening the job
shows the same letter back. "Rewrite" is the explicit "give me a different one"
button and it overwrites.

The draft is checked automatically before it's shown — word count, paragraph
count, banned phrases, forbidden openers, stray signature blocks. A draft that
fails gets one retry with the failures named. Persistent failures are logged to
`RunLog` rather than hidden.

**On submitting automatically:** the site can't do it, and shouldn't. Every
applicant tracking system has a different form, most block automated
submissions, and a bot filling in application forms is the kind of thing that
gets an applicant blacklisted rather than hired. The flow ends at a PDF he
uploads himself, which takes about twenty seconds per application.

## Watching it work

- **Jobs sheet** — every matching job ever found, with its score and reasons
- **Events sheet** — the decision log: what was served, applied to, skipped, and why
- **RunLog sheet** — one row per daily run: companies hit, postings seen, matches found, plus any cover letter that failed its checks twice
- **Resumes sheet** — the eight role-family resumes, editable in place

The Events sheet is the interesting one. After a couple of weeks it will show
which role families he actually applies to versus which he says he wants — and
the scorer is already reacting to that gap automatically.

## Troubleshooting

**The site says "Couldn't reach the backend."**
The deployment's access is not set to "Anyone", or you pasted the `/dev` URL
instead of the `/exec` one. Re-check step 5.

**Changes to the code don't show up.**
You saved but didn't re-deploy a new version. See "Tuning it" above.

**Cover letters return an error.**
Check `ANTHROPIC_API_KEY` is set in Script Properties and that the account has
credit. The error text from the API is passed straight through to the site, so
it will usually say which of the two it is.

**A company's jobs stopped appearing.**
They changed ATS. Run `python3 tools/probe.py` against their token to see which
platform they're on now, and update the `source` column in the Companies sheet.

**"Exceeded maximum execution time."**
Apps Script caps a run at 6 minutes. If the company list grows past ~250, lower
`MAX_COMPANIES_PER_RUN` and add a second trigger at a different hour — tier A
companies are always fetched first, so a truncated run still gets the best ones.

## A note on privacy

"Anyone" access means anyone holding the URL can read the feed and mark jobs.
The URL is a long random string and isn't indexed, which is fine for this. If
you want it locked down, set `API_KEY` in `Config.gs` to a random string and put
the same string in `web/config.js`. Requests without it are then rejected.
