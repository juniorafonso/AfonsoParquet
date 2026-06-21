require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const rateLimit = require('express-rate-limit');
const ejsMate = require('ejs-mate');

const app = express();

// Import sequelize for session store
const { sequelize } = require('./models');

// Trust proxy (behind Traefik/NPM)
app.set('trust proxy', 1);

// View engine
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Security headers (Helmet with CSP)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // For inline scripts with nonce (will be refined later)
        "https://www.googletagmanager.com",
        "https://www.google-analytics.com",
        "https://connect.facebook.net",
        "https://challenges.cloudflare.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "https://www.google-analytics.com",
        "https://www.facebook.com"
      ],
      fontSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com"
      ],
      connectSrc: [
        "'self'",
        "https://www.google-analytics.com",
        "https://www.facebook.com"
      ],
      frameSrc: [
        "https://challenges.cloudflare.com"
      ],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Remove X-Powered-By
app.disable('x-powered-by');

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration with Sequelize store
const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: 'sessions',
  checkExpirationInterval: 15 * 60 * 1000, // Clean up expired sessions every 15 minutes
  expiration: 24 * 60 * 60 * 1000 // 24 hours
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret',
  name: 'sid',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Create sessions table
sessionStore.sync();

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use(globalLimiter);

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Make environment variables available to views
app.locals.env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
  GA4_MEASUREMENT_ID: process.env.GA4_MEASUREMENT_ID || '',
  META_PIXEL_ID: process.env.META_PIXEL_ID || '',
  TURNSTILE_SITE_KEY: process.env.TURNSTILE_SITE_KEY || '',
  INSTAGRAM_URL: process.env.INSTAGRAM_URL || '',
  FACEBOOK_URL: process.env.FACEBOOK_URL || '',
  GOOGLE_SITE_VERIFICATION: process.env.GOOGLE_SITE_VERIFICATION || '',
  BING_SITE_VERIFICATION: process.env.BING_SITE_VERIFICATION || '',
  COMPANY_PHONE: process.env.COMPANY_PHONE || ''
};

// Locale middleware
const { localeMiddleware, rootRedirect } = require('./middleware/locale');
app.use(rootRedirect); // Redirect / to /fr
app.use(localeMiddleware);

// Sitemap route
app.use(require('./routes/sitemap'));

// Public routes
app.use(require('./routes/index'));

// Admin routes
app.use('/admin', require('./routes/admin'));

// 404 handler
app.use((req, res) => {
  res.status(404).send('<h1>404 - Page non trouvée</h1>');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Une erreur est survenue' 
    : err.message;
  
  res.status(err.status || 500).send(`<h1>Erreur</h1><p>${message}</p>`);
});

module.exports = app;
