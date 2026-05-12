import { NextResponse } from 'next/server';
import { getInitialServices } from '@core/container';
import { logger } from '@utils/logger';
import { getGeoLocation } from '@utils/geo';
import { assertRateLimit, jsonError, readJsonObject, requireString } from '@infrastructure/server/apiGuards';
import { validateEmail } from '@utils/validators';

export async function POST(request: Request) {
  try {
    await assertRateLimit(request, 'auth_security_log', 5, 60_000);
    const { action, email, details } = await readJsonObject(request);

    const actionName = requireString(action, 'action');
    const emailAddress = requireString(email, 'email').toLowerCase();
    if (!validateEmail(emailAddress).valid) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const { auditService } = getInitialServices();
    const ip = request.headers.get('x-forwarded-for') || '0.0.0.0';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const location = await getGeoLocation(ip);

    if (actionName === 'password_reset_finalized') {
      // Do not send mail based solely on client-supplied identity; this public
      // endpoint is only for best-effort audit logging after Firebase reset.
      await auditService.record({
        action: 'auth_password_reset',
        userId: 'system',
        userEmail: emailAddress,
        targetId: emailAddress,
        details: { status: 'success', method: (details as any)?.method || 'self_service_reset' },
        ip,
        userAgent,
        location,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    logger.error('Security log API failed', { error: error instanceof Error ? error.message : String(error) });
    return jsonError(error, 'Security log failed');
  }
}
