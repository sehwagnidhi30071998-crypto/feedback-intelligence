import { isJiraConfigured, jiraSite, jiraProjectKey } from "@/lib/jira";

export default function SettingsPage() {
  const jiraConnected = isJiraConfigured();
  const site = jiraSite();
  const projectKey = jiraProjectKey();
  const aiConfigured = Boolean(process.env.GROQ_API_KEY);
  const model = process.env.AI_MODEL ?? "openai/gpt-oss-120b";

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Settings
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Configure your AI model and Jira connection.
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
          <h2 className="text-base font-medium text-zinc-900">
            Jira Configuration
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Approved feedback can be turned into Jira tickets. Your connection
            details stay on the server and are never shown in the browser.
          </p>
          {jiraConnected ? (
            <div className="mt-4 space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <p>Connected.</p>
              {site ? <p>Site: {site}</p> : null}
              {projectKey ? <p>Project: {projectKey}</p> : null}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Not connected yet. To connect:
              <ol className="mt-2 list-inside list-decimal space-y-1">
                <li>
                  Create an API token at{" "}
                  <a
                    href="https://id.atlassian.com/manage-profile/security/api-tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline"
                  >
                    id.atlassian.com/manage-profile/security/api-tokens
                  </a>
                  .
                </li>
                <li>
                  Share your site URL, account email, API token, and project
                  key with your developer to configure the app.
                </li>
              </ol>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}