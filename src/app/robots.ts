import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://resumelens.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing"],
        disallow: [
          "/dashboard/",
          "/api/",
          "/auth/",
          "/reset-password",
          "/forgot-password",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
