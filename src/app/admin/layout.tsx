import { AdminLayout } from '@ui/layouts/AdminLayout';
import { requireAdminSession } from '@infrastructure/server/apiGuards';

export const dynamic = 'force-dynamic';

export default async function Layout({ children }: { children: React.ReactNode }) {
    await requireAdminSession();
    return <AdminLayout>{children}</AdminLayout>;
}
