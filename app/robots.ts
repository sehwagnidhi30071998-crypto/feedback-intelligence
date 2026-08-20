import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/login",
          "/signup",
          "/dashboard",
          "/meetings",
          "/feedback",
          "/jira",
          "/settings",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}