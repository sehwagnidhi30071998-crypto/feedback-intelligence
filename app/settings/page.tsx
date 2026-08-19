import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import JiraConnectionForm, {
  type JiraConnectionFormInitial,
} from "@/components/JiraConnectionForm";
import AiKeyForm from "@/components/AiKeyForm";
import { deleteJiraConnection, deleteAiKey } from "@/lib/actions";
import { AI_PROVIDERS } from "@/lib/constants";

type DbConnection = {
  id: string;
  name: string;
  site_url: string;
  email: string;
  project_key: string;
  issue_type: string;
  created_at: string;
};

type DbAiKey = {
  id: string;
  provider: string;
  model: string;
  base_url: string | null;
  key_tail: string;
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; deleted?: string; ai_deleted?: string }>;
}) {
  const { edit, deleted, ai_deleted } = await searchParams;

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

  const { data: aiKeyRow } = await supabase
    .from("ai_keys")
    .select("id, provider, model, base_url, key_tail")
    .maybeSingle();
  const aiKey = (aiKeyRow ?? null) as DbAiKey | null;
  const aiEdit = edit === "ai";
  const aiKeyLabel =
    AI_PROVIDERS.find((p) => p.id === aiKey?.provider)?.label ??
    aiKey?.provider;

  const aiConfigured = Boolean(process.env.GROQ_API_KEY);
  const model = process.env.AI_MODEL ?? "openai/gpt-oss-120b";

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <p className="fi-eyebrow">Workspace</p>
      <h1 className="fi-page-title mt-1">Configure your workspace</h1>
      <p className="fi-page-sub">
        Configure your AI model and connect your own Jira workspaces.
      </p>

      <div className="mt-8 space-y-6">
        <section className="fi-card p-6">
          <h2 className="font-display text-base font-semibold text-ink">
            AI Configuration
          </h2>
          <p className="mt-1 text-sm text-muted">
            The AI analyzes meeting transcripts and extracts feedback items.
          </p>
          <div
            className={`fi-notice mt-4 ${
              aiConfigured
                ? "border-ok-soft bg-ok-soft text-ok"
                : "border-amber-soft bg-amber-soft text-amber"
            }`}
          >
            {aiConfigured
              ? `Connected — using the shared model "${model}".`
              : "Not configured — set GROQ_API_KEY to enable transcript analysis."}
          </div>
          <p className="mt-3 text-xs text-faint">
            The app uses the shared Groq key first. When its quota is used up,
            anyone can bring their own key below and the app will switch to it
            automatically. Claude (Anthropic) is not supported yet.
          </p>
        </section>

        <section className="fi-card p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-base font-semibold text-ink">
              Your AI key (optional)
            </h2>
            {aiKey && !aiEdit ? (
              <Link href="/settings?edit=ai" className="fi-btn-secondary">
                Edit key
              </Link>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted">
            Bring your own provider key so you can keep analyzing even when the
            shared quota runs out. Keys are encrypted in the database and only
            ever used by your own server requests — they are never shown back.
          </p>

          {ai_deleted === "1" ? (
            <div className="fi-notice mt-4 border-ok-soft bg-ok-soft text-ok">
              Your AI key was removed.
            </div>
          ) : null}

          {aiKey && !aiEdit ? (
            <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-line px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">
                  {aiKeyLabel} · {aiKey.model}
                </p>
                <p className="mt-0.5 font-mono text-xs text-faint">
                  key ends in …{aiKey.key_tail}
                  {aiKey.base_url ? ` · ${aiKey.base_url}` : ""}
                </p>
              </div>
              <form action={deleteAiKey}>
                <input type="hidden" name="id" value={aiKey.id} />
                <button type="submit" className="fi-btn-danger-outline">
                  Delete
                </button>
              </form>
            </div>
          ) : null}

          {!aiKey || aiEdit ? (
            <div className="mt-5 border-t border-line pt-5">
              <h3 className="text-sm font-medium text-ink">
                {aiEdit ? "Edit your AI key" : "Connect your own AI key"}
              </h3>
              <div className="mt-4">
                <AiKeyForm
                  initial={
                    aiKey && aiEdit
                      ? {
                          id: aiKey.id,
                          provider: aiKey.provider,
                          model: aiKey.model,
                          baseUrl: aiKey.base_url ?? "",
                          keyTail: aiKey.key_tail,
                        }
                      : undefined
                  }
                />
              </div>
            </div>
          ) : null}
        </section>

        <section className="fi-card p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-base font-semibold text-ink">
              Jira Workspaces
            </h2>
            {list.length > 0 && !edit ? (
              <Link href="/settings?add=1" className="fi-btn-secondary">
                Add workspace
              </Link>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted">
            Connect your own Jira projects. Approved feedback can be turned into
            tickets in any of your workspaces. Tokens are encrypted and only
            your own server requests ever use them.
          </p>

          {deleted === "1" ? (
            <div className="fi-notice mt-4 border-ok-soft bg-ok-soft text-ok">
              Workspace removed.
            </div>
          ) : null}

          {list.length > 0 && !edit ? (
            <ul className="mt-4 space-y-3">
              {list.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-line px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{c.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-faint">
                      {c.site_url.replace(/^https?:\/\//, "")} · {c.project_key}{" "}
                      · {c.issue_type}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/settings?edit=${c.id}`}
                      className="fi-btn-ghost border border-line-strong"
                    >
                      Edit
                    </Link>
                    <form action={deleteJiraConnection}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        className="fi-btn-danger-outline"
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
            <div className="mt-4 rounded-lg border border-dashed border-line-strong p-4 text-sm text-muted">
              You have no Jira workspaces connected yet. Connect your first
              workspace below to start creating tickets from approved feedback.
            </div>
          ) : null}

          {list.length === 0 || edit ? (
            <div className="mt-5 border-t border-line pt-5">
              <h3 className="text-sm font-medium text-ink">
                {edit ? "Edit workspace" : "Connect a Jira workspace"}
              </h3>
              {!edit ? (
                <ol className="mt-2 list-inside list-decimal space-y-1 text-xs text-faint">
                  <li>
                    Create an API token at{" "}
                    <a
                      href="https://id.atlassian.com/manage-profile/security/api-tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="fi-link"
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