const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, redirectIfAuthenticated } = require('../middleware/auth');
const { DevisMedia } = require('../models');
const path = require('path');
const fs = require('fs');

// Login routes (public)
router.get('/login', redirectIfAuthenticated, adminController.loginForm);
router.post('/login', redirectIfAuthenticated, adminController.login);

// Logout
router.get('/logout', adminController.logout);

// Protected routes (require authentication)
router.use(requireAuth);

// Dashboard
router.get('/dashboard', adminController.dashboard);

// Devis
router.get('/devis/:id', adminController.devisDetail);
router.post('/devis/:id/status', adminController.updateDevisStatus);

// Media serving (protected)
router.get('/media/:id', async (req, res) => {
  try {
    const media = await DevisMedia.findByPk(req.params.id);
    
    if (!media) {
      return res.status(404).send('Media not found');
    }
    
    const filePath = path.join(__dirname, '../../', media.path);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
    }
    
    // Set content type
    res.contentType(media.mime);
    
    // Stream file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Media serving error:', error);
    res.status(500).send('Internal server error');
  }
});

// Projects
router.get('/projects', adminController.projectsList);
router.get('/projects/new', adminController.projectNewForm);
router.post('/projects', adminController.projectCreate);
router.get('/projects/:id/edit', adminController.projectEditForm);
router.post('/projects/:id', adminController.projectUpdate);
router.post('/projects/:id/delete', adminController.projectDelete);

// Change Password
router.get('/change-password', adminController.changePasswordForm);
router.post('/change-password', adminController.changePassword);

module.exports = router;
