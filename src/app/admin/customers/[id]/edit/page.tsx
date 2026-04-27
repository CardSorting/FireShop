import { AdminCustomerEdit } from '@ui/pages/admin/AdminCustomerEdit';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <AdminCustomerEdit id={id} />;
}