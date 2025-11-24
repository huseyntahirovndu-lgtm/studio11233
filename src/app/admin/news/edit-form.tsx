'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Firestore, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { AppUser, News, Admin } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { v4 as uuidv4 } from 'uuid';

const formSchema = z.object({
  title: z.string().min(5, "Başlıq ən azı 5 hərf olmalıdır."),
  content: z.string().min(20, "Məzmun ən azı 20 hərf olmalıdır."),
  coverImageUrl: z.string().url("Etibarlı URL daxil edin").or(z.literal('')).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditNewsFormProps {
  initialData?: News | null;
  onSuccess: (id: string) => void;
  firestore: Firestore;
  user: AppUser;
}

const generateSlug = (title: string) => {
  const azeToEng: { [key: string]: string } = {
    'ə': 'e', 'ç': 'c', 'ı': 'i', 'ğ': 'g', 'ö': 'o', 'ş': 's', 'ü': 'u',
  };
  return title
    .toLowerCase()
    .split('')
    .map(char => azeToEng[char] || char)
    .join('')
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '');
};

export default function NewsEditForm({ initialData, onSuccess, firestore, user }: EditNewsFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  const isEditMode = !!initialData;
  const coverImageInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      coverImageUrl: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);
  
  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload/sekiller', { method: 'POST', body: formData });
      const result = await response.json();
      if (result.success) {
        form.setValue('coverImageUrl', result.url, { shouldValidate: true, shouldDirty: true });
        toast({ title: "Şəkil uğurla yükləndi." });
      } else {
        throw new Error(result.error || 'Şəkil yüklənərkən xəta baş verdi.');
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Yükləmə Xətası", description: err.message });
    } finally {
      setIsUploading(false);
    }
  };


  const onSubmit: SubmitHandler<FormData> = async (values) => {
    setIsSaving(true);
    
    if (!user || user.role !== 'admin') {
        toast({ variant: 'destructive', title: 'Səlahiyyət Xətası', description: 'Bu əməliyyatı etmək üçün admin olmalısınız.' });
        setIsSaving(false);
        return;
    }

    try {
      if (isEditMode && initialData?.id) {
        const updateData = {
          ...values,
          updatedAt: serverTimestamp(),
        };
        const newsDocRef = doc(firestore, 'news', initialData.id);
        await updateDoc(newsDocRef, updateData);
        toast({ title: 'Uğurlu', description: 'Xəbər uğurla yeniləndi.' });
        onSuccess(initialData.id);
      } else {
        const slugBase = generateSlug(values.title);
        const newNewsId = uuidv4();
        const slug = `${slugBase}-${newNewsId.substring(0, 5)}`;
        
        const newsCollectionRef = collection(firestore, 'news');
        const newNewsRef = doc(newsCollectionRef, newNewsId);

        const newNewsData = {
          ...values,
          id: newNewsId,
          slug,
          authorId: user.id,
          authorName: `${(user as Admin).firstName} ${(user as Admin).lastName}`,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await addDocumentNonBlocking(newNewsRef, newNewsData);
        toast({ title: 'Uğurlu', description: 'Xəbər uğurla yaradıldı.' });
        onSuccess(newNewsId);
      }
    } catch (error: any) {
      console.error("Xəbər yaradılarkən/yenilənərkən xəta:", error);
      toast({
        variant: 'destructive',
        title: 'Xəta',
        description: error.message || 'Xəbər yaradılarkən/yenilənərkən xəta baş verdi.',
      });
    }

    setIsSaving(false);
  };

  const isSubmitDisabled = isSaving || isUploading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Xəbəri Redaktə Et' : 'Yeni Xəbər Yarat'}</CardTitle>
        <CardDescription>
          Platforma üçün yeni xəbər və ya elan daxil edin.
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
                    <Input placeholder="Xəbərin başlığı" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="coverImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Örtük Şəkli</FormLabel>
                   <div className="flex items-center gap-2">
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} />
                    </FormControl>
                     <Button type="button" onClick={() => coverImageInputRef.current?.click()} disabled={isUploading}>
                        <Upload className="mr-2 h-4 w-4" />
                        {isUploading ? 'Yüklənir...' : 'Yüklə'}
                    </Button>
                    <Input 
                        ref={coverImageInputRef}
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Məzmun</FormLabel>
                  <FormControl>
                     <Textarea {...field} rows={10} placeholder="Xəbərin tam mətni..." />
                  </FormControl>
                   <div className="text-sm text-muted-foreground">
                    Mətni formatlamaq üçün sadə HTML teqlərindən istifadə edə bilərsiniz (məs: `<b>qalin</b>`, `<h2>başlıq</h2>`, `<ul><li>siyahı</li></ul>`).
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                    Ləğv et
                </Button>
                <Button type="submit" disabled={isSubmitDisabled}>
                    {isSaving ? 'Yadda saxlanılır...' : (isEditMode ? 'Yenilə' : 'Yarat')}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
