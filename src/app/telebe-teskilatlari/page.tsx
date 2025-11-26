'use client';
import { useCollectionOptimized, useFirestore, useMemoFirebase } from '@/firebase';
import { StudentOrganization } from '@/types';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Building } from 'lucide-react';

export default function StudentOrganizationsPage() {
  const firestore = useFirestore();

  const studentOrgsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users'), where("role", "==", "student-organization"), where('status', '==', 'təsdiqlənmiş')) : null),
    [firestore]
  );
  const { data: studentOrgs, isLoading } = useCollectionOptimized<StudentOrganization>(studentOrgsQuery, { enableCache: true, disableRealtimeOnInit: true });

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold">Tələbə Təşkilatları</h1>
        <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
          Naxçıvan Dövlət Universitetinin aktiv tələbə təşkilatları ilə tanış olun, onların fəaliyyətlərini və layihələrini kəşf edin.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      ) : studentOrgs && studentOrgs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {studentOrgs.map((org) => (
            <Link key={org.id} href={`/telebe-teskilatlari/${org.id}`} className="group">
              <Card className="h-full overflow-hidden transition-shadow duration-300 hover:shadow-lg">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar className="h-16 w-16 border">
                    <AvatarImage src={org.logoUrl} alt={org.name} />
                    <AvatarFallback>
                      <Building />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="group-hover:text-primary">{org.name}</CardTitle>
                    {org.faculty && <CardDescription>{org.faculty}</CardDescription>}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{org.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center col-span-full text-muted-foreground py-16">
          <h2 className="text-2xl font-semibold mb-2">Heç bir təşkilat tapılmadı.</h2>
          <p>Hazırda sistemdə təsdiqlənmiş tələbə təşkilatı mövcud deyil.</p>
        </div>
      )}
    </div>
  );
}
