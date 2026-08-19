export const ALLOWED_TYPES = [
  "Bug",
  "Feature Request",
  "Logic Change",
  "UX Improvement",
  "Data Issue",
  "Performance Issue",
  "Domain Knowledge",
  "Existing Issue",
  "Other",
];

export const AI_PROVIDERS = [
  {
    id: "groq",
    label: "Groq",
    defaultModel: "openai/gpt-oss-120b",
    baseUrl: "https://api.groq.com/openai/v1",
  },
  {
    id: "openai",
    label: "OpenAI",
    defaultModel: "gpt-4o-mini",
    baseUrl: "https://api.openai.com/v1",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    defaultModel: "openai/gpt-4o-mini",
    baseUrl: "https://openrouter.ai/api/v1",
  },
] as const;

export type AiProviderId = (typeof AI_PROVIDERS)[number]["id"];

export const PROVIDER_BASE_URLS: Record<string, string> = Object.fromEntries(
  AI_PROVIDERS.map((p) => [p.id, p.baseUrl])
);

export const PROVIDER_DEFAULT_MODELS: Record<string, string> = Object.fromEntries(
  AI_PROVIDERS.map((p) => [p.id, p.defaultModel])
);

export const REVIEW_STATUSES = ["pending", "approved", "rejected", "duplicate"];

export const TICKET_SECTIONS = [
  { id: "context", heading: "Problem & context", format: "text" },
  { id: "requested_change", heading: "Requested change", format: "text" },
  { id: "impact", heading: "Impact", format: "text" },
  { id: "acceptance_criteria", heading: "Acceptance criteria", format: "list" },
  { id: "proposed_implementation", heading: "Proposed implementation", format: "text" },
  { id: "testing", heading: "Testing & verification", format: "text" },
  { id: "evidence", heading: "Evidence & notes", format: "quote" },
] as const;

export type TicketSectionId = (typeof TICKET_SECTIONS)[number]["id"];
export type TicketSectionFormat = (typeof TICKET_SECTIONS)[number]["format"];

export type TicketSection = {
  id: TicketSectionId;
  heading: string;
  body: string;
};

export type TicketDraft = {
  summary: string;
  sections: TicketSection[];
};