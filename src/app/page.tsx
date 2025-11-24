'use client';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Users,
  Library,
  Trophy,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/stat-card';
import { StudentCard } from '@/components/student-card';
import { CategoryPieChart } from '@/components/charts/category-pie-chart';
import { FacultyBarChart } from '@/components/charts/faculty-bar-chart';
import { Student, Project, CategoryData, Achievement, StudentOrganization } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCollection, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { selectTopStories } from '@/app/actions';

interface EnrichedProject extends Project {
    student?: Student;
}

interface SuccessStory {
    studentId: string;
    name: string;
    faculty: string;
    story: string;
    profilePictureUrl?: string;
}

const SuccessStoryCard = ({ story }: { story: SuccessStory }) => (
    <Card className="flex flex-col overflow-hidden">
         <CardHeader className="flex flex-row items-start gap-4">
            <Link href={`/profile/${story.studentId}`} className="flex items-center gap-4 group">
                <Avatar className="h-12 w-12 border">
                    <AvatarImage src={story.profilePictureUrl} alt={story.name} />
                    <AvatarFallback>{story.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="group-hover:underline">{story.name}</CardTitle>
                    <CardDescription>{story.faculty}</CardDescription>
                </div>
            </Link>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-3">"{story.story}"</p>
        </CardContent>
    </Card>
);

export default function HomePage() {
  const firestore = useFirestore();
  const { user } = useAuth();

  const studentsQuery = useMemoFirebase(() => query(collection(firestore, "users"), where("status", "==", "təsdiqlənmiş"), where("role", "==", "student")), [firestore]);
  const studentOrgsQuery = useMemoFirebase(() => query(collection(firestore, "student-organizations"), where("status", "==", "təsdiqlənmiş")), [firestore]);
  const categoriesQuery = useMemoFirebase(() => collection(firestore, "categories"), [firestore]);

  const { data: students, isLoading: studentsLoading } = useCollection<Student>(studentsQuery);
  const { data: studentOrgs, isLoading: studentOrgsLoading } = useCollection<StudentOrganization>(studentOrgsQuery);
  const { data: categories, isLoading: categoriesLoading } = useCollection<CategoryData>(categoriesQuery);

  const [topTalents, setTopTalents] = useState<Student[]>([]);
  const [newMembers, setNewMembers] = useState<Student[]>([]);
  const [strongestProjects, setStrongestProjects] = useState<EnrichedProject[]>([]);
  const [popularSkills, setPopularSkills] = useState<string[]>([]);
  const [successStories, setSuccessStories] = useState<SuccessStory[]>([]);
  const [stats, setStats] = useState({ projects: 0, achievements: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  
  const isLoading = studentsLoading || studentOrgsLoading || categoriesLoading || statsLoading;

  useEffect(() => {
    if (firestore && students) {
        const fetchStats = async () => {
            setStatsLoading(true);
            let projectCount = 0;
            let achievementCount = 0;
            
            for (const student of students) {
                const projectsSnap = await getDocs(collection(firestore, `users/${student.id}/projects`));
                const achievementsSnap = await getDocs(collection(firestore, `users/${student.id}/achievements`));
                projectCount += projectsSnap.size;
                achievementCount += achievementsSnap.size;
            }
            setStats({ projects: projectCount, achievements: achievementCount });
            setStatsLoading(false);
        };
        fetchStats();
    }
  }, [firestore, students]);

  useEffect(() => {
    if (!students || students.length === 0) return;

    const sortedByTalent = [...students].sort((a, b) => (b.talentScore || 0) - (a.talentScore || 0));
    setTopTalents(sortedByTalent.slice(0, 10));

    const sortedByDate = [...students].sort((a, b) => (a.createdAt && b.createdAt ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : 0));
    setNewMembers(sortedByDate.slice(0, 5));
    
    const allSkills = students.flatMap(s => s.skills || []).map(s => s.name);
    const skillCounts = allSkills.reduce((acc, skill) => {
        acc[skill] = (acc[skill] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const sortedSkills = Object.keys(skillCounts).sort((a, b) => skillCounts[b] - skillCounts[a]);
    setPopularSkills(sortedSkills.slice(0, 10));
    
    const fetchStories = async () => {
        const storiesToConsider = students
            .filter(s => s.successStory && s.successStory.trim().length > 10)
            .map(s => ({ id: s.id, firstName: s.firstName, lastName: s.lastName, faculty: s.faculty, successStory: s.successStory!, profilePictureUrl: s.profilePictureUrl }));
        
        if (storiesToConsider.length === 0) return;

        if (storiesToConsider.length <= 2) {
            setSuccessStories(storiesToConsider.map(s => ({
                studentId: s.id,
                name: `${s.firstName} ${s.lastName}`,
                faculty: s.faculty,
                story: s.successStory,
                profilePictureUrl: s.profilePictureUrl
            })));
            return;
        }

        try {
            const result = await selectTopStories({ stories: storiesToConsider });
            setSuccessStories(result.selectedStories.map(s => ({...s, profilePictureUrl: storiesToConsider.find(stc => stc.id === s.studentId)?.profilePictureUrl})));
        } catch (error) {
            console.error("AI story selection failed, using fallback:", error);
            setSuccessStories(storiesToConsider.slice(0, 2).map(s => ({
                 studentId: s.id,
                 name: `${s.firstName} ${s.lastName}`,
                 faculty: s.faculty,
                 story: s.successStory,
                 profilePictureUrl: s.profilePictureUrl
            })));
        }
    };
    fetchStories();

  }, [students]);

   useEffect(() => {
    if (!students || !firestore) return;
    
    const fetchProjects = async () => {
        const allStudentProjects: EnrichedProject[] = [];
        for (const student of students) {
            const projectsCol = collection(firestore, `users/${student.id}/projects`);
            const projectsSnap = await getDocs(projectsCol);
            projectsSnap.forEach(doc => {
                allStudentProjects.push({ ...doc.data() as Project, id: doc.id, student });
            });
        }
        // Here we can add sorting logic if needed, e.g., by date
        setStrongestProjects(allStudentProjects.slice(0, 3));
    }
    fetchProjects();
    
   }, [students, firestore]);


  return (
    <div className="flex flex-col">
       <main className="flex-1">
        <section className="relative w-full h-[50vh] md:h-[60vh]">
            <Image
              src="/banner.jpg"
              alt="Naxçıvan Dövlət Universiteti"
              fill
              className="object-cover"
              priority
              data-ai-hint="university campus students"
            />
            <div className="relative z-10 h-full flex items-center">
             
            </div>
        </section>

        <div className="container mx-auto px-4 py-8 md:py-12">
          <section className="py-12">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Ümumi Tələbə Sayı"
                value={isLoading ? '...' : (students?.length.toString() ?? '0')}
                icon={Users}
              />
              <StatCard
                title="Tələbə Təşkilatları"
                value={isLoading ? '...' : (studentOrgs?.length.toString() ?? '0')}
                icon={Library}
              />
              <StatCard
                title="Aktiv Layihələr"
                value={isLoading ? '...' : (stats.projects.toString())}
                icon={Lightbulb}
              />
              <StatCard
                title="Ümumi Uğurlar"
                value={isLoading ? '...' : (stats.achievements.toString())}
                icon={Trophy}
              />
            </div>
          </section>

          <section className="py-12">
             <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold">Top 10 İstedad</h2>
             </div>
            <div className="flex justify-between items-center mb-8">
              <Button variant="ghost" asChild>
                <Link href="/rankings">
                  Bütün reytinqlərə bax <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
             {isLoading ? (
               <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {Array.from({length: 10}).map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
               </div>
             ) : (
               <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {topTalents.map((student) => (
                    <StudentCard key={student.id} student={student} />
                  ))}
                </div>
             )}
          </section>
          
          <section className="py-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2">
                  <h2 className="text-3xl md:text-4xl font-bold mb-8">Ən Güclü Tələbə Layihələri</h2>
                  {isLoading ? (
                       <div className="space-y-4">
                          <Skeleton className="h-32 w-full" />
                          <Skeleton className="h-32 w-full" />
                          <Skeleton className="h-32 w-full" />
                      </div>
                  ) : (
                      <div className="space-y-6">
                          {strongestProjects.length > 0 ? strongestProjects.map(project => (
                              <Link key={project.id} href={`/profile/${project.student?.id}`} className="block">
                                  <Card className="hover:shadow-md hover:border-primary/50 transition-all">
                                      <CardHeader>
                                          <CardTitle className="text-lg">{project.title}</CardTitle>
                                          <CardDescription>
                                              <div className="flex items-center gap-2">
                                                  <Avatar className="h-6 w-6">
                                                      <AvatarImage src={project.student?.profilePictureUrl} />
                                                      <AvatarFallback>{project.student?.firstName?.[0]}{project.student?.lastName?.[0]}</AvatarFallback>
                                                  </Avatar>
                                                  <span>{project.student?.firstName} {project.student?.lastName}</span>
                                              </div>
                                          </CardDescription>
                                      </CardHeader>
                                      <CardContent>
                                          <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                                      </CardContent>
                                  </Card>
                              </Link>
                          )) : (
                               <p className="text-center text-muted-foreground py-10">Göstərmək üçün tələbə layihəsi tapılmadı.</p>
                          )}
                      </div>
                  )}
              </div>
               <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-8">Populyar Bacarıqlar</h2>
                  {isLoading ? (
                      <div className="flex flex-wrap gap-2">
                          {Array.from({length: 10}).map((_, i) => <Skeleton key={i} className="h-8 w-24" />)}
                      </div>
                  ) : (
                      <div className="flex flex-wrap gap-3">
                          {popularSkills.length > 0 ? popularSkills.map(skill => (
                              <Badge key={skill} variant="secondary" className="text-base px-4 py-2">{skill}</Badge>
                          )) : (
                             <p className="text-muted-foreground">Heç bir bacarıq tapılmadı.</p>
                          )}
                      </div>
                  )}
              </div>
          </section>

          <section className="py-12">
             <div className="grid gap-8 lg:grid-cols-5">
                <div className="lg:col-span-2">
                    <CategoryPieChart students={students || []} categoriesData={categories || []} />
                </div>
                <div className="lg:col-span-3">
                    <FacultyBarChart students={students || []} />
                </div>
            </div>
          </section>
          
          <section className="py-12">
              <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold">Tələbə Uğur Hekayələri</h2>
                  <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Platformamızın tələbələrimizin karyera yoluna necə təsir etdiyini kəşf edin.</p>
              </div>
              {isLoading ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <Skeleton className="h-48 w-full" />
                      <Skeleton className="h-48 w-full" />
                  </div>
              ) : successStories.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {successStories.map(story => (
                          <SuccessStoryCard key={story.studentId} story={story} />
                      ))}
                  </div>
              ) : (
                  <div className="text-center py-10 text-muted-foreground">
                      <p>Hələlik paylaşılacaq uğur hekayəsi yoxdur.</p>
                  </div>
              )}
          </section>


          <section className="py-12">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold">
                Yeni Qoşulanlar
              </h2>
               <Button variant="ghost" asChild>
                <Link href="/search?sort=newest">
                  Hamısına bax <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            {isLoading ? (
               <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
               </div>
             ) : (
              <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {newMembers.map((student) => (
                  <StudentCard key={student.id} student={student} />
                  ))}
              </div>
             )}
          </section>
        </div>
      </main>
    </div>
  );
}
