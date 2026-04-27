import { getInitialServices } from '@core/container';
import { jsonError, readJsonObject, requireAdminSession, requireJsonValue, requireString } from '@infrastructure/server/apiGuards';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await requireAdminSession();
    const services = getInitialServices();
    const settings = await services.settingsService.getSettings();
    return NextResponse.json(settings);
  } catch (err) {
    return jsonError(err, 'Failed to fetch settings');
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdminSession();
    const body = await readJsonObject(request);
    const key = requireString(body.key, 'key');
    const value = requireJsonValue(body.value, 'value');
    
    const services = getInitialServices();
    await services.settingsService.updateSetting(key, value, { id: user.id, email: user.email });
    
    return NextResponse.json({ success: true });
  } catch (err) {
    return jsonError(err, 'Failed to update setting');
  }
}
