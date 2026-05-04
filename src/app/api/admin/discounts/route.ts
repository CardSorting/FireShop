import { getServerServices } from '@infrastructure/server/services';
import { jsonError, requireAdminSession, readJsonObject } from '@infrastructure/server/apiGuards';

export async function GET() {
    try {
        await requireAdminSession();
        const services = await getServerServices();
        const discounts = await services.discountService.getAllDiscounts();
        return Response.json(discounts);
    } catch (error) {
        return jsonError(error, 'Failed to fetch discounts');
    }
}

export async function POST(request: Request) {
    try {
        const user = await requireAdminSession();
        const data = await readJsonObject(request);
        const services = await getServerServices();
        
        // Convert ISO strings back to Date objects
        if (data.startsAt) data.startsAt = new Date(data.startsAt as string);
        if (data.endsAt) data.endsAt = new Date(data.endsAt as string);
        
        const discount = await services.discountService.createDiscount(data as any, { id: user.id, email: user.email });
        return Response.json(discount);
    } catch (error) {
        return jsonError(error, 'Failed to create discount');
    }
}
