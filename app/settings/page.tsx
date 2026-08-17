export default function SettingsPage() {
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
            Choose which AI model analyzes your meeting transcripts. A local
            open-source model (Ollama) is planned so your data stays private
            and costs nothing.
          </p>
          <div className="mt-4 rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-400">
            No configuration yet — coming in a later step.
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-base font-medium text-zinc-900">
            Jira Configuration
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Connect your Jira workspace so approved feedback can be turned into
            tickets. Your connection details stay on the server and are never
            shown in the browser.
          </p>
          <div className="mt-4 rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-400">
            No configuration yet — coming in a later step.
          </div>
        </section>
      </div>
    </div>
  );
}