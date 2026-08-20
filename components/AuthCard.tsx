"use client";

import { useState } from "react";
import LoginForm from "@/components/LoginForm";
import SignupForm from "@/components/SignupForm";

type Tab = "login" | "signup";

const TABS: { key: Tab; label: string }[] = [
  { key: "login", label: "Sign in" },
  { key: "signup", label: "Create account" },
];

export default function AuthCard() {
  const [tab, setTab] = useState<Tab>("login");

  return (
    <div className="fi-card overflow-hidden">
      <div className="grid grid-cols-2 px-3 pt-2">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-pressed={tab === key}
            className={`border-b-2 pb-2.5 text-sm font-medium transition-colors ${
              tab === key
                ? "border-signal text-ink"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="px-6 py-6">
        {tab === "login" ? (
          <LoginForm onSwitch={() => setTab("signup")} />
        ) : (
          <SignupForm onSwitch={() => setTab("login")} />
        )}
      </div>
    </div>
  );
}