'use client';

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Users2, Library, Newspaper, School, ListTree, Settings, ShieldCheck } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip"
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Logo } from "@/components/logo";

const NAV_LINKS = [
    { href: "/admin/dashboard", icon: Home, label: "Panel", exact: true },
    { href: "/admin/students", icon: Users2, label: "Tələbələr" },
    { href: "/admin/telebe-teskilatlari", icon: Library, label: "Tələbə Təşkilatları" },
    { href: "/admin/news", icon: Newspaper, label: "Xəbərlər" },
    { href: "/admin/faculties", icon: School, label: "Fakültələr" },
    { href: "/admin/categories", icon: ListTree, label: "Kateqoriyalar" },
];


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user?.role !== 'admin') {
      toast({
        title: "Səlahiyyət Xətası",
        description: "Bu səhifəyə yalnız adminlər daxil ola bilər.",
        variant: "destructive",
      });
      router.push('/');
    }
  }, [user, loading, router, toast]);

  
  const isActive = (href: string, exact?: boolean) => {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  // While loading or if user is not an admin, show a loading/permission check screen.
  // This prevents child components from rendering with incorrect auth state.
  if (loading || user?.role !== 'admin') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Yoxlanılır...</p>
        </div>
      </div>
    );
  }

  // Once auth check is complete and user is an admin, render the actual layout.
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-6 w-6" />
              <span className="">İdarəetmə Paneli</span>
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
              <nav className="grid gap-3 text-lg font-medium">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-lg font-semibold border-b px-4 py-3.5"
                >
                  <Logo className="h-8 w-auto" />
                  <span className="sr-only">İstedad Mərkəzi</span>
                </Link>
                <div className="px-4">
                {NAV_LINKS.map(link => (
                   <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                      isActive(link.href, link.exact) && "bg-muted text-foreground"
                    )}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                ))}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
           <div className="w-full flex-1" />
           <p className="text-sm text-muted-foreground">Admin: {user.firstName}</p>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
