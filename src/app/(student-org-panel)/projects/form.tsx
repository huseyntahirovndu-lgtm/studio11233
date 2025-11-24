'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Firestore, doc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Project, StudentOrganization, ProjectStatus } from '@/types';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  title: z.string().min(5, "Başlıq ən azı 5 hərf olmalıdır."),
  description: z.string().min(20, "Təsvir ən azı 20 hərf olmalıdır."),
  link: z.string().url("Etibarlı URL daxil edin").or(z.literal('')).optional(),
  status: z.enum(['aktiv', 'bitmiş']),
});

type FormData = z.infer<typeof formSchema>;

interface ProjectFormProps {
  initialData?: Project | null;
  onSuccess: (id: string) => void;
  organization: StudentOrganization;
  firestore: Firestore;
}

export default function ProjectForm({ initialData, onSuccess, organization, firestore }: ProjectFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  const isEditMode = !!initialData;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      link: initialData?.link || '',
      status: initialData?.status || 'aktiv',
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (values) => {
    setIsSaving(true);

    try {
      if (isEditMode && initialData) {
        const updateData = {
          ...values,
        };
        const docRef = doc(firestore, 'projects', initialData.id);
        
        await updateDocumentNonBlocking(docRef, updateData);
        toast({ title: 'Uğurlu', description: 'Layihə uğurla yeniləndi.' });
        onSuccess(initialData.id);

      } else {
        const newProjectData = {
          ...values,
          ownerId: organization.id,
          ownerType: 'organization' as const,
          ownerName: organization.name,
          ownerLogo: organization.logoUrl || '',
          teamMemberIds: [],
          invitedStudentIds: [],
          applicantIds: [],
          createdAt: serverTimestamp(),
        };
        
        const docRef = await addDocumentNonBlocking(collection(firestore, 'projects'), newProjectData);
        toast({ title: 'Uğurlu', description: 'Layihə uğurla yaradıldı.' });
        onSuccess(docRef.id);
      }
    } catch (error: any) {
      console.error("Layihə yaradılarkən/yenilənərkən xəta:", error);
      toast({
        variant: 'destructive',
        title: 'Xəta',
        description: error.message || 'Layihə yaradılarkən/yenilənərkən xəta baş verdi.',
      });
    }

    setIsSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Layihəni Redaktə Et' : 'Yeni Layihə Yarat'}</CardTitle>
        <CardDescription>
          Təşkilatınız üçün yeni layihə və ya tədbir elanı yaradın.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Başlıq</FormLabel>
                  <FormControl>
                    <Input placeholder="Layihənin başlığı" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Təsvir</FormLabel>
                  <FormControl>
                     <Textarea {...field} rows={10} placeholder="Layihənin məqsədi, tələblər, tarix və s. haqqında ətraflı məlumat..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Əlavə Link (Könüllü)</FormLabel>
                   <FormControl>
                    <Input placeholder="https://ətraflı-məlumat-linki.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Layihə statusunu seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="aktiv">Aktiv (Müraciətlərə açıq)</SelectItem>
                      <SelectItem value="bitmiş">Bitmiş</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                    Ləğv et
                </Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Yadda saxlanılır...' : (isEditMode ? 'Yenilə' : 'Yarat')}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
