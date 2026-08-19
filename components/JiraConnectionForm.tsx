"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveJiraConnection } from "@/lib/actions";

export type JiraConnectionFormInitial = {
  id: string;
  name: string;
  siteUrl: string;
  email: string;
  projectKey: string;
  issueType: string;
};

export default function JiraConnectionForm({
  initial,
}: {
  initial?: JiraConnectionFormInitial;
}) {
  const [state, formAction, pending] = useActionState(saveJiraConnection, {});

  return (
    <form action={formAction} className="space-y-4">
      {initial ? (
        <input type="hidden" name="id" value={initial.id} />
      ) : null}
      {state.error ? (
        <div className="fi-notice border-danger-soft bg-danger-soft text-danger">
          {state.error}
        </div>
      ) : null}
      {state.saved ? (
        <div className="fi-notice border-ok-soft bg-ok-soft text-ok">
          Workspace saved.
        </div>
      ) : null}

      <div>
        <label className="fi-label" htmlFor="name">
          Workspace name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="e.g. Work — KAN"
          defaultValue={initial?.name}
          className="fi-input"
        />
        <p className="mt-1 text-xs text-faint">
          A label to tell this workspace apart from others.
        </p>
      </div>

      <div>
        <label className="fi-label" htmlFor="site_url">
          Jira site URL
        </label>
        <input
          id="site_url"
          name="site_url"
          type="url"
          required
          placeholder="https://yourcompany.atlassian.net"
          defaultValue={initial?.siteUrl}
          className="fi-input"
        />
      </div>

      <div>
        <label className="fi-label" htmlFor="email">
          Atlassian account email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          defaultValue={initial?.email}
          className="fi-input"
        />
      </div>

      <div>
        <label className="fi-label" htmlFor="project_key">
          Project key
        </label>
        <input
          id="project_key"
          name="project_key"
          type="text"
          required
          placeholder="e.g. KAN"
          defaultValue={initial?.projectKey}
          className="fi-input"
        />
        <p className="mt-1 text-xs text-faint">
          The short project code in Jira, e.g. KAN. Tickets are created in this
          project.
        </p>
      </div>

      <div>
        <label className="fi-label" htmlFor="issue_type">
          Default issue type
        </label>
        <select
          id="issue_type"
          name="issue_type"
          defaultValue={initial?.issueType ?? "Task"}
          className="fi-input"
        >
          {["Task", "Bug", "Story", "Epic", "Feature"].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-faint">
          Used for feedback without a matching type (e.g. Bug feedback becomes a
          Bug ticket automatically).
        </p>
      </div>

      <div>
        <label className="fi-label" htmlFor="token">
          API token
        </label>
        <input
          id="token"
          name="token"
          type="password"
          required={!initial}
          placeholder={
            initial
              ? "Leave blank to keep the existing token"
              : "Create at id.atlassian.com/manage-profile/security/api-tokens"
          }
          className="fi-input"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="fi-btn-primary"
      >
        {pending
          ? "Testing & saving…"
          : initial
            ? "Save changes"
            : "Test & connect"}
      </button>

      {initial ? (
        <Link
          href="/settings"
          className="fi-link ml-3 text-sm"
        >
          Cancel
        </Link>
      ) : null}
    </form>
  );
}