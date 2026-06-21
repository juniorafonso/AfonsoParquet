const nodemailer = require('nodemailer');

/**
 * Email Service
 * Sends emails using SMTP configuration from .env
 */

// Create transporter (reused for all emails)
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  
  // Check if SMTP is configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️  SMTP not configured. Emails will not be sent.');
    return null;
  }
  
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  
  console.log('✓ Email transporter configured');
  return transporter;
}

/**
 * Send email to admin when new devis request arrives
 */
async function sendAdminNotification(devisRequest) {
  const transport = getTransporter();
  if (!transport) {
    console.warn('⚠️  Skipping admin notification email (SMTP not configured)');
    return { skipped: true };
  }
  
  try {
    const locale = devisRequest.locale || 'fr';
    const subject = locale === 'fr' 
      ? `Nouveau devis #${devisRequest.id} - ${devisRequest.prenom} ${devisRequest.nom}`
      : `New quote request #${devisRequest.id} - ${devisRequest.prenom} ${devisRequest.nom}`;
    
    const html = generateAdminEmailHTML(devisRequest, locale);
    
    const info = await transport.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: process.env.ADMIN_EMAIL,
      subject,
      html
    });
    
    console.log('✅ Admin notification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send admin notification email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send confirmation email to client
 */
async function sendClientConfirmation(devisRequest) {
  const transport = getTransporter();
  if (!transport) {
    console.warn('⚠️  Skipping client confirmation email (SMTP not configured)');
    return { skipped: true };
  }
  
  try {
    const locale = devisRequest.locale || 'fr';
    const subject = locale === 'fr'
      ? 'Votre demande de devis - Afonso Parquet'
      : 'Your quote request - Afonso Parquet';
    
    const html = generateClientEmailHTML(devisRequest, locale);
    
    const info = await transport.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: devisRequest.email,
      subject,
      html
    });
    
    console.log('✅ Client confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send client confirmation email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate HTML email for admin notification
 */
function generateAdminEmailHTML(devis, locale) {
  const isFr = locale === 'fr';
  
  const services = Array.isArray(devis.serviceTypes) 
    ? devis.serviceTypes.join(', ') 
    : devis.serviceTypes || '-';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .section { margin-bottom: 25px; }
    .section-title { font-weight: bold; color: #667eea; margin-bottom: 10px; font-size: 16px; }
    .field { margin-bottom: 8px; }
    .field-label { font-weight: bold; display: inline-block; width: 140px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">${isFr ? 'Nouveau Devis Reçu' : 'New Quote Request'}</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">#${devis.id}</p>
    </div>
    
    <div class="content">
      <div class="section">
        <div class="section-title">${isFr ? 'Coordonnées du Client' : 'Client Contact'}</div>
        <div class="field"><span class="field-label">${isFr ? 'Civilité' : 'Title'}:</span> ${devis.civilite}</div>
        <div class="field"><span class="field-label">${isFr ? 'Nom' : 'Name'}:</span> ${devis.prenom} ${devis.nom}</div>
        <div class="field"><span class="field-label">Email:</span> <a href="mailto:${devis.email}">${devis.email}</a></div>
        <div class="field"><span class="field-label">${isFr ? 'Téléphone' : 'Phone'}:</span> <a href="tel:${devis.phone}">${devis.phone}</a></div>
        <div class="field"><span class="field-label">NPA:</span> ${devis.npa}</div>
      </div>
      
      <div class="section">
        <div class="section-title">${isFr ? 'Détails du Projet' : 'Project Details'}</div>
        ${devis.buildingType ? `<div class="field"><span class="field-label">${isFr ? 'Type' : 'Building'}:</span> ${devis.buildingType}</div>` : ''}
        <div class="field"><span class="field-label">Services:</span> ${services}</div>
        ${devis.parquetType ? `<div class="field"><span class="field-label">${isFr ? 'Parquet' : 'Flooring'}:</span> ${devis.parquetType}</div>` : ''}
        ${devis.poseType ? `<div class="field"><span class="field-label">${isFr ? 'Pose' : 'Installation'}:</span> ${devis.poseType}</div>` : ''}
        ${devis.surfaceM2 ? `<div class="field"><span class="field-label">Surface:</span> ${devis.surfaceM2} m²</div>` : ''}
        ${devis.delais ? `<div class="field"><span class="field-label">${isFr ? 'Délais' : 'Timeline'}:</span> ${devis.delais}</div>` : ''}
      </div>
      
      ${devis.message ? `
      <div class="section">
        <div class="section-title">Message</div>
        <p style="background: #f5f5f5; padding: 15px; border-radius: 5px;">${devis.message}</p>
      </div>
      ` : ''}
      
      ${devis.externalLink ? `
      <div class="section">
        <div class="section-title">${isFr ? 'Lien Externe' : 'External Link'}</div>
        <a href="${devis.externalLink}" target="_blank">${devis.externalLink}</a>
      </div>
      ` : ''}
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.BASE_URL}/admin/devis/${devis.id}" class="button">
          ${isFr ? 'Voir le Devis' : 'View Quote'}
        </a>
      </div>
    </div>
    
    <div class="footer">
      <p>${isFr ? 'Demande reçue le' : 'Request received on'} ${new Date().toLocaleDateString(isFr ? 'fr-CH' : 'en-GB')}</p>
      <p>Afonso Parquet - ${process.env.BASE_URL}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate HTML email for client confirmation
 */
function generateClientEmailHTML(devis, locale) {
  const isFr = locale === 'fr';
  
  const services = Array.isArray(devis.serviceTypes) 
    ? devis.serviceTypes.join(', ') 
    : devis.serviceTypes || '-';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .section { margin-bottom: 25px; }
    .highlight { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; border-radius: 4px; }
    .summary { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .summary-item { padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
    .summary-item:last-child { border-bottom: none; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">${isFr ? 'Merci pour votre demande !' : 'Thank you for your request!'}</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Afonso Parquet</p>
    </div>
    
    <div class="content">
      <p>${isFr 
        ? `Bonjour ${devis.civilite} ${devis.nom},`
        : `Hello ${devis.civilite} ${devis.nom},`
      }</p>
      
      <p>${isFr
        ? "Nous avons bien reçu votre demande de devis et vous remercions de l'intérêt que vous portez à nos services."
        : "We have received your quote request and thank you for your interest in our services."
      }</p>
      
      <div class="highlight">
        <strong>⏱️ ${isFr ? 'Réponse sous 24 heures' : 'Response within 24 hours'}</strong>
        <p style="margin: 5px 0 0 0; font-size: 14px;">${isFr
          ? "Notre équipe reviendra vers vous très prochainement avec une offre personnalisée."
          : "Our team will get back to you very soon with a personalized offer."
        }</p>
      </div>
      
      <div class="section">
        <h3>${isFr ? 'Récapitulatif de votre demande' : 'Request Summary'}</h3>
        <div class="summary">
          <div class="summary-item"><strong>NPA:</strong> ${devis.npa}</div>
          <div class="summary-item"><strong>Services:</strong> ${services}</div>
          ${devis.surfaceM2 ? `<div class="summary-item"><strong>Surface:</strong> ${devis.surfaceM2} m²</div>` : ''}
          ${devis.delais ? `<div class="summary-item"><strong>${isFr ? 'Délais' : 'Timeline'}:</strong> ${devis.delais}</div>` : ''}
        </div>
      </div>
      
      <p>${isFr
        ? "Si vous avez des questions ou souhaitez ajouter des informations, n'hésitez pas à nous contacter directement."
        : "If you have any questions or would like to add information, please feel free to contact us directly."
      }</p>
      
      <p style="margin-top: 30px;">
        ${isFr ? 'Cordialement,' : 'Best regards,'}<br>
        <strong>L'équipe Afonso Parquet</strong>
      </p>
    </div>
    
    <div class="footer">
      <p><strong>Afonso Parquet</strong></p>
      <p>${process.env.COMPANY_PHONE ? `📞 ${process.env.COMPANY_PHONE}<br>` : ''}📧 ${process.env.SMTP_FROM_EMAIL}</p>
      <p>${process.env.BASE_URL}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

module.exports = {
  sendAdminNotification,
  sendClientConfirmation
};
