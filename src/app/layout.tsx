'use client';
import { usePathname } from 'next/navigation';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { SessionProvider } from '@/hooks/use-auth';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

const siteConfig = {
  name: "İstedad Mərkəzi - Naxçıvan Dövlət Universiteti",
  url: "https://istedadmerkezi.net",
  ogImage: "https://i.ibb.co/cXv2KzRR/q2.jpg",
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

  const showHeaderFooter = !isAuthPage && !isAdminRoute && !isOrgPanelRoute;

  return (
    <html lang="az">
      <head>
        <title>{siteConfig.name}</title>
        <meta name="description" content={siteConfig.description} />
        <meta name="keywords" content={siteConfig.keywords.join(", ")} />
        <meta property="og:title" content={siteConfig.name} />
        <meta property="og:description" content={siteConfig.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteConfig.url} />
        <meta property="og:image" content={siteConfig.ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteConfig.name} />
        <meta name="twitter:description" content={siteConfig.description} />
        <meta name="twitter:image" content={siteConfig.ogImage} />
        <link rel="canonical" href={`${siteConfig.url}${pathname}`} />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="font-body bg-background antialiased">
        <FirebaseClientProvider>
          <SessionProvider>
            {isAuthPage ? (
              <main className="flex min-h-screen items-center justify-center bg-background p-4">
                {children}
              </main>
            ) : (
              <div className="flex flex-col min-h-screen">
                {showHeaderFooter && <Header />}
                <main className="flex-1">{children}</main>
                {showHeaderFooter && <Footer />}
              </div>
            )}
            <Toaster />
          </SessionProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
