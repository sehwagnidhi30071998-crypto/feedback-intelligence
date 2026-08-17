"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

export default function FormButtons() {
  const { pending } = useFormStatus();
  const [clicked, setClicked] = useState<"save" | "analyze" | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-3 pt-2">
      <button
        type="submit"
        name="intent"
        value="save"
        onClick={() => setClicked("save")}
        disabled={pending}
        className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending && clicked === "save" ? "Saving…" : "Save Meeting"}
      </button>
      <button
        type="submit"
        name="intent"
        value="analyze"
        onClick={() => setClicked("analyze")}
        disabled={pending}
        className="inline-flex items-center justify-center rounded-lg border border-indigo-300 bg-white px-4 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending && clicked === "analyze" ? "Analyzing…" : "Analyze Transcript"}
      </button>
    </div>
  );
}