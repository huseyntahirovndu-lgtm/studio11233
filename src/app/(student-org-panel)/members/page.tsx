'use client';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { Student } from '@/types';
import { useState } from 'react';
import { collection, doc, query, where, documentId } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Combobox } from '@/components/ui/combobox';
import { PlusCircle, Trash2, Users } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { useStudentOrg } from '@/app/(student-org-panel)/layout';

export default function OrganizationMembersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { organization, isLoading: orgLoading } = useStudentOrg();

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  const membersQuery = useMemoFirebase(
    () => (organization?.memberIds && organization.memberIds.length > 0 ? query(collection(firestore, 'users'), where(documentId(), 'in', organization.memberIds)) : null),
    [firestore, organization?.memberIds]
  );
  const { data: members, isLoading: membersLoading } = useCollection<Student>(membersQuery);

  const allStudentsQuery = useMemoFirebase(() => query(collection(firestore, 'users'), where('role', '==', 'student')), [firestore]);
  const { data: allStudents } = useCollection<Student>(allStudentsQuery);

  const studentOptions =
    allStudents?.filter(s => !organization?.memberIds?.includes(s.id)).map(s => ({
        value: s.id,
        label: `${s.firstName} ${s.lastName} (${s.faculty})`,
      })) || [];

  const handleAddMember = async () => {
    if (!organization || !selectedStudentId) return;
    setIsAddingMember(true);
    const orgDocRef = doc(firestore, 'users', organization.id);
    const newMemberIds = [...(organization.memberIds || []), selectedStudentId];

    await updateDocumentNonBlocking(orgDocRef, { memberIds: newMemberIds });
    toast({ title: 'Uğurlu', description: 'Təşkilata yeni üzv əlavə edildi.' });
    setSelectedStudentId('');
    setIsAddingMember(false);
  };
  
  const handleRemoveMember = async (memberId: string) => {
    if(!organization) return;
    const orgDocRef = doc(firestore, 'users', organization.id);
    const newMemberIds = organization.memberIds.filter(id => id !== memberId);
    
    await updateDocumentNonBlocking(orgDocRef, { memberIds: newMemberIds });
    toast({ title: 'Uğurlu', description: 'Üzv təşkilatdan çıxarıldı.' });
  }

  if (orgLoading) {
    return <div className="flex h-screen items-center justify-center">Yüklənir...</div>;
  }
  
  if(!organization) {
    return <div className="flex h-screen items-center justify-center">Təşkilat tapılmadı və ya təsdiqlənməyib.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users /> Təşkilat Üzvləri</CardTitle>
        <CardDescription>Təşkilatınızın üzvlərini idarə edin.</CardDescription>
      </CardHeader>
      <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
              <Combobox
                  options={studentOptions}
                  value={selectedStudentId}
                  onChange={setSelectedStudentId}
                  placeholder="Üzv əlavə et..."
                  searchPlaceholder="Tələbə axtar..."
                  notFoundText="Tələbə tapılmadı."
              />
              <Button onClick={handleAddMember} disabled={!selectedStudentId || isAddingMember} className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {isAddingMember ? 'Əlavə edilir...' : 'Əlavə Et'}
              </Button>
          </div>
          
          <div className="border rounded-lg">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Ad Soyad</TableHead>
                          <TableHead className="hidden md:table-cell">Fakültə</TableHead>
                           <TableHead className="hidden lg:table-cell">İxtisas</TableHead>
                          <TableHead className="text-right">Əməliyyat</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {membersLoading ? (
                          <TableRow><TableCell colSpan={4} className="text-center">Yüklənir...</TableCell></TableRow>
                      ) : members && members.length > 0 ? (
                         members.map(member => (
                             <TableRow key={member.id}>
                                 <TableCell>
                                    <Link href={`/profile/${member.id}`} className="flex items-center gap-3 group">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={member.profilePictureUrl} alt={`${member.firstName} ${member.lastName}`} />
                                            <AvatarFallback>{member.firstName?.charAt(0)}{member.lastName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="font-medium group-hover:underline">{`${member.firstName} ${member.lastName}`}</div>
                                    </Link>
                                 </TableCell>
                                 <TableCell className="hidden md:table-cell">{member.faculty}</TableCell>
                                  <TableCell className="hidden lg:table-cell">{member.major}</TableCell>
                                 <TableCell className="text-right">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Silməni təsdiq edirsiniz?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Bu əməliyyat geri qaytarıla bilməz. "{member.firstName} {member.lastName}" adlı tələbə təşkilatdan çıxarılacaq.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Ləğv et</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleRemoveMember(member.id)} className="bg-destructive hover:bg-destructive/90">Bəli, çıxar</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                 </TableCell>
                             </TableRow>
                         ))
                      ) : (
                           <TableRow><TableCell colSpan={4} className="text-center">Heç bir üzv tapılmadı.</TableCell></TableRow>
                      )}
                  </TableBody>
              </Table>
          </div>
      </CardContent>
    </Card>
  );
}
