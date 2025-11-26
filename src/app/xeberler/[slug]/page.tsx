'use client';
import { useParams } from 'next/navigation';
import { useCollectionOptimized, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { News, Admin } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { format } from 'date-fns';
import { Calendar, User } from 'lucide-react';
import DOMPurify from 'dompurify';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function NewsDetailsLoading() {
    return (
        <div className="container mx-auto max-w-4xl py-12 px-4">
            <Skeleton className="h-12 w-3/4 mb-4" />
            <div className="flex items-center gap-4 mb-8">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-6 w-1/4" />
            </div>
            <Skeleton className="w-full h-96 mb-8" />
            <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full mt-4" />
                <Skeleton className="h-4 w-2/3" />
            </div>
        </div>
    );
}

export default function NewsDetailsPage() {
    const { slug } = useParams();
    const firestore = useFirestore();
    const newsSlug = typeof slug === 'string' ? slug : '';

    const newsQuery = useMemoFirebase(() =>
        firestore && newsSlug
            ? query(collection(firestore, 'news'), where('slug', '==', newsSlug), limit(1))
            : null,
        [firestore, newsSlug]
    );

    const { data: newsData, isLoading: isNewsLoading } = useCollectionOptimized<News>(newsQuery, { enableCache: true, disableRealtimeOnInit: true });
    const newsItem = newsData?.[0];

    const authorQuery = useMemoFirebase(() =>
        firestore && newsItem?.authorId
            ? query(collection(firestore, 'users'), where('id', '==', newsItem.authorId), limit(1))
            : null,
        [firestore, newsItem?.authorId]
    );
    const { data: authorData, isLoading: isAuthorLoading } = useCollectionOptimized<Admin>(authorQuery, { enableCache: true, disableRealtimeOnInit: true });
    const author = authorData?.[0];

    const [sanitizedContent, setSanitizedContent] = useState('');

    useEffect(() => {
        if (newsItem?.content && typeof window !== 'undefined') {
            setSanitizedContent(DOMPurify.sanitize(newsItem.content));
        }
    }, [newsItem?.content]);

    const isLoading = isNewsLoading || (newsData && newsData.length > 0 && isAuthorLoading);
    
    if (isLoading) {
        return <NewsDetailsLoading />;
    }

    if (!newsItem) {
        return <div className="text-center py-20">Xəbər tapılmadı.</div>;
    }

    return (
        <article className="container mx-auto max-w-4xl py-8 md:py-12 px-4">
            <header className="mb-8">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
                    {newsItem.title}
                </h1>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                           <AvatarFallback>{author ? `${author.firstName.charAt(0)}${author.lastName.charAt(0)}` : 'A'}</AvatarFallback>
                        </Avatar>
                        <span>{author ? `${author.firstName} ${author.lastName}` : 'Admin'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <time dateTime={newsItem.createdAt?.toDate().toISOString()}>
                            {newsItem.createdAt ? format(newsItem.createdAt.toDate(), 'dd MMMM, yyyy') : ''}
                        </time>
                    </div>
                </div>
            </header>

            {newsItem.coverImageUrl && (
                <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden mb-8">
                    <Image
                        src={newsItem.coverImageUrl}
                        alt={newsItem.title}
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
            )}

            {sanitizedContent && (
                <div
                    className="prose dark:prose-invert max-w-none prose-lg prose-headings:font-headline prose-p:font-body"
                    dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                />
            )}
            
            <div className="mt-12 text-center">
                <Link href="/xeberler">
                    <Button variant="outline">Bütün xəbərlərə qayıt</Button>
                </Link>
            </div>
        </article>
    );
}
