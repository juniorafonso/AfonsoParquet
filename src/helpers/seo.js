/**
 * SEO helper functions for generating structured data (JSON-LD)
 * and meta tags
 */

const SUPPORTED_LOCALES = ['fr', 'en'];

/**
 * Generate JSON-LD for Organization schema
 * Used on homepage
 */
function generateOrganizationSchema(locale, baseUrl) {
  const name = 'Afonso Parquet';
  const description = locale === 'fr' 
    ? 'Spécialiste de la rénovation de parquet à Genève et Suisse romande'
    : 'Parquet renovation specialist in Geneva and French-speaking Switzerland';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    '@id': `${baseUrl}/#organization`,
    name,
    description,
    url: baseUrl,
    logo: `${baseUrl}/images/logo.png`,
    image: `${baseUrl}/images/og-image.jpg`,
    telephone: process.env.COMPANY_PHONE || '',
    email: process.env.ADMIN_EMAIL || '',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Genève',
      addressRegion: 'Genève',
      addressCountry: 'CH'
    },
    areaServed: [
      {
        '@type': 'City',
        name: 'Genève',
        '@id': 'https://www.wikidata.org/wiki/Q71'
      },
      {
        '@type': 'State',
        name: 'Vaud',
        '@id': 'https://www.wikidata.org/wiki/Q12771'
      },
      {
        '@type': 'State',
        name: 'Valais',
        '@id': 'https://www.wikidata.org/wiki/Q834'
      },
      {
        '@type': 'State',
        name: 'Neuchâtel',
        '@id': 'https://www.wikidata.org/wiki/Q12713'
      },
      {
        '@type': 'State',
        name: 'Fribourg',
        '@id': 'https://www.wikidata.org/wiki/Q12640'
      },
      {
        '@type': 'State',
        name: 'Jura',
        '@id': 'https://www.wikidata.org/wiki/Q11943'
      }
    ],
    priceRange: '$$',
    sameAs: [
      process.env.FACEBOOK_URL || '',
      process.env.INSTAGRAM_URL || ''
    ].filter(Boolean)
  };
}

/**
 * Generate JSON-LD for Service schema
 * Used on services pages
 */
function generateServiceSchema(serviceName, serviceDesc, locale, baseUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: serviceName,
    description: serviceDesc,
    provider: {
      '@id': `${baseUrl}/#organization`
    },
    areaServed: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: '46.2044',
        longitude: '6.1432'
      },
      geoRadius: '50000' // 50km around Geneva
    }
  };
}

/**
 * Generate JSON-LD for BreadcrumbList schema
 * Used on all pages for navigation breadcrumbs
 */
function generateBreadcrumbSchema(breadcrumbs, baseUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${baseUrl}${crumb.url}`
    }))
  };
}

/**
 * Generate JSON-LD for WebSite schema with SearchAction
 * Used on homepage
 */
function generateWebSiteSchema(locale, baseUrl) {
  const name = locale === 'fr' 
    ? 'Afonso Parquet - Rénovation de Parquet à Genève'
    : 'Afonso Parquet - Parquet Renovation in Geneva';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    url: baseUrl,
    name,
    publisher: {
      '@id': `${baseUrl}/#organization`
    },
    inLanguage: locale === 'fr' ? 'fr-CH' : 'en-CH'
  };
}

/**
 * Generate hreflang links for multilingual pages
 */
function generateHreflangLinks(currentPath, baseUrl) {
  const links = [];
  
  // Add each supported locale
  SUPPORTED_LOCALES.forEach(locale => {
    links.push({
      rel: 'alternate',
      hreflang: locale === 'fr' ? 'fr-CH' : 'en-CH',
      href: `${baseUrl}/${locale}${currentPath}`
    });
  });
  
  // Add x-default (default to French)
  links.push({
    rel: 'alternate',
    hreflang: 'x-default',
    href: `${baseUrl}/fr${currentPath}`
  });
  
  return links;
}

/**
 * Generate canonical URL
 */
function generateCanonicalUrl(locale, currentPath, baseUrl) {
  return `${baseUrl}/${locale}${currentPath}`;
}

module.exports = {
  generateOrganizationSchema,
  generateServiceSchema,
  generateBreadcrumbSchema,
  generateWebSiteSchema,
  generateHreflangLinks,
  generateCanonicalUrl
};
