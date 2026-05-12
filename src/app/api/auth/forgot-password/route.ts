import { NextResponse } from 'next/server';
import { adminAuth } from '@infrastructure/firebase/admin';
import { getInitialServices } from '@core/container';
import { AuthError } from '@domain/errors';
import { logger } from '@utils/logger';
import { getGeoLocation } from '@utils/geo';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Capture forensics
    const ip = request.headers.get('x-forwarded-for') || '0.0.0.0';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const location = await getGeoLocation(ip);

    const { emailService, auditService, rateLimitService } = getInitialServices();

    // Industry Standard: Rate limiting (5 requests per 1 hour per IP/Email combo)
    const rateLimitKey = `pw_reset_${ip}_${email}`;
    const { allowed, remaining, resetTime } = await rateLimitService.isAllowed(rateLimitKey, 5, 3600000);

    if (!allowed) {
      logger.warn('Password reset rate limit exceeded', { email, ip });
      return NextResponse.json({ 
        error: `Too many requests. Please try again after ${resetTime?.toLocaleTimeString()}.` 
      }, { status: 429 });
    }

    // Generate password reset link via Firebase Admin
    // We point the link to our own reset-password page
    const actionCodeSettings = {
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`,
      handleCodeInApp: true,
    };

    try {
      const resetLink = await adminAuth.generatePasswordResetLink(email, actionCodeSettings);
      
      // Send the link via Brevo
      await emailService.sendPasswordResetEmail(email, resetLink);

      // Audit the request with forensics
      await auditService.record({
        action: 'auth_password_reset_requested',
        userId: 'system', // Target user not signed in yet
        userEmail: email,
        targetId: email,
        details: { email },
        ip,
        userAgent,
        location,
      });

      return NextResponse.json({ success: true, message: 'If an account exists with this email, a reset link has been sent.' });
    } catch (error: any) {
      // If user doesn't exist, we still return success for security (prevent email enumeration)
      if (error.code === 'auth/user-not-found') {
         logger.info('Password reset requested for non-existent user', { email });
         return NextResponse.json({ success: true, message: 'If an account exists with this email, a reset link has been sent.' });
      }
      throw error;
    }
  } catch (error: any) {
    logger.error('Forgot password API failed', { error: error.message });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
