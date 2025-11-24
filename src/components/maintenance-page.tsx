'use client';

import { Wrench } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
      <Wrench className="h-16 w-16 text-primary mb-4 animate-bounce" />
      <h1 className="text-3xl font-bold text-foreground mb-2">Sayt Baxım Rejimindədir</h1>
      <p className="text-lg text-muted-foreground max-w-md">
        Platformanı daha da yaxşılaşdırmaq üçün hazırda texniki işlər aparırıq. Anlayışınız üçün təşəkkür edirik!
      </p>
    </div>
  );
}
