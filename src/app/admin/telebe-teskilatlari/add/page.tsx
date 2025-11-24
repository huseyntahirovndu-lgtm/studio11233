'use client';
import OrgForm from '../form';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { StudentOrganization } from '@/types';
import { useAuth } from '@/hooks/use-auth';

export default function AddStudentOrgPage() {
    const router = useRouter();
    const firestore = useFirestore();
    const { register } = useAuth();
    const { toast } = useToast();

    const handleSave = async (data: any, pass: string) => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Xəta', description: 'Firestore servisi tapılmadı.' });
            return false;
        }

        const newOrgData: Omit<StudentOrganization, 'id' | 'createdAt' | 'leaderId' | 'faculty' | 'memberIds' > = {
            role: 'student-organization',
            name: data.name,
            email: data.email,
            description: data.description,
            logoUrl: data.logoUrl,
            status: data.status,
        };

        const success = await register(newOrgData as any, pass, true);

        if (success) {
            toast({ title: 'Uğurlu', description: 'Tələbə təşkilatı uğurla yaradıldı.' });
            router.push('/admin/telebe-teskilatlari');
            return true;
        } else {
            toast({ variant: 'destructive', title: 'Xəta', description: 'Təşkilat yaradılarkən xəta baş verdi (e-poçt artıq mövcud ola bilər).' });
            return false;
        }
    };

    return <OrgForm onSave={handleSave} />;
}
