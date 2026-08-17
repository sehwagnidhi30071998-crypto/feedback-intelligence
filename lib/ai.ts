import { ALLOWED_TYPES } from "@/lib/constants";

const API_KEY = process.env.GROQ_API_KEY;
const BASE_URL = process.env.AI_BASE_URL ?? "https://api.groq.com/openai/v1";
const MODEL = process.env.AI_MODEL ?? "openai/gpt-oss-120b";

export type ExtractedFeedback = {
  title: string;
  type: string;
  reporter: string | null;
  reporter_team: string | null;
  reported_date: string | null;
  problem: string | null;
  requested_change: string | null;
  proposed_implementation: string | null;
  domain_knowledge: string | null;
  transcript_evidence: string | null;
  confidence: number | null;
  impact: number | null;
  ease: number | null;
  ice_score: number | null;
};

const SYSTEM_PROMPT = `You are a product analyst. Read the meeting transcript and extract actionable product feedback items.

Use only these feedback types: Bug, Feature Request, Logic Change, UX Improvement, Data Issue, Performance Issue, Domain Knowledge, Existing Issue, Other.

For EACH feedback item, return a JSON object with these fields:
- title: a short, descriptive title (required)
- type: one of the types above (required)
- reporter: the person who raised it, if mentioned, else null
- reporter_team: their team, if mentioned, else null
- reported_date: the meeting date ONLY if explicitly stated in the transcript as YYYY-MM-DD, else null
- problem: the problem being described
- requested_change: what the person is asking to be changed
- proposed_implementation: any suggested implementation, if given, else null
- domain_knowledge: relevant domain information, if any, else null
- transcript_evidence: the EXACT verbatim quote(s) from the transcript supporting this item (required)
- confidence: how clearly this was requested, 0-100
- impact: 1-10
- ease: 1-10
- ice_score: calculate as impact * ease * (confidence / 10), rounded

Rules:
- Only include genuine product feedback. Ignore small talk, logistics, and scheduling.
- If no feedback is present, return {"feedback": []}.
- Return ONLY valid JSON in this exact shape: {"feedback": [ { "title": "...", "type": "...", "reporter": ..., "reporter_team": ..., "reported_date": ..., "problem": "...", "requested_change": "...", "proposed_implementation": ..., "domain_knowledge": ..., "transcript_evidence": "...", "confidence": ..., "impact": ..., "ease": ..., "ice_score": ... } ] }`;

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function number(value: unknown, min: number, max: number): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function sanitizeItem(raw: Record<string, unknown>): ExtractedFeedback {
  const type = text(raw.type) ?? "";
  const confidence = number(raw.confidence, 0, 100);
  const impact = number(raw.impact, 1, 10);
  const ease = number(raw.ease, 1, 10);
  const ice =
    impact !== null && ease !== null && confidence !== null
      ? Math.round(impact * ease * (confidence / 10))
      : number(raw.ice_score, 0, 1000);

  return {
    title: text(raw.title) ?? "Untitled feedback",
    type: ALLOWED_TYPES.includes(type) ? type : "Other",
    reporter: text(raw.reporter),
    reporter_team: text(raw.reporter_team),
    reported_date: text(raw.reported_date),
    problem: text(raw.problem),
    requested_change: text(raw.requested_change),
    proposed_implementation: text(raw.proposed_implementation),
    domain_knowledge: text(raw.domain_knowledge),
    transcript_evidence: text(raw.transcript_evidence),
    confidence,
    impact,
    ease,
    ice_score: ice,
  };
}

function parseJson(content: string): unknown {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function analyzeTranscript(
  transcript: string,
  context: string | null
): Promise<ExtractedFeedback[]> {
  if (!API_KEY) {
    throw new Error("GROQ_API_KEY is not set");
  }

  const userMessage = context
    ? `Meeting context: ${context}\n\nTranscript:\n${transcript}`
    : `Transcript:\n${transcript}`;

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`AI request failed with status ${response.status}`);
  }

  const data = await response.json();
  const content: unknown = data.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.length === 0) {
    throw new Error("AI returned an empty response");
  }

  const parsed = parseJson(content) as { feedback?: unknown } | null;
  const items = Array.isArray(parsed?.feedback) ? parsed.feedback : [];
  return items
    .map((item) => sanitizeItem((item ?? {}) as Record<string, unknown>))
    .filter((item) => item.title !== "Untitled feedback");
}