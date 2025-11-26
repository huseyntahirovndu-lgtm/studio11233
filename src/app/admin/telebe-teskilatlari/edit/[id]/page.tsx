'use client';
import { useParams, useRouter } from 'next/navigation';
import OrgForm from '../../form';
import { useDoc, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { StudentOrganization } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemoFirebase } from '@/firebase/provider';

export default function EditStudentOrgPage() {
    const { id } = useParams();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const orgId = typeof id === 'string' ? id : '';
    const orgDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'student-organizations', orgId) : null, [firestore, orgId]);
    const { data: org, isLoading } = useDoc<StudentOrganization>(orgDocRef);

    const handleSave = async (data: any) => {
        if (!orgDocRef) return false;
        
        // Ensure fields that are no longer on the form are not accidentally overwritten with undefined
        const { leaderId, faculty, ...updateData } = data;

        await updateDocumentNonBlocking(orgDocRef, updateData);
        toast({ title: 'Uğurlu', description: 'Məlumatlar yeniləndi.' });
        router.push('/admin/telebe-teskilatlari');
        return true;
    };
    
    if(isLoading) {
        return (
             <div className="space-y-4">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-10 w-24" />
            </div>
        )
    }
    
    if(!org) {
        return <p>Təşkilat tapılmadı.</p>
    }

    return <OrgForm onSave={handleSave} initialData={org} />;
}
