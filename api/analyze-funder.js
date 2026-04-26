// api/analyze-funder.js — GoForth 990-PF Intelligence Layer
// Pulls ProPublica 990-PF data + Tavily intelligence → Claude competitive brief

const https = require("https");

function getJSON(hostname, path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname, path, method: "GET",
      headers: { "Accept": "application/json", "User-Agent": "GoForth/1.0 (nonprofit development platform)" }
    }, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { reject(new Error("Invalid JSON from " + hostname)); }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

function postJSON(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request(
      { hostname, path, method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload), ...headers } },
      (res) => {
        let data = "";
        res.on("data", c => data += c);
        res.on("end", () => { try { resolve({ status: res.statusCode, body: JSON.parse(data) }); } catch { reject(new Error("Invalid JSON")); } });
      }
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

function tavilySearch(query) {
  if (!process.env.TAVILY_API_KEY) return Promise.resolve({ status: 200, body: { results: [] } });
  return postJSON("api.tavily.com", "/search", {}, {
    api_key: process.env.TAVILY_API_KEY,
    query, search_depth: "advanced", max_results: 8,
  });
}

function claudePost(body) {
  return postJSON("api.anthropic.com", "/v1/messages",
    { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" }, body);
}

async function searchProPublica(name) {
  try {
    const q = encodeURIComponent(name.replace(/foundation|family|charitable/gi, "").trim());
    const { body } = await getJSON("projects.propublica.org", `/nonprofits/api/v2/search.json?q=${q}`);
    return body?.organizations || [];
  } catch { return []; }
}

async function getOrgDetails(ein) {
  try {
    const clean = String(ein).replace(/-/g, "");
    const { body } = await getJSON("projects.propublica.org", `/nonprofits/api/v2/organizations/${clean}.json`);
    return body;
  } catch { return null; }
}

const BRIEF_TOOL = {
  name: "return_competitive_brief",
  description: "Return structured competitive intelligence for a grant application.",
  input_schema: {
    type: "object",
    properties: {
      funderSnapshot: {
        type: "object",
        properties: {
          totalAssets: { type: "string" },
          estimatedGrant: { type: "string" },
          grantRange: { type: "string" },
          geographicFocus: { type: "string" },
          grantCycle: { type: "string" },
          applicationProcess: { type: "string" },
          knownPriorities: { type: "string" }
        },
        required: ["estimatedGrant", "geographicFocus", "knownPriorities"]
      },
      fundedOrgProfile: {
        type: "object",
        properties: {
          typicalMissions: { type: "string" },
          typicalBudgetRange: { type: "string" },
          geographicPattern: { type: "string" },
          faithPattern: { type: "string" },
          repeatFundeeNotes: { type: "string" },
          whatWins: { type: "string" }
        },
        required: ["typicalMissions", "whatWins"]
      },
      alignment: {
        type: "object",
        properties: {
          score: { type: "string", enum: ["strong", "moderate", "weak"] },
          scoreRationale: { type: "string" },
          strengths: { type: "array", items: { type: "string" } },
          concerns: { type: "array", items: { type: "string" } },
          uniqueDifferentiators: { type: "array", items: { type: "string" } }
        },
        required: ["score", "scoreRationale", "strengths", "uniqueDifferentiators"]
      },
      messagingBlueprint: {
        type: "object",
        properties: {
          openingHook: { type: "string" },
          framingStrategy: { type: "string" },
          keyPhrases: { type: "array", items: { type: "string" } },
          metricsToLead: { type: "array", items: { type: "string" } },
          thingsToAvoid: { type: "array", items: { type: "string" } },
          recommendedAsk: { type: "string" },
          toneGuidance: { type: "string" }
        },
        required: ["openingHook", "framingStrategy", "keyPhrases", "recommendedAsk"]
      },
      relationshipStrategy: {
        type: "object",
        properties: {
          approach: { type: "string" },
          timeline: { type: "string" },
          warmPathNotes: { type: "string" },
          nextImmediateAction: { type: "string" }
        },
        required: ["approach", "nextImmediateAction"]
      },
      donorPreferences: {
        type: "object",
        properties: {
          topFundingPatterns: { type: "string", description: "What this funder funds most consistently across their 990 history" },
          preferredOrgCharacteristics: { type: "string", description: "Types of orgs they prefer: size, model, faith status, geography" },
          keyDonorTriggers: { type: "string", description: "What specific factors seem to make them say yes — the triggers" },
          typicalGrantSize: { type: "string", description: "Typical grant size range based on 990 or public data" },
          repeatGranteeNotes: { type: "string", description: "Do they fund the same orgs repeatedly? Any notable patterns?" },
          avoidancePatterns: { type: "string", description: "Types of orgs, causes, or approaches they appear to avoid" }
        },
        required: ["topFundingPatterns", "keyDonorTriggers", "preferredOrgCharacteristics"]
      },
      boardProfile: {
        type: "object",
        properties: {
          keyLeaders: { type: "string", description: "Names and roles of board members, trustees, or officers found in public sources" },
          leaderInsights: { type: "string", description: "What their public statements, interviews, or affiliations reveal about their priorities" },
          messagingHooks: { type: "array", items: { type: "string" }, description: "Specific messaging angles tailored to what known leaders care about" },
          networkConnections: { type: "string", description: "Any known connections between their board and Catholic/community networks relevant to the applicant" },
          dataQuality: { type: "string", enum: ["rich", "partial", "minimal"], description: "How much leadership data was available" }
        },
        required: ["leaderInsights", "messagingHooks", "dataQuality"]
      },
      executiveSummary: { type: "string" },
      competitiveRisk: { type: "string" }
    },
    required: ["funderSnapshot", "fundedOrgProfile", "alignment", "messagingBlueprint", "relationshipStrategy", "donorPreferences", "boardProfile", "executiveSummary"]
  }
};

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: "API key not configured" });

  const { funder, profile } = req.body || {};
  if (!funder?.name) return res.status(400).json({ error: "Missing funder name" });

  let proPublicaContext = "";
  let webContext = "";

  // ── 1. ProPublica 990-PF lookup ──────────────────────────────────────────
  try {
    const orgs = await searchProPublica(funder.name);

    // Find best match (private foundation = subsection 3 or 4, or 990-PF filer)
    const match = orgs.find(o =>
      o.name?.toLowerCase().includes(funder.name.split(" ")[0].toLowerCase()) &&
      (o.subsection_code === "3" || o.subsection_code === "4" || o.form_type === "990PF")
    ) || orgs[0];

    if (match) {
      const details = await getOrgDetails(match.ein);
      const org = details?.organization || match;
      const filings = details?.filings_with_data || [];

      // Extract giving trends from recent filings
      const givingTrend = filings.slice(0, 5).map(f => {
        const yr = f.tax_prd_yr || f.tax_period?.slice(0, 4) || "?";
        const giving = f.totchrtbldisbursmts || f.totprgmservrev || f.pf_grants_or_contributions_paid_for_pub_purposes_amt || 0;
        const assets = f.totassetsend || f.totnetassetsorbalend || 0;
        return `FY${yr}: gave $${Math.round(giving / 1000)}K (assets $${Math.round(assets / 1000000 * 10) / 10}M)`;
      }).filter(s => !s.includes("$0K")).join(" | ");

      // Look for grant recipients in filings
      const grantRecipients = [];
      for (const f of filings.slice(0, 3)) {
        const sched = f.schedule_b_contributors || f.grants_made || [];
        if (Array.isArray(sched)) {
          sched.slice(0, 8).forEach(g => {
            if (g.recipient_name) grantRecipients.push(`${g.recipient_name} ($${Math.round((g.amount || 0) / 1000)}K)`);
          });
        }
      }

      proPublicaContext = `
PROPUBLICA 990 DATA:
Foundation: ${org.name || match.name}
EIN: ${org.ein || match.ein}
State: ${org.state || match.state}
Total Assets: $${Math.round((org.total_assets || 0) / 1000000 * 10) / 10}M
Total Giving (most recent year): $${Math.round((org.total_giving || 0) / 1000)}K
NTEE Category: ${org.ntee_code || "Not classified"}
Ruling Date: ${org.ruling_date || "N/A"}
Giving Trend: ${givingTrend || "See filings"}
${grantRecipients.length ? "Recent Grant Recipients: " + grantRecipients.join(", ") : ""}`;
    } else {
      proPublicaContext = `\nProPublica search for "${funder.name}" returned ${orgs.length} results. ${orgs.length > 0 ? "Closest match: " + orgs[0]?.name : "No close match found."}`;
    }
  } catch (e) {
    console.error("ProPublica error:", e.message);
    proPublicaContext = "\nProPublica data unavailable.";
  }

  // ── 2. Tavily intelligence searches ──────────────────────────────────────
  let boardContext = "";
  try {
    const [r1, r2, r3, r4] = await Promise.allSettled([
      tavilySearch(`"${funder.name}" grants awarded funded organizations 990 giving history recipients`),
      tavilySearch(`"${funder.name}" grant requirements priorities interests trustees officers how to apply`),
      tavilySearch(`${funder.name} Louisiana Catholic nonprofit human services women housing community funded`),
      tavilySearch(`"${funder.name}" board directors trustees officers executive philanthropic philosophy mission giving vision interview statement`),
    ]);

    const snippets = [];
    const boardSnippets = [];
    for (const r of [r1, r2, r3]) {
      if (r.status === "fulfilled" && r.value.status === 200) {
        for (const item of r.value.body?.results || []) {
          if (item.content) snippets.push(`SOURCE: ${item.url}\n${item.content.slice(0, 450)}`);
        }
      }
    }
    if (r4.status === "fulfilled" && r4.value.status === 200) {
      for (const item of r4.value.body?.results || []) {
        if (item.content) boardSnippets.push(`SOURCE: ${item.url}\n${item.content.slice(0, 500)}`);
      }
    }
    if (snippets.length) webContext = `\n\nLIVE INTELLIGENCE:\n${snippets.slice(0, 10).join("\n\n---\n")}`;
    if (boardSnippets.length) boardContext = `\n\nBOARD & LEADERSHIP INTELLIGENCE:\n${boardSnippets.slice(0, 6).join("\n\n---\n")}`;
  } catch (e) {
    console.error("Tavily error:", e.message);
  }

  // ── 3. Claude competitive brief synthesis ─────────────────────────────────
  const prompt = `You are a senior nonprofit development strategist with 20+ years writing winning proposals to private foundations. Analyze this funder and generate a complete competitive intelligence brief. Include detailed donor preference patterns and board/leadership intelligence to help tailor messaging.

APPLICANT ORGANIZATION:
Name: ${profile?.name || "St. Teresa Center for the Works of Mercy"}
Apostolate: ${profile?.apostolate || "Pope John XXIII House for Women"}
Location: ${profile?.city || "Saint Martinville"}, ${profile?.state || "LA"} (rural, economically depressed)
Director: ${profile?.director || "Fr. Michael Champagne, CJC"}
Diocese: ${profile?.diocese || "Diocese of Lafayette"}
EIN: ${profile?.ein || "81-3756179"}
Mission: ${profile?.mission || "Catholic mercy works — dignified service to the poor through corporal and spiritual works of mercy"}
Programs: ${profile?.programs || "Hot meals (250/Thursday), food pantry (450+ families), women's housing (PJ23), youth formation, wellness center"}
Impact: ${profile?.families || 450}+ families/week, ${profile?.mealsWeekly || 250} hot meals/week, ${profile?.womenServed || 19} women housed in 2025, ${profile?.volunteers || 120} volunteers
Overhead: ZERO — 100% volunteer-run
Structure: Catholic Private Association of the Faithful, canonically governed, Diocese of Lafayette

TARGET FUNDER: ${funder.name}
Type: ${funder.type || "Private Foundation"}
Known focus/notes: ${funder.notes || "Unknown — use intelligence below"}
Previous ask or context: ${funder.ask || "None yet"}
${proPublicaContext}
${webContext}
${boardContext}

Generate a complete competitive brief. For donorPreferences, synthesize the 990 giving history and web intelligence into clear patterns a grant writer can act on. For boardProfile, use any leadership intel found — if data is sparse, set dataQuality to "minimal" and still provide messagingHooks based on funder type and mission. Be specific and actionable. Use real language the grant writer can copy directly into their LOI or proposal.`;

  try {
    const { status, body } = await claudePost({
      model: "claude-sonnet-4-6",
      max_tokens: 3500,
      tools: [BRIEF_TOOL],
      tool_choice: { type: "tool", name: "return_competitive_brief" },
      messages: [{ role: "user", content: prompt }],
    });

    if (status !== 200) return res.status(502).json({ error: body?.error?.message || `Error ${status}` });
    const toolBlock = body.content?.find(b => b.type === "tool_use");
    return res.status(200).json({ brief: toolBlock?.input || {}, funder: funder.name, hasProPublica: !!proPublicaContext.includes("EIN") });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
