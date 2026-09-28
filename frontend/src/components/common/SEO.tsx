import { useEffect } from 'react';

export interface SEOProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: 'website' | 'product' | 'article';
  ogUrl?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  schema?: Record<string, any> | Array<Record<string, any>>;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonicalUrl,
  noIndex = false,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = 'website',
  ogUrl,
  twitterCard = 'summary_large_image',
  twitterTitle,
  twitterDescription,
  twitterImage,
  schema,
}) => {
  useEffect(() => {
    // 1. Document Title
    const baseTitle = 'Nexus Commerce';
    const computedTitle = title ? `${title} | ${baseTitle}` : `${baseTitle} | Next-Generation AI E-Commerce`;
    document.title = computedTitle;

    // Helper to create or update <meta> tags
    const setMeta = (attrKey: 'name' | 'property', attrVal: string, contentVal?: string) => {
      let el = document.querySelector(`meta[${attrKey}="${attrVal}"]`);
      if (!contentVal) {
        if (el) el.remove();
        return;
      }
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrKey, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', contentVal);
    };

    // 2. Meta Description
    setMeta('name', 'description', description);

    // 3. Robots Meta (noindex for private pages, index, follow for public)
    const robotsContent = noIndex ? 'noindex, nofollow' : 'index, follow';
    setMeta('name', 'robots', robotsContent);

    // 4. Canonical URL
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (canonicalUrl) {
      if (!linkCanonical) {
        linkCanonical = document.createElement('link');
        linkCanonical.setAttribute('rel', 'canonical');
        document.head.appendChild(linkCanonical);
      }
      linkCanonical.setAttribute('href', canonicalUrl);
    } else if (linkCanonical) {
      linkCanonical.remove();
    }

    // 5. Open Graph Meta
    setMeta('property', 'og:site_name', baseTitle);
    setMeta('property', 'og:type', ogType);
    setMeta('property', 'og:title', ogTitle || computedTitle);
    setMeta('property', 'og:description', ogDescription || description);
    setMeta('property', 'og:url', ogUrl || canonicalUrl || window.location.href);
    setMeta('property', 'og:image', ogImage);

    // 6. Twitter Card Meta
    setMeta('name', 'twitter:card', twitterCard);
    setMeta('name', 'twitter:title', twitterTitle || ogTitle || computedTitle);
    setMeta('name', 'twitter:description', twitterDescription || ogDescription || description);
    setMeta('name', 'twitter:image', twitterImage || ogImage);

    // 7. Structured Data (JSON-LD)
    const scriptId = 'jsonld-structured-data';
    let jsonLdScript = document.getElementById(scriptId);
    if (schema) {
      if (!jsonLdScript) {
        jsonLdScript = document.createElement('script');
        jsonLdScript.id = scriptId;
        jsonLdScript.setAttribute('type', 'application/ld+json');
        document.head.appendChild(jsonLdScript);
      }
      jsonLdScript.textContent = JSON.stringify(schema);
    } else if (jsonLdScript) {
      jsonLdScript.remove();
    }

    // Cleanup on unmount / route transition
    return () => {
      const activeScript = document.getElementById(scriptId);
      if (activeScript) {
        activeScript.remove();
      }
    };
  }, [
    title,
    description,
    canonicalUrl,
    noIndex,
    ogTitle,
    ogDescription,
    ogImage,
    ogType,
    ogUrl,
    twitterCard,
    twitterTitle,
    twitterDescription,
    twitterImage,
    schema,
  ]);

  return null;
};
