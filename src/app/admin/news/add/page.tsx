'use client';
import { useRouter } from 'next/navigation';
import NewsEditForm from '../edit-form';
import { useAuth, useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function AddNewsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();

  const handleSuccess = (id: string) => {
    // Navigate back to the news list after successful creation
    router.push('/admin/news');
  };

  const isLoading = authLoading || !firestore || !user;

  if (isLoading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-10 w-24" />
        </div>
    );
  }

  // This check is secondary because the layout already protects the route.
  if (user.role !== 'admin') {
    return <p>Bu əməliyyatı etmək üçün admin səlahiyyəti lazımdır.</p>;
  }

  return (
    <NewsEditForm 
      onSuccess={handleSuccess}
      firestore={firestore}
      user={user}
    />
  );
}
