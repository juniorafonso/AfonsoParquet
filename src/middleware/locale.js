const fs = require('fs');
const path = require('path');

// Load translation files
const translations = {
  fr: JSON.parse(fs.readFileSync(path.join(__dirname, '../locales/fr.json'), 'utf8')),
  en: JSON.parse(fs.readFileSync(path.join(__dirname, '../locales/en.json'), 'utf8'))
};

const SUPPORTED_LOCALES = ['fr', 'en'];
const DEFAULT_LOCALE = 'fr';

/**
 * Get nested translation value from JSON by dot notation
 * Example: t('site.title') => translations[locale].site.title
 */
function getTranslation(locale, key, fallback) {
  const keys = key.split('.');
  let value = translations[locale];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to default locale if key not found
      if (locale !== DEFAULT_LOCALE) {
        return getTranslation(DEFAULT_LOCALE, key, fallback);
      }
      return fallback || key;
    }
  }
  
  return value;
}

/**
 * Locale middleware
 * - Detects locale from URL path prefix (/fr, /en)
 * - Sets res.locals.locale and res.locals.t() helper
 * - Provides URL helpers for canonical/hreflang
 */
function localeMiddleware(req, res, next) {
  // Extract locale from path (e.g., /fr/about => 'fr')
  const pathParts = req.path.split('/').filter(Boolean);
  let locale = DEFAULT_LOCALE;
  let pathWithoutLocale = req.path;
  
  if (pathParts.length > 0 && SUPPORTED_LOCALES.includes(pathParts[0])) {
    locale = pathParts[0];
    pathWithoutLocale = '/' + pathParts.slice(1).join('/');
    if (pathWithoutLocale === '/') pathWithoutLocale = '';
  }
  
  // Set locale in response locals
  res.locals.locale = locale;
  res.locals.otherLocale = locale === 'fr' ? 'en' : 'fr';
  
  // Translation helper function
  res.locals.t = (key, fallback) => getTranslation(locale, key, fallback);
  
  // URL helper - adds locale prefix
  res.locals.url = (path) => {
    path = path || '';
    if (!path.startsWith('/')) path = '/' + path;
    return `/${locale}${path}`;
  };
  
  // Alternate URL (for language switcher and hreflang)
  res.locals.alternateUrl = (targetLocale, path) => {
    targetLocale = targetLocale || res.locals.otherLocale;
    path = path || pathWithoutLocale;
    if (!path.startsWith('/')) path = '/' + path;
    return `/${targetLocale}${path}`;
  };
  
  // Canonical URL (current page without locale prefix)
  res.locals.canonicalPath = pathWithoutLocale || '/';
  
  // Full URL helpers (for Open Graph, canonical, etc.)
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  res.locals.fullUrl = (path) => {
    return `${baseUrl}${res.locals.url(path)}`;
  };
  
  res.locals.alternateFullUrl = (targetLocale, path) => {
    return `${baseUrl}${res.locals.alternateUrl(targetLocale, path)}`;
  };
  
  // Store in request for route handlers
  req.locale = locale;
  req.pathWithoutLocale = pathWithoutLocale;
  
  next();
}

/**
 * Root redirect middleware
 * Redirects / to /fr (default locale)
 */
function rootRedirect(req, res, next) {
  if (req.path === '/') {
    return res.redirect(301, `/${DEFAULT_LOCALE}`);
  }
  next();
}

module.exports = {
  localeMiddleware,
  rootRedirect,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE
};
