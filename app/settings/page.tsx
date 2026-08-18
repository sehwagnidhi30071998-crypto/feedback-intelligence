import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import JiraConnectionForm, {
  type JiraConnectionFormInitial,
} from "@/components/JiraConnectionForm";
import { deleteJiraConnection } from "@/lib/actions";

type DbConnection = {
  id: string;
  name: string;
  site_url: string;
  email: string;
  project_key: string;
  issue_type: string;
  created_at: string;
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; deleted?: string }>;
}) {
  const { edit, deleted } = await searchParams;

  const supabase = await createClient();
  const { data: connections } = await supabase
    .from("jira_connections")
    .select("id, name, site_url, email, project_key, issue_type, created_at")
    .order("created_at", { ascending: false });

  const list = (connections ?? []) as unknown as DbConnection[];

  const editing = list.find((c) => c.id === edit) ?? null;
  const editInitial: JiraConnectionFormInitial | undefined = editing
    ? {
        id: editing.id,
        name: editing.name,
        siteUrl: editing.site_url,
        email: editing.email,
        projectKey: editing.project_key,
        issueType: editing.issue_type,
      }
    : undefined;

  const aiConfigured = Boolean(process.env.GROQ_API_KEY);
  const model = process.env.AI_MODEL ?? "openai/gpt-oss-120b";

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Settings
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Configure your AI model and connect your own Jira workspaces.
      </p>

      <div className="mt-6 space-y-6">
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-base font-medium text-zinc-900">
            AI Configuration
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            The AI analyzes meeting transcripts and extracts feedback items.
          </p>
          <div
            className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
              aiConfigured
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            {aiConfigured
              ? `Connected — using model "${model}".`
              : "Not configured — set GROQ_API_KEY to enable transcript analysis."}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-zinc-900">
              Jira Workspaces
            </h2>
            {list.length > 0 && !edit ? (
              <Link
                href="/settings?add=1"
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
              >
                Add workspace
              </Link>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Connect your own Jira projects. Approved feedback can be turned into
            tickets in any of your workspaces. Tokens are encrypted and only
            your own server requests ever use them.
          </p>

          {deleted === "1" ? (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Workspace removed.
            </div>
          ) : null}

          {list.length > 0 && !edit ? (
            <ul className="mt-4 space-y-3">
              {list.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {c.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {c.site_url.replace(/^https?:\/\//, "")} ·{" "}
                      {c.project_key} · {c.issue_type}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/settings?edit=${c.id}`}
                      className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
                    >
                      Edit
                    </Link>
                    <form action={deleteJiraConnection}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {list.length === 0 && !edit ? (
            <div className="mt-4 rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
              You have no Jira workspaces connected yet. Connect your first
              workspace below to start creating tickets from approved feedback.
            </div>
          ) : null}

          {list.length === 0 || edit ? (
            <div className="mt-5 border-t border-zinc-100 pt-5">
              <h3 className="text-sm font-medium text-zinc-900">
                {edit ? "Edit workspace" : "Connect a Jira workspace"}
              </h3>
              {!edit ? (
                <ol className="mt-2 list-inside list-decimal space-y-1 text-xs text-zinc-500">
                  <li>
                    Create an API token at{" "}
                    <a
                      href="https://id.atlassian.com/manage-profile/security/api-tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-indigo-600 hover:underline"
                    >
                      id.atlassian.com/manage-profile/security/api-tokens
                    </a>
                  </li>
                  <li>
                    Find your site URL, account email, and the project key where
                    tickets should be created.
                  </li>
                  <li>
                    Fill in the form — we verify the connection before saving.
                  </li>
                </ol>
              ) : null}
              <div className="mt-4">
                <JiraConnectionForm initial={editInitial} />
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}