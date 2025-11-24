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
import type { StudentOrgUpdate } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc, writeBatch } from "firebase/firestore";
import { format } from 'date-fns';
import { useStudentOrg } from "@/app/(student-org-panel)/layout";


function safeFormatDate(date: any): string {
    if (!date) return '-';
    // Firestore Timestamp
    if (date && typeof date.toDate === 'function') {
        return format(date.toDate(), 'dd.MM.yyyy');
    }
    // ISO string or number
    try {
        const d = new Date(date);
        // Check if date is valid
        if (!isNaN(d.getTime())) {
            return format(d, 'dd.MM.yyyy');
        }
    } catch (e) {
        // Ignore parsing errors
    }
    // If it's a string that's not a valid date, return as is or a placeholder
    return typeof date === 'string' ? date : '-';
}

export default function OrgUpdatesPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { organization } = useStudentOrg();

    const updatesQuery = useMemoFirebase(() => 
        organization ? query(collection(firestore, `users/${organization.id}/updates`), orderBy("createdAt", "desc")) : null, 
        [firestore, organization]
    );
    const { data: updates, isLoading } = useCollection<StudentOrgUpdate>(updatesQuery);

    const handleDelete = async (updateId: string) => {
        if (!organization || !firestore) return;

        const batch = writeBatch(firestore);

        const subCollectionDocRef = doc(firestore, `users/${organization.id}/updates`, updateId);
        const topLevelDocRef = doc(firestore, 'student-org-updates', updateId);

        batch.delete(subCollectionDocRef);
        batch.delete(topLevelDocRef);

        try {
            await batch.commit();
            toast({ title: "Yenilik uğurla silindi." });
        } catch (error) {
            console.error("Yenilik silinərkən xəta:", error);
            toast({ variant: 'destructive', title: "Xəta", description: "Yenilik silinərkən xəta baş verdi." });
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                        <CardTitle>Təşkilat Yenilikləri</CardTitle>
                        <CardDescription>
                            Təşkilatınızın fəaliyyəti haqqında yenilikləri və elanları idarə edin.
                        </CardDescription>
                    </div>
                    <Button asChild className="w-full sm:w-auto">
                        <Link href="/telebe-teskilati-paneli/updates/add">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Yeni Yenilik Yarat
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Başlıq</TableHead>
                    <TableHead className="hidden md:table-cell">Yaradılma Tarixi</TableHead>
                    <TableHead className="text-right">Əməliyyatlar</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                         <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">Yüklənir...</TableCell>
                        </TableRow>
                    ) : updates && updates.length > 0 ? (
                        updates.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.title}</TableCell>
                            <TableCell className="hidden md:table-cell">
                               {safeFormatDate(item.createdAt)}
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
                                            <Link href={`/telebe-teskilati-paneli/updates/edit/${item.id}`}>Redaktə Et</Link>
                                        </DropdownMenuItem>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">Sil</DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Silməni təsdiq edirsiniz?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Bu əməliyyat geri qaytarılmazdır. "{item.title}" başlıqlı yenilik sistemdən həmişəlik silinəcək.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Ləğv et</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive hover:bg-destructive/90">Bəli, sil</AlertDialogAction>
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
                            <TableCell colSpan={3} className="h-24 text-center">Heç bir yenilik tapılmadı.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
