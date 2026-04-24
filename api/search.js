// api/search.js — Grant Discovery proxy
// Model: claude-haiku-4-5-20251001 (fast + cheap for structured data)
// Rate limit: 3 searches per IP per hour

const https = require("https");

// In-memory rate limiter (resets on cold start — good enough for low-traffic nonprofit tool)
const rateLimits = new Map();
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
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

function anthropicPost(body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request(
      {
        hostname: "api.anthropic.com",
        path: "/v1/messages",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            reject(new Error("Invalid JSON from Anthropic"));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

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
  const struct = answers.structure || "any organization type";
  const amt    = answers.amount    || "any amount";

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

Use real funder names. Set gem:true for lesser-known sources. Keep desc to one clear sentence about why it fits.`;

  try {
    const { status, body } = await anthropicPost({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
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

    return res.status(200).json({ grants: toolBlock.input.grants });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Search failed" });
  }
};
