import { AdminCustomerDetail } from '@ui/pages/admin/AdminCustomerDetail';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <AdminCustomerDetail id={id} />;
}
