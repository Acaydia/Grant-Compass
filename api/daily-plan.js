// api/daily-plan.js — GoForth Daily Development Plan Generator
// Step 1: Tavily live search for today's featured funder
// Step 2: Claude Sonnet synthesizes the full strategic plan

const https = require("https");

function postJSON(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request(
      { hostname, path, method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload), ...headers } },
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

function tavilySearch(query, opts = {}) {
  return postJSON("api.tavily.com", "/search", {}, {
    api_key: process.env.TAVILY_API_KEY,
    query, search_depth: "advanced", max_results: 6,
    include_answer: false, include_raw_content: false, ...opts
  });
}

function claudePost(body) {
  return postJSON("api.anthropic.com", "/v1/messages",
    { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" }, body);
}

const PLAN_TOOL = {
  name: "return_daily_plan",
  description: "Return a structured daily development plan for a nonprofit organization.",
  input_schema: {
    type: "object",
    properties: {
      executiveSummary: { type: "string" },
      featuredFunder: {
        type: "object",
        properties: {
          name: { type: "string" }, type: { type: "string" },
          location: { type: "string" }, assets: { type: "string" },
          annualGrants: { type: "string" }, askRange: { type: "string" },
          focus: { type: "string" }, connection: { type: "string" },
          strategyNote: { type: "string" }, status: { type: "string" },
        },
        required: ["name","type","location","askRange","connection","strategyNote"]
      },
      messaging: {
        type: "object",
        properties: {
          core: { type: "string" },
          themes: { type: "array", items: { type: "string" } }
        },
        required: ["core","themes"]
      },
      sprint: { type: "array", items: { type: "string" } },
      deadlines: {
        type: "array",
        items: {
          type: "object",
          properties: { name: { type: "string" }, daysOut: { type: "number" }, action: { type: "string" } },
          required: ["name","daysOut","action"]
        }
      },
      assets: { type: "array", items: { type: "string" } }
    },
    required: ["executiveSummary","featuredFunder","messaging","sprint","deadlines","assets"]
  }
};

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: "API key not configured" });

  const { profile, funders = [], deadlines = [] } = req.body || {};
  if (!profile) return res.status(400).json({ error: "Missing org profile" });

  const loc = `${profile.city || "Saint Martinville"}, ${profile.state || "Louisiana"}`;
  const cause = profile.mission?.slice(0, 120) || "Catholic mercy works";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const dow = new Date().toLocaleDateString("en-US", { weekday: "long" });

  // Already-prospected funder names (so we pick something fresh)
  const existingNames = funders.map(f => f.name.toLowerCase());

  let webContext = "";
  let webSearched = false;

  if (process.env.TAVILY_API_KEY) {
    try {
      const region = profile.state === "LA" ? "Louisiana Acadiana" : loc;
      const [r1, r2, r3] = await Promise.allSettled([
        tavilySearch(`${region} private family foundation grants nonprofit 2025 2026 Catholic charity humanitarian`),
        tavilySearch(`${region} community foundation philanthropist major donor 990 form grant awards`),
        tavilySearch(`${profile.diocese || "Catholic diocese Louisiana"} foundation grants women housing poverty 2026`),
      ]);

      const snippets = [];
      for (const r of [r1, r2, r3]) {
        if (r.status === "fulfilled" && r.value.status === 200) {
          for (const item of r.value.body.results || []) {
            if (item.title && item.content) {
              // Skip already-known funders
              const known = existingNames.some(n => item.title.toLowerCase().includes(n.split(" ")[0]));
              if (!known) snippets.push(`SOURCE: ${item.url}\nTITLE: ${item.title}\nCONTENT: ${item.content.slice(0, 500)}`);
            }
          }
        }
      }

      if (snippets.length > 0) {
        webContext = `\n\nLIVE WEB SEARCH RESULTS — use these to identify today's featured funder (prefer funders NOT already in the pipeline):\n\n${snippets.slice(0,12).join("\n\n---\n\n")}`;
        webSearched = true;
      }
    } catch (e) {
      console.error("Tavily error:", e.message);
    }
  }

  const existingFundersList = funders.slice(0,6).map(f => `- ${f.name} (${f.stage})`).join("\n");
  const deadlinesList = deadlines.map(d => `- ${d.title}: ${d.date} (${Math.ceil((new Date(d.date)-new Date())/86400000)} days)`).join("\n");

  const prompt = `Generate a daily development plan for today, ${today} (${dow}).

ORGANIZATION: ${profile.name}
APOSTOLATE: ${profile.apostolate || ""}
LOCATION: ${loc}
DIRECTOR: ${profile.director || ""}
DIOCESE: ${profile.diocese || ""}
MISSION: ${profile.mission || ""}
PROGRAMS: ${profile.programs || ""}
IMPACT: ${profile.families}+ families served, ${profile.mealsWeekly} hot meals/week, ${profile.womenServed} women housed in 2025, ${profile.volunteers} volunteers, zero admin overhead
CATHOLIC: ${profile.catholic ? "Yes — canonically governed, faith-based" : "No"}
GOVERNMENT FUNDING: ${profile.govFunding ? "Open to it" : "Prefers private only"}

EXISTING PIPELINE (do NOT feature these as today's funder):
${existingFundersList || "None yet"}

UPCOMING DEADLINES:
${deadlinesList || "None specified"}

INSTRUCTIONS:
1. executiveSummary: 3-4 sentences capturing today's specific opportunity, ${dow}'s focus, and the organization's immediate momentum.
2. featuredFunder: Choose a REAL, specific funder from the web search results below that is NOT already in the pipeline. Must be a real foundation or philanthropy active in ${region || loc}. Include real asset/giving data if found. Explain the specific strategic connection to this org's work.
3. messaging.core: A compelling one-sentence ${dow} message for outreach.
4. messaging.themes: 4 specific, actionable messaging angles for today.
5. sprint: 7 specific daily actions for the next 7 days (Day 1 = today).
6. deadlines: All active grant/event deadlines with exact days-out counts.
7. assets: 3-4 specific deployable materials or outreach actions for today.

Write like an expert Catholic nonprofit development consultant who knows this community deeply.${webContext}`;

  try {
    const { status, body } = await claudePost({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      tools: [PLAN_TOOL],
      tool_choice: { type: "tool", name: "return_daily_plan" },
      messages: [{ role: "user", content: prompt }],
    });

    if (status !== 200) return res.status(502).json({ error: body?.error?.message || `Error ${status}` });

    const toolBlock = body.content?.find(b => b.type === "tool_use" && b.name === "return_daily_plan");
    if (!toolBlock?.input) return res.status(500).json({ error: "No plan data returned" });

    return res.status(200).json({ ...toolBlock.input, webSearched, generatedAt: new Date().toISOString() });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Plan generation failed" });
  }
};
