export type JiraConnection = {
  siteUrl: string;
  email: string;
  token: string;
  projectKey: string;
  issueType: string;
};

export type JiraTicketResult = { key: string; url: string; status: string };

export type JiraTicketSection = {
  heading: string;
  body: string;
  format: "text" | "list" | "quote";
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

function cleanText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[\u2028\u2029]/g, " ")
    .replace(/\u00A0/g, " ")
    .replace(/[\u200B\u200C\u200D\u2060\uFEFF]/g, "")
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function adfText(text: string) {
  const cleaned = cleanText(text);
  return cleaned.length > 0 ? [{ type: "text" as const, text: cleaned }] : [];
}

function adfParagraph(text: string) {
  return {
    type: "paragraph" as const,
    content: adfText(text),
  };
}

function adfHeading(text: string) {
  return {
    type: "heading" as const,
    attrs: { level: 2 },
    content: adfText(text),
  };
}

function adfBlockquote(lines: string[]) {
  return {
    type: "blockquote" as const,
    content: lines.map((line) => adfParagraph(line)),
  };
}

function adfBulletList(items: string[]) {
  return {
    type: "bulletList" as const,
    content: items.map((item) => ({
      type: "listItem" as const,
      content: [adfParagraph(item)],
    })),
  };
}

function adfParagraphs(lines: string[]) {
  return lines.map((line) => adfParagraph(line));
}

function adfLines(body: string): string[] {
  return body
    .split(/\n+/)
    .map((line) => cleanText(line))
    .filter((line) => line.length > 0);
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
    }
  | {
      type: "bulletList";
      content: {
        type: "listItem";
        content: { type: "paragraph"; content: { type: "text"; text: string }[] }[];
      }[];
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
  summary: string,
  sections: JiraTicketSection[],
  feedbackType: string | null,
  issueTypeOverride?: string | null
): Promise<JiraTicketResult> {
  const baseUrl = jiraBaseUrl(connection.siteUrl);
  const headers = jiraHeaders(connection);

  const blocks: AdfBlock[] = [];

  for (const section of sections) {
    const body = section.body.trim();
    if (!body) continue;

    const lines = adfLines(body);
    if (lines.length === 0) continue;

    blocks.push(adfHeading(section.heading));

    if (section.format === "quote") {
      blocks.push(adfBlockquote(lines));
    } else if (section.format === "list") {
      const items = lines
        .map((line) => line.replace(/^[-•*]\s*/, "").trim())
        .filter((item) => item.length > 0);
      if (items.length > 0) {
        blocks.push(adfBulletList(items));
      }
    } else if (lines.length === 1) {
      blocks.push(adfParagraph(lines[0]));
    } else {
      blocks.push(...adfParagraphs(lines));
    }
  }

  if (blocks.length === 0) {
    blocks.push(adfParagraph("No description was provided for this ticket."));
  }

  const description = { type: "doc", version: 1, content: blocks };

  const payload = {
      fields: {
        project: { key: connection.projectKey },
        summary,
        description,
        issuetype: {
          name: issueTypeOverride || jiraIssueTypeFor(feedbackType, connection.issueType),
        },
      },
    };

  const response = await fetch(`${baseUrl}/rest/api/3/issue`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("[jira] create issue failed", response.status, body, JSON.stringify(payload));
    throw new Error(
      `Jira could not create the ticket (${response.status}). ${body.slice(0, 300)}\nPayload:\n${JSON.stringify(payload)}`
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

export type JiraTicketSync = {
  status: string;
  sprint: string | null;
  assignee: string | null;
};

function jiraStatusName(value: unknown): string {
  if (value && typeof value === "object") {
    const name = (value as { name?: unknown }).name;
    if (typeof name === "string" && name.trim()) return name.trim();
  }
  return "Backlog";
}

function jiraAssigneeName(value: unknown): string | null {
  if (value && typeof value === "object") {
    const name = (value as { displayName?: unknown }).displayName;
    if (typeof name === "string" && name.trim()) return name.trim();
  }
  return null;
}

function jiraSprintName(value: unknown): string | null {
  if (Array.isArray(value)) {
    const sprints = value as { name?: unknown; state?: unknown }[];
    if (sprints.length === 0) return null;
    const active = sprints.find((s) => s.state === "active");
    const picked = active ?? sprints[0];
    if (typeof picked?.name === "string" && picked.name.trim()) return picked.name.trim();
    return null;
  }
  if (value && typeof value === "object") {
    const name = (value as { name?: unknown }).name;
    if (typeof name === "string" && name.trim()) return name.trim();
  }
  return null;
}

/**
 * Fetches the current status, sprint, and assignee of a Jira issue.
 * The sprint is stored in a per-instance custom field, so the field list is
 * queried first to find the one named "Sprint".
 */
export async function syncJiraTicket(
  connection: Pick<JiraConnection, "siteUrl" | "email" | "token">,
  key: string
): Promise<JiraTicketSync> {
  const baseUrl = jiraBaseUrl(connection.siteUrl);
  const headers = jiraHeaders(connection);

  let sprintField: string | null = null;
  const fieldsRes = await fetch(`${baseUrl}/rest/api/3/field`, { headers });
  if (fieldsRes.ok) {
    const fields = (await fieldsRes.json()) as { id: string; name: string }[];
    const sprint = fields.find((f) => f.name?.toLowerCase() === "sprint");
    if (sprint) sprintField = sprint.id;
  }

  const wanted = ["status", "assignee", sprintField].filter(Boolean).join(",");
  const issue = await fetch(
    `${baseUrl}/rest/api/3/issue/${encodeURIComponent(key)}?fields=${encodeURIComponent(wanted)}`,
    { headers }
  );
  if (!issue.ok) {
    throw new Error(`Jira could not load the ticket (${issue.status}).`);
  }

  const json = (await issue.json()) as { fields?: Record<string, unknown> };
  const fields = json.fields ?? {};

  return {
    status: jiraStatusName(fields.status),
    assignee: jiraAssigneeName(fields.assignee),
    sprint: sprintField ? jiraSprintName(fields[sprintField]) : null,
  };
}