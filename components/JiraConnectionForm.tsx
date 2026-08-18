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

const inputClasses =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

const labelClasses = "block text-sm font-medium text-zinc-700";

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
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}
      {state.saved ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Workspace saved.
        </div>
      ) : null}

      <div>
        <label className={labelClasses} htmlFor="name">
          Workspace name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="e.g. Work — KAN"
          defaultValue={initial?.name}
          className={inputClasses}
        />
        <p className="mt-1 text-xs text-zinc-400">
          A label to tell this workspace apart from others.
        </p>
      </div>

      <div>
        <label className={labelClasses} htmlFor="site_url">
          Jira site URL
        </label>
        <input
          id="site_url"
          name="site_url"
          type="url"
          required
          placeholder="https://yourcompany.atlassian.net"
          defaultValue={initial?.siteUrl}
          className={inputClasses}
        />
      </div>

      <div>
        <label className={labelClasses} htmlFor="email">
          Atlassian account email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          defaultValue={initial?.email}
          className={inputClasses}
        />
      </div>

      <div>
        <label className={labelClasses} htmlFor="project_key">
          Project key
        </label>
        <input
          id="project_key"
          name="project_key"
          type="text"
          required
          placeholder="e.g. KAN"
          defaultValue={initial?.projectKey}
          className={inputClasses}
        />
        <p className="mt-1 text-xs text-zinc-400">
          The short project code in Jira, e.g. KAN. Tickets are created in this
          project.
        </p>
      </div>

      <div>
        <label className={labelClasses} htmlFor="issue_type">
          Default issue type
        </label>
        <select
          id="issue_type"
          name="issue_type"
          defaultValue={initial?.issueType ?? "Task"}
          className={inputClasses}
        >
          {["Task", "Bug", "Story", "Epic", "Feature"].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-zinc-400">
          Used for feedback without a matching type (e.g. Bug feedback becomes a
          Bug ticket automatically).
        </p>
      </div>

      <div>
        <label className={labelClasses} htmlFor="token">
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
          className={inputClasses}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
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
          className="ml-3 text-sm font-medium text-zinc-500 hover:text-zinc-700"
        >
          Cancel
        </Link>
      ) : null}
    </form>
  );
}