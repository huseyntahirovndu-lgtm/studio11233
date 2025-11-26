'use client';
import { useFirestore, useMemoFirebase, useCollectionOptimized } from '@/firebase';
import { Student } from '@/types';
import { useMemo } from 'react';
import { collection, query, where, documentId } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useStudentOrg } from '../layout';

const chartConfig = {
  members: {
    label: 'Yeni Üzvlər',
    color: 'hsl(var(--chart-1))',
  },
};

export default function OrganizationDashboardPage() {
  const firestore = useFirestore();
  const { organization, isLoading: orgLoading } = useStudentOrg();

  const membersQuery = useMemoFirebase(
    () => (organization?.memberIds && organization.memberIds.length > 0 ? query(collection(firestore, 'users'), where(documentId(), 'in', organization.memberIds)) : null),
    [firestore, JSON.stringify(organization?.memberIds)]
  );
  const { data: members, isLoading: membersLoading } = useCollectionOptimized<Student>(membersQuery, { enableCache: true, disableRealtimeOnInit: true });

  const memberJoinData = useMemo(() => {
    if (!members) return [];
    const monthlyData: { [key: string]: number } = {};
    const currentYear = new Date().getFullYear();
    const monthOrder = ["Yan", "Fev", "Mar", "Apr", "May", "İyn", "İyl", "Avq", "Sen", "Okt", "Noy", "Dek"];
    
    monthOrder.forEach(month => {
        monthlyData[month] = 0;
    });

    members.forEach(member => {
        if (!member || !member.createdAt) {
            return; 
        }

        let memberDate: Date | null = null;
        try {
            if (member.createdAt && typeof member.createdAt.toDate === 'function') {
                memberDate = member.createdAt.toDate();
            } else if (typeof member.createdAt === 'string' || typeof member.createdAt === 'number') {
                memberDate = new Date(member.createdAt);
                 if (isNaN(memberDate.getTime())) {
                    memberDate = null;
                }
            } else if (member.createdAt instanceof Date) {
                memberDate = member.createdAt;
            }
        } catch(e) {
            console.error("Tarix formatı ilə bağlı problem:", member.id, member.createdAt, e);
            return;
        }

        if (memberDate && memberDate.getFullYear() === currentYear) {
            const monthIndex = memberDate.getMonth();
            const monthName = monthOrder[monthIndex];
            if (monthName) {
                 monthlyData[monthName]++;
            }
        }
    });

    return monthOrder.map(month => ({ month, members: monthlyData[month] || 0 }));

  }, [members]);


  if (orgLoading || membersLoading) {
    return <div className="flex h-screen items-center justify-center">Yüklənir...</div>;
  }
  
  if(!organization) {
    return <div className="flex h-screen items-center justify-center">Təşkilat tapılmadı və ya təsdiqlənməyib.</div>;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={organization.logoUrl} alt={organization.name} />
            <AvatarFallback>{organization.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{organization.name}</CardTitle>
            <CardDescription>{organization.description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted text-center">
                    <p className="text-3xl font-bold">{organization.memberIds?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Üzv Sayı</p>
                </div>
                 <div className="p-4 rounded-lg bg-muted col-span-1 md:col-span-2">
                     <p className="text-lg font-bold mb-2">Aylara görə yeni üzvlər ({new Date().getFullYear()})</p>
                    <ChartContainer config={chartConfig} className="min-h-[100px] w-full">
                        <BarChart accessibilityLayer data={memberJoinData}>
                          <CartesianGrid vertical={false} />
                          <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 3)} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="members" fill="var(--color-members)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
