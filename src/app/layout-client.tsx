'use client';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function AppLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register-student') || pathname.startsWith('/register-organization');
  
  const isAdminRoute = pathname.startsWith('/admin');
  const isOrgPanelRoute = pathname.startsWith('/telebe-teskilati-paneli');
  const isNotFoundPage = pathname.endsWith('/not-found');

  const showHeaderFooter = !isAuthPage && !isAdminRoute && !isOrgPanelRoute && !isNotFoundPage;

  return (
    <div className="flex flex-col min-h-screen">
      {showHeaderFooter && <Header />}
      <main className="flex-1">{children}</main>
      {showHeaderFooter && <Footer />}
    </div>
  )
}
