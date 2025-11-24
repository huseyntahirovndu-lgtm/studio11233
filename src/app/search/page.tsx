'use client';
import { Suspense } from 'react';
import SearchClient from './search-client';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

function SearchLoading() {
  return (
    <>
    <main className='flex-1'>
      <div className="container mx-auto py-8 md:py-12 px-4">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">İstedadları Kəşf Et</h1>
          <p className="text-muted-foreground">Platformadakı bütün istedadlı tələbələr arasında axtarış edin və filtrləyin.</p>
        </div>
        <div className="mb-8 space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Card key={i}>
              <div className="p-0 relative">
                <Skeleton className="h-2 w-full" />
                <div className="p-6 flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </main>
    </>
  );
}


export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <main className="flex-1">
        <SearchClient />
      </main>
    </Suspense>
  );
}
