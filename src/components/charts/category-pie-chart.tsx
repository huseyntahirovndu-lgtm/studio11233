'use client';

import { TrendingUp } from 'lucide-react';
import { Pie, PieChart, Cell } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Student, CategoryData } from '@/types';

// Helper to generate a consistent color from a string
const stringToHslColor = (str: string, s: number, l: number): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${h}, ${s}%, ${l}%)`;
};

interface CategoryPieChartProps {
  students: Student[];
  categoriesData: CategoryData[];
}

export function CategoryPieChart({ students, categoriesData }: CategoryPieChartProps) {
    
  const chartData = (categoriesData || []).map((category) => ({
    name: category.name,
    value: students.filter((student) => student.category.includes(category.name)).length,
    fill: stringToHslColor(category.name, 70, 50),
  })).filter(d => d.value > 0);

  const chartConfig = {
    value: {
      label: 'Tələbələr',
    },
    ...Object.fromEntries(
        (categoriesData || []).map(cat => [cat.name, {label: cat.name}])
    )
  };
  
  const mostPopulousCategory = chartData.length > 0 
    ? chartData.reduce((prev, current) => (prev.value > current.value) ? prev : current)
    : null;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="items-center pb-0">
        <CardTitle>Kateqoriyalara Görə Paylanma</CardTitle>
        <CardDescription>İstedadların əsas kateqoriyalar üzrə bölgüsü</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              strokeWidth={5}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm pt-4">
        {mostPopulousCategory && (
            <div className="flex items-center justify-center gap-2 font-medium leading-none">
              Ən çox tələbə {mostPopulousCategory.name} sahəsindədir <TrendingUp className="h-4 w-4" />
            </div>
        )}
        <div className="leading-none text-muted-foreground">
          Cari tələbə məlumatlarına əsasən.
        </div>
      </CardFooter>
    </Card>
  );
}
