'use client';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { News } from '@/types';
import { collection, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';

function safeFormatDate(date: any): string {
    if (!date) return '-';
    // Firestore Timestamp
    if (date && typeof date.toDate === 'function') {
        return format(date.toDate(), 'dd MMMM, yyyy');
    }
    // ISO string or number
    try {
        const d = new Date(date);
        // Check if date is valid
        if (!isNaN(d.getTime())) {
            return format(d, 'dd MMMM, yyyy');
        }
    } catch (e) {
        // Ignore parsing errors
    }
    // If it's a string that's not a valid date, return as is or a placeholder
    return typeof date === 'string' ? date : '-';
}


function NewsCardSkeleton() {
    return (
        <Card className="overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/4 mt-2" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-5/6 mt-2" />
            </CardContent>
        </Card>
    )
}

export default function NewsPage() {
    const firestore = useFirestore();
    const newsQuery = useMemoFirebase(() =>
        firestore ? query(collection(firestore, 'news'), orderBy('createdAt', 'desc')) : null,
        [firestore]
    );
    const { data: news, isLoading } = useCollection<News>(newsQuery);

    return (
        <main className="container mx-auto py-12 px-4">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-extrabold">Xəbərlər</h1>
                <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
                    İstedad Mərkəzi və universitet həyatı ilə bağlı ən son yeniliklər, elanlar və məqalələr.
                </p>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Array.from({ length: 6 }).map((_, i) => <NewsCardSkeleton key={i} />)}
                </div>
            ) : news && news.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {news.map(item => (
                        <Link key={item.id} href={`/xeberler/${item.slug}`} className="block group">
                            <Card className="h-full flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-xl">
                                {item.coverImageUrl && (
                                    <div className="relative w-full h-48">
                                        <Image
                                            src={item.coverImageUrl}
                                            alt={item.title}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                                <CardHeader>
                                    <CardTitle className="text-xl group-hover:text-primary transition-colors">{item.title}</CardTitle>
                                    <CardDescription>
                                        {safeFormatDate(item.createdAt)}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-sm text-muted-foreground line-clamp-3">
                                        {item.content.replace(/<[^>]*>?/gm, '')}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-muted-foreground">
                    <p>Heç bir xəbər tapılmadı.</p>
                </div>
            )}
        </main>
    );
}
