import { useEffect } from "react";
import type { Article } from "@/data/articles";

interface ArticleSchemaProps {
  article: Article;
}

export function ArticleSchema({ article }: ArticleSchemaProps) {
  const baseUrl = "https://www.pourhub.com.au";

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = `article-schema-${article.slug}`;
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.metaDescription,
      author: { "@type": "Organization", name: "PourHub" },
      publisher: {
        "@type": "Organization",
        name: "PourHub",
        url: baseUrl,
      },
      datePublished: article.publishDate,
      dateModified: article.lastUpdated,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${baseUrl}/articles/${article.slug}`,
      },
    });
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById(`article-schema-${article.slug}`);
      if (existing) existing.remove();
    };
  }, [article]);

  return null;
}
