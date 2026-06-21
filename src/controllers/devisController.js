const { body, validationResult } = require('express-validator');
const { DevisRequest, DevisMedia } = require('../models');
const { validateUploadedFiles } = require('../middleware/upload');
const { sendAdminNotification, sendClientConfirmation } = require('../services/mailer');
const fs = require('fs').promises;

/**
 * Devis Controller
 * Handles 2-step wizard quote request flow
 */

// GET Step 1 - Project details
exports.step1 = (req, res) => {
  res.render('devis/step1', {
    pageTitle: res.locals.t('devis.title'),
    pageDescription: res.locals.t('devis.subtitle'),
    pageType: 'website',
    formData: req.session.devisStep1 || {},
    errors: {}
  });
};

// POST Step 1 - Validate and store in session
exports.submitStep1 = [
  // Validation rules
  body('npa').notEmpty().withMessage('devis.errors.npa').isLength({ min: 4, max: 4 }).withMessage('devis.errors.npa'),
  body('serviceTypes').notEmpty().withMessage('devis.errors.serviceType'),
  
  async (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      // Return errors with form data
      return res.render('devis/step1', {
        pageTitle: res.locals.t('devis.title'),
        pageDescription: res.locals.t('devis.subtitle'),
        pageType: 'website',
        formData: req.body,
        errors: errors.mapped()
      });
    }
    
    // Handle file uploads if present
    let uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      // Validate uploaded files with magic-byte check
      const validation = await validateUploadedFiles(req.files);
      
      if (!validation.valid) {
        // Delete uploaded files
        for (const file of req.files) {
          await fs.unlink(file.path).catch(() => {});
        }
        
        return res.render('devis/step1', {
          pageTitle: res.locals.t('devis.title'),
          pageDescription: res.locals.t('devis.subtitle'),
          pageType: 'website',
          formData: req.body,
          errors: { files: { msg: validation.errors.join(', ') } }
        });
      }
      
      uploadedFiles = req.files;
    }
    
    // Store in session
    req.session.devisStep1 = {
      npa: req.body.npa,
      buildingType: req.body.buildingType || null,
      serviceTypes: Array.isArray(req.body.serviceTypes) ? req.body.serviceTypes : [req.body.serviceTypes],
      parquetType: req.body.parquetType || null,
      poseType: req.body.poseType || null,
      surfaceM2: req.body.surfaceM2 || null,
      delais: req.body.delais || null,
      message: req.body.message || null,
      externalLink: req.body.externalLink || null,
      uploadedFiles: uploadedFiles.map(f => ({
        path: f.path,
        filename: f.filename,
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size
      }))
    };
    
    // Redirect to step 2
    res.redirect(res.locals.url('/devis/step2'));
  }
];

// GET Step 2 - Contact details
exports.step2 = (req, res) => {
  // Check if step 1 completed
  if (!req.session.devisStep1) {
    return res.redirect(res.locals.url('/devis'));
  }
  
  res.render('devis/step2', {
    pageTitle: res.locals.t('devis.title'),
    pageDescription: res.locals.t('devis.subtitle'),
    pageType: 'website',
    formData: req.session.devisStep2 || {},
    errors: {}
  });
};

// POST Final submission
exports.submitFinal = [
  // Validation rules
  body('civilite').notEmpty().withMessage('devis.errors.required'),
  body('prenom').notEmpty().withMessage('devis.errors.required'),
  body('nom').notEmpty().withMessage('devis.errors.required'),
  body('email').isEmail().withMessage('devis.errors.email'),
  body('phone').notEmpty().withMessage('devis.errors.phone'),
  body('consent').equals('on').withMessage('devis.errors.required'),
  
  async (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.render('devis/step2', {
        pageTitle: res.locals.t('devis.title'),
        pageDescription: res.locals.t('devis.subtitle'),
        pageType: 'website',
        formData: req.body,
        errors: errors.mapped()
      });
    }
    
    // Check if step 1 completed
    if (!req.session.devisStep1) {
      return res.redirect(res.locals.url('/devis'));
    }
    
    try {
      const step1 = req.session.devisStep1;
      
      // Create DevisRequest
      const devisRequest = await DevisRequest.create({
        // Step 2 data (contact)
        civilite: req.body.civilite,
        prenom: req.body.prenom,
        nom: req.body.nom,
        email: req.body.email,
        phone: req.body.phone,
        
        // Step 1 data (project)
        npa: step1.npa,
        buildingType: step1.buildingType,
        serviceTypes: step1.serviceTypes.join(','),
        parquetType: step1.parquetType,
        poseType: step1.poseType,
        surfaceM2: step1.surfaceM2 ? parseFloat(step1.surfaceM2) : null,
        delais: step1.delais,
        message: step1.message,
        externalLink: step1.externalLink,
        
        // Metadata
        status: 'new',
        locale: req.locale
      });
      
      // Save uploaded files to DevisMedia
      if (step1.uploadedFiles && step1.uploadedFiles.length > 0) {
        const mediaRecords = step1.uploadedFiles.map(file => ({
          devisRequestId: devisRequest.id,
          type: file.mimetype.startsWith('image/') ? 'image' : 'video',
          path: `/uploads/${file.filename}`,
          mime: file.mimetype,
          size: file.size
        }));
        
        await DevisMedia.bulkCreate(mediaRecords);
      }
      Send emails (non-blocking - errors logged but don't stop flow)
      Promise.all([
        sendAdminNotification(devisRequest),
        sendClientConfirmation(devisRequest)
      ]).catch(err => {
        console.error('Email sending error:', err);
      });
      
      // TODO: Fire GA4 + Meta Pixel Lead event (already done in success page view
      // TODO: Fire GA4 + Meta Pixel Lead event (Phase 7 final step)
      
      // Clear session
      delete req.session.devisStep1;
      delete req.session.devisStep2;
      
      // Redirect to success page
      res.redirect(res.locals.url('/devis/success'));
      
    } catch (err) {
      console.error('Error creating devis request:', err);
      res.status(500).send('Error processing request');
    }
  }
];

// GET Success page
exports.success = (req, res) => {
  res.render('devis/success', {
    pageTitle: res.locals.t('devis.success.title'),
    pageDescription: '',
    pageType: 'website'
  });
};

module.exports = exports;
