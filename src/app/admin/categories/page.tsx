'use client';
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useCollectionOptimized, useFirestore, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { CategoryData } from '@/types';
import { PlusCircle, Trash2 } from 'lucide-react';
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

export default function AdminCategoriesPage() {
  const [newCategory, setNewCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'categories') : null, [firestore]);
  const { data: categories, isLoading: categoriesLoading } = useCollectionOptimized<CategoryData>(categoriesQuery, { enableCache: true, disableRealtimeOnInit: true });

  const handleAddCategory = async () => {
    if (!newCategory.trim() || !firestore) return;
    setIsLoading(true);
    
    const categoriesCollectionRef = collection(firestore, 'categories');
    try {
      await addDocumentNonBlocking(categoriesCollectionRef, { name: newCategory });
      toast({ title: 'Uğurlu', description: 'Yeni kateqoriya əlavə edildi.' });
      setNewCategory('');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Xəta', description: 'Kateqoriya əlavə edilərkən xəta baş verdi.' });
    }
    setIsLoading(false);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (!firestore) return;
    const categoryDocRef = doc(firestore, 'categories', categoryId);
    deleteDocumentNonBlocking(categoryDocRef);
    toast({ title: 'Uğurlu', description: 'Kateqoriya silindi.' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">İstedad Kateqoriyaları</h1>
          <p className="text-muted-foreground">
            Tələbələrin bölündüyü əsas istedad sahələri.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Kateqoriyaları İdarə Et</CardTitle>
            <CardDescription>Yeni istedad kateqoriyaları əlavə edin və ya mövcud olanları silin. Bu dəyişikliklər bütün saytda (qeydiyyat, axtarış və s.) dərhal tətbiq olunacaq.</CardDescription>
        </CardHeader>
        <CardContent className="mt-6">
          <div className="flex items-center gap-2 mb-6">
            <Input 
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Yeni kateqoriya adı"
              disabled={isLoading}
            />
            <Button onClick={handleAddCategory} disabled={isLoading || !newCategory.trim()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {isLoading ? 'Əlavə edilir...' : 'Əlavə Et'}
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kateqoriya Adı</TableHead>
                <TableHead className="text-right">Əməliyyatlar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoriesLoading ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">Yüklənir...</TableCell>
                </TableRow>
              ) : categories && categories.length > 0 ? (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-right">
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                              <AlertDialogTitle>Silməni təsdiq edirsiniz?</AlertDialogTitle>
                              <AlertDialogDescription>
                                  Bu əməliyyat geri qaytarılmazdır. "{category.name}" kateqoriyası sistemdən həmişəlik silinəcək.
                              </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                              <AlertDialogCancel>Ləğv et</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteCategory(category.id)} className="bg-destructive hover:bg-destructive/90">Bəli, sil</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                 <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">Heç bir kateqoriya tapılmadı.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
