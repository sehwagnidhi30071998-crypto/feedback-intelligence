import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import AppShell from "@/components/AppShell";
import { getCurrentUser } from "@/lib/supabase-server";
import { siteUrl } from "@/lib/seo";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Feedback Intelligence — Turn meeting talk into tracked work",
    template: "%s · Feedback Intelligence",
  },
  description:
    "Extract actionable product feedback from meeting transcripts and turn approved items into Jira tickets.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Feedback Intelligence",
    title: "Feedback Intelligence — Turn meeting talk into tracked work",
    description:
      "Extract actionable product feedback from meeting transcripts and turn approved items into Jira tickets.",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "Feedback Intelligence — Turn meeting talk into tracked work",
    description:
      "Extract actionable product feedback from meeting transcripts and turn approved items into Jira tickets.",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppShell userEmail={user?.email ?? null}>{children}</AppShell>
      </body>
    </html>
  );
}