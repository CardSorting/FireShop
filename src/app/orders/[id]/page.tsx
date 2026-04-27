import { OrderDetailPage } from '@ui/pages/OrderDetailPage';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
    return <OrderDetailPage params={params} />;
}