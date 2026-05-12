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
  }): Promise<void> {
    const fromEmail = params.from || process.env.BREVO_FROM_EMAIL || 'notsosuper68@gmail.com';
    const fromName = process.env.BREVO_FROM_NAME || 'Dream Bees Art';

    try {
      const result = await this.client.transactionalEmails.sendTransacEmail({
        subject: params.subject,
        htmlContent: params.html || params.text || '',
        textContent: params.text,
        sender: { name: fromName, email: fromEmail },
        to: [{ email: params.to }],
      });
      
      console.log('Email sent successfully via Brevo API:', result);
    } catch (error: any) {
      console.error('Failed to send email via Brevo API:', error.message);
      throw new Error('Email delivery failed');
    }
  }
}
