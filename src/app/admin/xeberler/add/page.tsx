'use client';
import { useRouter } from 'next/navigation';
import NewsEditForm from '../edit-form';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function AddNewsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const handleSuccess = (id: string) => {
    router.push('/admin/xeberler');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-10 w-24" />
      </div>
    );
  }
  
  if(!user) {
     return <p>Bu əməliyyatı etmək üçün giriş etməlisiniz.</p>;
  }

  return (
    <NewsEditForm 
      onSuccess={handleSuccess}
      authorId={user.id}
      authorName={`${user.firstName} ${user.lastName}`}
    />
  );
}
