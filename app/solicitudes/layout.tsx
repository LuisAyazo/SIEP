"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseSession } from "@/components/providers/SessionProvider";
import Image from "next/image";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import NotificationPanel from "@/components/NotificationPanel";
import { createClient } from "@/lib/supabase/client";

export default function SolicitudesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { session, loading: authLoading } = useSupabaseSession();
  const supabase = createClient();
  const [darkMode, setDarkMode] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Verificar autenticación
  useEffect(() => {
    if (!authLoading && !session) {
      router.replace('/login');
    }
  }, [session, authLoading, router]);

  // Obtener el rol del usuario
  useEffect(() => {
    async function fetchUserRole() {
      if (!session?.user?.id) {
        setUserRole(null);
        return;
      }
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', session.user.id)
        .limit(1);
      
      if (error) {
        console.error('Error al obtener rol:', error);
        setUserRole(null);
      } else if (data && data.length > 0) {
        const roleName = (data[0] as any)?.roles?.name;
        setUserRole(roleName || null);
      } else {
        setUserRole(null);
      }
    }
    
    fetchUserRole();
  }, [session?.user?.id, supabase]);

  // Cargar tema desde localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Función para alternar el tema
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Función para cerrar sesión
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Obtener datos del usuario
  const userName = (session?.user as any)?.user_metadata?.name || (session?.user as any)?.user_metadata?.full_name || (session?.user as any)?.name || session?.user?.email?.split('@')[0] || null;
  const userEmail = session?.user?.email || null;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-700">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-600">
        <div className="px-4 py-3 flex items-center justify-between">
          {/* Logo and title */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/images/logo-universidad-transparente.png"
                alt="Logo Universidad"
                width={48}
                height={48}
                className="rounded-sm border border-gray-200 dark:border-slate-500 dark:invert"
              />
              <span className="text-xl font-semibold text-gray-900 dark:text-white">
                SIEP
              </span>
            </Link>
          </div>

          {/* Right side of header with user info */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleDarkMode}
              className="h-12 w-12 flex items-center justify-center rounded-lg bg-gray-100/50 dark:bg-slate-700/50 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors backdrop-blur-sm"
              title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              )}
            </button>

            {/* Notification Panel */}
            <div className="h-12 flex items-center justify-center px-3 rounded-lg bg-gray-100/50 dark:bg-slate-700/50 backdrop-blur-sm">
              <NotificationPanel />
            </div>
            
            {/* User info */}
            <div className="relative group">
              <button className="h-12 flex items-center gap-3 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 bg-gray-100/50 dark:bg-slate-700/50 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors backdrop-blur-sm">
                <span className="hidden md:block text-right">
                  <span className="block text-sm font-medium text-gray-900 dark:text-white">
                    {userName || "Usuario"}
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    {userRole || "Sin centros asignados"}
                  </span>
                </span>
                <div className="w-9 h-9 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white shadow-sm font-medium">
                  {userName ? userName.charAt(0).toUpperCase() : "U"}
                </div>
              </button>
              {/* Dropdown user menu */}
              <div className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-slate-700 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-slate-600">
                  <div className="font-medium truncate">{userEmail || "email@example.com"}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Rol: {userRole || "Sin rol"}</div>
                </div>
                <Link
                  href="/"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600"
                >
                  ← Volver al Inicio
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-600 font-medium mt-1"
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                    Cerrar sesión
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="min-h-[calc(100vh-73px)]">
        {children}
      </main>
    </div>
  );
}
