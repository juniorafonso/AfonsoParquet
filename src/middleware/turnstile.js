const axios = require('axios');

/**
 * Verify Cloudflare Turnstile token
 * Middleware to validate anti-spam challenge
 */
async function verifyTurnstile(req, res, next) {
  const token = req.body['cf-turnstile-response'];
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  
  // Skip if Turnstile not configured (development)
  if (!secretKey || secretKey === '') {
    console.warn('⚠️  Turnstile not configured, skipping verification');
    return next();
  }
  
  // Check if token exists
  if (!token) {
    return res.status(400).json({
      success: false,
      error: res.locals.t('devis.errors.required')
    });
  }
  
  try {
    // Verify with Cloudflare API
    const response = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        secret: secretKey,
        response: token,
        remoteip: req.ip
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      }
    );
    
    if (response.data.success) {
      return next();
    } else {
      console.error('Turnstile verification failed:', response.data);
      return res.status(400).json({
        success: false,
        error: 'Verification failed. Please try again.'
      });
    }
  } catch (err) {
    console.error('Turnstile verification error:', err.message);
    // On error, allow request to proceed (fail-open to avoid blocking legitimate users)
    return next();
  }
}

module.exports = { verifyTurnstile };
