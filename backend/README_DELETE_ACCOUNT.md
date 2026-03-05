# Delete Account Feature Setup

This document explains how to set up the Delete Account feature for AI-Powered CropCare with proper email deliverability.

## Prerequisites

1. **Firebase Admin SDK**: Install firebase-admin package
   ```bash
   cd backend
   npm install firebase-admin
   ```

2. **Email Service**: Install nodemailer for email sending
   ```bash
   npm install nodemailer
   ```

3. **Firebase Service Account**: You need a Firebase service account JSON file with admin privileges.

## Environment Variables

Add the following to your `backend/.env` file:

```env
# Firebase Admin SDK Credentials
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"

# Frontend URL (for generating deletion links)
FRONTEND_URL=http://localhost:5173

# Email Configuration
# Option 1: SMTP (Recommended for Firebase verified domains)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Option 2: SendGrid (Alternative)
# SENDGRID_API_KEY=your-sendgrid-api-key

# Email sender identity
EMAIL_FROM=noreply@aicropcare.com
EMAIL_FROM_NAME=AI-Powered CropCare
```

## Getting Firebase Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Download the JSON file
6. Extract the following values:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the quotes and newlines)

## Email Configuration Options

### Option 1: Gmail SMTP (Recommended for Development)

1. Enable 2-Step Verification on your Gmail account
2. Generate an App Password:
   - Go to Google Account > Security > 2-Step Verification > App passwords
   - Generate a password for "Mail"
   - Use this password as `SMTP_PASSWORD`

### Option 2: Firebase Verified Domain (Recommended for Production)

1. **Verify your domain in Firebase**:
   - Go to Firebase Console > Authentication > Templates
   - Add your custom domain (e.g., `aicropcare.com`)
   - Follow DNS verification steps

2. **Configure DNS Records** (for email deliverability):
   - **SPF Record**: `v=spf1 include:_spf.google.com ~all`
   - **DKIM Record**: Provided by Firebase/Google
   - **DMARC Record**: `v=DMARC1; p=quarantine; rua=mailto:dmarc@aicropcare.com`

3. **Use Firebase SMTP**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-verified-email@yourdomain.com
   SMTP_PASSWORD=your-app-password
   ```

### Option 3: SendGrid (Alternative)

1. Sign up at [SendGrid](https://sendgrid.com/)
2. Create an API key
3. Verify your sender domain
4. Add to `.env`:
   ```env
   SENDGRID_API_KEY=your-api-key
   ```

## Email Deliverability Best Practices

### 1. Domain Verification
- Verify your sending domain in Firebase/email service
- This ensures emails come from a trusted source

### 2. DNS Records (SPF, DKIM, DMARC)
- **SPF**: Prevents email spoofing
- **DKIM**: Adds cryptographic signature to emails
- **DMARC**: Policy for handling failed authentication

### 3. Email Formatting
- Professional HTML template with plain text fallback
- Clear sender identity (`EMAIL_FROM_NAME`)
- Proper email headers
- Unsubscribe links

### 4. Sender Reputation
- Use a dedicated email address (e.g., `noreply@aicropcare.com`)
- Avoid spam trigger words
- Maintain consistent sending patterns

## Testing

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. In development mode:
   - If email service is not configured, the deletion link is logged to console
   - Check console for: `[DELETE ACCOUNT] Deletion link for {email}: {link}`

3. Test email delivery:
   - Request account deletion from the dashboard
   - Check your email inbox (and spam folder)
   - Click the deletion link to confirm

4. Verify email formatting:
   - Check that HTML renders correctly
   - Verify plain text version is readable
   - Ensure links work correctly

## Security Notes

- Deletion tokens are cryptographically secure (32 bytes random hex)
- Tokens expire after 1 hour
- Tokens can only be used once
- All user data is permanently deleted:
  - User profile
  - Analysis history
  - Feedback
  - Weather alerts
  - Storage files (images)
  - Firebase Auth user

## Troubleshooting

**Error: "firebase-admin not installed"**
- Run `npm install firebase-admin` in the backend directory

**Error: "nodemailer not installed"**
- Run `npm install nodemailer` in the backend directory

**Error: "Email service not configured"**
- Check that SMTP or SendGrid credentials are set in `.env`
- Verify SMTP credentials are correct
- Check firewall/network settings for SMTP port 587

**Emails going to spam:**
- Verify your domain DNS records (SPF, DKIM, DMARC)
- Use a verified sender domain
- Avoid spam trigger words in subject/content
- Warm up your sending domain gradually

**Firebase Admin initialization failed:**
- Check that environment variables are set correctly
- Ensure the private key includes `\n` characters for newlines
- Verify service account has proper permissions

## Production Checklist

- [ ] Firebase Admin SDK installed and configured
- [ ] Email service (SMTP/SendGrid) configured
- [ ] Domain verified in Firebase/email service
- [ ] DNS records (SPF, DKIM, DMARC) configured
- [ ] `EMAIL_FROM` uses verified domain
- [ ] `FRONTEND_URL` points to production domain
- [ ] Test email delivery in production environment
- [ ] Monitor email deliverability rates
- [ ] Set up email bounce/complaint handling
