# Five a Day

A job feed built for one person. Every morning it pulls open postings from the
public job board APIs of a curated list of companies, scores each one against
Thaddeus's actual preferences, and publishes the five best to a web page he can
open from any device.

- **Backend:** Google Apps Script + a Google Sheet as the database. Free, no server.
- **Frontend:** static HTML/CSS/JS on GitHub Pages. No build step, no dependencies.
- **Cost:** $0/month.

Setup instructions are in [SETUP.md](SETUP.md). Read that first.

---

## How it works

```
5:00am PT  →  fetch 320 company job boards (Greenhouse / Lever / Ashby)
           →  normalise every posting
           →  drop anything that fails a hard filter
           →  score what survives
           →  write new matches into the Jobs sheet
           →  serve the top 5 as today's list
```

He opens the page. Each job arrives with the right resume already attached and a
cover letter one click away, then gets one of two decisions: **Apply** (opens the
posting and marks it) or **Skip** (with a reason). Both are recorded. Once all
five are decided, the backlog unlocks and he can keep going.

Undecided jobs do **not** pile up. Each morning is a fresh five — yesterday's
untouched jobs go back into the pool and compete for a slot on merit rather
than accumulating into a guilt-inducing queue.

## What gets filtered out, and why

Every rule below traces back to a specific questionnaire answer.

| Filter | Rule |
|---|---|
| Refused roles | Customer Success, Account Management, People Ops, Recruiting, HR, Exec Assistant — hard exclude |
| Seniority | Senior, Staff, Principal, Lead, Head of, Director, VP, and II/III titles — hard exclude |
| Manager titles | Excluded unless the family is Program/Project, where "Manager" is an IC title |
| Experience | 5+ years required — hard exclude. 4 years takes a penalty |
| Location | Must match one of his ranked metros or be US remote. Europe, EMEA, LATAM and APAC are excluded |
| Industry | Defense, insurance, gambling, healthcare, fintech, adtech, social media, vape — hard exclude, checked against the company and title, not the customer list |
| Salary | A posted max below $55k — hard exclude. Above that, pay is a tiebreaker only |
| Age | Postings older than 45 days — dropped |
| Company size | 50-200 employees (tier A). 201-500 is tier B, scored 12 points lower and labelled "stretch" |
| Industry | 62 industries in, 58 out, taken row by row from his completed checklist |

## How the score is built

```
score = role_family × 0.45  +  location × 0.30  +  industry × 0.25  +  adjustments
```

Role families, ranked as he ranked them:

| Family | Weight |
|---|---|
| Business Ops / Strategy & Ops | 100 |
| Program / Project Coordination | 96 |
| Founder's Associate / Chief of Staff | 82 |
| Revenue / Sales Operations | 78 |
| Business Development | 70 |
| Account Executive | 62 |
| Supply Chain / Logistics Ops | 52 |
| Sales Development (SDR/BDR) | 45 |

## Industries

The industry filter is not a keyword guess. He went through a 120-row checklist
and marked every one. The 62 he marked Yes became the industry keys in
`Scoring.gs`; the 58 he marked No are enforced twice over — no company in those
industries is in `Companies.gs` at all, and a keyword net catches stragglers at
companies that span two markets.

A few of his calls are worth knowing about, because they look like mistakes and
aren't:

- **Solar yes, wind no.** Both were offered; he picked one.
- **Carbon markets yes, carbon accounting software no.** Registries, ratings and
  verification are in. Corporate ESG reporting tools are out. Watershed and
  Sweep were in the old list and have been removed.
- **Medical devices yes, everything else in healthcare no.** Devices are in;
  pharma, drug discovery, diagnostics, lab reagents, digital health, payers and
  hospitals are all out. Synthego, Enveda, Benchling and Antheia came out on
  this rule.
- **Desalination yes, water treatment no.** Adjacent, but he split them.
- **Dev tools and data infrastructure yes, enterprise SaaS no.** Linear and Attio
  came out; Sentry and ClickHouse stayed.
- **Nonprofits yes, government and civic tech no**, which is why Code for
  America and Nava are absent while charity: water and GiveDirectly are present.

He used the Yes and No columns only — no row was marked "would consider". That
means there is no soft-fallback pool, so a thin day is filled by tier B
companies (bigger than his target size) rather than by second-choice industries.

**Customers are not industries.** He was asked whether a company's customers
being in an excluded field made the company itself a no, and said it does not.
So the industry keyword net runs against the company name, job title and
department — never the posting body. Scanning the body was throwing out good
operations roles over sentences like "our customers include leading insurance
carriers", and fixing it recovered 8 matches, about 12% of the total supply.

**Pay is a tiebreaker, not a driver.** He said he would take a pay cut for the
right work, so the floor came down to $55k, the penalty for pay near the floor
was removed entirely, and the bonus for high pay was halved. A well-matched
conservation job at $68k should not lose to a worse-matched AI job at $150k on
comp alone.

**A note on the SDR ranking.** He ranked SDR/BDR second, then said he will not
make 60+ cold calls a day. Those are the same job. SDR sits near the bottom so
it surfaces only on thin days, and any posting whose text mentions cold calling,
dial quotas or high-volume outbound takes a further 18-point penalty.

Adjustments layered on top: freshness, posted salary versus his $60k floor and
$80k target, commission-heavy comp (penalised — he wants flat salary), Spanish
as a plus but never a requirement, explicit new-grad language, and keyword
overlap with his résumé.

## Resumes and cover letters

**One resume per role family, never per job.** The scorer already classifies
every job into a role family; the site attaches that family's resume
automatically. He never picks one and never re-checks one. All eight versions
carry the same true facts — same employers, same numbers, same dates — and
differ only in the summary and which evidence leads.

They live in the `Resumes` sheet and are edited there, not in code. Changes
apply to the next job with no redeploy.

**Cover letters are drafted per job by the Anthropic API**, shown in an editable
box, saved as he types, and downloadable as a PDF. Each letter is generated once
and stored, so re-opening a job returns his edited copy rather than spending
another API call on a different letter. "Rewrite" is the explicit escape hatch.

Both PDFs are rendered server-side from the same typographic template, so the
resume and the letter look like they came from the same person.

The prompt is strict on purpose — it bans the clichéd openers, forbids inventing
anything not in the resume (including places, causal links between bullets, and
claims of "comfort" with something), and forbids asserting anything about the
company that isn't in the posting text. Every draft is then checked in code
against those rules and retried once if it fails. That combination came out of
an adversarial review that caught the prompt inventing a country and inventing a
spacecraft's return.

## The learning loop

Every decision writes a row to the `Events` sheet. Once a role family or a
company reaches four decisions, the scorer starts reacting:

- Skipping more than 60% of a family pushes it down, up to 25 points
- Applying to more than 70% of a family lifts it, up to 10 points
- The same logic runs per company, at half the strength

So if he skips every Exec Assistant-shaped role for two weeks, they stop
appearing without anyone touching the code. Tune it with `LEARNING_STRENGTH`
and `LEARNING_MIN_SAMPLES` in `Config.gs`; set the strength to 0 to switch it
off entirely.

## The honest constraint

This is the thing worth understanding before judging the output.

At the time of building, the 320 curated companies had **7,816 open postings**
between them. Exactly **75** survived the filters. That is a 1.0% match rate,
and it is not a bug — it is what "entry-level business operations at a 50-500
person company, in one of 62 specific industries, in one of nine specific
metros" actually means in the market.

At 45 days of posting history, 75 matches works out to roughly **1.7 genuinely
new matching jobs per day**. The starting pool covers the first fifteen days at
five a day. After that, some mornings will show three, or two.

Expanding the industry list from six to 62 nearly doubled the company universe
and improved the mix a lot — 23 industries are represented in the current
matches, and a forestry company sits second on the list — but it moved the daily
rate less than you'd hope. The binding constraint is not which industries he'll
consider; it's that entry-level operations roles are rare everywhere.

The site handles this honestly — it says how many cleared the bar and why the
number is low, rather than padding the list with jobs he'd never take. If you
want more volume, in rough order of how much they cost you in match quality:

1. **Add companies.** Still the highest-leverage change. `Companies.gs` explains the format; every new token needs verifying against the ATS API first.
2. **Raise `TIER_B_MAX`** from 500 — brings in bigger companies as clearly-labelled stretch picks.
3. **Raise `MAX_POSTING_AGE_DAYS`** from 45 to 60.
4. **Lower `MIN_SCORE`** from 40.
5. **Widen the role families** in `Scoring.gs` — this is where quality degrades fastest, so do it last.

## Repo layout

```
apps-script/          paste these into a Google Apps Script project
  Config.gs           every tunable setting
  Companies.gs        the curated company list — 320 companies, 58 industries
  Sources.gs          Greenhouse / Lever / Ashby fetchers
  Scoring.gs          filters, scoring, learning
  Resumes.gs          the eight role-family resumes
  Letters.gs          Anthropic cover letters, validation, PDF rendering
  Store.gs            Google Sheet read/write
  Daily.gs            the daily pipeline
  Api.gs              the JSON API the site calls
  Setup.gs            run setup() once
  appsscript.json     manifest

web/                  deploy to GitHub Pages
  index.html
  styles.css
  app.js
  config.js           paste your web app URL here

tools/                local development, not deployed
  probe.py            test whether a company has a live ATS board
  cache_boards.py     snapshot every board for offline testing
  simulate.js         run the real pipeline offline and print what a day looks like
  mockserver.js       serve the site against live data without deploying
```

## Working on it locally

```bash
cd tools
python3 cache_boards.py      # snapshot the boards
node simulate.js             # what would today's five be?
node mockserver.js           # then open http://127.0.0.1:8899
```

`simulate.js` runs the real `Sources.gs` and `Scoring.gs` files against cached
API responses, so a scoring change can be checked in about two seconds without
touching the deployed Apps Script project.

## Adding a company

Verify the board exists first:

```bash
cd tools
echo "companyname|climate" > /tmp/one.txt
python3 probe.py /tmp/one.txt
```

If it prints a source and a job count, add the row to `Companies.gs`, then
either edit the `Companies` sheet directly or run `reseedCompanies()` in the
Apps Script editor. **The sheet wins over the file after first setup** — so
correcting a headcount estimate in the sheet is permanent, and re-seeding
discards those corrections.
