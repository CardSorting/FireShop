import nodemailer from 'nodemailer';
import type { IEmailService } from '@domain/repositories';

export class BrevoEmailService implements IEmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const host = process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com';
    const port = parseInt(process.env.BREVO_SMTP_PORT || '587');
    const user = process.env.BREVO_SMTP_USER;
    const pass = process.env.BREVO_SMTP_KEY;

    if (!user || !pass) {
      console.warn('Brevo SMTP credentials not found. Email service will not be able to send emails.');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });
  }

  async sendEmail(params: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    from?: string;
  }): Promise<void> {
    const from = params.from || process.env.BREVO_FROM_EMAIL || 'no-reply@dreambees.art';
    const fromName = process.env.BREVO_FROM_NAME || 'Dream Bees Art';

    try {
      await this.transporter.sendMail({
        from: `"${fromName}" <${from}>`,
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html,
      });
      console.log(`Email sent successfully to ${params.to}`);
    } catch (error) {
      console.error('Failed to send email via Brevo:', error);
      throw new Error('Email delivery failed');
    }
  }
}
