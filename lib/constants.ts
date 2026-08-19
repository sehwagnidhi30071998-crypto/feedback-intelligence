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