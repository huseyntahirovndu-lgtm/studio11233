'use client';
import React, { useState, useMemo, useEffect } from "react";
import { File, ListFilter, MoreHorizontal, Search } from "lucide-react"
import Link from "next/link";
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
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
import { Input } from "@/components/ui/input";
import type { Student, StudentStatus, FacultyData, AppUser } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";

export default function AdminStudentsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();

  const allUsersQuery = useMemoFirebase(
    () => (firestore) ? query(collection(firestore, "users"), where("role", "==", "student")) : null,
    [firestore]
  );
  
  const facultiesQuery = useMemoFirebase(
    () => (firestore) ? collection(firestore, "faculties") : null, 
    [firestore]
  );

  const { data: students, isLoading: usersLoading } = useCollection<Student>(allUsersQuery);
  const { data: faculties, isLoading: facultiesLoading } = useCollection<FacultyData>(facultiesQuery);


  const [activeTab, setActiveTab] = useState<StudentStatus | 'all'>('all');
  const [selectedFaculties, setSelectedFaculties] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleStatusChange = (studentId: string, newStatus: StudentStatus) => {
    if (!firestore) return;
    const studentDocRef = doc(firestore, 'users', studentId);
    updateDocumentNonBlocking(studentDocRef, { status: newStatus });
    toast({ title: "Status uğurla dəyişdirildi."});
  };

  const handleDeleteStudent = (studentId: string) => {
    if (!firestore) return;
    const studentDocRef = doc(firestore, 'users', studentId);
    deleteDocumentNonBlocking(studentDocRef);
    toast({ title: "Tələbə uğurla silindi."});
  }

  const handleFacultyFilterChange = (facultyName: string, checked: boolean) => {
    setSelectedFaculties(prev => 
        checked ? [...prev, facultyName] : prev.filter(f => f !== facultyName)
    );
  };
  
    const statusMap: Record<StudentStatus, string> = {
        'təsdiqlənmiş': 'Təsdiqlənmiş',
        'gözləyir': 'Gözləyir',
        'arxivlənmiş': 'Arxivlənmiş'
    };

    const filteredStudents = useMemo(() => {
        if (!students) return [];
        return students.filter(student => {
            const statusMatch = activeTab === 'all' || student.status === activeTab;
            const facultyMatch = selectedFaculties.length === 0 || selectedFaculties.includes(student.faculty);
            const searchMatch = 
                `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.email.toLowerCase().includes(searchTerm.toLowerCase());
            return statusMatch && facultyMatch && searchMatch;
        })
    }, [students, activeTab, selectedFaculties, searchTerm]);

    const isLoading = usersLoading || facultiesLoading;

    if (isLoading) {
      return <div className="text-center py-10">Yüklənir...</div>
    }

    return (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <div className="flex items-center">
              <TabsList>
                <TabsTrigger value="all">Hamısı</TabsTrigger>
                <TabsTrigger value="təsdiqlənmiş">Təsdiqlənmiş</TabsTrigger>
                <TabsTrigger value="gözləyir">Gözləyən</TabsTrigger>
                <TabsTrigger value="arxivlənmiş" className="hidden sm:flex">
                  Arxivlənmiş
                </TabsTrigger>
              </TabsList>
              <div className="ml-auto flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1">
                      <ListFilter className="h-3.5 w-3.5" />
                      <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Filtr
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Fakültəyə görə</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {faculties?.map(faculty => (
                       <DropdownMenuCheckboxItem 
                            key={faculty.id}
                            checked={selectedFaculties.includes(faculty.name)}
                            onCheckedChange={(checked) => handleFacultyFilterChange(faculty.name, !!checked)}
                        >
                        {faculty.name}
                       </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm" variant="outline" className="h-8 gap-1" disabled>
                  <File className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Eksport
                  </span>
                </Button>
              </div>
            </div>
            <Card className="mt-4">
            <CardHeader>
                <CardTitle>Tələbələr</CardTitle>
                <CardDescription>
                Sistemdəki bütün tələbələri idarə edin.
                </CardDescription>
                <div className="relative pt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Ad, soyad və ya email ilə axtar..."
                        className="pl-10 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Ad Soyad</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">
                        İstedad Balı
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                        Qeydiyyat Tarixi
                    </TableHead>
                    <TableHead>
                        <span className="sr-only">Əməliyyatlar</span>
                    </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center">Yüklənir...</TableCell></TableRow>
                    ) : (
                      filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                          <TableCell className="font-medium">
                              {student.firstName} {student.lastName}
                              <div className="text-xs text-muted-foreground">{student.email}</div>
                          </TableCell>
                          <TableCell>
                              <Badge variant={student.status === 'təsdiqlənmiş' ? 'default' : student.status === 'gözləyir' ? 'secondary' : 'outline'}>
                                  {student.status ? statusMap[student.status] : 'Naməlum'}
                              </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                              {student.talentScore || 'N/A'}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                              {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>
                              <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button
                                  aria-haspopup="true"
                                  size="icon"
                                  variant="ghost"
                                  >
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Menyunu aç</span>
                                  </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Əməliyyatlar</DropdownMenuLabel>
                                  <DropdownMenuItem asChild>
                                      <Link href={`/profile/${student.id}`}>Profilə bax</Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                      <Link href={`/profile/edit?userId=${student.id}`}>Redaktə et</Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSub>
                                      <DropdownMenuSubTrigger>Statusu dəyiş</DropdownMenuSubTrigger>
                                      <DropdownMenuSubContent>
                                          <DropdownMenuItem onClick={() => handleStatusChange(student.id, 'təsdiqlənmiş')}>Təsdiqlə</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleStatusChange(student.id, 'gözləyir')}>Gözləməyə al</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleStatusChange(student.id, 'arxivlənmiş')}>Arxivlə</DropdownMenuItem>
                                      </DropdownMenuSubContent>
                                  </DropdownMenuSub>
                                  <DropdownMenuSeparator />
                                      <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">Sil</DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                          <AlertDialogHeader>
                                              <AlertDialogTitle>Təsdiq edirsiniz?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                  Bu əməliyyat geri qaytarılmazdır. Bu, tələbəni sistemdən həmişəlik siləcək.
                                              </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                              <AlertDialogCancel>Ləğv et</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleDeleteStudent(student.id)} className="bg-destructive hover:bg-destructive/90">Bəli, sil</AlertDialogAction>
                                          </AlertDialogFooter>
                                      </AlertDialogContent>
                                  </AlertDialog>
                              </DropdownMenuContent>
                              </DropdownMenu>
                          </TableCell>
                      </TableRow>
                      ))
                    )}
                </TableBody>
                </Table>
                 {filteredStudents.length === 0 && !isLoading && (
                    <div className="text-center py-10 text-muted-foreground">
                        Nəticə tapılmadı.
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <div className="text-xs text-muted-foreground">
                Göstərilir: <strong>{filteredStudents.length}</strong> / <strong>{students?.length || 0}</strong>{" "}
                tələbə
                </div>
            </CardFooter>
            </Card>
        </Tabs>
    )
}
