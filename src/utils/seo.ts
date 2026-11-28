/**
 * WE THE LEADER – Comprehensive SEO & Structured Data Management
 * Handles dynamic document titles, meta descriptions, canonical URLs,
 * Open Graph / Twitter Card tags, and JSON-LD schemas.
 */

export interface PageSeoConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  noindex?: boolean;
  breadcrumbs?: Array<{ name: string; url: string }>;
  schemas?: object[];
}

export const BASE_SITE_URL = 'https://wetheleader.online';
export const DEFAULT_OG_IMAGE = `${BASE_SITE_URL}/we-the-leader-logo.jpg`;
export const APA_MANIKANDAKUMAR_PHOTO = `${BASE_SITE_URL}/apa-manikandakumar.jpg`;

/**
 * Standard structured data for We The Leader Organisation
 */
export function getOrganizationSchema(socialLinks: string[] = []): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${BASE_SITE_URL}/#organization`,
    name: 'We The Leader',
    alternateName: [
      'We The Leader Kinathukadavu',
      'நாம் தி லீடர்',
      'நாம் தி லீடர் கிணத்துக்கடவு'
    ],
    url: BASE_SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${BASE_SITE_URL}/logo.svg`,
      width: 512,
      height: 512,
      caption: 'We The Leader Official Logo'
    },
    image: DEFAULT_OG_IMAGE,
    description:
      'We The Leader is a grassroots youth leadership, community development and social service organisation based in Kinathukadavu, Coimbatore District, Tamil Nadu, India.',
    founder: {
      '@type': 'Person',
      name: 'APA Manikandakumar',
      alternateName: 'திரு. APA. மணிகண்டகுமார்',
      jobTitle: 'Founder & Leader',
      image: APA_MANIKANDAKUMAR_PHOTO
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Kinathukadavu',
      addressLocality: 'Kinathukadavu',
      addressRegion: 'Tamil Nadu',
      postalCode: '642109',
      addressCountry: 'IN'
    },
    areaServed: [
      {
        '@type': 'AdministrativeArea',
        name: 'Kinathukadavu'
      },
      {
        '@type': 'AdministrativeArea',
        name: 'Coimbatore'
      },
      {
        '@type': 'AdministrativeArea',
        name: 'Pollachi'
      },
      {
        '@type': 'AdministrativeArea',
        name: 'Tamil Nadu'
      }
    ],
    knowsLanguage: ['ta', 'en'],
    sameAs: socialLinks.length > 0 ? socialLinks : [
      'https://facebook.com/wetheleader',
      'https://instagram.com/wetheleader',
      'https://wa.me/919750855623'
    ]
  };
}

/**
 * WebSite Schema for SearchAction & Sitelinks
 */
export function getWebSiteSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${BASE_SITE_URL}/#website`,
    url: BASE_SITE_URL,
    name: 'We The Leader Kinathukadavu',
    alternateName: 'We The Leader',
    inLanguage: ['en-IN', 'ta-IN'],
    description:
      'Official portal of We The Leader - Youth Leadership and Social Service Organisation in Kinathukadavu, Coimbatore, Tamil Nadu.'
  };
}

/**
 * Verified Person Schema for APA Manikandakumar
 */
export function getPersonSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${BASE_SITE_URL}/about#person`,
    name: 'APA Manikandakumar',
    alternateName: ['திரு. APA. மணிகண்டகுமார்', 'APA Manikanda Kumar'],
    jobTitle: 'Community Leader & Social Worker',
    description:
      'APA Manikandakumar is the prominent community leader and founder of We The Leader, driving youth empowerment, social development, and community welfare initiatives in Kinathukadavu, Pollachi, and Coimbatore.',
    image: APA_MANIKANDAKUMAR_PHOTO,
    worksFor: {
      '@type': 'Organization',
      name: 'We The Leader',
      url: BASE_SITE_URL
    },
    nationality: {
      '@type': 'Country',
      name: 'India'
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Kinathukadavu',
      addressRegion: 'Tamil Nadu',
      postalCode: '642109',
      addressCountry: 'IN'
    }
  };
}

/**
 * Breadcrumbs Schema
 */
export function getBreadcrumbsSchema(items: Array<{ name: string; url: string }>): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${BASE_SITE_URL}${item.url}`
    }))
  };
}

/**
 * Updates DOM head elements with the given SEO configuration dynamically
 */
export function applyPageSeo(config: PageSeoConfig): void {
  if (typeof document === 'undefined') return;

  // 1. Document Title
  document.title = config.title;

  // Helper to get or create a meta tag
  const setMeta = (name: string, content: string, isProperty = false) => {
    const attr = isProperty ? 'property' : 'name';
    let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  // 2. Standard Meta Tags
  setMeta('description', config.description);
  if (config.keywords && config.keywords.length > 0) {
    setMeta('keywords', config.keywords.join(', '));
  }

  // 3. Robots directive
  const robotsContent = config.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  setMeta('robots', robotsContent);
  setMeta('googlebot', robotsContent);

  // 4. Canonical Link
  let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', config.canonicalUrl);

  // 5. Open Graph Meta Tags
  setMeta('og:title', config.title, true);
  setMeta('og:description', config.description, true);
  setMeta('og:url', config.canonicalUrl, true);
  setMeta('og:type', config.ogType || 'website', true);
  setMeta('og:site_name', 'We The Leader', true);
  setMeta('og:locale', 'ta_IN', true);
  setMeta('og:locale:alternate', 'en_IN', true);
  setMeta('og:image', config.ogImage || DEFAULT_OG_IMAGE, true);
  setMeta('og:image:width', '1200', true);
  setMeta('og:image:height', '630', true);
  setMeta('og:image:alt', config.title, true);

  // 6. Twitter / X Card Meta Tags
  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', config.title);
  setMeta('twitter:description', config.description);
  setMeta('twitter:image', config.ogImage || DEFAULT_OG_IMAGE);

  // 7. Inject JSON-LD Schema
  const existingSchemas = document.querySelectorAll('script[data-wtl-schema="true"]');
  existingSchemas.forEach(el => el.remove());

  const schemasToInject: object[] = [];

  // Always include basic breadcrumbs if provided
  if (config.breadcrumbs && config.breadcrumbs.length > 0) {
    schemasToInject.push(getBreadcrumbsSchema(config.breadcrumbs));
  }

  // Include custom schemas
  if (config.schemas && config.schemas.length > 0) {
    schemasToInject.push(...config.schemas);
  }

  schemasToInject.forEach(schemaObj => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-wtl-schema', 'true');
    script.textContent = JSON.stringify(schemaObj);
    document.head.appendChild(script);
  });
}
