const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const devisController = require('../controllers/devisController');
const { upload } = require('../middleware/upload');
const { verifyTurnstile } = require('../middleware/turnstile');
const { checkHoneypot, checkTimeTrap } = require('../middleware/antiSpam');
const rateLimit = require('express-rate-limit');

// Rate limiter for devis submissions (3 per 15 minutes per IP)
const devisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: 'Too many devis requests, please try again later.'
});

// Home
router.get('/:locale(fr|en)', publicController.home);

// Services
router.get('/:locale(fr|en)/services', publicController.services);

// Réalisations (Portfolio)
router.get('/:locale(fr|en)/realisations', publicController.realisations);
router.get('/:locale(fr|en)/realisations/:id', publicController.realisationDetail);

// About
router.get('/:locale(fr|en)/about', publicController.about);

// Contact
router.get('/:locale(fr|en)/contact', publicController.contact);

// Legal
router.get('/:locale(fr|en)/legal', publicController.legal);

// Privacy
router.get('/:locale(fr|en)/privacy', publicController.privacy);

// Devis - Step 1 (Project details)
router.get('/:locale(fr|en)/devis', devisController.step1);
router.post(
  '/:locale(fr|en)/devis/step1',
  devisLimiter,
  upload.array('files', 12),
  checkHoneypot,
  checkTimeTrap,
  verifyTurnstile,
  devisController.submitStep1
);

// Devis - Step 2 (Contact details)
router.get('/:locale(fr|en)/devis/step2', devisController.step2);
router.post(
  '/:locale(fr|en)/devis/submit',
  devisLimiter,
  checkHoneypot,
  checkTimeTrap,
  verifyTurnstile,
  devisController.submitFinal
);

// Devis - Success
router.get('/:locale(fr|en)/devis/success', devisController.success);

module.exports = router;
