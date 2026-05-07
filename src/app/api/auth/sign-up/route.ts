import { NextResponse } from 'next/server';
import { setSessionUser } from '@infrastructure/server/session';
import { assertRateLimit, jsonError, readJsonObject, requireString } from '@infrastructure/server/apiGuards';
import { userFromVerifiedIdToken } from '@infrastructure/server/firebaseSession';

export async function POST(request: Request) {
    try {
        await assertRateLimit(request, 'getAuth():sign-up', 5, 60_000);
        const body = await readJsonObject(request);
        const displayName = requireString(body.displayName, 'displayName');
        const idToken = requireString(body.idToken, 'idToken');
        const user = await userFromVerifiedIdToken(idToken, { displayName });
        await setSessionUser(user);
        return NextResponse.json(user);
    } catch (error) {
        return jsonError(error, 'Registration failed');
    }
}
