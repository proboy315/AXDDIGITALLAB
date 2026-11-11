import { useEffect } from "react";
import type { Database } from "@/data/database";

export function SeoHead({ db }: { db: Database }) {
  useEffect(() => {
    document.title = db.site.seo.title;

    const setMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMeta("description", db.site.seo.description);
    setMeta("keywords", db.site.seo.keywords);
    setMeta("robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
    setMeta("theme-color", "#050B08");
    setMeta("og:title", db.site.seo.title, "property");
    setMeta("og:description", db.site.seo.description, "property");
    setMeta("og:image", db.site.seo.ogImage, "property");
    setMeta("og:url", db.site.seo.canonical, "property");
    setMeta("og:type", "website", "property");
    setMeta("og:site_name", db.site.name, "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", db.site.seo.title);
    setMeta("twitter:description", db.site.seo.description);
    setMeta("twitter:image", db.site.seo.ogImage);
    setMeta("twitter:site", db.site.seo.twitterHandle);

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = db.site.seo.canonical;

    // JSON-LD
    const ldId = "axd-jsonld";
    let ld = document.getElementById(ldId);
    if (!ld) {
      ld = document.createElement("script") as HTMLScriptElement;
      ld.id = ldId;
      (ld as HTMLScriptElement).type = "application/ld+json";
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": db.site.seo.schemaType,
      name: db.site.name,
      description: db.site.seo.description,
      url: db.site.seo.canonical,
      logo: db.site.seo.ogImage,
      address: { "@type": "PostalAddress", addressLocality: "Lahore", addressCountry: "PK" },
      aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "1200" },
      offers: db.products.slice(0, 5).map((p) => ({
        "@type": "Offer",
        name: p.title,
        price: p.price,
        priceCurrency: "PKR",
        availability: "https://schema.org/InStock",
      })),
    });
  }, [db]);

  return null;
}
