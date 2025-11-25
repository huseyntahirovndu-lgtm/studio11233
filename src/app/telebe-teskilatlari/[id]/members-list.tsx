'use client';

import { useAuth } from '@/hooks/use-auth';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, documentId, query, where } from 'firebase/firestore';
import { Student, StudentOrganization } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface MembersListProps {
  organization: StudentOrganization;
}

export default function MembersList({ organization }: MembersListProps) {
  const { user: currentUser } = useAuth();
  const firestore = useFirestore();

  const membersQuery = useMemoFirebase(
    () =>
      organization?.memberIds && organization.memberIds.length > 0
        ? query(
            collection(firestore, 'users'),
            where(documentId(), 'in', organization.memberIds)
          )
        : null,
    [firestore, organization?.memberIds]
  );

  const { data: members, isLoading: membersLoading } = useCollection<Student>(membersQuery);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Users /> Üzvlər
        </CardTitle>
        {!currentUser && (
          <CardDescription className="text-xs">
            Üzv siyahısını görmək üçün giriş edin.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {currentUser && membersLoading && (
           <div className="space-y-3">
             <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-32" />
             </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-40" />
             </div>
           </div>
        )}
        {currentUser && members && members.length > 0 ? (
          <div>
            <div className="space-y-3">
              {members.map((member) => (
                <Link
                  key={member.id}
                  href={`/profile/${member.id}`}
                  className="flex items-center gap-3 group"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={member.profilePictureUrl}
                      alt={`${member.firstName} ${member.lastName}`}
                    />
                    <AvatarFallback>
                      {member.firstName?.charAt(0)}
                      {member.lastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium group-hover:underline">{`${member.firstName} ${member.lastName}`}</p>
                </Link>
              ))}
            </div>
          </div>
        ) : currentUser && !membersLoading ? (
          <p className="text-sm text-muted-foreground">
            Bu təşkilatın heç bir üzvü yoxdur.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
