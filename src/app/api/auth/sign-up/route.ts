import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { setSessionUser } from '@infrastructure/server/session';
import { assertRateLimit, jsonError, readJsonObject, requireString } from '@infrastructure/server/apiGuards';

export async function POST(request: Request) {
    try {
        await assertRateLimit(request, 'getAuth():sign-up', 5, 60_000);
        const body = await readJsonObject(request);
        const email = requireString(body.email, 'email');
        const password = requireString(body.password, 'password');
        const displayName = requireString(body.displayName, 'displayName');
        const services = await getServerServices();
        const user = await services.authService.signUp(email, password, displayName);
        await setSessionUser(user);
        return NextResponse.json(user);
    } catch (error) {
        return jsonError(error, 'Registration failed');
    }
}
