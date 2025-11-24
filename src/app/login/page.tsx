'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  email: z.string().email({ message: 'Etibarlı bir e-poçt ünvanı daxil edin.' }),
  password: z.string().min(6, { message: 'Şifrə ən azı 6 simvoldan ibarət olmalıdır.' }),
});

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Redirect if user is already logged in
  useEffect(() => {
    if (!loading && user) {
        if (user.role === 'student') router.push('/student-dashboard');
        else if (user.role === 'student-organization') router.push('/telebe-teskilati-paneli/dashboard');
        else if (user.role === 'admin') router.push('/admin/dashboard');
        else router.push('/');
    }
  }, [user, loading, router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const success = await login(values.email, values.password);

    if (success) {
      toast({
        title: 'Uğurlu Giriş',
        description: 'İstedad Mərkəzinə xoş gəlmisiniz!',
      });
      // The useEffect hook will handle the redirection after the user state is updated.
    } else {
      toast({
        variant: 'destructive',
        title: 'Giriş Uğursuz Oldu',
        description: 'E-poçt və ya şifrə yanlışdır.',
      });
    }
    setIsSubmitting(false);
  }
  
  if (loading || user) {
    return <div className="text-center">Yönləndirilir...</div>;
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Giriş</CardTitle>
          <CardDescription>
            Hesabınıza daxil olmaq üçün məlumatlarınızı daxil edin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-poçt</FormLabel>
                    <FormControl>
                      <Input placeholder="ad@nümunə.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şifrə</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Giriş edilir...' : 'Daxil ol'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex-col items-center justify-center text-sm">
          <p>
              Hesabınız yoxdur?{' '}
              <Button variant="link" asChild className="p-0">
                 <Link href="/register-student">Tələbə kimi qeydiyyat</Link>
              </Button>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
