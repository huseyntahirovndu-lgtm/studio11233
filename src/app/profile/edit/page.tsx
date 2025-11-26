'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, useRef, Suspense, ChangeEvent } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Student, Project, Achievement, Certificate, AchievementLevel, Skill, SkillLevel } from '@/types';
import { calculateTalentScore } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Trash2, PlusCircle, Award, Briefcase, FileText, User as UserIcon, X, Link, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, writeBatch, getDocs, query, setDoc, where } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import AvatarEditor from 'react-avatar-editor';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';


const skillSchema = z.object({
    name: z.string().min(1, "Bacarıq adı boş ola bilməz."),
    level: z.enum(['Başlanğıc', 'Orta', 'İrəli']),
});

const profileSchema = z.object({
  firstName: z.string().min(2, "Ad ən azı 2 hərf olmalıdır."),
  lastName: z.string().min(2, "Soyad ən azı 2 hərf olmalıdır."),
  profilePictureUrl: z.string().url("Etibarlı bir URL daxil edin.").or(z.literal('')).optional(),
  major: z.string().min(2, "İxtisas boş ola bilməz."),
  courseYear: z.coerce.number().min(1, "Təhsil ilini seçin.").max(6),
  educationForm: z.string().optional(),
  gpa: z.coerce.number({invalid_type_error: "ÜOMG mütləq qeyd edilməlidir."}).min(0, "ÜOMG 0-dan az ola bilməz.").max(100, "ÜOMG 100-dən çox ola bilməz."),
  skills: z.array(skillSchema).optional(),
  successStory: z.string().optional(),
  linkedInURL: z.string().url().or(z.literal('')).optional(),
  githubURL: z.string().url().or(z.literal('')).optional(),
  behanceURL: z.string().url().or(z.literal('')).optional(),
  instagramURL: z.string().url().or(z.literal('')).optional(),
  portfolioURL: z.string().url().or(z.literal('')).optional(),
  googleScholarURL: z.string().url().or(z.literal('')).optional(),
  youtubeURL: z.string().url().or(z.literal('')).optional(),
});

const projectSchema = z.object({
  title: z.string().min(3, "Layihə adı boş ola bilməz."),
  description: z.string().min(10, "Təsvir ən azı 10 hərf olmalıdır."),
  role: z.string().min(2, "Rol boş ola bilməz."),
  teamMembers: z.string().optional().transform(val => val ? val.split(',').map(s => s.trim()).filter(Boolean) : []),
  link: z.string().url().or(z.literal('')),
  status: z.enum(['davam edir', 'tamamlanıb']),
});

const achievementSchema = z.object({
  name: z.string().min(3, "Nailiyyət adı boş ola bilməz."),
  description: z.string().optional(),
  position: z.string().min(1, "Dərəcə boş ola bilməz."),
  level: z.enum(['Beynəlxalq', 'Respublika', 'Regional', 'Universitet']),
  date: z.string().min(1, "Tarix boş ola bilməz."),
  link: z.string().url().or(z.literal('')),
});

const certificateSchema = z.object({
    name: z.string().min(3, "Sertifikat adı boş ola bilməz."),
    certificateURL: z.string().url({ message: "Etibarlı bir link daxil edin." }).optional().or(z.literal('')),
    level: z.enum(['Beynəlxalq', 'Respublika', 'Regional', 'Universitet']),
});

const SKILL_LEVELS: SkillLevel[] = ['Başlanğıc', 'Orta', 'İrəli'];

function EditProfilePageComponent() {
  const { user: currentUser, loading, updateUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1.2);
  
  const editorRef = useRef<AvatarEditor>(null);
  const userIdFromQuery = searchParams.get('userId');
  const userIdToFetch = currentUser?.role === 'admin' && userIdFromQuery ? userIdFromQuery : currentUser?.id;
  
  const userDocRef = useMemoFirebase(() => userIdToFetch ? doc(firestore, 'users', userIdToFetch) : null, [firestore, userIdToFetch]);
  const { data: targetUser, isLoading: userLoading } = useDoc<Student>(userDocRef);

  const projectsQuery = useMemoFirebase(() => userIdToFetch ? collection(firestore, `users/${userIdToFetch}/projects`) : null, [firestore, userIdToFetch]);
  const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

  const achievementsQuery = useMemoFirebase(() => userIdToFetch ? collection(firestore, `users/${userIdToFetch}/achievements`) : null, [firestore, userIdToFetch]);
  const { data: achievements, isLoading: achievementsLoading } = useCollection<Achievement>(achievementsQuery);

  const certificatesQuery = useMemoFirebase(() => userIdToFetch ? collection(firestore, `users/${userIdToFetch}/certificates`) : null, [firestore, userIdToFetch]);
  const { data: certificates, isLoading: certificatesLoading } = useCollection<Certificate>(certificatesQuery);

  const [skillInput, setSkillInput] = useState('');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('Başlanğıc');
  const skillInputRef = useRef<HTMLInputElement>(null);
  const profilePictureInputRef = useRef<HTMLInputElement>(null);
  const certificateFileInputRef = useRef<HTMLInputElement>(null);

  const triggerTalentScoreUpdate = useCallback(async (userId: string) => {
    if (!firestore) return;
    setIsSaving(true);
    toast({ title: "İstedad Balı Hesablanır...", description: "Profiliniz yenilənir, bu proses bir az vaxt ala bilər." });

    try {
        const allUsersSnapshot = await getDocs(query(collection(firestore, 'users'), where('role', '==', 'student')));
        
        const allStudentsContext = await Promise.all(allUsersSnapshot.docs.map(async (userDoc) => {
            const data = userDoc.data() as Student;
            const studentId = userDoc.id;

            const projectsSnap = await getDocs(collection(firestore, `users/${studentId}/projects`));
            const achievementsSnap = await getDocs(collection(firestore, `users/${studentId}/achievements`));
            const certificatesSnap = await getDocs(collection(firestore, `users/${studentId}/certificates`));

            return {
                id: studentId,
                talentScore: data.talentScore || 0,
                skills: data.skills || [],
                gpa: data.gpa || 0,
                courseYear: data.courseYear || 1,
                projects: projectsSnap.docs.map(d => d.data()),
                achievements: achievementsSnap.docs.map(d => d.data()),
                certificates: certificatesSnap.docs.map(d => d.data()),
            };
        }));

        if (allStudentsContext.length === 0) {
            throw new Error("No students found to compare against.");
        }
        
        const scoreResult = await calculateTalentScore({
            targetStudentId: userId,
            allStudents: allStudentsContext as any,
        });
        
        const targetUserDoc = doc(firestore, 'users', userId);
        await updateDocumentNonBlocking(targetUserDoc, { talentScore: scoreResult.talentScore });

        toast({ title: "Profil Yeniləndi!", description: `Yeni istedad balınız: ${scoreResult.talentScore}. Səbəb: ${scoreResult.reasoning}` });
    } catch (error: any) {
        console.error("Error updating talent score:", error);
        toast({ variant: "destructive", title: "Xəta", description: `İstedad balını yeniləyərkən xəta baş verdi: ${error.message}` });
    } finally {
        setIsSaving(false);
    }
  }, [firestore, toast]);
  
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);


  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
    defaultValues: {
        skills: [],
    }
  });
  
  const { control: profileControl, watch: watchProfile, setValue: setProfileValue } = profileForm;
  const skills = watchProfile('skills', []);
  const profilePictureUrl = watchProfile('profilePictureUrl');

  const projectForm = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: { title: '', description: '', role: '', teamMembers: [], link: '', status: 'davam edir' }
  });

  const achievementForm = useForm<z.infer<typeof achievementSchema>>({
    resolver: zodResolver(achievementSchema),
    defaultValues: { name: '', description: '', position: '', level: 'Universitet', date: '', link: '' }
  });
  
  const certificateForm = useForm<z.infer<typeof certificateSchema>>({
    resolver: zodResolver(certificateSchema),
    defaultValues: { name: '', level: 'Universitet', certificateURL: '' }
  });

  useEffect(() => {
    if (targetUser) {
      profileForm.reset({
        firstName: targetUser.firstName || '',
        lastName: targetUser.lastName || '',
        profilePictureUrl: targetUser.profilePictureUrl || '',
        major: targetUser.major || '',
        courseYear: targetUser.courseYear || undefined,
        educationForm: targetUser.educationForm || '',
        gpa: targetUser.gpa || 0,
        skills: targetUser.skills || [],
        successStory: targetUser.successStory || '',
        linkedInURL: targetUser.linkedInURL || '',
        githubURL: targetUser.githubURL || '',
        behanceURL: targetUser.behanceURL || '',
        instagramURL: targetUser.instagramURL || '',
        portfolioURL: targetUser.portfolioURL || '',
        googleScholarURL: targetUser.googleScholarURL || '',
        youtubeURL: targetUser.youtubeURL || '',
      });
    }
  }, [targetUser, profileForm]);
  
  const handleFileUpload = async (file: File, type: 'sekil' | 'sened'): Promise<string | null> => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    const endpoint = type === 'sekil' ? '/api/upload/sekiller' : '/api/upload/senedler';

    try {
        const response = await fetch(endpoint, { method: 'POST', body: formData });
        const result = await response.json();
        if (result.success) {
            toast({ title: "Fayl uğurla yükləndi." });
            return result.url;
        } else {
            throw new Error(result.error || 'Fayl yüklənərkən xəta baş verdi.');
        }
    } catch (err: any) {
        toast({ variant: 'destructive', title: "Yükləmə Xətası", description: err.message });
        return null;
    } finally {
        setIsUploading(false);
    }
  };

  const onProfilePictureChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setEditorOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCroppedImage = async () => {
    if (editorRef.current) {
      const canvas = editorRef.current.getImageScaledToCanvas();
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
          const url = await handleFileUpload(file, 'sekil');
          if (url) {
            setProfileValue('profilePictureUrl', url, { shouldValidate: true, shouldDirty: true });
            if (currentUser && userDocRef && currentUser.id === userDocRef.id) {
              updateUser({ ...currentUser, profilePictureUrl: url });
            }
            setEditorOpen(false);
            setImageSrc(null);
          }
        }
      }, 'image/jpeg');
    }
  };

    const onProfileSubmit: SubmitHandler<z.infer<typeof profileSchema>> = (data) => {
      if (!targetUser || !userDocRef) return;
      
      const updateData: { [key: string]: any } = { ...data };
      if (updateData.gpa === '' || updateData.gpa === null || isNaN(Number(updateData.gpa))) {
          updateData.gpa = 0;
      } else {
          updateData.gpa = Number(updateData.gpa);
      }
      
      if (!updateData.skills) {
        updateData.skills = [];
      }

      setDoc(userDocRef, updateData, { merge: true });
      if (currentUser && currentUser.id === targetUser.id) {
        updateUser(updateData);
      }
      
      triggerTalentScoreUpdate(targetUser.id);
      toast({ title: "Profil məlumatları yeniləndi" });
    };
  
  const onProjectSubmit: SubmitHandler<z.infer<typeof projectSchema>> = (data) => {
    if (!targetUser || !firestore) return;
    const projectCollectionRef = collection(firestore, `users/${targetUser.id}/projects`);
    addDocumentNonBlocking(projectCollectionRef, { 
      ...data, 
      ownerId: targetUser.id, 
      ownerType: 'student',
      teamMemberIds: [], 
      invitedStudentIds: [] 
    });
    projectForm.reset();
    triggerTalentScoreUpdate(targetUser.id); 
    toast({ title: "Layihə əlavə edildi" });
  };
  
  const onAchievementSubmit: SubmitHandler<z.infer<typeof achievementSchema>> = (data) => {
    if (!targetUser || !firestore) return;
    const achievementCollectionRef = collection(firestore, `users/${targetUser.id}/achievements`);
    addDocumentNonBlocking(achievementCollectionRef, { ...data, studentId: targetUser.id });
    achievementForm.reset();
    triggerTalentScoreUpdate(targetUser.id);
    toast({ title: "Nailiyyət əlavə edildi" });
  };
  
 const onCertificateSubmit: SubmitHandler<z.infer<typeof certificateSchema>> = async (data) => {
    if (!targetUser || !firestore) return;

    let finalCertificateURL = data.certificateURL;
    const fileInput = certificateFileInputRef.current;
    
    if (fileInput && fileInput.files && fileInput.files[0]) {
        const url = await handleFileUpload(fileInput.files[0], 'sened');
        if (url) {
            finalCertificateURL = url;
        } else {
            return;
        }
    }

    if (!finalCertificateURL) {
        toast({ variant: 'destructive', title: "Xəta", description: "Sertifikat üçün fayl yükləməli və ya link daxil etməlisiniz."});
        return;
    }

    const certificateCollectionRef = collection(firestore, `users/${targetUser.id}/certificates`);
    addDocumentNonBlocking(certificateCollectionRef, { ...data, certificateURL: finalCertificateURL, studentId: targetUser.id });
    
    certificateForm.reset();
    if(fileInput) fileInput.value = '';
    
    triggerTalentScoreUpdate(targetUser.id);
    toast({ title: "Sertifikat əlavə edildi" });
  };

  const handleDelete = async (docId: string, itemType: 'project' | 'achievement' | 'certificate') => {
      if (!targetUser || !firestore) return;
      
      const batch = writeBatch(firestore);
      let docRef;
      
      switch (itemType) {
          case 'project': 
            docRef = doc(firestore, `users/${targetUser.id}/projects`, docId);
            break;
          case 'achievement': 
            docRef = doc(firestore, `users/${targetUser.id}/achievements`, docId);
            break;
          case 'certificate': 
            docRef = doc(firestore, `users/${targetUser.id}/certificates`, docId);
            break;
      }
      batch.delete(docRef);

      await batch.commit();

      triggerTalentScoreUpdate(targetUser.id);
      toast({ title: "Element silindi", description: "Seçilmiş element uğurla silindi." });
  };

  const handleSkillAdd = async () => {
    const trimmedInput = skillInput.trim();
    if (trimmedInput) {
        const newSkill: Skill = { name: trimmedInput, level: skillLevel };
        const currentSkills = profileForm.getValues('skills') || [];
        if (!currentSkills.some(s => s && s.name && s.name.toLowerCase() === newSkill.name.toLowerCase())) {
            setProfileValue('skills', [...currentSkills, newSkill], { shouldValidate: true });
            setSkillInput('');
            setSkillLevel('Başlanğıc');
            skillInputRef.current?.focus();
        } else {
            toast({ variant: 'destructive', title: 'Bu bacarıq artıq mövcuddur.' });
        }
    }
};

  const handleSkillRemove = (skillToRemove: string) => {
    setProfileValue('skills', (skills || []).filter(skill => skill.name !== skillToRemove));
  };


  if (loading || userLoading) {
    return <div className="container mx-auto py-8 text-center">Yüklənir...</div>;
  }

  if (!targetUser) {
    return <div className="container mx-auto py-8 text-center">İstifadəçi tapılmadı.</div>
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  }

  return (
    <>
    <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>Profil Şəklini Tənzimlə</DialogTitle>
                <DialogDescription>
                    Şəkli yaxınlaşdırın və çərçivəyə uyğunlaşdırın.
                </DialogDescription>
            </DialogHeader>
            {imageSrc && (
                <div className="flex flex-col items-center gap-4">
                     <AvatarEditor
                        ref={editorRef}
                        image={imageSrc}
                        width={250}
                        height={250}
                        border={50}
                        borderRadius={125}
                        color={[0, 0, 0, 0.6]} // RGBA
                        scale={zoom}
                        rotate={0}
                    />
                     <div className="w-full max-w-xs space-y-2">
                        <Label htmlFor="zoom">Yaxınlaşdırma</Label>
                        <Slider
                            id="zoom"
                            min={1}
                            max={3}
                            step={0.1}
                            value={[zoom]}
                            onValueChange={(value) => setZoom(value[0])}
                        />
                    </div>
                </div>
            )}
            <DialogFooter>
                <Button variant="outline" onClick={() => setEditorOpen(false)}>Ləğv et</Button>
                <Button onClick={handleSaveCroppedImage} disabled={isUploading}>
                    {isUploading ? "Yadda saxlanılır..." : "Yadda Saxla"}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>


    <div className="container mx-auto max-w-4xl py-8 md:py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Profili Redaktə Et</h1>
        <p className="text-muted-foreground">Profil məlumatlarınızı, layihə və nailiyyətlərinizi buradan idarə edin.</p>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserIcon /> Şəxsi Məlumatlar</CardTitle>
            <CardDescription>Əsas profil məlumatlarınızı, bacarıqlarınızı və sosial media hesablarınızı yeniləyin.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField name="firstName" control={profileForm.control} render={({ field }) => (
                    <FormItem><FormLabel>Ad</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField name="lastName" control={profileForm.control} render={({ field }) => (
                    <FormItem><FormLabel>Soyad</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                 
                 <FormItem>
                    <FormLabel>Profil Şəkli</FormLabel>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={profilePictureUrl} />
                            <AvatarFallback>{getInitials(targetUser.firstName, targetUser.lastName)}</AvatarFallback>
                        </Avatar>
                        <Button type="button" onClick={() => profilePictureInputRef.current?.click()} disabled={isUploading}>
                            <Upload className="mr-2 h-4 w-4" />
                            {isUploading ? 'Yüklənir...' : 'Şəkil Dəyiş'}
                        </Button>
                        <Input 
                            ref={profilePictureInputRef}
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={onProfilePictureChange}
                        />
                    </div>
                </FormItem>


                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <FormField name="major" control={profileForm.control} render={({ field }) => (
                        <FormItem><FormLabel>İxtisas</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField name="courseYear" control={profileForm.control} render={({ field }) => (
                        <FormItem>
                            <FormLabel>Təhsil ili</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ? String(field.value) : ""}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Təhsil ilini seçin" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {[1, 2, 3, 4, 5, 6].map(y => <SelectItem key={y} value={String(y)}>{y}-ci kurs</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                 </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField name="educationForm" control={profileForm.control} render={({ field }) => (
                      <FormItem><FormLabel>Təhsil Forması</FormLabel><FormControl><Input {...field} placeholder="Əyani / Qiyabi" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField name="gpa" control={profileForm.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Keçən ilki ÜOMG (GPA)</FormLabel>
                        <FormControl><Input type="number" step="0.1" {...field} placeholder="Məs: 85.5" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                 <FormField name="skills" control={profileControl} render={() => (
                    <FormItem>
                        <FormLabel>Bacarıqlar</FormLabel>
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                            <Input
                                ref={skillInputRef}
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSkillAdd(); } }}
                                placeholder="Bacarıq adı"
                                className="w-full"
                            />
                            <div className="flex w-full sm:w-auto gap-2 mt-2 sm:mt-0">
                                <Select value={skillLevel} onValueChange={(value: SkillLevel) => setSkillLevel(value)}>
                                    <SelectTrigger className="w-full sm:w-[150px]">
                                        <SelectValue placeholder="Səviyyə seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SKILL_LEVELS.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Button type="button" onClick={handleSkillAdd} className="w-full sm:w-auto">Əlavə et</Button>
                            </div>
                        </div>
                        <FormMessage />
                        <div className="flex flex-wrap gap-2 pt-2">
                            {skills && skills.map((skill) => (
                                <Badge key={skill.name} variant="secondary" className="flex items-center gap-2 text-sm">
                                    {skill.name} <span className="text-xs opacity-70">({skill.level})</span>
                                    <button type="button" onClick={() => handleSkillRemove(skill.name)} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </FormItem>
                  )} />
                <Separator />
                <h3 className="text-lg font-medium">Uğur Hekayəsi</h3>
                 <FormField
                    control={profileForm.control}
                    name="successStory"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Uğur Hekayəm</FormLabel>
                        <FormControl>
                            <Textarea
                            placeholder="Platforma sayəsində qazandığınız bir uğuru və ya təcrübəni burada paylaşın..."
                            className="min-h-[100px]"
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                 />

                <Separator />
                <h3 className="text-lg font-medium">Sosial Linklər</h3>
                 <FormField name="linkedInURL" control={profileForm.control} render={({ field }) => (
                    <FormItem><FormLabel>LinkedIn URL</FormLabel><FormControl><Input placeholder="https://linkedin.com/in/..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField name="githubURL" control={profileForm.control} render={({ field }) => (
                    <FormItem><FormLabel>GitHub URL</FormLabel><FormControl><Input placeholder="https://github.com/..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField name="behanceURL" control={profileForm.control} render={({ field }) => (
                    <FormItem><FormLabel>Behance URL</FormLabel><FormControl><Input placeholder="https://behance.net/..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField name="instagramURL" control={profileForm.control} render={({ field }) => (
                    <FormItem><FormLabel>Instagram URL</FormLabel><FormControl><Input placeholder="https://instagram.com/..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField name="portfolioURL" control={profileForm.control} render={({ field }) => (
                    <FormItem><FormLabel>Portfolio URL</FormLabel><FormControl><Input placeholder="https://sizin-saytiniz.com" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField name="googleScholarURL" control={profileForm.control} render={({ field }) => (
                    <FormItem><FormLabel>Google Scholar URL</FormLabel><FormControl><Input placeholder="https://scholar.google.com/citations?user=..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField name="youtubeURL" control={profileForm.control} render={({ field }) => (
                    <FormItem><FormLabel>YouTube URL</FormLabel><FormControl><Input placeholder="https://youtube.com/channel/..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                <Button type="submit" disabled={isSaving || isUploading}>
                  {isSaving ? 'Yadda saxlanılır...' : 'Dəyişiklikləri Yadda Saxla'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Briefcase /> Layihələr</CardTitle>
                <CardDescription>Gördüyünüz işləri və layihələri profilinizə əlavə edin.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...projectForm}>
                    <form onSubmit={projectForm.handleSubmit(onProjectSubmit)} className="space-y-4">
                        <FormField name="title" control={projectForm.control} render={({ field }) => (
                            <FormItem><FormLabel>Layihə Adı</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="description" control={projectForm.control} render={({ field }) => (
                            <FormItem><FormLabel>Təsvir</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="teamMembers" control={projectForm.control} render={({ field }) => (
                            <FormItem><FormLabel>Komanda Üzvləri</FormLabel><FormControl><Input {...field} value={Array.isArray(field.value) ? field.value.join(', ') : ''} placeholder="Adları vergül ilə ayırın" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField name="role" control={projectForm.control} render={({ field }) => (
                                <FormItem><FormLabel>Rolunuz</FormLabel><FormControl><Input {...field} placeholder="Məs: Developer, Dizayner" /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField name="status" control={projectForm.control} render={({ field }) => (
                                <FormItem><FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="davam edir">Davam edir</SelectItem>
                                        <SelectItem value="tamamlanıb">Tamamlanıb</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage /></FormItem>
                            )} />
                        </div>
                        <FormField name="link" control={projectForm.control} render={({ field }) => (
                           <FormItem><FormLabel>Layihə Linki (GitHub, Vebsayt və s.)</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <Button type="submit" disabled={isSaving || isUploading}>
                            <PlusCircle className="mr-2 h-4 w-4" /> {isSaving ? 'Əlavə edilir...' : 'Layihə Əlavə Et'}
                        </Button>
                    </form>
                </Form>
                 <Separator className="my-6" />
                <h4 className="text-md font-medium mb-4">Mövcud Layihələr</h4>
                <div className="space-y-4">
                    {projectsLoading ? <p>Yüklənir...</p> : projects?.map(p => (
                        <div key={p.id} className="flex justify-between items-center p-2 border rounded-md">
                            <span>{p.title}</span>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" disabled={isSaving}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Silməni təsdiq edirsiniz?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Bu əməliyyat geri qaytarıla bilməz. "{p.title}" adlı layihə profilinizdən həmişəlik silinəcək.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Ləğv et</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(p.id, 'project')} className="bg-destructive hover:bg-destructive/90">Bəli, sil</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
        
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Award /> Nailiyyətlər</CardTitle>
                <CardDescription>Qazandığınız uğurları və mükafatları qeyd edin.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Form {...achievementForm}>
                    <form onSubmit={achievementForm.handleSubmit(onAchievementSubmit)} className="space-y-4">
                         <FormField name="name" control={achievementForm.control} render={({ field }) => (
                            <FormItem><FormLabel>Nailiyyətin Adı (Müsabiqə, Olimpiada və s.)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="description" control={achievementForm.control} render={({ field }) => (
                            <FormItem><FormLabel>Təsvir (Könüllü)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField name="position" control={achievementForm.control} render={({ field }) => (
                                <FormItem><FormLabel>Tutduğunuz Yer/Dərəcə</FormLabel><FormControl><Input {...field} placeholder="Məs: 1-ci yer, Qızıl medal" /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField name="level" control={achievementForm.control} render={({ field }) => (
                                <FormItem><FormLabel>Səviyyə</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {(['Universitet', 'Regional', 'Respublika', 'Beynəlxalq'] as AchievementLevel[]).map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage /></FormItem>
                            )} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField name="date" control={achievementForm.control} render={({ field }) => (
                                <FormItem><FormLabel>Tarix</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField name="link" control={achievementForm.control} render={({ field }) => (
                                <FormItem><FormLabel>Təsdiq Linki (Könüllü)</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <Button type="submit" disabled={isSaving || isUploading}>
                            <PlusCircle className="mr-2 h-4 w-4" /> {isSaving ? 'Əlavə edilir...' : 'Nailiyyət Əlavə Et'}
                        </Button>
                    </form>
                </Form>
                 <Separator className="my-6" />
                <h4 className="text-md font-medium mb-4">Mövcud Nailiyyətlər</h4>
                <div className="space-y-4">
                    {achievementsLoading ? <p>Yüklənir...</p> : achievements?.map(a => (
                        <div key={a.id} className="flex justify-between items-center p-2 border rounded-md">
                            <span>{a.name} - {a.position}</span>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" disabled={isSaving}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Silməni təsdiq edirsiniz?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Bu əməliyyat geri qaytarıla bilməz. "{a.name}" adlı nailiyyət profilinizdən həmişəlik silinəcək.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Ləğv et</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(a.id, 'achievement')} className="bg-destructive hover:bg-destructive/90">Bəli, sil</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText /> Sertifikatlar</CardTitle>
            <CardDescription>
              Əldə etdiyiniz sertifikatları profilinizə əlavə edin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...certificateForm}>
              <form onSubmit={certificateForm.handleSubmit(onCertificateSubmit)} className="space-y-4">
                <FormField name="name" control={certificateForm.control} render={({ field }) => (
                  <FormItem><FormLabel>Sertifikatın Adı</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormItem>
                    <FormLabel>Sertifikat Faylı</FormLabel>
                    <FormControl>
                         <Input type="file" ref={certificateFileInputRef} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" disabled={isUploading} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                 <FormField name="level" control={certificateForm.control} render={({ field }) => (
                    <FormItem><FormLabel>Səviyyə</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                              {(['Universitet', 'Regional', 'Respublika', 'Beynəlxalq'] as AchievementLevel[]).map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage /></FormItem>
                )} />
                <Button type="submit" disabled={isSaving || isUploading}>
                  <PlusCircle className="mr-2 h-4 w-4" /> {isUploading ? 'Yüklənir...' : (isSaving ? 'Əlavə edilir...' : 'Sertifikat Əlavə Et')}
                </Button>
              </form>
            </Form>
            <Separator className="my-6" />
            <h4 className="text-md font-medium mb-4">Mövcud Sertifikatlar</h4>
            <div className="space-y-4">
              {certificatesLoading ? <p>Yüklənir...</p> : certificates?.map(c => (
                <div key={c.id} className="flex justify-between items-center p-2 border rounded-md">
                  <a href={c.certificateURL} target="_blank" rel="noopener noreferrer" className="hover:underline">{c.name}</a>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={isSaving}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Silməni təsdiq edirsiniz?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bu əməliyyat geri qaytarılmazdır. "{c.name}" adlı sertifikat profilinizdən həmişəlik silinəcək.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Ləğv et</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(c.id, 'certificate')} className="bg-destructive hover:bg-destructive/90">Bəli, sil</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
    </>
  );
}

export default function EditProfilePage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-8 text-center">Yüklənir...</div>}>
      <EditProfilePageComponent />
    </Suspense>
  )
}
