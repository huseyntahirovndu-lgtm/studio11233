'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import type { AppUser, Student, StudentOrganization } from '@/types';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navLinks = [
  { href: '/', label: 'Ana Səhifə' },
  { href: '/xeberler', label: 'Xəbərlər' },
  { href: '/telebe-teskilatlari', label: 'Tələbə Təşkilatları' },
  { href: '/search', label: 'Axtarış' },
  { href: '/rankings', label: 'Reytinq' },
];

export function Header() {
  const { user, loading, logout } = useAuth();
  const appUser = user as AppUser | null;
  const pathname = usePathname();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    logout();
  };

  const getDisplayName = (user: AppUser | null) => {
    if(!user) return '';
    if(user.role === 'student' || user.role === 'admin') return `${user.firstName} ${user.lastName}`;
    if(user.role === 'student-organization') return user.name;
    return user.email;
  }

  const getInitials = (displayName: string | null | undefined): string => {
    if (!displayName) return '';
    const names = displayName.split(' ');
    if (names.length > 1) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`;
    }
    return names[0].charAt(0);
  };
  
  const getProfilePicture = (user: AppUser | null): string | undefined => {
      if (!user) return undefined;
      if (user.role === 'student') return user.profilePictureUrl;
      if (user.role === 'student-organization') return user.logoUrl;
      return undefined;
  }

  const getDashboardLink = () => {
    if (!appUser) return '/';
    if (appUser.role === 'student-organization') return '/telebe-teskilati-paneli/dashboard';
    if (appUser.role === 'student') return '/student-dashboard';
    if (appUser.role === 'admin') return '/admin/dashboard';
    return `/`; 
  }
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-primary text-primary-foreground">
      <div className="container flex h-20 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-3">
          <Logo className="h-14 w-auto" />
          <span className="hidden font-bold sm:inline-block text-base">
            İstedad Mərkəzi
          </span>
        </Link>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "transition-colors hover:text-primary-foreground/80",
                pathname === link.href ? "text-primary-foreground" : "text-primary-foreground/60"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {loading ? (
            <div className='h-10 w-10 bg-muted rounded-full animate-pulse' />
          ) : user && appUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-primary/80">
                   <Avatar className="h-10 w-10">
                    <AvatarImage src={getProfilePicture(appUser)} alt={getDisplayName(appUser)} />
                    <AvatarFallback>{getInitials(getDisplayName(appUser))}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{getDisplayName(appUser)}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={getDashboardLink()}>
                    Panel
                  </Link>
                </DropdownMenuItem>
                {appUser.role === 'student' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${user.id}`}>Profilimə bax</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile/edit">Profili redaktə et</Link>
                    </DropdownMenuItem>
                  </>
                )}
                 {appUser.role === 'student-organization' && (
                  <DropdownMenuItem asChild>
                    <Link href="/profile/edit">Profili redaktə et</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  Çıxış
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center space-x-2">
              <Button variant="ghost" className="hover:bg-primary/80" asChild>
                <Link href="/login">Giriş</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/register-student">Qeydiyyat</Link>
              </Button>
            </div>
          )}

          <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden hover:bg-primary/80">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menyu aç</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
               <div className="flex items-center p-4 border-b">
                   <Link href="/" className="flex items-center space-x-3" onClick={() => setMobileMenuOpen(false)}>
                    <Logo className="h-10 w-auto" />
                    <span className="font-bold text-base">
                      İstedad Mərkəzi
                    </span>
                  </Link>
                </div>
                <nav className="flex flex-col gap-4 p-4 text-lg font-medium">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "transition-colors hover:text-foreground/80",
                        pathname === link.href ? "text-foreground" : "text-foreground/60"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto p-4 border-t flex flex-col gap-2">
                   {!user && !loading && (
                     <>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Giriş</Link>
                      </Button>
                      <Button className="w-full" asChild>
                        <Link href="/register-student" onClick={() => setMobileMenuOpen(false)}>Qeydiyyat</Link>
                      </Button>
                     </>
                   )}
                </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
