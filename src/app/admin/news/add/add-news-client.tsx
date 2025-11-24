'use client';

import { useRouter } from 'next/navigation';
import NewsEditForm from '../edit/[id]/edit-form';
import { useAuth, useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function AddNewsPageClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();

  const handleSuccess = (id: string) => {
    router.push('/admin/news');
  };

  const isLoading = authLoading || !firestore || !user;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Bu əməliyyatı etmək üçün admin səlahiyyəti lazımdır.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <NewsEditForm 
        onSuccess={handleSuccess}
        firestore={firestore}
        user={user}
      />
    </div>
  );
}