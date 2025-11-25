'use client';
import {
  MoreHorizontal,
  PlusCircle,
} from "lucide-react"
import Link from "next/link";
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import type { StudentOrganization } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, doc, where } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";

export default function AdminStudentOrgsPage() {
    const { toast } = useToast();
    const firestore = useFirestore();

    const orgsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "users"), where("role", "==", "student-organization")) : null, [firestore]);
    const { data: organizations, isLoading } = useCollection<StudentOrganization>(orgsQuery);

    const handleDelete = (orgId: string) => {
        if (!firestore) return;
        const orgDocRef = doc(firestore, 'users', orgId);
        // Also need to handle deletion from auth, but this is a mock.
        // In a real scenario, you'd call a Cloud Function to delete the auth user.
        deleteDocumentNonBlocking(orgDocRef);
        toast({ title: "Təşkilat uğurla silindi." });
    };
    
    const statusMap: Record<StudentOrganization['status'], string> = {
        'təsdiqlənmiş': 'Təsdiqlənmiş',
        'gözləyir': 'Gözləyir',
        'arxivlənmiş': 'Arxivlənmiş'
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div>
                        <CardTitle>Tələbə Təşkilatları</CardTitle>
                        <CardDescription>
                            Universitet daxilindəki tələbə təşkilatlarını idarə edin.
                        </CardDescription>
                    </div>
                     <Button asChild>
                        <Link href="/admin/telebe-teskilatlari/add">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Yeni Təşkilat Yarat
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Təşkilat Adı</TableHead>
                    <TableHead>E-poçt</TableHead>
                     <TableHead className="hidden md:table-cell">
                        Status
                    </TableHead>
                    <TableHead className="text-right">Əməliyyatlar</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                     {isLoading ? (
                         <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">Yüklənir...</TableCell>
                        </TableRow>
                    ) : organizations && organizations.length > 0 ? (
                        organizations.map((org) => (
                        <TableRow key={org.id}>
                            <TableCell className="font-medium">{org.name}</TableCell>
                            <TableCell>{org.email}</TableCell>
                            <TableCell className="hidden md:table-cell">
                                <Badge variant={org.status === 'təsdiqlənmiş' ? 'default' : org.status === 'gözləyir' ? 'secondary' : 'outline'}>
                                  {statusMap[org.status]}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                               <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Menyunu aç</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Əməliyyatlar</DropdownMenuLabel>
                                         <DropdownMenuItem asChild>
                                            <Link href={`/admin/telebe-teskilatlari/edit/${org.id}`}>Redaktə Et</Link>
                                        </DropdownMenuItem>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">Sil</DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Silməni təsdiq edirsiniz?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Bu əməliyyat geri qaytarılmazdır. "{org.name}" təşkilatı sistemdən həmişəlik silinəcək.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Ləğv et</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(org.id)} className="bg-destructive hover:bg-destructive/90">Bəli, sil</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </DropdownMenuContent>
                                    </DropdownMenu>
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                         <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">Heç bir təşkilat tapılmadı.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
