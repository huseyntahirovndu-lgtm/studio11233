'use client';
import { usePathname } from 'next/navigation';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { SessionProvider } from '@/hooks/use-auth';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

// Default metadata for pages that don't have their own
export const defaultSiteConfig = {
  name: "İstedad Mərkəzi - Naxçıvan Dövlət Universiteti",
  url: "https://istedadmerkezi.net",
  ogImage: "https://istedadmerkezi.net/og-image.jpg",
  description: "Naxçıvan Dövlət Universitetinin istedadlı tələbələrini kəşf edin. Potensialı reallığa çevirən platforma.",
  keywords: ["Naxçıvan Dövlət Universiteti", "İstedad Mərkəzi", "tələbə", "karyera", "istedad", "layihə", "NDU"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register-student') || pathname.startsWith('/register-organization');
  
  const isAdminRoute = pathname.startsWith('/admin');
  const isOrgPanelRoute = pathname.startsWith('/telebe-teskilati-paneli');
  const isNotFoundPage = pathname === '/not-found';

  const showHeaderFooter = !isAuthPage && !isAdminRoute && !isOrgPanelRoute && !isNotFoundPage;

  return (
    <html lang="az">
      <head>
        {/*
          Dynamic metadata is handled by `generateMetadata` in page.tsx/layout.tsx files.
          This head section can be used for static elements like fonts or icons.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="font-body bg-background antialiased">
        <FirebaseClientProvider>
          <SessionProvider>
            <div className="flex flex-col min-h-screen">
              {showHeaderFooter && <Header />}
              <main className="flex-1">{children}</main>
              {showHeaderFooter && <Footer />}
            </div>
            <Toaster />
          </SessionProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
