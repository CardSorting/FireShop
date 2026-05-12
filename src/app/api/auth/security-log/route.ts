import { NextResponse } from 'next/server';
import { getInitialServices } from '@core/container';
import { logger } from '@utils/logger';
import { getGeoLocation } from '@utils/geo';

export async function POST(request: Request) {
  try {
    const { action, email, details } = await request.json();

    if (!action || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { emailService, auditService } = getInitialServices();
    const ip = request.headers.get('x-forwarded-for') || '0.0.0.0';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const location = await getGeoLocation(ip);

    if (action === 'password_reset_finalized') {
      // 1. Send confirmation email
      await emailService.sendPasswordChangedEmail(email);

      // 2. Audit the success
      await auditService.record({
        action: 'auth_password_reset',
        userId: 'system',
        userEmail: email,
        targetId: email,
        details: { ...details, status: 'success' },
        ip,
        userAgent,
        location,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    logger.error('Security log API failed', { error: error.message });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
