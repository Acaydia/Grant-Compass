// api/write.js — Grant Proposal Writing proxy
// Model: claude-sonnet-4-6 (better writing quality, still affordable)
// Rate limit: 20 writes per IP per hour

const https = require("https");

const rateLimits = new Map();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 20;

function checkRate(ip) {
  const now = Date.now();
  const rec = rateLimits.get(ip);
  if (!rec || now - rec.start > WINDOW_MS) {
    rateLimits.set(ip, { start: now, count: 1 });
    return { allowed: true, remaining: MAX_PER_WINDOW - 1 };
  }
  if (rec.count >= MAX_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }
  rec.count++;
  return { allowed: true, remaining: MAX_PER_WINDOW - rec.count };
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

  const { allowed, remaining } = checkRate(ip);
  res.setHeader("X-Rate-Limit-Remaining", remaining);

  if (!allowed) {
    return res.status(429).json({
      error: "You've reached the hourly writing limit. Come back in a bit.",
    });
  }

  const { system, user, maxTokens } = req.body || {};
  if (!system || !user) return res.status(400).json({ error: "Missing system or user prompt" });

  try {
    const { status, body } = await anthropicPost({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens || 900,
      system,
      messages: [{ role: "user", content: user }],
    });

    if (status !== 200) {
      return res.status(502).json({ error: body?.error?.message || `Upstream error ${status}` });
    }

    const text = body.content?.find((b) => b.type === "text")?.text || "";
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Writing failed" });
  }
};
