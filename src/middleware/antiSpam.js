/**
 * Anti-spam middleware
 * Includes honeypot and time-trap checks
 */

// Honeypot field check
function checkHoneypot(req, res, next) {
  // Check if honeypot field is filled (bots will fill it)
  if (req.body.website || req.body.url || req.body.company) {
    console.warn('⚠️  Honeypot triggered from IP:', req.ip);
    // Return success to avoid alerting bot
    return res.json({ success: true, message: 'Request received' });
  }
  next();
}

// Time-trap check (form should take at least 3 seconds to fill)
function checkTimeTrap(req, res, next) {
  const formStartTime = parseInt(req.body._formStartTime || '0');
  const currentTime = Date.now();
  const timeTaken = currentTime - formStartTime;
  
  // If form submitted in less than 3 seconds, likely a bot
  if (timeTaken < 3000) {
    console.warn('⚠️  Time-trap triggered (', timeTaken, 'ms) from IP:', req.ip);
    // Return success to avoid alerting bot
    return res.json({ success: true, message: 'Request received' });
  }
  
  next();
}

module.exports = {
  checkHoneypot,
  checkTimeTrap
};
