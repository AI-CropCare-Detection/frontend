// Dynamically import nodemailer to handle cases where it's not installed
let nodemailer = null
let nodemailerLoaded = false

async function loadNodemailer() {
  if (nodemailerLoaded) return nodemailer !== null
  nodemailerLoaded = true
  
  try {
    const nodemailerModule = await import('nodemailer')
    nodemailer = nodemailerModule.default
    return true
  } catch (err) {
    console.warn('⚠️  nodemailer not installed. Email sending will be disabled.')
    console.warn('   Install with: npm install nodemailer')
    nodemailer = null
    return false
  }
}

// Initialize email transporter
let transporter = null
let transporterInitialized = false

async function initializeEmailService() {
  if (transporterInitialized) return transporter
  transporterInitialized = true

  const nodemailerAvailable = await loadNodemailer()
  if (!nodemailerAvailable || !nodemailer) {
    console.warn('⚠️  Nodemailer not available. Email sending disabled.')
    return null
  }

  try {
    // Option 1: Use SendGrid (if configured)
    if (process.env.SENDGRID_API_KEY) {
      transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
      })
      return transporter
    }

    // Option 2: Use SMTP (Gmail, Firebase SMTP, or custom SMTP)
    const smtpUser = process.env.SMTP_USER
    const smtpPassword = process.env.SMTP_PASSWORD

    if (!smtpUser || !smtpPassword) {
      console.warn('⚠️  Email service not configured. SMTP_USER and SMTP_PASSWORD required.')
      return null
    }

    const emailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
      // Additional options for better deliverability
      tls: {
        rejectUnauthorized: false, // For self-signed certificates (not recommended for production)
      },
    }

    transporter = nodemailer.createTransport(emailConfig)
    
    // Verify connection asynchronously (don't block)
    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email service verification failed:', error.message)
      } else {
        console.log('✅ Email service ready')
      }
    })

    return transporter
  } catch (err) {
    console.error('❌ Email service initialization error:', err.message)
    return null
  }
}

/**
 * Send account deletion confirmation email
 * @param {string} to - Recipient email address
 * @param {string} deletionLink - Secure deletion link
 * @param {string} userName - User's display name (optional)
 */
export async function sendDeletionEmail(to, deletionLink, userName = '') {
  try {
    let emailTransporter
    try {
      emailTransporter = await initializeEmailService()
    } catch (initErr) {
      console.warn('Email service initialization error:', initErr.message)
      console.log(`[DELETE ACCOUNT] Deletion link for ${to}: ${deletionLink}`)
      return { success: false, message: 'Email service initialization failed', error: initErr.message }
    }
    
    if (!emailTransporter) {
      console.warn('Email service not configured. Logging deletion link instead.')
      console.log(`[DELETE ACCOUNT] Deletion link for ${to}: ${deletionLink}`)
      return { success: false, message: 'Email service not configured' }
    }

    const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@aicropcare.com'
    const fromName = process.env.EMAIL_FROM_NAME || 'AI-Powered CropCare'

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: 'Confirm Account Deletion - AI-Powered CropCare',
      text: generatePlainTextEmail(deletionLink, userName),
      html: generateHtmlEmail(deletionLink, userName),
      // Email headers for deliverability
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'List-Unsubscribe': `<mailto:${fromEmail}?subject=unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      // SPF/DKIM/DMARC are handled by the email service provider
      // Ensure your domain has proper DNS records configured
    }

    const info = await emailTransporter.sendMail(mailOptions)
    console.log('✅ Deletion email sent successfully:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Failed to send deletion email:', error)
    // Log the link for development/testing
    console.log(`[DELETE ACCOUNT] Deletion link for ${to}: ${deletionLink}`)
    return { success: false, error: error.message }
  }
}

function generatePlainTextEmail(deletionLink, userName) {
  const greeting = userName ? `Hello ${userName},` : 'Hello,'
  
  return `${greeting}

You requested to delete your account. Click the link below to confirm. If you did not request this, ignore this email.

This action cannot be undone. All your data including:
- Your profile
- Analysis history
- Notification preferences
- All synced data

will be permanently deleted.

To confirm account deletion, click the link below (expires in 1 hour):
${deletionLink}

If the link doesn't work, copy and paste it into your browser.

If you have any questions, contact us at support@aicropcare.com

Best regards,
AI-Powered CropCare Team

---
This is an automated message. Please do not reply to this email.`
}

function generateHtmlEmail(deletionLink, userName) {
  const greeting = userName ? `Hello ${userName},` : 'Hello,'
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Account Deletion</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">AI-Powered CropCare</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #dc2626; margin-top: 0; font-size: 20px;">Confirm Account Deletion</h2>
    
    <p>${greeting}</p>
    
    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
      <strong>You requested to delete your account.</strong> Click the link below to confirm. <strong>If you did not request this, ignore this email.</strong>
    </p>
    
    <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #991b1b; font-weight: 600;">⚠️ This action cannot be undone.</p>
      <p style="margin: 10px 0 0 0; color: #7f1d1d; font-size: 14px;">
        All your data including your profile, analysis history, notification preferences, and all synced data will be permanently deleted.
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${deletionLink}" 
         style="display: inline-block; background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Confirm Account Deletion
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${deletionLink}" style="color: #10b981; word-break: break-all;">${deletionLink}</a>
    </p>
    
    <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        This link will expire in <strong>1 hour</strong>.<br>
        If you have any questions, contact us at <a href="mailto:support@aicropcare.com" style="color: #10b981;">support@aicropcare.com</a>
      </p>
    </div>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
    <p>© 2026 AI-Powered CropCare. All Rights Reserved.</p>
    <p style="margin: 5px 0;">This is an automated message. Please do not reply to this email.</p>
  </div>
</body>
</html>
  `.trim()
}
