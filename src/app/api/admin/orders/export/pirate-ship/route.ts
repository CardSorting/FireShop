import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, readJsonObject, requireAdminSession, requireString } from '@infrastructure/server/apiGuards';

/**
 * [LAYER: API]
 * Export orders to Pirate Ship compatible CSV format.
 */
export async function POST(request: Request) {
    try {
        await requireAdminSession(request);
        const body = await readJsonObject(request);
        const { ids, packageDimensions, tareWeight } = body;

        if (!Array.isArray(ids)) {
            throw new Error('IDs must be an array');
        }

        const validatedIds = ids.map((id, i) => requireString(id, `ids[${i}]`));

        const services = await getServerServices();
        const csv = await services.orderService.exportOrdersToPirateShipCsv(
            validatedIds, 
            packageDimensions as { length: string; width: string; height: string } | undefined, 
            tareWeight as number | undefined
        );

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="pirate_ship_export.csv"',
            },
        });
    } catch (error) {
        return jsonError(error, 'Failed to export orders to CSV');
    }
}
