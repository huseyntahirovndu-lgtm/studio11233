'use client';
import { useRouter } from 'next/navigation';
import OrgUpdateEditForm from '../edit-form';
import { useStudentOrg } from '../../layout';
import { useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function AddOrgUpdatePage() {
  const router = useRouter();
  const { organization, isLoading: orgLoading } = useStudentOrg();
  const firestore = useFirestore();

  const handleSuccess = (id: string) => {
    router.push('/telebe-teskilati-paneli/updates');
  };

  if (orgLoading || !firestore) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-10 w-24" />
      </div>
    );
  }

  if (!organization) {
    return <p>Bu əməliyyatı etmək üçün təşkilat rəhbəri olmalısınız.</p>;
  }

  return (
    <OrgUpdateEditForm 
      onSuccess={handleSuccess}
      organization={organization}
      firestore={firestore}
    />
  );
}
