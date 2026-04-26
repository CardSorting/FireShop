import type { Metadata } from 'next';
import { AuthProvider } from '@ui/hooks/useAuth';
import { ErrorBoundary } from '@ui/components/ErrorBoundary';
import { Navbar } from '@ui/layouts/Navbar';
import { Footer } from '@ui/layouts/Footer';
import '../index.css';

export const metadata: Metadata = {
    title: 'PlayMoreTCG',
    description: 'TCG ecommerce storefront',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <ErrorBoundary>
                    <AuthProvider>
                        <div className="min-h-screen flex flex-col bg-gray-50">
                            <Navbar />
                            <main className="flex-1">{children}</main>
                            <Footer />
                        </div>
                    </AuthProvider>
                </ErrorBoundary>
            </body>
        </html>
    );
}
