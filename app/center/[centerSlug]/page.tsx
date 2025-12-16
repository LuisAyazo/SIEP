"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSupabaseSession } from "@/components/providers/SessionProvider";
import { createClient } from "@/lib/supabase/client";
import { hasGranularPermission, GRANULAR_PERMISSIONS } from "@/app/auth/permissions-granular";

export default function CenterIndexPage() {
  const router = useRouter();
  const params = useParams();
  const centerSlug = params.centerSlug as string;
  const { session, loading } = useSupabaseSession();
  const supabase = createClient();

  useEffect(() => {
    async function redirectToFirstAllowedPage() {
      if (loading) return;
      
      if (!session?.user?.id) {
        router.push("/login");
        return;
      }

      // Obtener el rol del usuario
      const { data, error } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', session.user.id)
        .limit(1);

      if (error || !data || data.length === 0) {
        console.error('[CenterIndex] Error al obtener rol:', error);
        router.push("/login");
        return;
      }

      const userRole = (data[0] as any)?.roles?.name;
      console.log('[CenterIndex] Rol del usuario:', userRole);

      // Definir orden de prioridad de páginas según permisos
      const pagesByPriority = [
        { 
          path: `/center/${centerSlug}/dashboard`, 
          permission: GRANULAR_PERMISSIONS.DASHBOARD_VIEW 
        },
        { 
          path: `/center/${centerSlug}/solicitudes`, 
          permission: GRANULAR_PERMISSIONS.SOLICITUDES_READ 
        },
        { 
          path: `/center/${centerSlug}/dashboard/fichas`, 
          permission: GRANULAR_PERMISSIONS.FICHAS_READ 
        },
        { 
          path: `/center/${centerSlug}/dashboard/meetings`, 
          permission: GRANULAR_PERMISSIONS.MEETINGS_READ 
        },
        { 
          path: `/center/${centerSlug}/dashboard/documents`, 
          permission: GRANULAR_PERMISSIONS.DOCUMENTS_READ 
        },
        { 
          path: `/center/${centerSlug}/dashboard/users`, 
          permission: GRANULAR_PERMISSIONS.USERS_READ 
        },
        { 
          path: `/center/${centerSlug}/dashboard/roles`, 
          permission: GRANULAR_PERMISSIONS.ROLES_READ 
        },
        { 
          path: `/center/${centerSlug}/dashboard/settings`, 
          permission: GRANULAR_PERMISSIONS.SETTINGS_READ 
        }
      ];

      // Buscar la primera página permitida
      for (const page of pagesByPriority) {
        if (userRole === 'administrador' || hasGranularPermission(userRole, page.permission)) {
          console.log('[CenterIndex] Redirigiendo a:', page.path);
          router.push(page.path);
          return;
        }
      }

      // Si no tiene permisos para ninguna página, redirigir a login
      console.error('[CenterIndex] Usuario sin permisos para ninguna página');
      router.push("/login");
    }

    redirectToFirstAllowedPage();
  }, [session, loading, router, centerSlug, supabase]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Cargando...
          </span>
        </div>
        <p className="mt-4 text-gray-600">Redirigiendo a tu página principal...</p>
      </div>
    </div>
  );
}