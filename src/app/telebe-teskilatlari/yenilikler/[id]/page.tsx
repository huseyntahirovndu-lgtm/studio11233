'use client';
import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { StudentOrgUpdate, StudentOrganization } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { format } from 'date-fns';
import { Calendar, Building } from 'lucide-react';
import DOMPurify from 'dompurify';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function StudentOrgUpdateDetailsPage() {
    const { id } = useParams();
    const firestore = useFirestore();
    const updateId = typeof id === 'string' ? id : '';
    
    const updateDocRef = useMemoFirebase(() => 
      firestore && updateId ? doc(firestore, 'student-org-updates', updateId) : null,
      [firestore, updateId]
    );
    const { data: update, isLoading: isUpdateLoading } = useDoc<StudentOrgUpdate>(updateDocRef);

    const orgDocRef = useMemoFirebase(() =>
      firestore && update?.organizationId ? doc(firestore, 'student-organizations', update.organizationId) : null,
      [firestore, update?.organizationId]
    );
    const { data: organization, isLoading: isOrgLoading } = useDoc<StudentOrganization>(orgDocRef);
    
    const isLoading = isUpdateLoading || (update && !organization);

    const sanitizedContent = update?.content && typeof window !== 'undefined'
        ? DOMPurify.sanitize(update.content)
        : update?.content;

    if (isLoading) {
        return (
            <div className="container mx-auto max-w-4xl py-12 px-4">
                <Skeleton className="h-10 w-3/4 mb-4" />
                <Skeleton className="h-6 w-1/4 mb-8" />
                <Skeleton className="w-full h-96 mb-8" />
                <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
            </div>
        );
    }
    
    if (!update || !organization) {
        return <div className="text-center py-20">Yenilik tapılmadı və ya yüklənərkən xəta baş verdi.</div>;
    }

    const pageTitle = `${update.title} | ${organization.name}`;
    const description = update.content.replace(/<[^>]*>?/gm, '').substring(0, 155);

    return (
        <>
            <Head>
                <title>{pageTitle}</title>
                <meta name="description" content={description} />
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={description} />
                <meta property="og:image" content={update.coverImageUrl || organization.logoUrl || 'https://i.ibb.co/cXv2KzRR/q2.jpg'} />
                <meta property="og:type" content="article" />
            </Head>
            <article className="container mx-auto max-w-4xl py-8 md:py-12 px-4">
                <header className="mb-8">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
                        {update.title}
                    </h1>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <Link href={`/telebe-teskilatlari/${organization.id}`} className="flex items-center gap-2 hover:text-primary">
                            <Building className="h-4 w-4" />
                            <span>{organization.name}</span>
                        </Link>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <time dateTime={update.createdAt?.toDate().toISOString()}>
                                {update.createdAt ? format(update.createdAt.toDate(), 'dd MMMM, yyyy') : ''}
                            </time>
                        </div>
                    </div>
                </header>

                {update.coverImageUrl && (
                    <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden mb-8">
                        <Image 
                            src={update.coverImageUrl}
                            alt={update.title}
                            fill
                            className="object-cover"
                        />
                    </div>
                )}
                
                {sanitizedContent && (
                    <div 
                        className="prose dark:prose-invert max-w-none prose-lg" 
                        dangerouslySetInnerHTML={{ __html: sanitizedContent }} 
                    />
                )}
            </article>
        </>
    );
}
