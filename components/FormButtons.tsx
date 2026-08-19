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
        className="fi-btn-secondary"
      >
        {pending && clicked === "save" ? "Saving…" : "Save Meeting"}
      </button>
      <button
        type="submit"
        name="intent"
        value="analyze"
        onClick={() => setClicked("analyze")}
        disabled={pending}
        className="fi-btn-primary"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        {pending && clicked === "analyze" ? "Analyzing…" : "Analyze Transcript"}
      </button>
    </div>
  );
}