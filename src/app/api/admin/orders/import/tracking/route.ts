import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, readJsonObject, requireAdminSession, requireString } from '@infrastructure/server/apiGuards';

/**
 * [LAYER: API]
 * Import tracking numbers from a CSV (Pirate Ship format).
 * Expects: { rows: [{ orderId: string, trackingNumber: string, carrier: string }] }
 */
export async function POST(request: Request) {
    try {
        await requireAdminSession(request);
        const body = await readJsonObject(request);
        const { rows } = body;

        if (!Array.isArray(rows)) {
            throw new Error('Rows must be an array');
        }

        const services = await getServerServices();
        const user = await services.authService.getCurrentUser();
        const actor = { id: user?.id || 'unknown', email: user?.email || 'system' };

        let successCount = 0;
        const errors: string[] = [];

        for (const row of rows) {
            try {
                const orderId = requireString(row.orderId, 'orderId');
                const trackingNumber = requireString(row.trackingNumber, 'trackingNumber');
                const carrier = row.carrier || 'USPS';

                await services.orderService.updateOrderFulfillment(orderId, {
                    trackingNumber,
                    shippingCarrier: carrier
                }, actor);

                // Auto-advance to shipped if not already
                const order = await services.orderService.getAdminOrder(orderId);
                if (order && (order.status === 'confirmed' || order.status === 'processing')) {
                    await services.orderService.updateOrderStatus(orderId, 'shipped', actor);
                }

                successCount++;
            } catch (err) {
                errors.push(`Row failed: ${err instanceof Error ? err.message : String(err)}`);
            }
        }

        return NextResponse.json({ success: true, successCount, errors });
    } catch (error) {
        return jsonError(error, 'Failed to import tracking numbers');
    }
}
