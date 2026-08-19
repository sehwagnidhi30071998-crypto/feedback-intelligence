"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/lib/auth-actions";
import Wordmark, { Waveform } from "@/components/Wordmark";

type IconName =
  | "dashboard"
  | "transcript"
  | "review"
  | "jira"
  | "settings"
  | "tour";

function NavIcon({
  name,
  className = "h-4 w-4",
}: {
  name: IconName;
  className?: string;
}) {
  const common = {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    className,
  } as const;

  switch (name) {
    case "dashboard":
      return (
        <svg {...common} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
          />
        </svg>
      );
    case "transcript":
      return (
        <svg {...common} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
          />
        </svg>
      );
    case "review":
      return (
        <svg {...common} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      );
    case "jira":
      return (
        <svg {...common} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-12h6a2.25 2.25 0 0 1 2.25 2.25v9A2.25 2.25 0 0 1 13.5 19.5h-6a2.25 2.25 0 0 1-2.25-2.25v-9A2.25 2.25 0 0 1 7.5 6Zm7.5 4.5h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"
          />
        </svg>
      );
    case "settings":
      return (
        <svg {...common} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a7.723 7.723 0 0 1 0-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
        </svg>
      );
    case "tour":
      return (
        <svg {...common} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25"
          />
        </svg>
      );
  }
}

const navGroups: { label: string; links: { href: string; label: string; icon: IconName }[] }[] = [
  {
    label: "Overview",
    links: [{ href: "/dashboard", label: "Dashboard", icon: "dashboard" }],
  },
  {
    label: "Pipeline",
    links: [
      { href: "/meetings", label: "Add transcript", icon: "transcript" },
      { href: "/feedback", label: "Review extracted feedback", icon: "review" },
      { href: "/jira", label: "Create Jira tickets", icon: "jira" },
    ],
  },
];

function SidebarNav({
  pathname,
  collapsed = false,
  userEmail,
  onNavigate,
}: {
  pathname: string;
  collapsed?: boolean;
  userEmail: string | null;
  onNavigate?: () => void;
}) {
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <div className="flex-1 space-y-7 overflow-y-auto px-3 py-2">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed ? (
              <p className="fi-eyebrow px-3 pb-2">{group.label}</p>
            ) : null}
            <div className="space-y-0.5">
              {group.links.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    title={collapsed ? link.label : undefined}
                    onClick={onNavigate}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      collapsed ? "justify-center px-0" : ""
                    } ${
                      active
                        ? "bg-signal-soft text-signal-strong"
                        : "text-muted hover:bg-paper hover:text-ink"
                    }`}
                  >
                    <span className={active ? "text-signal" : ""}>
                      <NavIcon name={link.icon} />
                    </span>
                    {!collapsed ? (
                      <span className="truncate">{link.label}</span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-0.5 border-t border-line px-3 py-2">
        <Link
          href="/dashboard?tour=1"
          id="tour-launcher"
          onClick={onNavigate}
          title={collapsed ? "Take the tour" : undefined}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-paper hover:text-ink ${
            collapsed ? "justify-center px-0" : ""
          }`}
        >
          <NavIcon name="tour" />
          {!collapsed ? "Take the tour" : null}
        </Link>
        <Link
          href="/settings"
          id="tour-settings"
          onClick={onNavigate}
          title={collapsed ? "Configure your workspace" : undefined}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            collapsed ? "justify-center px-0" : ""
          } ${
            isActive("/settings")
              ? "bg-signal-soft text-signal-strong"
              : "text-muted hover:bg-paper hover:text-ink"
          }`}
        >
          <span className={isActive("/settings") ? "text-signal" : ""}>
            <NavIcon name="settings" />
          </span>
          {!collapsed ? "Configure your workspace" : null}
        </Link>
      </div>

      {userEmail ? (
        <div
          className={`border-t border-line py-4 ${collapsed ? "px-3" : "px-4"}`}
        >
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full bg-signal-soft font-display text-sm font-semibold text-signal-strong"
                title={userEmail}
              >
                {userEmail.charAt(0).toUpperCase()}
              </span>
              <form action={signOut}>
                <button
                  type="submit"
                  title="Sign out"
                  className="rounded-lg p-2 text-muted transition-colors hover:bg-paper hover:text-ink"
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
                      d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                    />
                  </svg>
                </button>
              </form>
            </div>
          ) : (
            <>
              <p className="max-w-full truncate font-mono text-[11px] text-faint">
                {userEmail}
              </p>
              <form action={signOut} className="mt-2">
                <button
                  type="submit"
                  className="fi-btn-ghost w-full justify-start px-0"
                >
                  Sign out
                </button>
              </form>
            </>
          )}
        </div>
      ) : null}
    </>
  );
}

function CollapseButton({
  collapsed,
  onClick,
}: {
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      onClick={onClick}
      className="rounded-lg p-2 text-faint transition-colors hover:bg-paper hover:text-ink"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-4 w-4"
      >
        {collapsed ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5 8.25 12l7.5-7.5"
          />
        )}
      </svg>
    </button>
  );
}

export default function AppShell({
  userEmail,
  children,
}: {
  userEmail: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try {
        window.localStorage.setItem("fi-sidebar-collapsed", c ? "0" : "1");
      } catch {
        // ignore storage failures
      }
      return !c;
    });
  };

  if (!userEmail) {
    return (
      <>
        <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur lg:hidden">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
            <Link href="/login">
              <Wordmark className="scale-90" />
            </Link>
          </div>
        </header>
        <main className="min-h-screen bg-paper">{children}</main>
      </>
    );
  }

  return (
    <>
      <aside
        id="tour-sidebar"
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line bg-surface lg:flex ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <div
          className={`flex items-center border-b border-line py-4 ${
            collapsed ? "justify-center px-2" : "justify-between px-4"
          }`}
        >
          <Link href="/dashboard" title={collapsed ? "Dashboard" : undefined}>
            {collapsed ? (
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-signal-soft">
                <Waveform active className="h-4 w-4" />
              </span>
            ) : (
              <Wordmark className="scale-90" />
            )}
          </Link>
          {!collapsed ? <CollapseButton collapsed={collapsed} onClick={toggleCollapsed} /> : null}
        </div>
        {collapsed ? (
          <div className="flex justify-center border-b border-line py-2">
            <CollapseButton collapsed={collapsed} onClick={toggleCollapsed} />
          </div>
        ) : null}
        <SidebarNav
          pathname={pathname}
          collapsed={collapsed}
          userEmail={userEmail}
        />
      </aside>

      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/dashboard" onClick={() => setDrawerOpen(false)}>
            <Wordmark className="scale-90" />
          </Link>
          <button
            type="button"
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((o) => !o)}
            className="rounded-lg border border-line-strong p-2 text-ink transition-colors hover:bg-paper"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
            >
              {drawerOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              )}
            </svg>
          </button>
        </div>
      </header>

      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" aria-hidden>
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-line bg-surface">
            <div className="px-5 pb-5 pt-6">
              <Wordmark />
            </div>
            <SidebarNav
              pathname={pathname}
              userEmail={userEmail}
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <main
        className={`min-h-screen bg-paper ${collapsed ? "lg:pl-16" : "lg:pl-60"}`}
      >
        {children}
      </main>
    </>
  );
}