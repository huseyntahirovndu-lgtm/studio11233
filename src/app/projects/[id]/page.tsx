'use client';
import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useAuth, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { Project, StudentOrganization, Student, Application } from '@/types';
import { doc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Calendar, Users, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

function ProjectDetailsLoading() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <div className="flex items-center gap-4">
             <Skeleton className="h-12 w-12 rounded-full" />
             <Skeleton className="h-6 w-1/3" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <Skeleton className="h-12 w-48" />
        </div>
        <div className="md:col-span-1 space-y-6">
           <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const projectId = typeof id === 'string' ? id : '';

  const [hasApplied, setHasApplied] = useState(false);
  const [isCheckingApplication, setIsCheckingApplication] = useState(true);

  const projectDocRef = useMemoFirebase(() => (firestore && projectId ? doc(firestore, 'projects', projectId) : null), [firestore, projectId]);
  const { data: project, isLoading: projectLoading } = useDoc<Project>(projectDocRef);
  
  const orgDocRef = useMemoFirebase(() => (firestore && project?.ownerType === 'organization' ? doc(firestore, 'student-organizations', project.ownerId) : null), [firestore, project]);
  const { data: organization, isLoading: orgLoading } = useDoc<StudentOrganization>(orgDocRef);
  
  const teamMembersQuery = useMemoFirebase(() => (firestore && project?.teamMemberIds && project.teamMemberIds.length > 0 ? query(collection(firestore, 'users'), where(doc.id, 'in', project.teamMemberIds)) : null), [firestore, project]);
  const { data: teamMembers, isLoading: membersLoading } = useCollection<Student>(teamMembersQuery);

  const isLoading = projectLoading || orgLoading || authLoading || membersLoading;

  // Check if the current student has already applied
  useEffect(() => {
    const checkApplication = async () => {
      if (user?.role === 'student' && project) {
        setIsCheckingApplication(true);
        const applicationsRef = collection(firestore, 'applications');
        const q = query(applicationsRef, where('studentId', '==', user.id), where('projectId', '==', project.id));
        const querySnapshot = await getDocs(q);
        setHasApplied(!querySnapshot.empty);
        setIsCheckingApplication(false);
      } else {
        setIsCheckingApplication(false);
      }
    };
    checkApplication();
  }, [user, project, firestore]);


  const handleApply = async () => {
    if (!user || user.role !== 'student' || !project || !organization) {
      toast({ variant: 'destructive', title: 'Xəta', description: 'Müraciət etmək üçün tələbə kimi daxil olmalısınız.' });
      return;
    }

    const applicationData: Omit<Application, 'id'> = {
      studentId: user.id,
      projectId: project.id,
      organizationId: organization.id,
      status: 'gözləyir',
      createdAt: new Date(),
    };
    
    await addDocumentNonBlocking(collection(firestore, 'applications'), applicationData);
    
    // Also update the project's applicants list
    const projectRef = doc(firestore, 'projects', project.id);
    const updatedApplicants = [...(project.applicantIds || []), user.id];
    await updateDocumentNonBlocking(projectRef, { applicantIds: updatedApplicants });

    toast({ title: 'Uğurlu', description: `"${project.title}" layihəsinə müraciətiniz göndərildi.` });
    setHasApplied(true);
  };

  if (isLoading || isCheckingApplication) {
    return <ProjectDetailsLoading />;
  }
  
  if (!project || !organization) {
    return <div className="text-center py-20">Layihə tapılmadı.</div>;
  }
  
  const canApply = user?.role === 'student' && !project.teamMemberIds?.includes(user.id) && !hasApplied;

  return (
    <main className="container mx-auto max-w-5xl py-8 md:py-12 px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Badge variant={project.status === 'aktiv' ? 'default' : 'secondary'} className="text-base">
            {project.status === 'aktiv' ? 'Aktiv' : 'Bitmiş'}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold">{project.title}</h1>
          <Link href={`/telebe-teskilatlari/${organization.id}`} className="flex items-center gap-3 group">
              <Avatar>
                <AvatarImage src={organization.logoUrl} />
                <AvatarFallback><Building /></AvatarFallback>
              </Avatar>
              <h2 className="text-lg font-semibold text-muted-foreground group-hover:text-primary">{organization.name}</h2>
          </Link>

          <Card>
            <CardHeader>
                <CardTitle>Layihə Haqqında</CardTitle>
            </CardHeader>
             <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{project.description}</p>
                {project.link && (
                    <Button asChild variant="link" className="px-0 mt-4">
                        <a href={project.link} target="_blank" rel="noopener noreferrer">Daha çox məlumat üçün keçid</a>
                    </Button>
                )}
             </CardContent>
          </Card>
          
          {project.status === 'aktiv' && canApply && (
            <Button size="lg" onClick={handleApply}>Müraciət Et</Button>
          )}

          {hasApplied && (
             <div className="flex items-center gap-2 p-4 rounded-md bg-green-100 text-green-800 border border-green-200">
                <CheckCircle className="h-5 w-5" />
                <p className="font-medium">Bu layihəyə müraciət etmisiniz.</p>
             </div>
          )}

        </div>

        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar /> Tarix</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Elan tarixi: {project.createdAt?.toDate ? format(project.createdAt.toDate(), 'dd MMMM, yyyy') : 'Naməlum'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users /> Komanda</CardTitle>
            </CardHeader>
             <CardContent className="space-y-3">
              {teamMembers && teamMembers.length > 0 ? (
                teamMembers.map(member => (
                   <Link key={member.id} href={`/profile/${member.id}`} className="flex items-center gap-3 group">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.profilePictureUrl} />
                        <AvatarFallback>{member.firstName?.charAt(0)}{member.lastName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-sm group-hover:underline">{member.firstName} {member.lastName}</p>
                   </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Hələ heç bir üzv qoşulmayıb.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
