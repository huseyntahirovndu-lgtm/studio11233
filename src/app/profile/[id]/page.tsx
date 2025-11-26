'use client';
import { useAuth } from '@/hooks/use-auth';
import { useParams } from 'next/navigation';
import { Student, Project, Achievement, Certificate, Organization, Invitation, Skill, InvitationStatus } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Star, Linkedin, Github, Dribbble, Instagram, Link as LinkIcon, Award, Briefcase, FileText, Bookmark, MailPlus, Book, Youtube } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import NextImage from 'next/image';
import { useDoc, useCollectionOptimized, useFirestore, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where, getDoc, writeBatch } from 'firebase/firestore';


function SocialLink({ href, icon: Icon, text }: { href: string; icon: React.ElementType; text: string }) {
    if (!href) return null;
    return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors">
            <Icon className="w-5 h-5" />
            <span>{text}</span>
        </a>
    );
}

export default function ProfilePage() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const studentId = typeof id === 'string' ? id : '';
  const organization = currentUser?.role === 'organization' ? currentUser as Organization : null;

  const studentDocRef = useMemoFirebase(() => studentId ? doc(firestore, 'users', studentId) : null, [firestore, studentId]);
  const projectsQuery = useMemoFirebase(() => studentId ? collection(firestore, `users/${studentId}/projects`) : null, [firestore, studentId]);
  const achievementsQuery = useMemoFirebase(() => studentId ? collection(firestore, `users/${studentId}/achievements`) : null, [firestore, studentId]);
  const certificatesQuery = useMemoFirebase(() => studentId ? collection(firestore, `users/${studentId}/certificates`) : null, [firestore, studentId]);
  
  const orgProjectsQuery = useMemoFirebase(() => organization?.id ? query(collection(firestore, 'projects'), where('studentId', '==', organization.id)) : null, [firestore, organization?.id]);

  const { data: student, isLoading: studentLoading } = useDoc<Student>(studentDocRef);
  const { data: projectsData, isLoading: projectsLoading } = useCollectionOptimized<Project>(projectsQuery, { enableCache: true, disableRealtimeOnInit: true });
  const { data: achievements, isLoading: achievementsLoading } = useCollectionOptimized<Achievement>(achievementsQuery, { enableCache: true, disableRealtimeOnInit: true });
  const { data: certificates, isLoading: certificatesLoading } = useCollectionOptimized<Certificate>(certificatesQuery, { enableCache: true, disableRealtimeOnInit: true });
  const { data: organizationProjects } = useCollectionOptimized<Project>(orgProjectsQuery, { enableCache: true, disableRealtimeOnInit: true });

  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isInviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  
  const isLoading = studentLoading || projectsLoading || achievementsLoading || certificatesLoading;

  useEffect(() => {
    if (projectsData && firestore) {
      const fetchTeamMembers = async () => {
        const enrichedProjects = await Promise.all(
          projectsData.map(async (project) => {
            if (project.teamMemberIds && project.teamMemberIds.length > 0) {
              const memberNames = await Promise.all(
                project.teamMemberIds.map(async (memberId) => {
                  try {
                    const userDoc = await getDoc(doc(firestore, 'users', memberId));
                    if (userDoc.exists()) {
                      const userData = userDoc.data() as Student;
                      return `${userData.firstName} ${userData.lastName}`;
                    }
                  } catch (e) {
                     console.error("Error fetching team member:", e);
                  }
                  return 'Naməlum Üzv';
                })
              );
              return { ...project, teamMembers: memberNames };
            }
            return project;
          })
        );
        setProjects(enrichedProjects);
      };
      fetchTeamMembers();
    } else if (projectsData) {
        setProjects(projectsData);
    }
  }, [projectsData, firestore]);

  const isAllowedToView = student?.status === 'təsdiqlənmiş' || currentUser?.role === 'admin' || currentUser?.id === student?.id;


  const isSaved = organization?.savedStudentIds?.includes(studentId);

  const handleBookmark = () => {
    if (!organization || !student) return;

    const orgDocRef = doc(firestore, 'users', organization.id);
    const currentSavedIds = organization.savedStudentIds || [];
    const newSavedStudentIds = isSaved
      ? currentSavedIds.filter(id => id !== student.id)
      : [...currentSavedIds, student.id];

    updateDocumentNonBlocking(orgDocRef, { savedStudentIds: newSavedStudentIds });

    toast({
      title: isSaved ? "Siyahıdan çıxarıldı" : "Yadda saxlanıldı",
      description: `${student.firstName} ${student.lastName} ${isSaved ? 'yaddaş siyahısından çıxarıldı.' : 'yaddaş siyahısına əlavə edildi.'}`,
    });
  };
  
  const handleInvite = async () => {
    if (!organization || !student || !selectedProject || !organizationProjects || !firestore) {
        toast({ variant: 'destructive', title: 'Xəta', description: 'Dəvət üçün layihə seçilməlidir.' });
        return;
    }
    
    const project = organizationProjects.find(p => p.id === selectedProject);
    if (!project) {
        toast({ variant: 'destructive', title: 'Xəta', description: 'Seçilmiş layihə tapılmadı.' });
        return;
    }

    const isAlreadyMember = project.teamMemberIds?.includes(student.id);

    if (isAlreadyMember) {
        toast({ variant: 'destructive', title: 'Xəta', description: 'Bu tələbə artıq bu layihənin üzvüdür.' });
        return;
    }
    
    const invitationsColRef = collection(firestore, `users/${student.id}/invitations`);
    const newInvitationRef = doc(invitationsColRef);

    const invitationData: Invitation = {
        id: newInvitationRef.id,
        organizationId: organization.id,
        studentId: student.id,
        projectId: selectedProject,
        status: 'gözləyir' as InvitationStatus,
        createdAt: new Date(),
    };
    
    const batch = writeBatch(firestore);
    batch.set(newInvitationRef, invitationData);

    const projectDocRef = doc(firestore, 'projects', selectedProject);
    batch.update(projectDocRef, {
      invitedStudentIds: [...(project.invitedStudentIds || []), student.id]
    });

    await batch.commit();

    toast({
        title: 'Dəvət Göndərildi',
        description: `${student.firstName} ${student.lastName} tələbəsi "${project.title}" layihəsinə dəvət edildi.`,
    });
    setInviteDialogOpen(false);
    setSelectedProject('');
  }

  if (isLoading) {
    return <div className="container mx-auto py-8 text-center">Yüklənir...</div>;
  }
  
  if (!isAllowedToView) {
    return <div className="container mx-auto py-8 text-center">Tələbə tapılmadı və ya profil təsdiqlənməyib.</div>;
  }

  if (!student) {
    return <div className="container mx-auto py-8 text-center">Tələbə tapılmadı.</div>;
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  }

  const getSkillBadgeVariant = (level: Skill['level']) => {
    switch (level) {
      case 'İrəli':
        return 'default';
      case 'Orta':
        return 'secondary';
      case 'Başlanğıc':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getProjectOwner = (project: Project): { name: string; logoUrl?: string; profilePictureUrl?: string } => {
    if (project.studentId === student.id) {
        return { name: `${student.firstName} ${student.lastName}`, profilePictureUrl: student.profilePictureUrl };
    }
    return { name: 'Təşkilat Layihəsi' };
  };


  return (
      <main className="flex-1">
        <div className="container mx-auto max-w-6xl py-8 md:py-12 px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Sidebar */}
            <div className="md:col-span-1 space-y-6">
              <Card>
                <CardContent className="pt-6 flex flex-col items-center text-center">
                  <Avatar className="h-32 w-32 mb-4 border-4 border-primary/20 shadow-lg">
                    <AvatarImage src={student.profilePictureUrl} alt={`${student.firstName} ${student.lastName}`} />
                    <AvatarFallback className="text-4xl">{getInitials(student.firstName, student.lastName)}</AvatarFallback>
                  </Avatar>
                  <h1 className="text-2xl font-bold">{`${student.firstName} ${student.lastName}`}</h1>
                  <p className="text-muted-foreground">{student.major}</p>
                  <p className="text-sm text-muted-foreground">{student.faculty}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-5 h-5 fill-current" />
                        <span className="font-bold text-lg text-foreground">{student.talentScore || 'N/A'}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">İstedad Balı</p>
                  </div>
                  {student.status !== 'təsdiqlənmiş' && (
                      <Badge variant="destructive" className="mt-2">Təsdiqlənməyib</Badge>
                  )}
                   {organization && (
                    <div className='flex items-center gap-2 mt-4 w-full'>
                        <Button onClick={handleBookmark} variant={isSaved ? 'default' : 'outline'} className="w-full">
                            <Bookmark className={cn("mr-2 h-4 w-4", isSaved && "fill-current")} />
                            {isSaved ? 'Yaddaşdan çıxar' : 'Yadda saxla'}
                        </Button>
                        <Dialog open={isInviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <MailPlus className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <div className="flex items-center gap-3 mb-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={organization.logoUrl} />
                                            <AvatarFallback>{organization.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <DialogTitle>Layihəyə Dəvət Et</DialogTitle>
                                            <DialogDescription>
                                                {student.firstName} {student.lastName} tələbəsini hansı layihəyə dəvət etmək istəyirsiniz?
                                            </DialogDescription>
                                        </div>
                                    </div>
                                </DialogHeader>
                                <div className="py-4">
                                    <Select onValueChange={setSelectedProject}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Layihə seçin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {organizationProjects?.map(proj => (
                                                <SelectItem key={proj.id} value={proj.id}>{proj.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild><Button variant="outline">Ləğv et</Button></DialogClose>
                                    <Button onClick={handleInvite}>Dəvət Göndər</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                  <CardHeader>
                      <CardTitle>Bacarıqlar</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                      {student.skills?.map((skill, index) => (
                          <Badge key={index} variant={getSkillBadgeVariant(skill.level)} className="text-sm py-1">
                            {skill.name}
                          </Badge>
                      ))}
                      {(!student.skills || student.skills.length === 0) && <p className="text-sm text-muted-foreground">Heç bir bacarıq qeyd edilməyib.</p>}
                  </CardContent>
              </Card>
               <Card>
                  <CardHeader>
                      <CardTitle>Sosial Hesablar</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                      <SocialLink href={student.linkedInURL} icon={Linkedin} text="LinkedIn" />
                      <SocialLink href={student.githubURL} icon={Github} text="GitHub" />
                      <SocialLink href={student.behanceURL} icon={Dribbble} text="Behance" />
                      <SocialLink href={student.instagramURL} icon={Instagram} text="Instagram" />
                      <SocialLink href={student.portfolioURL} icon={LinkIcon} text="Portfolio" />
                      <SocialLink href={student.googleScholarURL} icon={Book} text="Google Scholar" />
                      <SocialLink href={student.youtubeURL} icon={Youtube} text="YouTube" />
                       {!student.linkedInURL && !student.githubURL && !student.behanceURL && !student.instagramURL && !student.portfolioURL && !student.googleScholarURL && !student.youtubeURL && <p className="text-sm text-muted-foreground">Heç bir sosial hesab qeyd edilməyib.</p>}
                  </CardContent>
              </Card>
            </div>

            {/* Right Content */}
            <div className="md:col-span-2 space-y-8">
                {projects && projects.length > 0 && (
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Briefcase /> Layihələr</CardTitle>
                        </CardHeader>
                        <CardContent className="divide-y">
                            {projects.map((project) => {
                                const owner = getProjectOwner(project);
                                return (
                                    <div key={project.id} className="py-4 first:pt-0 last:pb-0">
                                        <h3 className="font-semibold">{project.title} <span className="text-sm font-normal text-muted-foreground">- {project.role}</span></h3>
                                        
                                         <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                            <Avatar className="h-4 w-4">
                                                <AvatarImage src={owner.logoUrl || owner.profilePictureUrl} />
                                                <AvatarFallback>{owner.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span>{owner.name}</span>
                                        </div>
                                        
                                        <p className="text-sm text-muted-foreground mt-2">{project.description}</p>
                                        
                                        {project.teamMembers && project.teamMembers.length > 0 && (
                                        <p className="text-xs text-muted-foreground mt-1"><strong>Komanda:</strong> {project.teamMembers.join(', ')}</p>
                                        )}
                                        {project.link && <Button variant="link" asChild className="p-0 h-auto mt-1"><a href={project.link} target="_blank" rel="noopener noreferrer">Layihəyə bax</a></Button>}
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>
                )}

                {achievements && achievements.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Award /> Nailiyyətlər</CardTitle>
                        </CardHeader>
                        <CardContent className="divide-y">
                           {achievements.map((ach) => (
                               <div key={ach.id} className="py-4 first:pt-0 last:pb-0">
                                   <div className="flex items-start justify-between">
                                      <div>
                                          <h3 className="font-semibold">{ach.name}</h3>
                                          <p className="text-sm text-muted-foreground">{ach.position} - {ach.level}</p>
                                          {ach.description && <p className="text-sm text-muted-foreground mt-1">{ach.description}</p>}
                                      </div>
                                      <p className="text-sm text-muted-foreground whitespace-nowrap pl-4">{new Date(ach.date).toLocaleDateString()}</p>
                                   </div>
                                    {ach.link && <Button variant="link" asChild className="p-0 h-auto mt-1"><a href={ach.link} target="_blank" rel="noopener noreferrer">Təsdiqə bax</a></Button>}
                               </div>
                           ))}
                        </CardContent>
                    </Card>
                )}

                {certificates && certificates.length > 0 && (
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><FileText /> Sertifikatlar</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {certificates.map((cert) => (
                                <a key={cert.id} href={cert.certificateURL} target="_blank" rel="noopener noreferrer" className="block border rounded-lg overflow-hidden hover:opacity-80 transition-opacity group">
                                   <div className="bg-muted h-24 flex items-center justify-center relative">
                                      {cert.certificateURL.match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                                        <NextImage src={cert.certificateURL} alt={cert.name} fill objectFit="cover" />
                                      ) : (
                                        <FileText className="w-8 h-8 text-muted-foreground" />
                                      )}
                                   </div>
                                   <p className="p-2 text-xs text-center font-medium truncate group-hover:text-primary" title={cert.name}>{cert.name}</p>
                                </a>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>
          </div>
        </div>
      </main>
  );
}
