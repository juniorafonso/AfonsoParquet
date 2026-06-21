const express = require('express');
const router = express.Router();
const { Project } = require('../models');

const SUPPORTED_LOCALES = ['fr', 'en'];

/**
 * Generate XML sitemap dynamically
 * Includes:
 * - Static pages (home, services, about, contact, legal, privacy) in both languages
 * - Published portfolio projects in both languages
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    
    // Static pages (priority and changefreq based on page type)
    const staticPages = [
      { path: '', priority: 1.0, changefreq: 'weekly' },       // Home
      { path: '/services', priority: 0.9, changefreq: 'monthly' },
      { path: '/realisations', priority: 0.8, changefreq: 'weekly' },
      { path: '/about', priority: 0.7, changefreq: 'monthly' },
      { path: '/devis', priority: 0.9, changefreq: 'monthly' },
      { path: '/contact', priority: 0.7, changefreq: 'monthly' },
      { path: '/legal', priority: 0.3, changefreq: 'yearly' },
      { path: '/privacy', priority: 0.3, changefreq: 'yearly' }
    ];
    
    // Fetch published projects
    const projects = await Project.findAll({
      where: { published: true },
      order: [['order', 'ASC']],
      attributes: ['id', 'updatedAt']
    });
    
    // Build XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Add static pages for each locale
    staticPages.forEach(page => {
      SUPPORTED_LOCALES.forEach(locale => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/${locale}${page.path}</loc>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += '  </url>\n';
      });
    });
    
    // Add project detail pages for each locale
    projects.forEach(project => {
      SUPPORTED_LOCALES.forEach(locale => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/${locale}/realisations/${project.id}</loc>\n`;
        xml += `    <lastmod>${project.updatedAt.toISOString().split('T')[0]}</lastmod>\n`;
        xml += `    <changefreq>monthly</changefreq>\n`;
        xml += `    <priority>0.6</priority>\n`;
        xml += '  </url>\n';
      });
    });
    
    xml += '</urlset>';
    
    // Set response headers
    res.set('Content-Type', 'application/xml');
    res.send(xml);
    
  } catch (err) {
    console.error('Error generating sitemap:', err);
    res.status(500).send('Error generating sitemap');
  }
});

module.exports = router;
