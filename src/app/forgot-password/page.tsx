import { ForgotPasswordPage } from '@ui/pages/ForgotPasswordPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password | Dream Bees Art',
  description: 'Reset your Dream Bees Art account password.',
};

export default function Page() {
  return <ForgotPasswordPage />;
}
