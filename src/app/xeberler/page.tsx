'use client';
import {
  MoreHorizontal,
  PlusCircle,
} from "lucide-react"
import Link from "next/link";
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { News } from "@/types";
import { useCollection, useFirestore, useMemoFirebase, useAuth } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { format } from 'date-fns';
import Image from "next/image";

export default function AllNewsPage() {
    const firestore = useFirestore();
    const { user } = useAuth();

    const newsQuery = useMemoFirebase(() => query(collection(firestore, "news"), orderBy("createdAt", "desc")), [firestore]);
    const { data: news, isLoading } = useCollection<News>(newsQuery);

    return (
         <div className="container mx-auto py-12 px-4">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-extrabold">Xəbərlər və Elanlar</h1>
                <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">Naxçıvan Dövlət Universiteti və İstedad Mərkəzi ilə bağlı ən son yenilikləri buradan izləyin.</p>
                 {user?.role === 'admin' && (
                     <Button asChild className="mt-4">
                        <Link href="/admin/news/add">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Yeni Xəbər Yarat
                        </Link>
                    </Button>
                 )}
            </div>

            {isLoading ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="space-y-4"><div className="h-64 w-full bg-muted rounded-lg animate-pulse"></div><div className="h-6 w-3/4 bg-muted rounded animate-pulse"></div><div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div></div>
                    <div className="space-y-4"><div className="h-64 w-full bg-muted rounded-lg animate-pulse"></div><div className="h-6 w-3/4 bg-muted rounded animate-pulse"></div><div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div></div>
                    <div className="space-y-4"><div className="h-64 w-full bg-muted rounded-lg animate-pulse"></div><div className="h-6 w-3/4 bg-muted rounded animate-pulse"></div><div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div></div>
                </div>
            ) : news && news.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {news.map((item) => (
                        <Card key={item.id} className="overflow-hidden group flex flex-col">
                           <Link href={`/xeberler/${item.slug}`} className="flex flex-col h-full">
                                <div className="relative h-56 w-full">
                                    <Image src={item.coverImageUrl || 'https://picsum.photos/seed/news/600/400'} alt={item.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105"/>
                                </div>
                                <div className="p-6 flex flex-col flex-grow">
                                    <h2 className="text-xl font-bold line-clamp-2 group-hover:text-primary mb-2">{item.title}</h2>
                                    <p className="text-sm text-muted-foreground mb-4">{item.createdAt ? format(item.createdAt.toDate(), 'dd MMMM, yyyy') : ''}</p>
                                    <p className="line-clamp-3 text-sm text-muted-foreground flex-grow">{item.content.replace(/<[^>]*>?/gm, '').substring(0, 100)}...</p>
                                    <div className="mt-4 text-primary font-semibold flex items-center">
                                        Daha çox oxu <MoreHorizontal className="ml-1 h-4 w-4" />
                                    </div>
                                </div>
                           </Link>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center col-span-full text-muted-foreground py-16">
                    <h2 className="text-2xl font-semibold mb-2">Heç bir xəbər tapılmadı.</h2>
                    <p>Tezliklə yeni xəbərlər və elanlar burada olacaq.</p>
                </div>
            )}
        </div>
    )
}
