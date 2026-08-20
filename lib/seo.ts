import type { Metadata } from "next";

export function getSiteUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  return "https://feedback-intelligence-prod.vercel.app";
}

export const siteUrl = getSiteUrl();

export const noindex: Metadata = {
  robots: { index: false, follow: false },
};