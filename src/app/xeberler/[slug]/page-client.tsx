'use client';
import { News, Admin } from '@/types';
import Image from 'next/image';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import DOMPurify from 'dompurify';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface NewsDetailsClientProps {
    newsItem: News;
    author: Admin | null;
}

export default function NewsDetailsClient({ newsItem, author }: NewsDetailsClientProps) {
    const [sanitizedContent, setSanitizedContent] = useState('');

    useEffect(() => {
        if (newsItem?.content && typeof window !== 'undefined') {
            setSanitizedContent(DOMPurify.sanitize(newsItem.content));
        }
    }, [newsItem?.content]);

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
