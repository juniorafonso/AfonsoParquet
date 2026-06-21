const { Project } = require('../models');
const seoHelpers = require('../helpers/seo');

/**
 * Public Pages Controller
 */

// Home page
exports.home = async (req, res) => {
  try {
    // Get featured projects (first 3 published projects)
    const projects = await Project.findAll({
      where: { published: true },
      order: [['order', 'ASC']],
      limit: 3
    });
    
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const jsonLd = [
      seoHelpers.generateOrganizationSchema(req.locale, baseUrl),
      seoHelpers.generateWebSiteSchema(req.locale, baseUrl),
      seoHelpers.generateBreadcrumbSchema([
        { name: res.locals.t('nav.home'), url: res.locals.url('/') }
      ], baseUrl)
    ];
    
    res.render('home', {
      projects,
      pageTitle: '',
      pageDescription: res.locals.t('site.description'),
      pageType: 'website',
      jsonLd
    });
  } catch (err) {
    console.error('Error loading home page:', err);
    res.status(500).send('Error loading page');
  }
};

// Services page
exports.services = (req, res) => {
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  const jsonLd = [
    seoHelpers.generateBreadcrumbSchema([
      { name: res.locals.t('nav.home'), url: res.locals.url('/') },
      { name: res.locals.t('nav.services'), url: res.locals.url('/services') }
    ], baseUrl)
  ];
  
  res.render('services', {
    pageTitle: res.locals.t('services.title'),
    pageDescription: res.locals.t('services.subtitle'),
    pageType: 'website',
    jsonLd
  });
};

// Réalisations (portfolio) list page
exports.realisations = async (req, res) => {
  try {
    const projects = await Project.findAll({
      where: { published: true },
      order: [['order', 'ASC']]
    });
    
    const pageDescription = req.locale === 'fr'
      ? 'Découvrez nos réalisations de rénovation de parquet à Genève et Suisse romande.'
      : 'Discover our parquet renovation projects in Geneva and French-speaking Switzerland.';
    
    res.render('realisations', {
      projects,
      pageTitle: res.locals.t('nav.realisations'),
      pageDescription,
      pageType: 'website'
    });
  } catch (err) {
    console.error('Error loading realisations:', err);
    res.status(500).send('Error loading page');
  }
};

// Réalisation detail page
exports.realisationDetail = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    
    if (!project || !project.published) {
      return res.status(404).send('Project not found');
    }
    
    const pageTitle = req.locale === 'fr' ? project.titleFr : project.titleEn;
    const pageDescription = (req.locale === 'fr' ? project.descFr : project.descEn).substring(0, 160);
    const ogImage = project.imagePath ? process.env.BASE_URL + project.imagePath : undefined;
    
    res.render('realisation-detail', {
      project,
      pageTitle,
      pageDescription,
      pageType: 'article',
      ogImage
    });
  } catch (err) {
    console.error('Error loading realisation detail:', err);
    res.status(500).send('Error loading page');
  }
};

// About page
exports.about = (req, res) => {
  const pageDescription = req.locale === 'fr' 
    ? 'Découvrez Afonso Parquet, spécialiste de la rénovation de parquet à Genève et Suisse romande.'
    : 'Discover Afonso Parquet, parquet renovation specialist in Geneva and French-speaking Switzerland.';
  
  res.render('about', {
    pageTitle: res.locals.t('nav.about'),
    pageDescription,
    pageType: 'website'
  });
};

// Contact page
exports.contact = (req, res) => {
  const pageDescription = req.locale === 'fr'
    ? 'Contactez Afonso Parquet pour vos projets de rénovation de parquet à Genève.'
    : 'Contact Afonso Parquet for your parquet renovation projects in Geneva.';
  
  res.render('contact', {
    pageTitle: res.locals.t('nav.contact'),
    pageDescription,
    pageType: 'website'
  });
};

// Legal page
exports.legal = (req, res) => {
  res.render('legal', {
    pageTitle: res.locals.t('legal.title'),
    pageDescription: '',
    noindex: true
  });
};

// Privacy page
exports.privacy = (req, res) => {
  res.render('privacy', {
    pageTitle: res.locals.t('legal.privacy'),
    pageDescription: '',
    noindex: true
  });
};
