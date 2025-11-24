'use client';

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Newspaper, Settings, Users, Library, Menu, Briefcase } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import { useEffect, createContext, useContext } from "react";
import type { StudentOrganization } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

const NAV_LINKS = [
    { href: "/telebe-teskilati-paneli/dashboard", icon: Home, label: "Panel", exact: true },
    { href: "/telebe-teskilati-paneli/members", icon: Users, label: "Üzvlər" },
    { href: "/telebe-teskilati-paneli/projects", icon: Briefcase, label: "Layihələr" },
    { href: "/telebe-teskilati-paneli/updates", icon: Newspaper, label: "Yeniliklər" },
];

interface OrgContextType {
    organization: StudentOrganization | null;
    isLoading: boolean;
}

const StudentOrgContext = createContext<OrgContextType | null>(null);

export const useStudentOrg = () => {
    const context = useContext(StudentOrgContext);
    if (!context) {
        throw new Error('useStudentOrg must be used within a StudentOrganizationLayout');
    }
    return context;
}

export default function StudentOrganizationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const organization = user as StudentOrganization | null;
  const isLoading = authLoading;

  useEffect(() => {
    if (!isLoading && user?.role !== 'student-organization') {
        toast({ title: "Səlahiyyət Xətası", description: "Bu səhifəyə yalnız təşkilat hesabları daxil ola bilər.", variant: "destructive"});
        router.push('/login');
    }
     if (!isLoading && user?.role === 'student-organization' && (user as StudentOrganization).status !== 'təsdiqlənmiş') {
        toast({ title: "Gözləmədə Olan Hesab", description: "Təşkilat hesabınız hələ admin tərəfindən təsdiqlənməyib.", variant: "destructive"});
        router.push('/');
     }

  }, [isLoading, user, router, toast]);

  if (isLoading || user?.role !== 'student-organization' || (user as StudentOrganization).status !== 'təsdiqlənmiş') {
      return <div className="flex h-screen items-center justify-center">Yüklənir və ya səlahiyyət yoxlanılır...</div>;
  }
  
  const isActive = (href: string, exact?: boolean) => {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <StudentOrgContext.Provider value={{ organization, isLoading: authLoading }}>
       <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Library className="h-6 w-6" />
              <span className="">Təşkilat Paneli</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    isActive(link.href, link.exact) && "bg-muted text-primary"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-auto p-4 border-t">
            <Button asChild variant="ghost" size="sm" className="w-full justify-start gap-2">
                <Link href={`/telebe-teskilatlari/${organization?.id}`}>
                    <Settings className="h-4 w-4" /> İctimai Profil
                </Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menyunu aç/bağla</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
               <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                 <Link href="/" className="flex items-center gap-2 font-semibold">
                    <Logo className="h-8 w-auto" />
                    <span className="">İstedad Mərkəzi</span>
                  </Link>
               </div>
              <nav className="grid gap-2 text-base font-medium p-4">
                {NAV_LINKS.map(link => (
                   <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-4 rounded-lg px-3 py-2 text-muted-foreground hover:text-primary",
                      isActive(link.href, link.exact) && "bg-accent text-accent-foreground"
                    )}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                ))}
              </nav>
                <div className="mt-auto p-4 border-t">
                  <Button asChild variant="ghost" size="sm" className="w-full justify-start gap-2">
                     <Link href={`/telebe-teskilatlari/${organization?.id}`}>
                        <Settings className="h-4 w-4" /> İctimai Profil
                    </Link>
                  </Button>
                </div>
            </SheetContent>
          </Sheet>
           <div className="w-full flex-1" />
           <p className="text-sm text-muted-foreground">{organization.name}</p>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
    </StudentOrgContext.Provider>
  )
}
