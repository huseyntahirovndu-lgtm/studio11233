'use client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, ClipboardList, Edit, Mail, Check, X, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Student, Invitation, Project, StudentOrganization as OrgType } from '@/types';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getProfileRecommendations } from '@/app/actions';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, getDoc, getDocs, updateDoc, writeBatch } from 'firebase/firestore';


interface EnrichedInvitation extends Invitation {
    project?: Project;
    organization?: OrgType;
}

function AIProfileOptimizer({ student }: { student: Student }) {
    const [recommendations, setRecommendations] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const firestore = useFirestore();

    const handleGetRecommendations = async () => {
        setIsLoading(true);
        setRecommendations([]);
        try {
            const projectsCol = collection(firestore, `users/${student.id}/projects`);
            const achievementsCol = collection(firestore, `users/${student.id}/achievements`);
            const certificatesCol = collection(firestore, `users/${student.id}/certificates`);

            const [projectsSnap, achievementsSnap, certificatesSnap] = await Promise.all([
                getDocs(projectsCol),
                getDocs(achievementsCol),
                getDocs(certificatesCol),
            ]);

            const fullProfile = {
                ...student,
                projects: projectsSnap.docs.map(d => d.data()),
                achievements: achievementsSnap.docs.map(d => d.data()),
                certificates: certificatesSnap.docs.map(d => d.data()),
            };
            const result = await getProfileRecommendations({ profileData: JSON.stringify(fullProfile) });
            setRecommendations(result.recommendations);
             toast({ title: "Tövsiyələr Hazırdır!", description: "Profilinizi gücləndirmək üçün aşağıdakı addımları ata bilərsiniz." });
        } catch (error) {
            console.error("Failed to get AI recommendations:", error);
            toast({ variant: "destructive", title: "Xəta", description: "AI məsləhətçisi ilə əlaqə qurularkən xəta baş verdi." });
        }
        setIsLoading(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="text-amber-500" /> AI Profil Məsləhətçisi</CardTitle>
                <CardDescription>Süni intellektdən profilinizi necə daha cəlbedici edə biləcəyinizlə bağlı fərdi məsləhətlər alın.</CardDescription>
            </CardHeader>
            <CardContent>
                {recommendations.length > 0 && (
                    <div className="space-y-3 mb-4">
                        <ul className="list-disc list-inside space-y-2 text-sm">
                            {recommendations.map((rec, index) => (
                                <li key={index}>{rec}</li>
                            ))}
                        </ul>
                    </div>
                )}
                <Button onClick={handleGetRecommendations} disabled={isLoading}>
                    {isLoading ? 'Analiz edilir...' : (recommendations.length > 0 ? 'Yenidən Tövsiyə Al' : 'Tövsiyələr Al')}
                </Button>
            </CardContent>
        </Card>
    )
}


export default function StudentDashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();
    
    const studentProfile = user as Student;

    useEffect(() => {
        if (!loading && (!user || (user as Student)?.role !== 'student')) {
            router.push('/login');
        }
    }, [user, loading, router]);
    
    const invitationsQuery = useMemoFirebase(() => studentProfile ? query(collection(firestore, `users/${studentProfile.id}/invitations`), where('status', '==', 'gözləyir')) : null, [firestore, studentProfile]);
    const { data: invitations, isLoading: invitationsLoading } = useCollection<Invitation>(invitationsQuery as any);
    const [enrichedInvitations, setEnrichedInvitations] = useState<EnrichedInvitation[]>([]);

    useEffect(() => {
        if (invitations) {
            const enrich = async () => {
                const enriched = await Promise.all(invitations.map(async (inv) => {
                    const projectDoc = await getDoc(doc(firestore, 'projects', inv.projectId));
                    const orgDoc = await getDoc(doc(firestore, 'student-organizations', inv.organizationId));
                    return {
                        ...inv,
                        project: projectDoc.exists() ? { id: projectDoc.id, ...projectDoc.data() } as Project : undefined,
                        organization: orgDoc.exists() ? { id: orgDoc.id, ...orgDoc.data() } as OrgType : undefined,
                    }
                }));
                setEnrichedInvitations(enriched.filter(e => e.project && e.organization) as EnrichedInvitation[]);
            }
            enrich();
        }
    }, [invitations, firestore]);
    
    const handleInvitation = async (invitation: EnrichedInvitation, status: 'qəbul edildi' | 'rədd edildi') => {
        if (!invitation.project || !studentProfile) return;
        
        const invitationDocRef = doc(firestore, `users/${studentProfile.id}/invitations`, invitation.id);
        
        try {
             const batch = writeBatch(firestore);

            batch.update(invitationDocRef, { status });

            if (status === 'qəbul edildi') {
                const projectDocRef = doc(firestore, 'projects', invitation.projectId);
                const updatedTeam = [...(invitation.project.teamMemberIds || []), studentProfile.id];
                batch.update(projectDocRef, { teamMemberIds: updatedTeam });
            }

            await batch.commit();

            setEnrichedInvitations(prev => prev.filter(i => i.id !== invitation.id));

            toast({
                title: `Dəvət ${status === 'qəbul edildi' ? 'qəbul edildi' : 'rədd edildi'}`,
                description: `"${invitation.project.title}" layihəsinə olan dəvətinizə cavab verdiniz.`
            });
        } catch (error) {
            console.error("Error handling invitation:", error);
            toast({ variant: 'destructive', title: 'Xəta', description: 'Dəvətə cavab verilərkən xəta baş verdi.' });
        }
    }

    const profileCompletion = useMemo(() => {
        if (!studentProfile) return 0;
        
        const fields = [
            { value: studentProfile.firstName, weight: 1 },
            { value: studentProfile.lastName, weight: 1 },
            { value: studentProfile.major, weight: 1 },
            { value: studentProfile.educationForm, weight: 1 },
            { value: studentProfile.gpa, weight: 1 },
            { value: studentProfile.skills && studentProfile.skills.length > 1, weight: 2 }, 
            { value: studentProfile.projectIds && studentProfile.projectIds.length > 0, weight: 1.5 },
            { value: (studentProfile.projectIds?.length || 0) > 1, weight: 1 },
            { value: studentProfile.achievementIds && studentProfile.achievementIds.length > 0, weight: 2 },
            { value: (studentProfile.achievementIds?.length || 0) > 1, weight: 1.5 },
            { value: studentProfile.certificateIds && studentProfile.certificateIds.length > 0, weight: 1.5 },
            { value: (studentProfile.certificateIds?.length || 0) > 1, weight: 1 },
            { value: studentProfile.linkedInURL, weight: 1 },
            { value: studentProfile.githubURL, weight: 1 },
            { value: studentProfile.portfolioURL, weight: 1 },
        ];

        const totalWeight = fields.reduce((sum, field) => sum + field.weight, 0);
        const completedWeight = fields.reduce((sum, field) => {
            const fieldValue = field.value;
            const hasValue = typeof fieldValue === 'boolean' ? fieldValue : (fieldValue !== null && fieldValue !== undefined && fieldValue !== '');

            if (hasValue) {
                return sum + field.weight;
            }
            return sum;
        }, 0);
        
        if (totalWeight === 0) return 0;
        return Math.round((completedWeight / totalWeight) * 100);
    }, [studentProfile]);


    if (loading || !user || !studentProfile) {
        return <div className="container mx-auto py-8 text-center">Yüklənir...</div>;
    }
    
    return (
        <div className="container mx-auto py-8 md:py-12 px-4">
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Tələbə Paneli</h1>
                <p className="text-muted-foreground">Xoş gəlmisiniz, {studentProfile.firstName}!</p>
            </div>

             <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Profilin Tamlığı</CardTitle>
                    <CardDescription>Profilinizi tamamlamaq daha çox diqqət çəkməyinizə kömək edər.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Progress value={profileCompletion} className="w-full" />
                        <span className="font-bold text-lg">{profileCompletion}%</span>
                    </div>
                     {profileCompletion < 100 && (
                        <div className="text-sm text-muted-foreground mt-2">
                            Profilinizi daha da gücləndirmək üçün <Link href="/profile/edit" className="text-primary hover:underline">layihə, nailiyyət və sertifikatlarınızı</Link> əlavə edin.
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <DashboardActionCard
                    title="Profilimi İdarə Et"
                    description="Şəxsi məlumatları, layihələri və nailiyyətləri yeniləyin."
                    icon={Edit}
                    href={`/profile/edit`} 
                />
                <DashboardActionCard
                    title="İctimai Profilim"
                    description="Profilinizin digər istifadəçilər tərəfindən necə göründüyünə baxın."
                    icon={User}
                    href={`/profile/${user.id}`}
                />
                 <DashboardActionCard
                    title="Reytinqlərə Bax"
                    description="Platformadakı ümumi sıralamanızı və digər tələbələri izləyin."
                    icon={ClipboardList}
                    href="/rankings"
                />
            </div>
             <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Mail /> Layihə Dəvətləri</CardTitle>
                        <CardDescription>Təşkilatlardan gələn layihə təkliflərinə buradan baxa bilərsiniz.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {invitationsLoading ? <p>Yüklənir...</p> : enrichedInvitations.length > 0 ? (
                            <div className="space-y-4">
                                {enrichedInvitations.map(inv => (
                                    <div key={inv.id} className="border p-4 rounded-lg flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold">{inv.project?.title}</p>
                                            <p className="text-sm text-muted-foreground">{inv.organization?.name}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="icon" variant="outline" className="h-8 w-8 text-green-600 hover:text-green-600" onClick={() => handleInvitation(inv, 'qəbul edildi')}>
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="outline" className="h-8 w-8 text-red-600 hover:text-red-600" onClick={() => handleInvitation(inv, 'rədd edildi')}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                <p>Hazırda yeni dəvətiniz yoxdur.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                 <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mənim Statistikam</CardTitle>
                            <CardDescription>Platformadakı fəaliyyətinizə ümumi baxış.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="p-4 rounded-lg bg-muted">
                                <p className="text-3xl font-bold">{studentProfile.talentScore || 0}</p>
                                <p className="text-sm text-muted-foreground">İstedad Balı</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted">
                                <p className="text-3xl font-bold">{studentProfile.projectIds?.length || 0}</p>
                                <p className="text-sm text-muted-foreground">Layihə Sayı</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted">
                                <p className="text-3xl font-bold">{studentProfile.achievementIds?.length || 0}</p>
                                <p className="text-sm text-muted-foreground">Nailiyyət Sayı</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted">
                                <p className="text-3xl font-bold">{studentProfile.certificateIds?.length || 0}</p>
                                <p className="text-sm text-muted-foreground">Sertifikat Sayı</p>
                            </div>
                        </CardContent>
                    </Card>
                     <AIProfileOptimizer student={studentProfile} />
                </div>
            </div>
        </div>
    );
}

interface DashboardActionCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    href: string;
}

function DashboardActionCard({ title, description, icon: Icon, href }: DashboardActionCardProps) {
    return (
        <Link href={href}>
            <Card className="h-full hover:bg-accent/50 hover:shadow-lg transition-all duration-200">
                <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                        <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-base">{title}</CardTitle>
                        <CardDescription className="mt-1 text-xs">{description}</CardDescription>
                    </div>
                </CardHeader>
            </Card>
        </Link>
    );
}
