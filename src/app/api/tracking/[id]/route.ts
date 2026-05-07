import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError } from '@infrastructure/server/apiGuards';

/**
 * [LAYER: INTERFACE]
 * Public tracking endpoint for retrieving non-sensitive order tracking data.
 */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const services = await getServerServices();
        const order = await services.orderService.getOrder(id);

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Return only non-sensitive tracking information
        const trackingData = {
            id: order.id,
            status: order.status,
            trackingNumber: order.trackingNumber || null,
            carrier: order.shippingCarrier || 'Standard',
            estimatedDelivery: order.estimatedDeliveryDate?.toISOString() || null,
            events: order.fulfillmentEvents?.map((e: any) => ({
                status: e.label,
                location: e.description,
                time: e.at.toISOString(),
                current: false // Logic to determine current could go here
            })) || [],
            trackingUrl: order.trackingUrl || null
        };

        // Mark the last event as current if events exist
        if (trackingData.events.length > 0) {
            trackingData.events[trackingData.events.length - 1].current = true;
        }

        return NextResponse.json(trackingData);
    } catch (error) {
        return jsonError(error, 'Failed to fetch tracking information');
    }
}
