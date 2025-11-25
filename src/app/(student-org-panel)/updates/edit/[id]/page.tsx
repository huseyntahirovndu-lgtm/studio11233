'use client';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { StudentOrgUpdate } from '@/types';
import OrgUpdateEditForm from '../../edit-form';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudentOrg } from '@/app/(student-org-panel)/layout';
import { useMemoFirebase } from '@/firebase/provider';

export default function EditOrgUpdatePage() {
  const { id } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { organization, isLoading: orgLoading } = useStudentOrg();
  
  const updateId = typeof id === 'string' ? id : '';
  
  const updateDocRef = useMemoFirebase(() => 
      organization && firestore ? doc(firestore, `users/${organization.id}/updates`, updateId) : null,
      [firestore, organization?.id, updateId]
  );

  const { data: updateData, isLoading: updateLoading } = useDoc<StudentOrgUpdate>(updateDocRef);
  
  const isLoading = orgLoading || updateLoading;

  const handleSuccess = () => {
    router.push('/telebe-teskilati-paneli/updates');
  };
  
  if(isLoading || !organization || !firestore) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-10 w-24" />
        </div>
    )
  }
  
  if(!updateData && !isLoading) {
    return <p>Yenilik tapılmadı.</p>
  }

  return (
    <OrgUpdateEditForm 
      onSuccess={handleSuccess}
      initialData={updateData}
      organization={organization}
      firestore={firestore}
    />
  );
}
