import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalPath?: string;
  type?: "website" | "article";
  keywords?: string;
}

/**
 * SEOHead component for setting page-specific meta tags
 * Updates document title and meta tags dynamically
 */
export function SEOHead({
  title,
  description,
  canonicalPath = "",
  type = "website",
  keywords,
}: SEOHeadProps) {
  const baseUrl = "https://www.pourhub.com.au";
  const fullUrl = `${baseUrl}${canonicalPath}`;

  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (selector: string, content: string, attrName = "content") => {
      let element = document.querySelector(selector) as HTMLMetaElement;
      if (element) {
        element.setAttribute(attrName, content);
      }
    };

    const updateOrCreateMetaTag = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let element = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (element) {
        element.content = content;
      } else {
        element = document.createElement("meta");
        element.setAttribute(attr, name);
        element.content = content;
        document.head.appendChild(element);
      }
    };

    // Update standard meta tags
    updateOrCreateMetaTag("description", description);
    if (keywords) {
      updateOrCreateMetaTag("keywords", keywords);
    }

    // Update Open Graph tags
    updateOrCreateMetaTag("og:title", title, true);
    updateOrCreateMetaTag("og:description", description, true);
    updateOrCreateMetaTag("og:url", fullUrl, true);
    updateOrCreateMetaTag("og:type", type, true);

    // Update Twitter tags
    updateOrCreateMetaTag("twitter:title", title, true);
    updateOrCreateMetaTag("twitter:description", description, true);

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonical) {
      canonical.href = fullUrl;
    } else {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      canonical.href = fullUrl;
      document.head.appendChild(canonical);
    }

    // Cleanup function to restore defaults when component unmounts
    return () => {
      document.title = "PourHub - Concreting Business Management Software";
    };
  }, [title, description, fullUrl, type, keywords]);

  return null;
}
