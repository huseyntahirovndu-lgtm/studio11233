'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Student } from '@/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';


interface FacultyBarChartProps {
    students: Student[];
}

export function FacultyBarChart({ students }: FacultyBarChartProps) {
  const firestore = useFirestore();
  const facultiesQuery = useMemoFirebase(() => collection(firestore, 'faculties'), [firestore]);
  const { data: faculties } = useCollection<{name: string}>(facultiesQuery);

  const chartData = faculties?.map(faculty => ({
      name: faculty.name.split(' ')[0], // Shorten name for display
      total: students.filter(student => student.faculty === faculty.name).length
  })).filter(d => d.total > 0) || [];

  const chartConfig = {
    total: {
      label: 'Tələbə sayı',
      color: 'hsl(var(--chart-1))',
    },
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Fakültələr Üzrə İstedadlar</CardTitle>
        <CardDescription>Hər fakültədəki qeydiyyatdan keçmiş istedadlı tələbələrin sayı</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart 
            accessibilityLayer
            data={chartData}
            margin={{
                left: -20
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value}
            />
            <YAxis />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="total" fill="var(--color-total)" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
