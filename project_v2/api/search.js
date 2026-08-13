// api/search.js — Grant Discovery proxy
// Step 1: Tavily live web search for real grant data
// Step 2: Claude Haiku structures the results into cards
// Rate limit: 3 searches per IP per hour

const https = require("https");

// ── Rate limiter ─────────────────────────────────────────────────────────────
const rateLimits = new Map();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 3;

function checkRate(ip) {
  const now = Date.now();
  const rec = rateLimits.get(ip);
  if (!rec || now - rec.start > WINDOW_MS) {
    rateLimits.set(ip, { start: now, count: 1 });
    return true;
  }
  if (rec.count >= MAX_PER_WINDOW) return false;
  rec.count++;
  return true;
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────
function postJSON(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request(
      {
        hostname,
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          ...headers,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            reject(new Error("Invalid JSON response"));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

function tavilySearch(query, extraParams = {}) {
  return postJSON(
    "api.tavily.com",
    "/search",
    {},
    {
      api_key: process.env.TAVILY_API_KEY,
      query,
      search_depth: "advanced",
      max_results: 8,
      include_answer: false,
      include_raw_content: false,
      ...extraParams,
    }
  );
}

function anthropicPost(body) {
  return postJSON(
    "api.anthropic.com",
    "/v1/messages",
    {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body
  );
}

// ── Grant schema tool ─────────────────────────────────────────────────────────
const TOOL = {
  name: "return_grants",
  description: "Return a list of real U.S. funding opportunities matching the user profile.",
  input_schema: {
    type: "object",
    properties: {
      grants: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id:          { type: "string" },
            name:        { type: "string" },
            org:         { type: "string" },
            cat:         { type: "string", enum: ["local","faith","private","ngo","government","corporate","microgrant","donor","fellowship"] },
            local:       { type: "boolean" },
            status:      { type: "string", enum: ["open","soon","rolling"] },
            amount:      { type: "string" },
            deadline:    { type: "string" },
            window:      { type: "string" },
            gem:         { type: "boolean" },
            seekingNew:  { type: "boolean" },
            desc:        { type: "string" },
            competitive: { type: "string" },
            firstTimers: { type: "string" },
            tags:        { type: "array", items: { type: "string" } },
            eligibility: { type: "array", items: { type: "string" } },
            documents:   { type: "array", items: { type: "string" } },
            prep:        { type: "array", items: { type: "string" } },
            stalls:      { type: "array", items: { type: "string" } },
            nextSteps:   { type: "array", items: { type: "object", properties: { icon: { type: "string" }, text: { type: "string" } }, required: ["icon","text"] } },
          },
          required: ["id","name","org","cat","local","status","amount","deadline","window","gem","seekingNew","desc","eligibility","documents","prep","stalls","nextSteps"],
        },
      },
    },
    required: ["grants"],
  },
};

// ── Handler ───────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "API key not configured on server" });
  }

  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  if (!checkRate(ip)) {
    return res.status(429).json({
      error: "You've searched 3 times this hour. Please wait a bit before searching again.",
    });
  }

  const { answers } = req.body || {};
  if (!answers) return res.status(400).json({ error: "Missing answers" });

  const loc    = answers.location  || "rural United States";
  const cause  = answers.cause     || "community support";
  const struct = answers.structure || "nonprofit";
  const amt    = answers.amount    || "any amount";

  // ── Step 1: Live web search via Tavily ───────────────────────────────────
  let webContext = "";

  if (process.env.TAVILY_API_KEY) {
    try {
      // Run 3 targeted searches in parallel for breadth
      const [localRes, federalRes, foundationRes] = await Promise.allSettled([
        tavilySearch(
          `grants for ${struct} ${cause} in ${loc} 2024 2025 apply deadline`,
          { include_domains: ["grants.gov", "usda.gov", "hhs.gov", "americorps.gov", "arts.gov", "arc.gov", "dra.gov"] }
        ),
        tavilySearch(
          `community foundation grants ${loc} ${cause} nonprofit funding 2025`
        ),
        tavilySearch(
          `private foundation grants ${cause} ${struct} rural faith-based small nonprofit 2025`
        ),
      ]);

      const snippets = [];

      for (const result of [localRes, federalRes, foundationRes]) {
        if (result.status === "fulfilled" && result.value.status === 200) {
          const items = result.value.body.results || [];
          for (const item of items) {
            if (item.title && item.content) {
              snippets.push(`SOURCE: ${item.url}\nTITLE: ${item.title}\nSNIPPET: ${item.content.slice(0, 600)}`);
            }
          }
        }
      }

      if (snippets.length > 0) {
        webContext = `\n\nLIVE WEB SEARCH RESULTS (use these as primary sources — extract real grant names, orgs, deadlines, amounts):\n\n${snippets.join("\n\n---\n\n")}`;
      }
    } catch (searchErr) {
      // Tavily failed — continue without it, Claude will use training knowledge
      console.error("Tavily search failed:", searchErr.message);
    }
  }

  // ── Step 2: Claude structures the results ────────────────────────────────
  const prompt = `Find 20 real U.S. funding opportunities for:

- Cause: ${cause}
- Location: ${loc}
- Organization type: ${struct}
- Amount needed: ${amt}

Include this mix:
- 6 LOCAL sources specific to ${loc}: community foundations, state agencies, regional NGOs, dioceses, local corporate foundations (local:true)
- 5 FEDERAL programs: USDA Rural Development, HHS, AmeriCorps, CDBG, ARC, DRA, SAMHSA, HRSA, NEA
- 5 PRIVATE FOUNDATIONS and faith-based funders matching the cause
- 4 MICROGRANTS, fellowships, or donor platforms

IMPORTANT: Use the live web search results below as your PRIMARY source — extract real grant names, real organizations, real deadlines, and real award amounts from those pages. Only fall back to training knowledge if the search results don't cover a category.

Use real funder names only. Set gem:true for lesser-known sources. Keep desc to one clear sentence about why it fits this organization.${webContext}`;

  try {
    const { status, body } = await anthropicPost({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      tools: [TOOL],
      tool_choice: { type: "tool", name: "return_grants" },
      messages: [{ role: "user", content: prompt }],
    });

    if (status !== 200) {
      return res.status(502).json({ error: body?.error?.message || `Upstream error ${status}` });
    }

    const toolBlock = body.content?.find(
      (b) => b.type === "tool_use" && b.name === "return_grants"
    );
    if (!toolBlock?.input?.grants?.length) {
      return res.status(500).json({ error: "No grant data returned — please try again" });
    }

    return res.status(200).json({
      grants: toolBlock.input.grants,
      webSearched: !!webContext,  // tells the UI whether live data was used
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Search failed" });
  }
};
