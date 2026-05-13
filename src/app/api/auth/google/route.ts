import { NextResponse } from 'next/server';
import { setSessionUser } from '@infrastructure/server/session';
import { assertRateLimit, jsonError, readJsonObject, requireString, clientFingerprint } from '@infrastructure/server/apiGuards';
import { userFromVerifiedIdToken } from '@infrastructure/server/firebaseSession';

export async function POST(request: Request) {
    try {
        await assertRateLimit(request, 'getAuth():google', 10, 60_000);
        const body = await readJsonObject(request);
        const idToken = requireString(body.idToken, 'idToken');
        const user = await userFromVerifiedIdToken(idToken);
        const fp = clientFingerprint(request);
        await setSessionUser(user, fp);

        return NextResponse.json(user);
    } catch (error) {
        console.error('Google Auth API Error:', error);
        return jsonError(error, 'Google sign in failed');
    }
}
