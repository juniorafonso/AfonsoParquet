/**
 * Authentication Middleware
 * Protects admin routes
 */

exports.requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  
  // Store the original URL to redirect after login
  req.session.returnTo = req.originalUrl;
  res.redirect('/admin/login');
};

exports.redirectIfAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return res.redirect('/admin/dashboard');
  }
  next();
};
