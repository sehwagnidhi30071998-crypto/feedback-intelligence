import { ALLOWED_TYPES } from "@/lib/constants";
import {
  TICKET_SECTIONS,
  type TicketDraft,
  type TicketSection,
} from "@/lib/constants";

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

export type TicketSource = {
  title: string;
  type: string | null;
  reporter: string | null;
  reporter_team: string | null;
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

const TICKET_SYSTEM_PROMPT = `You are a senior product manager writing a fully-scoped engineering ticket from product feedback extracted from a meeting transcript. Engineers will pick up this ticket and implement it, so it must be complete, unambiguous, and actionable.

You are given:
1. The feedback item (fields extracted from the meeting).
2. The relevant excerpt(s) of the meeting transcript.
3. Optional extra context added by the user.

Treat the user's extra context as authoritative: weave it in wherever it applies, and where it conflicts with the transcript, follow the user.

Return ONLY valid JSON in this exact shape:
{
  "summary": "<one concise, specific sentence, max ~12 words>",
  "sections": {
    "context": "<background: what is happening, who reported it, why it matters, relevant domain knowledge>",
    "requested_change": "<exactly what needs to change>",
    "impact": "<who is affected and how severely, referencing the scoring when useful>",
    "acceptance_criteria": "<checkable items, one per line, each starting with '- '>",
    "proposed_implementation": "<concrete approach and notes; if the source gives none, propose a sensible minimal approach and mark it as an assumption>",
    "testing": "<how to verify the change works and does not regress>",
    "evidence": "<the exact verbatim transcript quote(s) supporting this item>"
  }
}

Rules:
- Do not invent facts, numbers, users, or links that are not in the source material.
- Keep every section grounded in the feedback item, the transcript, or the user's extra context.
- acceptance_criteria must be a bullet list, one checkable statement per line, each line starting with "- ".
- Write for engineers: be specific, name surfaces/features only if they appear in the source, and never pad with filler.
- All section values are strings. Return ONLY the JSON object.`;

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

async function groqChat(
  system: string,
  user: string,
  temperature: number
): Promise<string> {
  if (!API_KEY) {
    throw new Error("GROQ_API_KEY is not set");
  }

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature,
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
  return content;
}

export async function analyzeTranscript(
  transcript: string,
  context: string | null
): Promise<ExtractedFeedback[]> {
  const userMessage = context
    ? `Meeting context: ${context}\n\nTranscript:\n${transcript}`
    : `Transcript:\n${transcript}`;

  const content = await groqChat(SYSTEM_PROMPT, userMessage, 0.2);

  const parsed = parseJson(content) as { feedback?: unknown } | null;
  const items = Array.isArray(parsed?.feedback) ? parsed.feedback : [];
  return items
    .map((item) => sanitizeItem((item ?? {}) as Record<string, unknown>))
    .filter((item) => item.title !== "Untitled feedback");
}

export async function generateTicketDraft(
  feedback: TicketSource,
  transcript: string | null,
  extraContext: string | null
): Promise<TicketDraft> {
  const scoring = [
    feedback.type ? `Type: ${feedback.type}` : null,
    feedback.reporter
      ? `Reporter: ${feedback.reporter}${feedback.reporter_team ? ` (${feedback.reporter_team})` : ""}`
      : null,
    feedback.confidence !== null ? `Confidence: ${feedback.confidence}%` : null,
    feedback.impact !== null ? `Impact: ${feedback.impact}/10` : null,
    feedback.ease !== null ? `Ease: ${feedback.ease}/10` : null,
    feedback.ice_score !== null ? `ICE score: ${feedback.ice_score}` : null,
  ]
    .filter((s): s is string => Boolean(s))
    .join("\n");

  const feedbackBlock = [
    `Title: ${feedback.title}`,
    scoring ? `Scoring:\n${scoring}` : null,
    feedback.problem ? `Problem: ${feedback.problem}` : null,
    feedback.requested_change
      ? `Requested change: ${feedback.requested_change}`
      : null,
    feedback.proposed_implementation
      ? `Proposed implementation: ${feedback.proposed_implementation}`
      : null,
    feedback.domain_knowledge ? `Domain knowledge: ${feedback.domain_knowledge}` : null,
    feedback.transcript_evidence
      ? `Transcript evidence:\n${feedback.transcript_evidence}`
      : null,
  ]
    .filter((s): s is string => Boolean(s))
    .join("\n\n");

  const userMessage = [
    `FEEDBACK ITEM:\n${feedbackBlock}`,
    transcript ? `MEETING TRANSCRIPT EXCERPT:\n${transcript}` : null,
    extraContext ? `EXTRA CONTEXT FROM USER (authoritative):\n${extraContext}` : null,
  ]
    .filter((s): s is string => Boolean(s))
    .join("\n\n");

  const content = await groqChat(TICKET_SYSTEM_PROMPT, userMessage, 0.3);

  const parsed = parseJson(content) as
    | { summary?: unknown; sections?: Record<string, unknown> }
    | null;

  const summary =
    text(parsed?.summary) ??
    (feedback.title.length > 0
      ? feedback.title
      : "Untitled feedback ticket");

  const sections: TicketSection[] = [];
  if (parsed?.sections && typeof parsed.sections === "object") {
    for (const section of TICKET_SECTIONS) {
      const body = text(parsed.sections[section.id]);
      if (body) {
        sections.push({ id: section.id, heading: section.heading, body });
      }
    }
  }

  if (sections.length === 0) {
    throw new Error("The AI did not return a usable ticket draft.");
  }

  return { summary, sections };
}