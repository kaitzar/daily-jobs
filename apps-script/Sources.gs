/**
 * Sources.gs — fetch + normalise postings from public ATS job board APIs.
 *
 * Each fetcher returns an array of normalised job objects:
 *   {id, company, companyToken, source, industry, title, department,
 *    location, remote, url, postedAt, description, salaryMin, salaryMax,
 *    salaryText, employmentType}
 *
 * These endpoints are the public, unauthenticated job board feeds that each
 * ATS publishes so that job aggregators can read them. No scraping, no keys.
 */

function httpGetJson_(url) {
  if (typeof UrlFetchApp !== "undefined") {
    var res = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      followRedirects: true,
      headers: { "Accept": "application/json" }
    });
    if (res.getResponseCode() !== 200) return null;
    try { return JSON.parse(res.getContentText()); } catch (e) { return null; }
  }
  // Node fallback used by the offline test harness in tools/
  return globalThis.__nodeGetJson(url);
}

function stripHtml_(html) {
  if (!html) return "";
  return String(html)
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Pull "$85,000 - $110,000" style ranges out of free text. */
function parseSalary_(text) {
  if (!text) return { min: 0, max: 0, raw: "" };
  var t = String(text).replace(/–|—/g, "-");
  var re = /\$\s?(\d{2,3}(?:,\d{3})?(?:\.\d+)?)\s?([kK])?\s?(?:-|to|and)\s?\$?\s?(\d{2,3}(?:,\d{3})?(?:\.\d+)?)\s?([kK])?/;
  var m = t.match(re);
  if (m) {
    var lo = norm_(m[1], m[2]);
    var hi = norm_(m[3], m[4]);
    if (lo > 20000 && hi >= lo && hi < 1000000) {
      return { min: lo, max: hi, raw: m[0].trim() };
    }
  }
  var single = t.match(/\$\s?(\d{2,3}(?:,\d{3})?)\s?([kK])?\b/);
  if (single) {
    var v = norm_(single[1], single[2]);
    if (v > 20000 && v < 1000000) return { min: v, max: v, raw: single[0].trim() };
  }
  return { min: 0, max: 0, raw: "" };

  function norm_(numStr, kFlag) {
    var n = parseFloat(String(numStr).replace(/,/g, ""));
    if (kFlag) n = n * 1000;
    else if (n < 1000) n = n * 1000;
    return Math.round(n);
  }
}

function fetchGreenhouse_(co) {
  var url = "https://boards-api.greenhouse.io/v1/boards/" + co.token + "/jobs?content=true";
  var data = httpGetJson_(url);
  if (!data || !data.jobs) return [];
  return data.jobs.map(function (j) {
    var desc = stripHtml_(j.content);
    var sal = parseSalary_(desc);
    return {
      id: "gh:" + co.token + ":" + j.id,
      company: co.name, companyToken: co.token, source: "greenhouse",
      industry: co.industry,
      title: j.title || "",
      department: (j.departments && j.departments[0] && j.departments[0].name) || "",
      location: (j.location && j.location.name) || "",
      remote: /remote/i.test((j.location && j.location.name) || ""),
      url: j.absolute_url,
      postedAt: j.first_published || j.updated_at || "",
      description: desc,
      salaryMin: sal.min, salaryMax: sal.max, salaryText: sal.raw,
      employmentType: ""
    };
  });
}

function fetchLever_(co) {
  var url = "https://api.lever.co/v0/postings/" + co.token + "?mode=json";
  var data = httpGetJson_(url);
  if (!Array.isArray(data)) return [];
  return data.map(function (j) {
    var cats = j.categories || {};
    // Lever keeps "What you'll do" and "What you bring" in j.lists, NOT in the
    // description. Dropping it cost us the requirements on every Lever board —
    // which broke the years-of-experience filter as well as the cover letters.
    var listText = (j.lists || []).map(function (L) {
      return (L.text || "") + "\n" + stripHtml_(L.content || "");
    }).join("\n\n");
    var desc = [j.descriptionPlain, listText, j.additionalPlain, j.salaryDescriptionPlain]
      .filter(Boolean).join("\n");
    if (!desc) desc = stripHtml_(j.description);
    var sal = { min: 0, max: 0, raw: "" };
    if (j.salaryRange && j.salaryRange.min) {
      sal = {
        min: Math.round(j.salaryRange.min), max: Math.round(j.salaryRange.max || j.salaryRange.min),
        raw: "$" + j.salaryRange.min + " - $" + (j.salaryRange.max || j.salaryRange.min)
      };
      if (j.salaryRange.interval && /hour/i.test(j.salaryRange.interval)) {
        sal.min = Math.round(sal.min * 2080); sal.max = Math.round(sal.max * 2080);
      }
    } else {
      sal = parseSalary_(desc);
    }
    var loc = cats.location || "";
    return {
      id: "lv:" + co.token + ":" + j.id,
      company: co.name, companyToken: co.token, source: "lever",
      industry: co.industry,
      title: j.text || "",
      department: cats.department || cats.team || "",
      location: loc,
      remote: /remote/i.test(loc) || /remote/i.test(j.workplaceType || ""),
      url: j.hostedUrl || j.applyUrl,
      postedAt: j.createdAt ? new Date(j.createdAt).toISOString() : "",
      description: desc,
      salaryMin: sal.min, salaryMax: sal.max, salaryText: sal.raw,
      employmentType: cats.commitment || ""
    };
  });
}

function fetchAshby_(co) {
  var url = "https://api.ashbyhq.com/posting-api/job-board/" + co.token + "?includeCompensation=true";
  var data = httpGetJson_(url);
  if (!data || !data.jobs) return [];
  return data.jobs.filter(function (j) { return j.isListed !== false; }).map(function (j) {
    var desc = j.descriptionPlain || stripHtml_(j.descriptionHtml);
    var compText = (j.compensation && (j.compensation.scrapeableCompensationSalarySummary ||
      j.compensation.compensationTierSummary)) || "";
    var sal = parseSalary_(compText);
    if (!sal.min) sal = parseSalary_(desc);
    var locs = [j.location].concat((j.secondaryLocations || []).map(function (s) {
      return s.location || s;
    })).filter(Boolean);
    return {
      id: "ab:" + co.token + ":" + j.id,
      company: co.name, companyToken: co.token, source: "ashby",
      industry: co.industry,
      title: j.title || "",
      department: j.department || j.team || "",
      location: locs.join(" | "),
      remote: !!j.isRemote || /remote/i.test(j.workplaceType || ""),
      url: j.jobUrl || j.applyUrl,
      postedAt: j.publishedAt || "",
      description: desc,
      salaryMin: sal.min, salaryMax: sal.max, salaryText: sal.raw || compText,
      employmentType: j.employmentType || ""
    };
  });
}

function fetchCompany_(co) {
  try {
    if (co.source === "greenhouse") return fetchGreenhouse_(co);
    if (co.source === "lever") return fetchLever_(co);
    if (co.source === "ashby") return fetchAshby_(co);
  } catch (e) {
    return [];
  }
  return [];
}
