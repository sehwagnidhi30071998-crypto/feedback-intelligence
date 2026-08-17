const SITE = process.env.JIRA_SITE_URL ?? "";
const EMAIL = process.env.JIRA_EMAIL ?? "";
const TOKEN = process.env.JIRA_API_TOKEN ?? "";
const PROJECT_KEY = process.env.JIRA_PROJECT_KEY ?? "";
const ISSUE_TYPE = process.env.JIRA_ISSUE_TYPE ?? "Task";

export function isJiraConfigured(): boolean {
  return Boolean(SITE && EMAIL && TOKEN && PROJECT_KEY);
}

export function jiraSite(): string | null {
  return SITE || null;
}

export function jiraProjectKey(): string | null {
  return PROJECT_KEY || null;
}

const TYPE_MAP: Record<string, string> = {
  Bug: "Bug",
  "Feature Request": "Story",
  "Logic Change": "Story",
  "UX Improvement": "Story",
  "Data Issue": "Bug",
  "Performance Issue": "Bug",
  "Domain Knowledge": "Task",
  "Existing Issue": "Bug",
  Other: "Task",
};

export function jiraIssueTypeFor(feedbackType: string | null): string {
  return (feedbackType && TYPE_MAP[feedbackType]) || ISSUE_TYPE;
}

export type JiraTicketResult = { key: string; url: string; status: string };

export type JiraFeedbackInput = {
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

function adfParagraph(text: string) {
  return {
    type: "paragraph" as const,
    content: [{ type: "text" as const, text }],
  };
}

function adfHeading(text: string) {
  return {
    type: "heading" as const,
    attrs: { level: 2 },
    content: [{ type: "text" as const, text }],
  };
}

function adfBlockquote(text: string) {
  return { type: "blockquote" as const, content: [adfParagraph(text)] };
}

function adfParagraphs(value: string) {
  return value
    .split(/\n+/)
    .filter((line) => line.trim().length > 0)
    .map((line) => adfParagraph(line.trim()));
}

type AdfBlock =
  | { type: "paragraph"; content: { type: "text"; text: string }[] }
  | {
      type: "heading";
      attrs: { level: number };
      content: { type: "text"; text: string }[];
    }
  | { type: "blockquote"; content: { type: "paragraph"; content: { type: "text"; text: string }[] }[] };

export async function createJiraTicket(
  feedback: JiraFeedbackInput
): Promise<JiraTicketResult> {
  if (!isJiraConfigured()) {
    throw new Error("Jira is not configured. Add your connection details in Settings.");
  }

  const baseUrl = SITE.replace(/\/+$/, "");
  const auth = Buffer.from(`${EMAIL}:${TOKEN}`).toString("base64");

  const blocks: AdfBlock[] = [];

  const scoring = [
    feedback.type ? `Type: ${feedback.type}` : null,
    feedback.reporter
      ? `Reporter: ${feedback.reporter}${feedback.reporter_team ? ` (${feedback.reporter_team})` : ""}`
      : null,
    feedback.confidence !== null ? `Confidence: ${feedback.confidence}%` : null,
    feedback.impact !== null ? `Impact: ${feedback.impact}/10` : null,
    feedback.ease !== null ? `Ease: ${feedback.ease}/10` : null,
    feedback.ice_score !== null ? `ICE score: ${feedback.ice_score}` : null,
  ].filter((s): s is string => Boolean(s));

  if (scoring.length > 0) {
    blocks.push(adfParagraph(scoring.join("\n")));
  }

  const sections: [string, string][] = [
    ["Problem", feedback.problem ?? ""],
    ["Requested change", feedback.requested_change ?? ""],
    ["Proposed implementation", feedback.proposed_implementation ?? ""],
    ["Domain knowledge", feedback.domain_knowledge ?? ""],
  ];

  for (const [heading, value] of sections) {
    if (value) {
      blocks.push(adfHeading(heading));
      blocks.push(...adfParagraphs(value));
    }
  }

  if (feedback.transcript_evidence) {
    blocks.push(adfHeading("Transcript evidence"));
    blocks.push(adfBlockquote(feedback.transcript_evidence.trim()));
  }

  const description = { type: "doc", version: 1, content: blocks };

  const response = await fetch(`${baseUrl}/rest/api/3/issue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      fields: {
        project: { key: PROJECT_KEY },
        summary: feedback.title,
        description,
        issuetype: { name: jiraIssueTypeFor(feedback.type) },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Jira could not create the ticket (${response.status}). ${body.slice(0, 200)}`
    );
  }

  const created = (await response.json()) as { key?: string; self?: string };
  const key = created.key;
  if (!key) {
    throw new Error("Jira did not return a ticket key.");
  }
  const url = `${baseUrl}/browse/${key}`;

  let status = "Backlog";
  try {
    const issue = await fetch(`${baseUrl}/rest/api/3/issue/${key}`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (issue.ok) {
      const json = (await issue.json()) as { fields?: { status?: { name?: string } } };
      status = json.fields?.status?.name ?? status;
    }
  } catch {
    // status stays "Backlog" if we cannot fetch it
  }

  return { key, url, status };
}