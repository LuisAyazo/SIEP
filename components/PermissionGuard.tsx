'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseSession } from './providers/SessionProvider';
import { usePermission } from '@/app/auth/hooks';
import { PermissionLevel } from '@/app/auth/permissions';

interface PermissionGuardProps {
  resource: string;
  requiredPermission: PermissionLevel;
  redirectTo?: string;
  children: ReactNode;
}

export default function PermissionGuard({
  resource,
  requiredPermission,
  redirectTo = '/',
  children,
}: PermissionGuardProps) {
  const { user, loading } = useSupabaseSession();
  const router = useRouter();
  const hasAccess = usePermission(resource, requiredPermission);

  // Check if the user is authenticated
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="h-12 w-12 border-b-2 border-amber-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // If the user doesn't have the required permission, redirect them
  if (!hasAccess) {
    // Use a client-side redirect for authenticated users without permission
    if (user) {
      // If in production, perform the redirect
      // In development, just show a warning so we can develop the UI
      if (process.env.NODE_ENV === 'production') {
        router.push(redirectTo);
        return null;
      } else {
        console.warn(`[DEV MODE] Permission denied: ${resource}.${requiredPermission}`);
        // In development, show the component with a warning banner
        return (
          <div>
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
              <p className="font-bold">Permiso denegado</p>
              <p>Acceso restringido: {resource}.{requiredPermission}</p>
              <p className="text-sm">Nota: Este mensaje solo aparece en modo desarrollo.</p>
            </div>
            {children}
          </div>
        );
      }
    } else {
      // For unauthenticated users, redirect to sign in
      router.push('/auth/signin');
      return null;
    }
  }

  // If the user has the required permission, render the children
  return <>{children}</>;
}