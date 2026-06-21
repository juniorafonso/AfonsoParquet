const { body, validationResult } = require('express-validator');
const { User, DevisRequest, DevisMedia, Project } = require('../models');
const { Op } = require('sequelize');

/**
 * Admin Controller
 * Handles admin panel operations
 */

// GET /admin/login
exports.loginForm = (req, res) => {
  res.render('admin/login', {
    layout: false,
    error: null
  });
};

// POST /admin/login
exports.login = async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await User.findOne({ where: { username } });
    
    if (!user || !(await user.verifyPassword(password))) {
      return res.render('admin/login', {
        layout: false,
        error: 'Invalid username or password'
      });
    }
    
    // Regenerate session to prevent fixation attacks
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error:', err);
        return res.status(500).send('Internal server error');
      }
      
      req.session.userId = user.id;
      req.session.username = user.username;
      
      const returnTo = req.session.returnTo || '/admin/dashboard';
      delete req.session.returnTo;
      
      // IMPORTANT: Save session before redirect
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('Session save error:', saveErr);
          return res.status(500).send('Internal server error');
        }
        res.redirect(returnTo);
      });
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).send('Internal server error');
  }
};

// GET /admin/logout
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
};

// GET /admin/dashboard
exports.dashboard = async (req, res) => {
  try {
    const statusFilter = req.query.status || 'all';
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    
    // Build where clause
    const where = {};
    if (statusFilter !== 'all') {
      where.status = statusFilter;
    }
    // Query devis requests
    const { count, rows: devisRequests } = await DevisRequest.findAndCountAll({
      where,
      include: [{
        model: DevisMedia,
        as: 'media'
      }],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    
    // Calculate age warnings (>90 days)
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    devisRequests.forEach(devis => {
      devis.isOld = devis.createdAt < ninetyDaysAgo && devis.status !== 'done';
    });
    
    // Count by status
    const statusCounts = await DevisRequest.findAll({
      attributes: [
        'status',
        [DevisRequest.sequelize.fn('COUNT', DevisRequest.sequelize.col('id')), 'count']
      ],
      group: ['status']
    });
    
    const counts = {
      all: count,
      new: 0,
      in_progress: 0,
      done: 0
    };
    
    statusCounts.forEach(item => {
      counts[item.status] = parseInt(item.get('count'));
    });
    
    const totalPages = Math.ceil(count / limit);
    
    res.render('admin/dashboard', {
      pageTitle: 'Admin Dashboard',
      devisRequests,
      statusFilter,
      counts,
      currentPage: page,
      totalPages,
      username: req.session.username
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('Internal server error');
  }
};

// GET /admin/devis/:id
exports.devisDetail = async (req, res) => {
  try {
    const devis = await DevisRequest.findByPk(req.params.id, {
      include: [{
        model: DevisMedia,
        as: 'media'
      }]
    });
    
    if (!devis) {
      return res.status(404).send('Devis not found');
    }
    
    res.render('admin/devis-detail', {
      pageTitle: `Devis #${devis.id}`,
      devis,
      username: req.session.username
    });
  } catch (error) {
    console.error('Devis detail error:', error);
    res.status(500).send('Internal server error');
  }
};

// POST /admin/devis/:id/status
exports.updateDevisStatus = async (req, res) => {
  try {
    const devis = await DevisRequest.findByPk(req.params.id);
    
    if (!devis) {
      return res.status(404).json({ error: 'Devis not found' });
    }
    
    const { status } = req.body;
    if (!['new', 'in_progress', 'done'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    devis.status = status;
    await devis.save();
    
    res.json({ success: true, status: devis.status });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /admin/projects
exports.projectsList = async (req, res) => {
  try {
    const projects = await Project.findAll({
      order: [['order', 'ASC'], ['created_at', 'DESC']]
    });
    
    res.render('admin/projects', {
      pageTitle: 'Manage Projects',
      projects,
      username: req.session.username
    });
  } catch (error) {
    console.error('Projects list error:', error);
    res.status(500).send('Internal server error');
  }
};

// GET /admin/projects/new
exports.projectNewForm = (req, res) => {
  res.render('admin/project-form', {
    pageTitle: 'New Project',
    project: null,
    username: req.session.username
  });
};

// GET /admin/projects/:id/edit
exports.projectEditForm = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      return res.status(404).send('Project not found');
    }
    
    res.render('admin/project-form', {
      pageTitle: 'Edit Project',
      project,
      username: req.session.username
    });
  } catch (error) {
    console.error('Project edit form error:', error);
    res.status(500).send('Internal server error');
  }
};

// POST /admin/projects
exports.projectCreate = [
  body('titleFr').notEmpty().withMessage('French title is required'),
  body('titleEn').notEmpty().withMessage('English title is required'),
  body('descFr').notEmpty().withMessage('French description is required'),
  body('descEn').notEmpty().withMessage('English description is required'),
  body('category').notEmpty().withMessage('Category is required'),
  
  async (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.render('admin/project-form', {
        pageTitle: 'New Project',
        project: null,
        username: req.session.username,
        errors: errors.array(),
        formData: req.body
      });
    }
    
    try {
      // Get max order value
      const maxOrder = await Project.max('order') || 0;
      
      const project = await Project.create({
        titleFr: req.body.titleFr,
        titleEn: req.body.titleEn,
        descFr: req.body.descFr,
        descEn: req.body.descEn,
        category: req.body.category,
        imagePath: req.body.imagePath || null,
        order: maxOrder + 1,
        published: req.body.published === 'on'
      });
      
      res.redirect('/admin/projects');
    } catch (error) {
      console.error('Project create error:', error);
      res.status(500).send('Internal server error');
    }
  }
];

// POST /admin/projects/:id
exports.projectUpdate = [
  body('titleFr').notEmpty().withMessage('French title is required'),
  body('titleEn').notEmpty().withMessage('English title is required'),
  body('descFr').notEmpty().withMessage('French description is required'),
  body('descEn').notEmpty().withMessage('English description is required'),
  body('category').notEmpty().withMessage('Category is required'),
  
  async (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const project = await Project.findByPk(req.params.id);
      return res.render('admin/project-form', {
        pageTitle: 'Edit Project',
        project,
        username: req.session.username,
        errors: errors.array(),
        formData: req.body
      });
    }
    
    try {
      const project = await Project.findByPk(req.params.id);
      
      if (!project) {
        return res.status(404).send('Project not found');
      }
      
      project.titleFr = req.body.titleFr;
      project.titleEn = req.body.titleEn;
      project.descFr = req.body.descFr;
      project.descEn = req.body.descEn;
      project.category = req.body.category;
      project.imagePath = req.body.imagePath || null;
      project.published = req.body.published === 'on';
      
      await project.save();
      
      res.redirect('/admin/projects');
    } catch (error) {
      console.error('Project update error:', error);
      res.status(500).send('Internal server error');
    }
  }
];

// POST /admin/projects/:id/delete
exports.projectDelete = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    await project.destroy();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Project delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /admin/change-password
exports.changePasswordForm = (req, res) => {
  res.render('admin/change-password', {
    pageTitle: 'Change Password',
    username: req.session.username,
    success: null,
    error: null
  });
};

// POST /admin/change-password
exports.changePassword = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
  
  async (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.render('admin/change-password', {
        pageTitle: 'Change Password',
        username: req.session.username,
        success: null,
        error: errors.array()[0].msg
      });
    }
    
    try {
      const user = await User.findByPk(req.session.userId);
      
      if (!user || !(await user.verifyPassword(req.body.currentPassword))) {
        return res.render('admin/change-password', {
          pageTitle: 'Change Password',
          username: req.session.username,
          success: null,
          error: 'Current password is incorrect'
        });
      }
      
      await user.setPassword(req.body.newPassword);
      await user.save();
      
      res.render('admin/change-password', {
        pageTitle: 'Change Password',
        username: req.session.username,
        success: 'Password changed successfully',
        error: null
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).send('Internal server error');
    }
  }
];
