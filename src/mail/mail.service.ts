import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface EmailOptions {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    attachments?: Array<{
        filename: string;
        content: Buffer | string;
        contentType?: string;
    }>;
}

export interface PasswordResetEmailData {
    name: string;
    resetUrl: string;
    expirationTime?: string;
}

export interface WelcomeEmailData {
    name: string;
    loginUrl: string;
}

export interface EventRegistrationEmailData {
    userName: string;
    eventTitle: string;
    eventDate?: string;
    eventLocation?: string;
    confirmationUrl?: string;
}

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private transporter: Transporter;

    constructor() {
        this.initializeTransporter();
    }

    private initializeTransporter() {
        const emailUser = process.env.EMAIL_USER;
        const emailPassword = process.env.EMAIL_PASSWORD;

        if (!emailUser || !emailPassword) {
            this.logger.warn(
                'Email credentials not configured. Email functionality will be disabled.',
            );
            return;
        }

        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: emailUser,
                pass: emailPassword, // Gmail App Password
            },
            tls: {
                rejectUnauthorized: false,
            },
        });

        // Verify transporter configuration
        this.verifyConnection();
    }

    private async verifyConnection() {
        try {
            await this.transporter.verify();
            this.logger.log(
                'Email service successfully configured and connected to Gmail SMTP',
            );
        } catch (error) {
            this.logger.error('Failed to connect to Gmail SMTP:', error);
        }
    }

    /**
     * Send a generic email
     */
    async sendEmail(emailOptions: EmailOptions): Promise<boolean> {
        if (!this.transporter) {
            this.logger.error(
                'Email transporter not initialized. Cannot send email.',
            );
            return false;
        }

        try {
            const info = await this.transporter.sendMail({
                from: `"${process.env.APP_NAME || 'Followers Bicara'}" <${process.env.EMAIL_USER}>`,
                to: emailOptions.to,
                subject: emailOptions.subject,
                html: emailOptions.html,
                text: emailOptions.text,
                attachments: emailOptions.attachments,
            });

            this.logger.log(
                `Email sent successfully to ${emailOptions.to}. Message ID: ${info.messageId}`,
            );
            return true;
        } catch (error) {
            this.logger.error(
                `Failed to send email to ${emailOptions.to}:`,
                error,
            );
            return false;
        }
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(
        email: string,
        data: PasswordResetEmailData,
    ): Promise<boolean> {
        const html = this.generatePasswordResetTemplate(data);

        return this.sendEmail({
            to: email,
            subject: 'Reset Your Password - Followers Bicara',
            html,
            text: `Hi ${data.name}, click this link to reset your password: ${data.resetUrl}. This link expires in ${data.expirationTime || '1 hour'}.`,
        });
    }

    /**
     * Send welcome email
     */
    async sendWelcomeEmail(
        email: string,
        data: WelcomeEmailData,
    ): Promise<boolean> {
        const html = this.generateWelcomeTemplate(data);

        return this.sendEmail({
            to: email,
            subject: 'Welcome to Followers Bicara!',
            html,
            text: `Welcome ${data.name}! Thanks for joining Followers Bicara. You can login at: ${data.loginUrl}`,
        });
    }

    /**
     * Send event registration confirmation email
     */
    async sendEventRegistrationEmail(
        email: string,
        data: EventRegistrationEmailData,
    ): Promise<boolean> {
        const html = this.generateEventRegistrationTemplate(data);

        return this.sendEmail({
            to: email,
            subject: `Registration Confirmed - ${data.eventTitle}`,
            html,
            text: `Hi ${data.userName}, your registration for "${data.eventTitle}" has been confirmed!`,
        });
    }

    /**
     * Send event registration approved email
     */
    async sendEventRegistrationApprovedEmail(
        email: string,
        data: EventRegistrationEmailData,
    ): Promise<boolean> {
        const html = this.generateEventRegistrationApprovedTemplate(data);

        return this.sendEmail({
            to: email,
            subject: `Registration Approved - ${data.eventTitle}`,
            html,
            text: `Hi ${data.userName}, your registration for "${data.eventTitle}" has been approved!`,
        });
    }

    /**
     * Generate password reset email template
     */
    private generatePasswordResetTemplate(
        data: PasswordResetEmailData,
    ): string {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
                .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Password Reset Request</h1>
            </div>
            <div class="content">
                <p>Hi ${data.name},</p>
                <p>You requested to reset your password for your Followers Bicara account.</p>
                <p>Click the button below to reset your password:</p>
                <a href="${data.resetUrl}" class="button">Reset Password</a>
                <div class="warning">
                    <strong>⚠️ Security Notice:</strong>
                    <ul>
                        <li>This link will expire in ${data.expirationTime || '1 hour'}</li>
                        <li>If you didn't request this reset, please ignore this email</li>
                        <li>Never share this link with anyone</li>
                    </ul>
                </div>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 3px;">${data.resetUrl}</p>
            </div>
            <div class="footer">
                <p>This email was sent by Followers Bicara. If you have any questions, please contact our support team.</p>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Generate welcome email template
     */
    private generateWelcomeTemplate(data: WelcomeEmailData): string {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Followers Bicara</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
                .features { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #10b981; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Welcome to Followers Bicara! 🎉</h1>
            </div>
            <div class="content">
                <p>Hi ${data.name},</p>
                <p>Welcome to <strong>Followers Bicara</strong>! We're excited to have you join our community.</p>
                <div class="features">
                    <h3>What you can do:</h3>
                    <ul>
                        <li>📝 Read and write articles</li>
                        <li>🎪 Create and attend events</li>
                        <li>💬 Engage with the community</li>
                        <li>👥 Follow your favorite writers</li>
                    </ul>
                </div>
                <p>Ready to get started?</p>
                <a href="${data.loginUrl}" class="button">Login to Your Account</a>
                <p>Thank you for joining us. We can't wait to see what you'll share with our community!</p>
            </div>
            <div class="footer">
                <p>Welcome aboard! - The Followers Bicara Team</p>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Generate event registration confirmation template
     */
    private generateEventRegistrationTemplate(
        data: EventRegistrationEmailData,
    ): string {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Event Registration Confirmed</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .event-details { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #3b82f6; }
                .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Registration Confirmed! ✅</h1>
            </div>
            <div class="content">
                <p>Hi ${data.userName},</p>
                <p>Great news! Your registration for the following event has been <strong>confirmed</strong>:</p>
                <div class="event-details">
                    <h3>${data.eventTitle}</h3>
                    ${data.eventDate ? `<p><strong>📅 Date:</strong> ${data.eventDate}</p>` : ''}
                    ${data.eventLocation ? `<p><strong>📍 Location:</strong> ${data.eventLocation}</p>` : ''}
                </div>
                <p>We're looking forward to seeing you at the event!</p>
                ${data.confirmationUrl ? `<a href="${data.confirmationUrl}" class="button">View Event Details</a>` : ''}
                <p><strong>What's next?</strong></p>
                <ul>
                    <li>Add this event to your calendar</li>
                    <li>Prepare any materials if needed</li>
                    <li>Join us at the scheduled time</li>
                </ul>
                <p>If you have any questions or need to make changes to your registration, please contact the event organizer.</p>
            </div>
            <div class="footer">
                <p>See you there! - Followers Bicara Events Team</p>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Generate event registration approved template
     */
    private generateEventRegistrationApprovedTemplate(
        data: EventRegistrationEmailData,
    ): string {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Event Registration Approved</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .event-details { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #10b981; }
                .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
                .success { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Registration Approved! 🎉</h1>
            </div>
            <div class="content">
                <p>Hi ${data.userName},</p>
                <div class="success">
                    <strong>Congratulations!</strong> Your registration for the following event has been reviewed and <strong>approved</strong>:
                </div>
                <div class="event-details">
                    <h3>${data.eventTitle}</h3>
                    ${data.eventDate ? `<p><strong>📅 Date:</strong> ${data.eventDate}</p>` : ''}
                    ${data.eventLocation ? `<p><strong>📍 Location:</strong> ${data.eventLocation}</p>` : ''}
                </div>
                <p>You're all set to attend this event!</p>
                ${data.confirmationUrl ? `<a href="${data.confirmationUrl}" class="button">View Event Details</a>` : ''}
                <p><strong>Important reminders:</strong></p>
                <ul>
                    <li>Save the event date and time in your calendar</li>
                    <li>Arrive on time or join the online session promptly</li>
                    <li>Bring any required materials mentioned in the event details</li>
                </ul>
                <p>We're excited to have you participate in this event!</p>
            </div>
            <div class="footer">
                <p>Looking forward to seeing you! - Followers Bicara Events Team</p>
            </div>
        </body>
        </html>
        `;
    }
}
