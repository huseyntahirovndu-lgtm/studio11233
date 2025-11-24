'use client';
import React, { useState, useEffect } from 'react';
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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, updateDoc } from 'firebase/firestore';
import type { FacultyData } from '@/types';
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
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const initialFaculties = [
    "İqtisadiyyat və idarəetmə fakültəsi",
    "Memarlıq və mühəndislik fakültəsi",
    "Pedaqoji fakültə",
    "Təbiətşünaslıq və kənd təsərrüfatı fakültəsi",
    "Beynəlxalq münasibətlər və hüquq fakültəsi",
    "Tarix-filologiya fakültəsi",
    "Fizika-riyaziyyat fakültəsi",
    "Xarici dillər fakültəsi",
    "Tibb fakültəsi",
    "İncəsənət fakültəsi"
];

export default function AdminFacultiesPage() {
  const [newFaculty, setNewFaculty] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const facultiesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'faculties') : null, [firestore]);
  const { data: faculties, isLoading: facultiesLoading } = useCollection<FacultyData>(facultiesQuery);

  useEffect(() => {
    if (firestore && !facultiesLoading && faculties && faculties.length === 0) {
      const seedFaculties = async () => {
        setIsSaving(true);
        const batch = writeBatch(firestore);
        const facultiesCollectionRef = collection(firestore, 'faculties');
        initialFaculties.forEach(name => {
          const docRef = doc(facultiesCollectionRef);
          batch.set(docRef, { id: docRef.id, name });
        });
        try {
            await batch.commit();
            toast({ title: 'Fakültələr əlavə edildi', description: 'Başlanğıc fakültə siyahısı sistemə yükləndi.' });
        } catch(e) {
            toast({variant: 'destructive', title: 'Xəta', description: 'Fakültələr yüklənərkən xəta baş verdi.'})
        } finally {
            setIsSaving(false);
        }
      };
      seedFaculties();
    }
  }, [firestore, faculties, facultiesLoading, toast]);


  const handleAddFaculty = async () => {
    if (!newFaculty.trim() || !firestore) return;
    setIsSaving(true);
    
    const facultiesCollectionRef = collection(firestore, 'faculties');
    try {
      const newDocRef = await addDocumentNonBlocking(facultiesCollectionRef, { name: newFaculty });
      if (newDocRef) {
        await updateDoc(newDocRef, { id: newDocRef.id });
      }
      toast({ title: 'Uğurlu', description: 'Yeni fakültə əlavə edildi.' });
      setNewFaculty('');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Xəta', description: 'Fakültə əlavə edilərkən xəta baş verdi.' });
    }
    setIsSaving(false);
  };

  const handleDeleteFaculty = (facultyId: string) => {
    if (!firestore) return;
    const facultyDocRef = doc(firestore, 'faculties', facultyId);
    // Use non-blocking delete
    deleteDocumentNonBlocking(facultyDocRef);
    toast({ title: 'Uğurlu', description: 'Fakültə silindi.' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Fakültələr</h1>
          <p className="text-muted-foreground">
            Universitetdəki mövcud fakültələrin siyahısı.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Fakültələri İdarə Et</CardTitle>
            <CardDescription>Yeni fakültələr əlavə edin və ya mövcud olanları silin. Bu dəyişikliklər qeydiyyat və axtarış səhifələrində görünəcək.</CardDescription>
        </CardHeader>
        <CardContent className="mt-6">
          <div className="flex items-center gap-2 mb-6">
            <Input 
              value={newFaculty}
              onChange={(e) => setNewFaculty(e.target.value)}
              placeholder="Yeni fakültə adı"
              disabled={isSaving}
            />
            <Button onClick={handleAddFaculty} disabled={isSaving || !newFaculty.trim()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {isSaving ? 'Əlavə edilir...' : 'Əlavə Et'}
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fakültə Adı</TableHead>
                <TableHead className="text-right">Əməliyyatlar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facultiesLoading ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">Yüklənir...</TableCell>
                </TableRow>
              ) : faculties && faculties.length > 0 ? (
                faculties.map((faculty) => (
                  <TableRow key={faculty.id}>
                    <TableCell className="font-medium">{faculty.name}</TableCell>
                    <TableCell className="text-right">
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                              <AlertDialogTitle>Silməni təsdiq edirsiniz?</AlertDialogTitle>
                              <AlertDialogDescription>
                                  Bu əməliyyat geri qaytarılmazdır. "{faculty.name}" fakültəsi sistemdən həmişəlik silinəcək.
                              </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                              <AlertDialogCancel>Ləğv et</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteFaculty(faculty.id)} className="bg-destructive hover:bg-destructive/90">Bəli, sil</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                 <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">Heç bir fakültə tapılmadı.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
