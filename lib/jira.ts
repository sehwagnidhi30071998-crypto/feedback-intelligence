export type JiraConnection = {
  siteUrl: string;
  email: string;
  token: string;
  projectKey: string;
  issueType: string;
};

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

export function jiraIssueTypeFor(
  feedbackType: string | null,
  fallback: string
): string {
  return (feedbackType && TYPE_MAP[feedbackType]) || fallback;
}

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
  | {
      type: "blockquote";
      content: { type: "paragraph"; content: { type: "text"; text: string }[] }[];
    };

function jiraHeaders(
  connection: Pick<JiraConnection, "email" | "token">
): Record<string, string> {
  const auth = Buffer.from(
    `${connection.email}:${connection.token}`
  ).toString("base64");
  return {
    "Content-Type": "application/json",
    Authorization: `Basic ${auth}`,
  };
}

function jiraBaseUrl(siteUrl: string): string {
  return siteUrl.trim().replace(/\/+$/, "");
}

/**
 * Verifies that the given Jira credentials work and that the project exists.
 * Throws an Error with a friendly message when the connection is not valid.
 */
export async function testJiraConnection(
  connection: Omit<JiraConnection, "issueType">
): Promise<void> {
  const baseUrl = jiraBaseUrl(connection.siteUrl);
  const headers = jiraHeaders(connection);

  const me = await fetch(`${baseUrl}/rest/api/3/myself`, { headers });
  if (!me.ok) {
    throw new Error(
      "Could not sign in to Jira with those details. Check the site URL, email, and API token."
    );
  }

  const project = await fetch(
    `${baseUrl}/rest/api/3/project/${connection.projectKey}`,
    { headers }
  );
  if (!project.ok) {
    throw new Error(
      `Jira is connected, but no project with key "${connection.projectKey}" was found. Check the project key.`
    );
  }
}

export async function createJiraTicket(
  connection: JiraConnection,
  feedback: JiraFeedbackInput
): Promise<JiraTicketResult> {
  const baseUrl = jiraBaseUrl(connection.siteUrl);
  const headers = jiraHeaders(connection);

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
    headers,
    body: JSON.stringify({
      fields: {
        project: { key: connection.projectKey },
        summary: feedback.title,
        description,
        issuetype: {
          name: jiraIssueTypeFor(feedback.type, connection.issueType),
        },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Jira could not create the ticket (${response.status}). ${body.slice(0, 200)}`
    );
  }

  const created = (await response.json()) as { key?: string };
  const key = created.key;
  if (!key) {
    throw new Error("Jira did not return a ticket key.");
  }
  const url = `${baseUrl}/browse/${key}`;

  let status = "Backlog";
  try {
    const issue = await fetch(`${baseUrl}/rest/api/3/issue/${key}`, { headers });
    if (issue.ok) {
      const json = (await issue.json()) as { fields?: { status?: { name?: string } } };
      status = json.fields?.status?.name ?? status;
    }
  } catch {
    // status stays "Backlog" if we cannot fetch it
  }

  return { key, url, status };
}