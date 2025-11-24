'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Student, FacultyData, CategoryData } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';


const formSchema = z.object({
  firstName: z.string().min(2, {
    message: 'Ad ən azı 2 hərfdən ibarət olmalıdır.'
  }),
  lastName: z.string().min(2, {
    message: 'Soyad ən azı 2 hərfdən ibarət olmalıdır.'
  }),
  email: z.string().email({
    message: 'Etibarlı bir e-poçt ünvanı daxil edin.'
  }),
  password: z.string().min(6, {
    message: 'Şifrə ən azı 6 simvoldan ibarət olmalıdır.'
  }),
  faculty: z.string().min(1, {
    message: 'Fakültə seçmək mütləqdir.'
  }),
  major: z.string().min(2, {
    message: 'İxtisas ən azı 2 hərfdən ibarət olmalıdır.'
  }),
  courseYear: z.coerce.number().min(1).max(6),
  category: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "Ən azı bir kateqoriya seçməlisiniz.",
  }),
});

export default function RegisterStudentPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();

  const facultiesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'faculties') : null, [firestore]);
  const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'categories') : null, [firestore]);

  const { data: faculties, isLoading: facultiesLoading } = useCollection<FacultyData>(facultiesQuery);
  const { data: categories, isLoading: categoriesLoading } = useCollection<CategoryData>(categoriesQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      faculty: '',
      major: '',
      courseYear: 1,
      category: [],
    },
  });


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    const newUserProfile: Omit<Student, 'id' | 'createdAt' | 'status'> = {
      role: 'student' as const,
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      faculty: values.faculty,
      major: values.major,
      courseYear: values.courseYear,
      skills: [],
      category: values.category.join(', '),
      projectIds: [],
      achievementIds: [],
      certificateIds: [],
      linkedInURL: '',
      githubURL: '',
      behanceURL: '',
      instagramURL: '',
      portfolioURL: '',
      talentScore: 10,
    };
    
    const success = await register(newUserProfile, values.password);

    if (success) {
      toast({
        title: 'Qeydiyyat Uğurlu Oldu',
        description: 'Hesabınız yaradıldı və təsdiq üçün göndərildi.',
      });
      router.push('/login');
    } else {
       toast({
        variant: 'destructive',
        title: 'Qeydiyyat Uğursuz Oldu',
        description: 'Bu e-poçt ünvanı artıq istifadə olunur.',
      });
    }

    setIsLoading(false);
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">Tələbə Qeydiyyatı</CardTitle>
        <CardDescription>
          Profilinizi yaratmaq üçün məlumatları daxil edin.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ad</FormLabel>
                    <FormControl>
                      <Input placeholder="Adınız" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Soyad</FormLabel>
                    <FormControl>
                      <Input placeholder="Soyadınız" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-poçt</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="example@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şifrə</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="faculty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fakültə</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Fakültə seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {facultiesLoading ? <SelectItem value="loading" disabled>Yüklənir...</SelectItem> : faculties?.map(faculty => (
                          <SelectItem key={faculty.id} value={faculty.name}>
                            {faculty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="major"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İxtisas</FormLabel>
                    <FormControl>
                      <Input placeholder="İxtisasınız" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="courseYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Təhsil ili</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Kursu seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map(year => (
                        <SelectItem key={year} value={String(year)}>
                          {year}-ci kurs
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İstedad Kateqoriyaları</FormLabel>
                   <FormDescription>
                    Aid olduğunuz bir və ya bir neçə kateqoriyanı seçin.
                  </FormDescription>
                  {categoriesLoading ? <p>Yüklənir...</p> : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 py-2">
                  {categories?.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name="category"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={item.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.name)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), item.name])
                                    : field.onChange(
                                        (field.value || [])?.filter(
                                          (value) => value !== item.name
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {item.name}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                  </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />


            <Button type="submit" className="w-full" disabled={isLoading || facultiesLoading || categoriesLoading}>
              {isLoading ? 'Hesab yaradılır...' : 'Hesab yarat'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex-col justify-center gap-4">
        <p className="text-sm text-muted-foreground">
          Artıq hesabınız var?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Daxil olun
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
