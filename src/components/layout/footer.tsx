import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 md:px-8 lg:px-16 py-12">
        {/* Main content grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          
          {/* Column 1: Logo and University Info */}
          <div className="flex flex-row items-center gap-4 md:col-span-1 lg:col-span-1">
            <Logo className="h-16 w-auto" />
            <div>
              <p className="font-bold text-lg">İstedad Mərkəzi</p>
              <p className="text-base text-primary-foreground/80">Naxçıvan Dövlət Universiteti</p>
            </div>
          </div>

          {/* Column 2: Platforma Links */}
          <div>
            <h3 className="font-semibold mb-4 text-lg">Platforma</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-base">
                  Ana Səhifə
                </Link>
              </li>
              <li>
                <Link href="/xeberler" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-base">
                  Xəbərlər
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-base">
                  İstedadları Kəşf Et
                </Link>
              </li>
              <li>
                <Link href="/rankings" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-base">
                  Reytinqlər
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div>
            <h3 className="font-semibold mb-4 text-lg">Əlaqə</h3>
            <ul className="space-y-3 text-primary-foreground/80 text-base">
              <li>Azərbaycan Respublikası, Naxçıvan şəhəri, Universitet şəhərciyi, AZ7012, Naxçıvan Dövlət Universiteti</li>
              <li>Tel: +994 36 544 08 61</li>
              <li>Daxili telefon: 1108</li>
              <li>Email: tedbir@ndu.edu.az</li>
            </ul>
          </div>

          {/* Column 4: Social Media */}
          <div>
            <h3 className="font-semibold mb-4 text-lg">Bizi İzləyin</h3>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/ndu.edu.az/?locale=tr_TR" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors" aria-label="Facebook"><Facebook size={24} /></a>
              <a href="https://www.instagram.com/ndu.edu.az/" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors" aria-label="Instagram"><Instagram size={24} /></a>
              <a href="https://az.linkedin.com/school/nax%C3%A7%C4%B1van-d%C3%B6vl%C9%99t-universiteti/" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors" aria-label="LinkedIn"><Linkedin size={24} /></a>
              <a href="https://www.youtube.com/channel/UCdebBI5bSkr4uQHFrTD2bNQ" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors" aria-label="YouTube"><Youtube size={24} /></a>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="w-full pt-8 border-t border-primary-foreground/20 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-primary-foreground/70">
          <div className="text-center sm:text-left space-y-1">
            <p>&copy; {currentYear} Naxçıvan Dövlət Universiteti | Bütün hüquqlar qorunur.</p>
            <p>Tələbələrlə iş və tədbirlərin təşkili şöbəsi</p>
          </div>
          <div className="text-center sm:text-right">
            <p>Designed by Hüseyn Tahirov</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
