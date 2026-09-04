import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// robots.txt generowany przez Next (konwencja App Routera).
//
// Blokujemy wszystko, co jest ulotne albo prywatne. Pokoje żyją kilkadziesiąt minut
// i mają 4-znakowe kody, więc wpuszczenie ich do indeksu dałoby wyszukiwarkom listę
// aktywnych kodów, a użytkownikom wyniki prowadzące do pokoi, których już nie ma.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/pokoj/", "/p/", "/~offline"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
