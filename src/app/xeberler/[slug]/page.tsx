'use client';
import { useParams } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { News } from '@/types';
import { collection, query, where, limit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { format } from 'date-fns';
import { Calendar, User } from 'lucide-react';
import DOMPurify from 'dompurify';
import Head from 'next/head';


export default function NewsDetailsPage() {
    const { slug } = useParams();
    const firestore = useFirestore();

    const newsQuery = useMemoFirebase(() => 
        slug ? query(collection(firestore, 'news'), where('slug', '==', slug), limit(1)) : null,
        [firestore, slug]
    );
    const { data: newsItems, isLoading } = useCollection<News>(newsQuery);

    const news = newsItems?.[0];
    
    // Sanitize HTML content on the client side
    const sanitizedContent = news?.content && typeof window !== 'undefined' 
        ? DOMPurify.sanitize(news.content) 
        : news?.content;

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
    
    if (!news) {
        return <div className="text-center py-20">Xəbər tapılmadı.</div>;
    }

    const pageTitle = `${news.title} | İstedad Mərkəzi`;
    const description = news.content.replace(/<[^>]*>?/gm, '').substring(0, 155);

    return (
        <>
            <Head>
                <title>{pageTitle}</title>
                <meta name="description" content={description} />
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={description} />
                <meta property="og:image" content={news.coverImageUrl || 'https://i.ibb.co/cXv2KzRR/q2.jpg'} />
                <meta property="og:type" content="article" />
                <meta property="og:url" content={`https://istedadmerkezi.net/xeberler/${news.slug}`} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={pageTitle} />
                <meta name="twitter:description" content={description} />
                <meta name="twitter:image" content={news.coverImageUrl || 'https://i.ibb.co/cXv2KzRR/q2.jpg'} />
            </Head>
            <article className="container mx-auto max-w-4xl py-8 md:py-12 px-4">
                <header className="mb-8">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
                        {news.title}
                    </h1>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{news.authorName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <time dateTime={news.createdAt?.toDate().toISOString()}>
                                {news.createdAt ? format(news.createdAt.toDate(), 'dd MMMM, yyyy') : ''}
                            </time>
                        </div>
                    </div>
                </header>

                {news.coverImageUrl && (
                    <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden mb-8">
                        <Image 
                            src={news.coverImageUrl}
                            alt={news.title}
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
