import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import PageTransition from '@/components/PageTransition'; // <-- Import our new component

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Social Media App',
  description: 'Built with NestJS and Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {/* --- WRAP THE CHILDREN HERE --- */}
          <PageTransition>
            {children}
          </PageTransition>
          <Toaster richColors />
        </AuthProvider>
      </body>
    </html>
  );
}