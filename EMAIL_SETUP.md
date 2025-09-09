# Email Service Setup Guide

This guide explains how to configure Gmail App Passwords for the email service.

## 📋 Setup Steps

### 1. Enable 2-Factor Authentication on Gmail
1. Go to your [Google Account settings](https://myaccount.google.com)
2. Navigate to **Security** → **2-Step Verification**
3. Enable 2-Step Verification if not already enabled

### 2. Generate App Password
1. Go to **Security** → **App passwords**
2. Select **Mail** as the app
3. Choose **Other** for device and enter "Followers Bicara API"
4. Google will generate a 16-character password (e.g., `abcd efgh ijkl mnop`)

### 3. Configure Environment Variables
Add these variables to your `.env` file:

```bash
# Email Configuration
EMAIL_USER="your-gmail@gmail.com"
EMAIL_PASSWORD="abcdefghijklmnop"  # 16-character app password (no spaces)
APP_NAME="Followers Bicara"
```

### 4. Test Email Configuration
The email service will automatically verify the connection on startup. Check your logs for:
```
[MailService] Email service successfully configured and connected to Gmail SMTP
```

## 🚀 Usage Examples

### Using in Any Service/Controller

```typescript
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class MyService {
    constructor(private mailService: MailService) {}

    async sendCustomEmail() {
        // Generic email
        await this.mailService.sendEmail({
            to: 'user@example.com',
            subject: 'Hello!',
            html: '<h1>Hello World!</h1>',
            text: 'Hello World!'
        });

        // Password reset email
        await this.mailService.sendPasswordResetEmail('user@example.com', {
            name: 'John Doe',
            resetUrl: 'https://yoursite.com/reset?token=abc123',
            expirationTime: '1 hour'
        });

        // Welcome email
        await this.mailService.sendWelcomeEmail('user@example.com', {
            name: 'John Doe',
            loginUrl: 'https://yoursite.com/login'
        });

        // Event registration confirmation
        await this.mailService.sendEventRegistrationEmail('user@example.com', {
            userName: 'John Doe',
            eventTitle: 'Amazing Workshop',
            eventDate: 'December 25, 2024',
            eventLocation: 'Online',
            confirmationUrl: 'https://yoursite.com/events/123'
        });
    }
}
```

## 📧 Available Email Templates

### 1. Password Reset Email
- Professional HTML template with security warnings
- Includes reset link with expiration time
- Mobile-responsive design

### 2. Welcome Email
- Welcoming message for new users
- Features overview
- Login link

### 3. Event Registration Confirmation
- Event details and confirmation
- Professional layout
- Call-to-action buttons

### 4. Event Registration Approved
- Approval notification
- Event reminders and instructions
- Professional styling

## 🔐 API Endpoints

### Password Reset Flow

**1. Request Password Reset**
```http
POST /v1/auth/forgot-password
Content-Type: application/json

{
    "email": "user@example.com"
}
```

**2. Reset Password with Token**
```http
POST /v1/auth/reset-password
Content-Type: application/json

{
    "token": "jwt-token-from-email",
    "newPassword": "newpassword123"
}
```

## 📊 Gmail Limits

- **Free Gmail**: 100 emails/day
- **Google Workspace**: Higher limits available
- **Rate limiting**: Built into the service

## 🔒 Security Features

- **App passwords**: More secure than regular passwords
- **Token-based reset**: JWT tokens with expiration
- **No email enumeration**: Same response for existing/non-existing emails
- **Secure templates**: XSS protection in email content

## 🛠️ Troubleshooting

### Common Issues

1. **"Invalid credentials" error**
   - Make sure 2FA is enabled
   - Use app password, not regular password
   - Remove spaces from app password

2. **"Failed to connect to Gmail SMTP"**
   - Check internet connection
   - Verify EMAIL_USER and EMAIL_PASSWORD in .env
   - Ensure port 587 is not blocked

3. **Emails not being sent**
   - Check spam folder
   - Verify recipient email address
   - Check Gmail sending limits

### Debug Mode
Set `NODE_ENV=development` to see detailed email logs.

## 💡 Production Recommendations

For production, consider upgrading to:
- **SendGrid** (better deliverability, analytics)
- **Mailgun** (API-first approach)
- **Amazon SES** (cost-effective)
- **Google Workspace** (higher limits)

The email service is designed to be easily switchable between providers.