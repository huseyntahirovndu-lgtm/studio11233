'use client';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { News } from '@/types';
import NewsEditForm from '../../edit-form';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

export default function EditNewsPage() {
  const { id } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { user, loading: authLoading } = useAuth();
  
  const newsId = typeof id === 'string' ? id : '';
  
  const newsDocRef = useMemoFirebase(() => 
      firestore ? doc(firestore, `news`, newsId) : null,
      [firestore, newsId]
  );

  const { data: newsData, isLoading: newsLoading } = useDoc<News>(newsDocRef);
  
  const isLoading = authLoading || newsLoading;

  const handleSuccess = () => {
    router.push('/admin/xeberler');
  };
  
  if(isLoading || !user) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-10 w-24" />
        </div>
    )
  }
  
  if(!newsData && !isLoading) {
    return <p>Xəbər tapılmadı.</p>
  }

  return (
    <NewsEditForm 
      onSuccess={handleSuccess}
      initialData={newsData}
      authorId={user.id}
      authorName={`${user.firstName} ${user.lastName}`}
    />
  );
}
