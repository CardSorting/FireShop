import { BrevoClient } from '@getbrevo/brevo';
import type { IEmailService } from '@domain/repositories';

export class BrevoEmailService implements IEmailService {
  private client: BrevoClient;

  constructor() {
    const apiKey = process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY;

    if (!apiKey) {
      console.warn('Brevo API key not found. Email service will not be able to send emails.');
    }

    this.client = new BrevoClient({
      apiKey: apiKey || '',
    });
  }

  async sendEmail(params: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    from?: string;
    idempotencyKey?: string;
  }): Promise<void> {
    const fromEmail = params.from || process.env.BREVO_FROM_EMAIL || 'notsosuper68@gmail.com';
    const fromName = process.env.BREVO_FROM_NAME || 'Dream Bees Art';

    // Point 9: Email Idempotency
    if (params.idempotencyKey) {
      const alreadySent = await this.checkEmailIdempotency(params.idempotencyKey);
      if (alreadySent) {
        console.log(`Email with idempotency key ${params.idempotencyKey} already sent. Skipping.`);
        return;
      }
    }

    try {
      const result = await this.client.transactionalEmails.sendTransacEmail({
        subject: params.subject,
        htmlContent: params.html || params.text || '',
        textContent: params.text,
        sender: { name: fromName, email: fromEmail },
        to: [{ email: params.to }],
      });
      
      if (params.idempotencyKey) {
        await this.markEmailSent(params.idempotencyKey, params.to, params.subject);
      }
      
      console.log('Email sent successfully via Brevo API:', result);
    } catch (error: any) {
      console.error('Failed to send email via Brevo API:', error.message);
      throw new Error('Email delivery failed');
    }
  }

  private async checkEmailIdempotency(key: string): Promise<boolean> {
    const { adminDb } = await import('@infrastructure/firebase/admin');
    const doc = await adminDb.collection('sent_emails').doc(key).get();
    return doc.exists;
  }

  private async markEmailSent(key: string, to: string, subject: string): Promise<void> {
    const { adminDb, FieldValue } = await import('@infrastructure/firebase/admin');
    const retentionDays = 30; // 30 day replay protection / lifecycle
    await adminDb.collection('sent_emails').doc(key).set({
      to,
      subject,
      sentAt: FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000)
    });
  }

  async sendPasswordResetEmail(email: string, resetLink: string, idempotencyKey?: string): Promise<void> {
    const fromEmail = process.env.BREVO_FROM_EMAIL || 'no-reply@dreambeesart.com';
    const fromName = process.env.BREVO_FROM_NAME || 'Dream Bees Art';

    if (idempotencyKey) {
      if (await this.checkEmailIdempotency(idempotencyKey)) return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap');
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              color: #1f2937; 
              line-height: 1.6; 
              margin: 0; 
              padding: 0;
              background-color: #f9fafb;
            }
            .wrapper { width: 100%; table-layout: fixed; background-color: #f9fafb; padding-bottom: 60px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { padding: 40px 0; text-align: center; background-color: #ffffff; }
            .logo { font-size: 28px; font-weight: 800; color: #111827; text-decoration: none; letter-spacing: -0.05em; }
            .content { padding: 40px 50px; border-radius: 24px; }
            h1 { font-size: 24px; font-weight: 800; color: #111827; margin-bottom: 24px; letter-spacing: -0.02em; }
            p { font-size: 16px; color: #4b5563; margin-bottom: 24px; }
            .btn-container { text-align: center; margin: 40px 0; }
            .button { 
              display: inline-block; 
              background-color: #111827; 
              color: #ffffff !important; 
              padding: 18px 36px; 
              border-radius: 16px; 
              text-decoration: none; 
              font-weight: 700; 
              font-size: 14px; 
              text-transform: uppercase; 
              letter-spacing: 0.1em;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }
            .security-note { 
              background-color: #f3f4f6; 
              padding: 24px; 
              border-radius: 16px; 
              font-size: 13px; 
              color: #6b7280; 
              margin-top: 40px;
            }
            .footer { 
              text-align: center; 
              padding: 40px 50px; 
              font-size: 12px; 
              color: #9ca3af; 
              background-color: #f9fafb;
            }
            .social-links { margin-bottom: 24px; }
            .social-links a { margin: 0 10px; color: #9ca3af; text-decoration: none; font-weight: 700; }
            .divider { height: 1px; background-color: #e5e7eb; margin: 40px 0; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="header">
              <a href="https://dreambeesart.com" class="logo">DREAMBEES ART</a>
            </div>
            <div class="container">
              <div class="content">
                <h1>Reset your password</h1>
                <p>Hello,</p>
                <p>We received a request to reset the password for your DreamBees Art account. To proceed, please click the secure link below. This link will expire in 1 hour for your security.</p>
                
                <div class="btn-container">
                  <a href="${resetLink}" class="button">Reset Password</a>
                </div>

                <p>If you didn't request this, you can safely ignore this email. Your password will remain unchanged and your account is secure.</p>
                
                <div class="security-note">
                  <strong>Security Alert:</strong> For your protection, never share this link with anyone. DreamBees Art will never ask for your password via email.
                </div>

                <div class="divider"></div>
                
                <p style="font-size: 13px; color: #9ca3af; margin-bottom: 8px;">Button not working? Copy and paste this link:</p>
                <p style="font-size: 11px; color: #7c3aed; word-break: break-all; margin: 0;">${resetLink}</p>
              </div>
            </div>
            <div class="footer">
              <div class="social-links">
                <a href="#">INSTAGRAM</a>
                <a href="#">TWITTER</a>
                <a href="#">DISCORD</a>
              </div>
              <p>&copy; ${new Date().getFullYear()} DreamBees Art &bull; 123 Artist Way, Salt Lake City, UT 84101</p>
              <p style="margin-top: 12px;">You're receiving this because you're a member of the DreamBees community.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      await this.client.transactionalEmails.sendTransacEmail({
        subject: 'Reset your password - Dream Bees Art',
        htmlContent: htmlContent,
        sender: { name: fromName, email: fromEmail },
        to: [{ email }],
      });
      if (idempotencyKey) await this.markEmailSent(idempotencyKey, email, 'Password Reset');
      console.log(`Password reset email sent to ${email}`);
    } catch (error: any) {
      console.error('Failed to send password reset email via Brevo API:', error.message);
      throw new Error('Failed to send reset email');
    }
  }

  async sendPasswordChangedEmail(email: string, idempotencyKey?: string): Promise<void> {
    const fromEmail = process.env.BREVO_FROM_EMAIL || 'no-reply@dreambeesart.com';
    const fromName = process.env.BREVO_FROM_NAME || 'Dream Bees Art';

    if (idempotencyKey) {
      if (await this.checkEmailIdempotency(idempotencyKey)) return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap');
            body { font-family: 'Inter', sans-serif; color: #1f2937; line-height: 1.6; background-color: #f9fafb; margin: 0; padding: 0; }
            .content { padding: 40px; background: white; border-radius: 24px; max-width: 600px; margin: 40px auto; }
            h1 { font-size: 24px; font-weight: 800; color: #111827; }
            .alert { background-color: #fef2f2; color: #991b1b; padding: 20px; border-radius: 16px; font-size: 14px; margin-top: 32px; }
            .footer { text-align: center; font-size: 12px; color: #9ca3af; margin-top: 40px; }
          </style>
        </head>
        <body>
          <div class="content">
            <h1>Security Update</h1>
            <p>Hello,</p>
            <p>This is a confirmation that the password for your <strong>DreamBees Art</strong> account was recently changed.</p>
            <p>If you made this change, you can safely ignore this email.</p>
            
            <div class="alert">
              <strong>Wait, I didn't do this!</strong><br/>
              If you did not change your password, your account may have been compromised. Please contact our security hive immediately at support@dreambeesart.com.
            </div>
          </div>
          <div class="footer">&copy; ${new Date().getFullYear()} DreamBees Art</div>
        </body>
      </html>
    `;

    try {
      await this.client.transactionalEmails.sendTransacEmail({
        subject: 'Security Alert: Password Changed - DreamBees Art',
        htmlContent: htmlContent,
        sender: { name: fromName, email: fromEmail },
        to: [{ email }],
      });
      if (idempotencyKey) await this.markEmailSent(idempotencyKey, email, 'Password Changed');
      console.log(`Password change confirmation sent to ${email}`);
    } catch (error: any) {
      console.error('Failed to send password changed confirmation:', error.message);
    }
  }
}
