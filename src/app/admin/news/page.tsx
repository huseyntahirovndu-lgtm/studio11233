'use client';
import { MoreHorizontal, PlusCircle } from "lucide-react"
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
import type { News } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { format } from 'date-fns';
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminNewsPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user, loading: authLoading } = useAuth();

    const newsQuery = useMemoFirebase(() => 
        firestore ? query(collection(firestore, "news"), orderBy("createdAt", "desc")) : null, 
        [firestore]
    );
    const { data: news, isLoading: newsLoading } = useCollection<News>(newsQuery);

    const handleDelete = (newsId: string) => {
        if (!firestore) return;
        const newsDocRef = doc(firestore, 'news', newsId);
        deleteDocumentNonBlocking(newsDocRef);
        toast({ title: "Xəbər uğurla silindi." });
    };

    const isLoading = authLoading || newsLoading;

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                        <CardTitle>Xəbərlər</CardTitle>
                        <CardDescription>
                            Platformadakı ümumi xəbərləri və elanları idarə edin.
                        </CardDescription>
                    </div>
                    <Button asChild className="w-full sm:w-auto">
                        <Link href="/admin/news/add">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Yeni Xəbər Yarat
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Başlıq</TableHead>
                    <TableHead className="hidden md:table-cell">Müəllif</TableHead>
                    <TableHead className="hidden md:table-cell">Yaradılma Tarixi</TableHead>
                    <TableHead className="text-right">Əməliyyatlar</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                         <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : news && news.length > 0 ? (
                        news.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.title}</TableCell>
                            <TableCell className="hidden md:table-cell">{item.authorName}</TableCell>
                            <TableCell className="hidden md:table-cell">
                               {item.createdAt?.toDate ? format(item.createdAt.toDate(), 'dd.MM.yyyy') : '-'}
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
                                            <Link href={`/xeberler/${item.slug}`} target="_blank">Xəbərə Bax</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href={`/admin/news/edit/${item.id}`}>Redaktə Et</Link>
                                        </DropdownMenuItem>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">Sil</DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Silməni təsdiq edirsiniz?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Bu əməliyyat geri qaytarılmazdır. "{item.title}" başlıqlı xəbər sistemdən həmişəlik silinəcək.
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
                            <TableCell colSpan={4} className="h-24 text-center">Heç bir xəbər tapılmadı.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
