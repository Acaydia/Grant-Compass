// api/write-document.js — GoForth AI Writing Studio
// Generates grant proposals, LOIs, memos, and more using Claude Sonnet

const https = require("https");

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

const DOC_PROMPTS = {
  "LOI": (profile, funder, context) => `Write a professional Letter of Inquiry (LOI) from ${profile.name} to ${funder.name}.

Organization: ${profile.name} | EIN: ${profile.ein} | ${profile.city}, ${profile.state}
Director: ${profile.director} | Diocese: ${profile.diocese}
Mission: ${profile.mission}
Programs: ${profile.programs}
Impact: ${profile.families}+ families/week, ${profile.mealsWeekly} hot meals/week, ${profile.womenServed} women served in 2025, ${profile.volunteers} volunteers, zero admin overhead
Funder: ${funder.name} | Type: ${funder.type} | Focus: ${funder.notes}
Ask Range: ${funder.ask || context || "TBD"}
${context ? "Additional context: " + context : ""}

Write a formal, compelling LOI (2-3 pages when printed). Include: opening paragraph establishing connection to funder priorities, statement of need, program description, specific use of funds, impact metrics, Catholic identity/canonical governance (if applicable), closing with next steps. Use professional nonprofit grant writing style. Address to "Dear Grants Committee" unless funder contact is known.`,

  "Grant Proposal": (profile, funder, context) => `Write a full grant proposal from ${profile.name} to ${funder.name}.

Organization: ${profile.name} | EIN: ${profile.ein} | ${profile.city}, ${profile.state}
Director: ${profile.director} | Mission: ${profile.mission}
Programs: ${profile.programs}
Impact: ${profile.families}+ families, ${profile.mealsWeekly} meals/week, ${profile.womenServed} women, ${profile.volunteers} volunteers
Funder: ${funder.name} | Focus: ${funder.notes} | Ask: ${funder.ask || ""}
${context ? "Context: " + context : ""}

Write a complete grant proposal with sections: Executive Summary, Statement of Need, Project Description, Goals and Objectives, Evaluation Plan, Organizational Capacity, Budget Narrative, and Conclusion. Professional, evidence-based, faith-informed language. 4-6 pages.`,

  "Alignment Memo": (profile, funder, context) => `Write an internal strategic alignment memo from the development team of ${profile.name} regarding ${funder.name}.

Org: ${profile.name} | Location: ${profile.city}, ${profile.state} | Director: ${profile.director}
Funder: ${funder.name} | Type: ${funder.type} | Notes: ${funder.notes} | Ask: ${funder.ask || ""}
${context ? "Context: " + context : ""}

Format: To: Board / Fr. [Director] | From: Development | Re: ${funder.name} — Alignment & Strategy
Include: funder profile summary, strategic fit analysis, recommended approach, suggested ask, timeline, required action items, and canonical/compliance notes if relevant. 1-2 pages. Confident, advisory tone.`,

  "One-Pager": (profile, funder, context) => `Create a one-page funding brief for ${profile.name} tailored to ${funder.name}.

Org: ${profile.name} | Mission: ${profile.mission} | Impact: ${profile.families}+ families, ${profile.womenServed} women, ${profile.mealsWeekly} meals/week, ${profile.volunteers} volunteers
Funder priorities: ${funder.notes}
${context ? "Ask/focus: " + context : "Ask: " + (funder.ask || "TBD")}

One page. Sections: Who We Are | What We Do | The Need | Our Impact | Your Partnership. Compelling, visual language. End with a clear call to action. Ready to email or print.`,

  "Thank You Letter": (profile, funder, context) => `Write a warm, professional thank-you letter from ${profile.name} to ${funder.name} for a grant or gift.

Org: ${profile.name} | Director: ${profile.director} | EIN: ${profile.ein}
${context ? "Gift details: " + context : ""}

Heartfelt, specific, canonical acknowledgment of the gift's impact. Reference the programs supported. Include a specific story or outcome if possible. Close with an invitation to visit or stay connected. Signed by ${profile.director}. 1 page.`,

  "Impact Report": (profile, funder, context) => `Write an impact report from ${profile.name} to ${funder.name} covering 2025 program outcomes.

Org: ${profile.name} | Programs: ${profile.programs}
Data: ${profile.families}+ families served, ${profile.mealsWeekly} hot meals/week, ${profile.womenServed} women through ${profile.apostolate || "the House"}, ${profile.volunteers} volunteers
${context ? "Additional detail: " + context : ""}

2-page narrative impact report. Sections: Year in Review, Program Highlights, Impact by the Numbers, Stories of Transformation (anonymized), Financial Stewardship, Looking Ahead. Professional yet personal. Concludes with gratitude and renewal invitation.`,

  "Board Briefing": (profile, funder, context) => `Write a board briefing document for ${profile.name} regarding the ${funder.name} funding opportunity.

Org: ${profile.name} | Director: ${profile.director}
Funder: ${funder.name} | Ask: ${funder.ask || ""} | Notes: ${funder.notes}
${context ? "Context: " + context : ""}

1-page briefing for board review. Sections: Opportunity Summary, Strategic Fit, Proposed Ask & Use of Funds, Timeline, Required Board Actions, Risk Assessment. Clear, decision-ready format.`,

  "Donor Cultivation Email": (profile, funder, context) => `Write a personal cultivation email from ${profile.director} at ${profile.name} to a contact at ${funder.name}.

Org: ${profile.name} | Director: ${profile.director} | ${profile.city}, ${profile.state}
Recipient: Representative at ${funder.name}
${context ? "Context: " + context : ""}

Warm, relationship-first email requesting a conversation or meeting. Reference the funder's known priorities. Share one compelling statistic or story. Do not make an ask — the goal is to open a conversation. 3-4 paragraphs. Personal, not form-letter.`,

  "Case for Support": (profile, funder, context) => `Write a compelling case for support for ${profile.name}, tailored for ${funder.name}.

Org: ${profile.name} | Mission: ${profile.mission} | Location: ${profile.city}, ${profile.state}
Impact: ${profile.families}+ families, ${profile.womenServed} women, ${profile.mealsWeekly} meals/week, ${profile.volunteers} volunteers
${context ? "Focus: " + context : ""}

2-3 pages. Tell the story of why this work matters, who it serves, what makes it unique, and what continued investment will accomplish. End with a clear vision of the future and invitation to join. Emotional, evidence-based, mission-centered.`,
};

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: "API key not configured" });

  const { profile, funder, docType, context } = req.body || {};
  if (!profile || !funder || !docType) return res.status(400).json({ error: "Missing required fields" });

  const promptFn = DOC_PROMPTS[docType] || DOC_PROMPTS["LOI"];
  const prompt = promptFn(profile, funder, context || "");

  try {
    const { status, body } = await postJSON(
      "api.anthropic.com", "/v1/messages",
      { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      {
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }
    );

    if (status !== 200) return res.status(502).json({ error: body?.error?.message || `Error ${status}` });
    const text = body.content?.[0]?.text || "";
    return res.status(200).json({ document: text, docType, funder: funder.name });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
