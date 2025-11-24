'use client';
import Link from 'next/link';
import { ArrowUpRight, Star, Bookmark } from 'lucide-react';
import type { Student, Organization } from '@/types';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface StudentCardProps {
  student: Student;
  className?: string;
}

const categoryColors: { [key: string]: string } = {
  STEM: 'bg-category-stem',
  Humanitar: 'bg-category-humanitarian',
  İncəsənət: 'bg-category-art',
  İdman: 'bg-category-sport',
  Sahibkarlıq: 'bg-category-entrepreneurship',
  'Texnologiya / IT': 'bg-category-technology',
  'Startap və innovasiya': 'bg-purple-500', 
  'Sosial fəaliyyət': 'bg-pink-500',
  'Media və yaradıcılıq': 'bg-orange-500'
};


export function StudentCard({ student, className }: StudentCardProps) {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const organization = user?.role === 'organization' ? user as Organization : null;
  const isSaved = organization?.savedStudentIds?.includes(student.id);

  const {
    firstName,
    lastName,
    faculty,
    profilePictureUrl,
    skills,
    talentScore,
    id,
    category
  } = student;
  
  const primaryCategory = category?.split(',')[0].trim() ?? '';
  const categoryColor = categoryColors[primaryCategory] || 'bg-muted';

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    if (!organization) return;

    const currentSavedIds = organization.savedStudentIds || [];
    const newSavedStudentIds = isSaved
      ? currentSavedIds.filter(id => id !== student.id)
      : [...currentSavedIds, student.id];

    const updatedOrg = { ...organization, savedStudentIds: newSavedStudentIds };
    const success = updateUser(updatedOrg);

    if (success) {
        toast({
          title: isSaved ? "Siyahıdan çıxarıldı" : "Yadda saxlanıldı",
          description: `${student.firstName} ${student.lastName} ${isSaved ? 'yaddaş siyahısından çıxarıldı.' : 'yaddaş siyahısına əlavə edildi.'}`,
        });
    } else {
        toast({
            variant: 'destructive',
            title: 'Xəta',
            description: 'Əməliyyat zamanı xəta baş verdi.'
        })
    }
  };


  return (
    <Card className={cn("flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group", className)} data-ai-hint="student profile picture">
      <CardHeader className="p-0 relative">
        <div className={`h-2 w-full ${categoryColor}`}></div>
        {organization && (
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "absolute top-3 right-3 h-8 w-8 rounded-full bg-black/20 text-white backdrop-blur-sm hover:bg-black/40",
              "opacity-0 group-hover:opacity-100 transition-opacity",
              isSaved && "opacity-100"
            )}
            onClick={handleBookmark}
          >
            <Bookmark className={cn("h-5 w-5", isSaved && "fill-current")} />
          </Button>
        )}
        <div className="p-6 flex items-center gap-4">
          <Avatar className="h-16 w-16 border-4 border-background shadow-md">
            <AvatarImage src={profilePictureUrl} alt={`${firstName} ${lastName}`} />
            <AvatarFallback>{firstName?.charAt(0)}{lastName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-bold">{`${firstName} ${lastName}`}</h3>
            <p className="text-sm text-muted-foreground">{faculty}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-5 h-5 fill-current" />
                <span className="font-bold text-lg text-foreground">{talentScore || 0}</span>
            </div>
            <p className="text-sm text-muted-foreground">İstedad balı</p>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Əsas bacarıqlar:</p>
        <div className="flex flex-wrap gap-2">
          {skills?.slice(0, 4).map((skill, index) => (
            <Badge key={index} variant="secondary" className="font-normal">
              {skill.name}
            </Badge>
          ))}
          {skills && skills.length > 4 && <Badge variant="outline">+{skills.length - 4}</Badge>}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/profile/${id}`}>
            Profili Gör <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
