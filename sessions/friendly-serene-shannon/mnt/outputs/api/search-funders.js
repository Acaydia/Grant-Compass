// api/search-funders.js — GoForth Funder Discovery
// Searches ProPublica Nonprofit Explorer API + Tavily for local funders

const https = require("https");

function getJSON(hostname, path) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path, method: "GET", headers: { "Accept": "application/json" } }, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => { try { resolve({ status: res.statusCode, body: JSON.parse(data) }); } catch { reject(new Error("Invalid JSON")); } });
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
  return postJSON("api.tavily.com", "/search", {}, {
    api_key: process.env.TAVILY_API_KEY,
    query, search_depth: "advanced", max_results: 8,
  });
}

function claudePost(body) {
  return postJSON("api.anthropic.com", "/v1/messages",
    { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" }, body);
}

const FUNDER_TOOL = {
  name: "return_funders",
  description: "Return a list of discovered funding opportunities.",
  input_schema: {
    type: "object",
    properties: {
      funders: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            type: { type: "string" },
            location: { type: "string" },
            askRange: { type: "string" },
            focus: { type: "string" },
            notes: { type: "string" },
            contact: { type: "string" },
            deadline: { type: "string" },
            priority: { type: "string", enum: ["high","medium","low"] },
            catholic: { type: "boolean" },
          },
          required: ["name","type","askRange","notes","priority","catholic"]
        }
      }
    },
    required: ["funders"]
  }
};

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: "API key not configured" });

  const { location, cause, structure } = req.body || {};
  const loc = location || "rural Louisiana";

  let webContext = "";

  if (process.env.TAVILY_API_KEY) {
    try {
      const [r1, r2, r3] = await Promise.allSettled([
        tavilySearch(`${loc} private foundation grants 990 nonprofit 2025 2026`),
        tavilySearch(`Louisiana Catholic foundation grants women housing human services Acadiana`),
        tavilySearch(`community foundation ${loc} competitive grants nonprofits apply`),
      ]);

      const snippets = [];
      for (const r of [r1, r2, r3]) {
        if (r.status === "fulfilled" && r.value.status === 200) {
          for (const item of r.value.body.results || []) {
            if (item.title && item.content) {
              snippets.push(`SOURCE: ${item.url}\nTITLE: ${item.title}\nCONTENT: ${item.content.slice(0,500)}`);
            }
          }
        }
      }
      if (snippets.length) webContext = `\n\nLIVE SEARCH RESULTS:\n\n${snippets.slice(0,10).join("\n\n---\n\n")}`;
    } catch(e) { console.error("Tavily:", e.message); }
  }

  const prompt = `Find 8 real funding opportunities for a nonprofit in ${loc} focused on: ${cause || "Catholic mercy works, women, youth, human services"}.

Return a mix of local private foundations, community foundations, Catholic funders, and any current grant cycles. Use real funder names with real giving data where available.

Prioritize funders that are:
- Based in Louisiana or Acadiana region
- Focused on human services, women's programs, Catholic causes, or community strengthening
- Currently accepting applications or LOIs in 2026${webContext}`;

  try {
    const { status, body } = await claudePost({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2500,
      tools: [FUNDER_TOOL],
      tool_choice: { type: "tool", name: "return_funders" },
      messages: [{ role: "user", content: prompt }],
    });

    if (status !== 200) return res.status(502).json({ error: body?.error?.message || `Error ${status}` });
    const toolBlock = body.content?.find(b => b.type === "tool_use");
    return res.status(200).json({ funders: toolBlock?.input?.funders || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
