'use client';
import { useParams } from 'next/navigation';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { StudentOrganization, StudentOrgUpdate } from '@/types';
import { doc, collection, query, orderBy, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Newspaper } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import Image from 'next/image';
import MembersList from './members-list';
import { useAuth } from '@/hooks/use-auth';


function OrgDetailsLoading() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="md:col-span-2 space-y-8">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function StudentOrgDetailsPage() {
  const { id } = useParams();
  const firestore = useFirestore();

  const orgId = typeof id === 'string' ? id : '';

  const orgDocRef = useMemoFirebase(() => (firestore && orgId ? doc(firestore, 'users', orgId) : null), [firestore, orgId]);
  const { data: organization, isLoading: orgLoading } = useDoc<StudentOrganization>(orgDocRef);
  
  const updatesQuery = useMemoFirebase(
    () => (firestore && orgId ? query(collection(firestore, 'student-org-updates'), where('organizationId', '==', orgId), orderBy('createdAt', 'desc')) : null),
    [firestore, orgId]
);
  const { data: updates, isLoading: updatesLoading } = useCollection<StudentOrgUpdate>(updatesQuery);

  const isLoading = orgLoading || updatesLoading;

  if (isLoading) {
    return <OrgDetailsLoading />;
  }

  if (!organization) {
    return <div className="text-center py-20">Tələbə təşkilatı tapılmadı.</div>;
  }

  return (
    <main className="container mx-auto max-w-5xl py-8 md:py-12 px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column */}
        <aside className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="items-center">
              <Avatar className="h-24 w-24 mb-4 border">
                <AvatarImage src={organization.logoUrl} alt={organization.name} />
                <AvatarFallback className="text-3xl">
                  <Building />
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl text-center">{organization.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{organization.description}</p>
            </CardContent>
          </Card>
          
          <MembersList organization={organization} />

        </aside>
        
        {/* Right Column */}
        <section className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl"><Newspaper /> Təşkilat Yenilikləri</CardTitle>
                    <CardDescription>Təşkilatın fəaliyyəti haqqında ən son məlumatlar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {updates && updates.length > 0 ? (
                        updates.map(update => (
                             <Link key={update.id} href={`/telebe-teskilatlari/yenilikler/${update.id}`} className="block group">
                                <Card className="hover:border-primary/50 transition-colors">
                                    {update.coverImageUrl && (
                                        <div className="relative w-full h-40 rounded-t-lg overflow-hidden">
                                            <Image src={update.coverImageUrl} alt={update.title} fill className="object-cover" />
                                        </div>
                                    )}
                                    <div className="p-4">
                                        <h3 className="font-bold text-lg group-hover:text-primary mb-1">{update.title}</h3>
                                        <p className="text-xs text-muted-foreground mb-2">
                                            {update.createdAt ? format(update.createdAt.toDate(), 'dd MMMM, yyyy') : ''}
                                        </p>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                             {update.content.replace(/<[^>]*>?/gm, '')}
                                        </p>
                                    </div>
                                </Card>
                            </Link>
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground py-10">
                            <p>Bu təşkilat hələ heç bir yenilik paylaşmayıb.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </section>
      </div>
    </main>
  );
}
