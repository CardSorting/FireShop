import { AdminOrderDetail } from '@ui/pages/admin/AdminOrderDetail';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <AdminOrderDetail id={id} />;
}
