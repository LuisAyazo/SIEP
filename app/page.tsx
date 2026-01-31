"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCenterContext } from "@/components/providers/CenterContext";
import { useSupabaseSession } from "@/components/providers/SessionProvider";
import { FileText, FolderOpen, Moon, Sun } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import NotificationPanel from "@/components/NotificationPanel";
import LoadingScreen from "@/components/LoadingScreen";

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { availableCenters, currentCenter, loading: centersLoading } = useCenterContext();
  const { session, loading: authLoading } = useSupabaseSession();
  const [showNoCenterView, setShowNoCenterView] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasRedirected, setHasRedirected] = useState(false);

  // Cargar tema desde localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

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

  // Toggle tema oscuro/claro
  const toggleDarkMode = () => {
    // console.log('[HomePage] 🌓 Toggle dark mode clicked');
    // console.log('[HomePage] Current darkMode state:', darkMode);
    const newMode = !darkMode;
    // console.log('[HomePage] New darkMode state:', newMode);
    setDarkMode(newMode);
    if (newMode) {
      // console.log('[HomePage] ✅ Activando modo oscuro');
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      // console.log('[HomePage] HTML classList:', document.documentElement.classList.toString());
    } else {
      // console.log('[HomePage] ☀️ Activando modo claro');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      // console.log('[HomePage] HTML classList:', document.documentElement.classList.toString());
    }
    // console.log('[HomePage] localStorage theme:', localStorage.getItem('theme'));
  };

  // Función para cerrar sesión
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  useEffect(() => {
    // 🔥 CRÍTICO: Solo ejecutar redirección si estamos EXACTAMENTE en la ruta "/"
    // Esto previene que se ejecute cuando el usuario está en otras rutas
    if (pathname !== '/') {
      return;
    }

    // 🔥 PREVENIR LOOP: Si ya redirigimos, no hacer nada más
    if (hasRedirected) {
      return;
    }

    // Esperar a que termine de cargar la autenticación
    if (authLoading) {
      return;
    }

    // Si no hay sesión, redirigir a login inmediatamente
    if (!session) {
      setHasRedirected(true);
      router.replace('/login');
      return;
    }

    // Si hay sesión pero aún están cargando los centros, esperar
    if (centersLoading) {
      return;
    }

    // Si hay centros disponibles, redirigir al dashboard del centro INMEDIATAMENTE
    if (availableCenters.length > 0) {
      const centerToUse = currentCenter || availableCenters[0];
      const slug = centerToUse.slug || centerToUse.name.toLowerCase().replace(/ /g, '-');
      
      // 🔥 MARCAR que ya redirigimos ANTES de hacer la redirección
      setHasRedirected(true);
      
      // 🔥 NO mostrar la vista de "sin centros" si hay centros
      setShowNoCenterView(false);
      
      // Usar router.replace para evitar que el usuario vuelva a /
      router.replace(`/center/${slug}/dashboard`);
      return; // Importante: salir inmediatamente
    } else {
      // No hay centros asignados, mostrar vista especial
      setShowNoCenterView(true);
    }
  }, [pathname, availableCenters, currentCenter, router, session, authLoading, centersLoading, hasRedirected]);

  // Vista de carga - mostrar loader profesional
  if (authLoading) {
    return <LoadingScreen message="Verificando autenticación..." />;
  }

  if (centersLoading) {
    return <LoadingScreen message="Cargando centros..." />;
  }

  // 🔥 Si hay centros disponibles, SIEMPRE mostrar loader (nunca la vista sin centros)
  if (availableCenters.length > 0) {
    return <LoadingScreen message="Redirigiendo al dashboard..." />;
  }

  // Si no hay centros pero aún no se ha determinado que debe mostrar la vista sin centros
  // mostrar loader (esto previene el flash de contenido)
  if (!showNoCenterView) {
    return <LoadingScreen message="Preparando interfaz..." />;
  }

  // Obtener datos del usuario
  const userName = (session?.user as any)?.user_metadata?.name || (session?.user as any)?.user_metadata?.full_name || (session?.user as any)?.name || session?.user?.email?.split('@')[0] || null;
  const userEmail = session?.user?.email || null;

  // Vista para usuarios sin centros asignados
  return (
    <div className="min-h-screen">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        {/* Header estilo dashboard */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3 flex items-center justify-between">
            {/* Logo and title */}
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="/images/logo-universidad-transparente.png"
                  alt="Logo Universidad"
                  width={48}
                  height={48}
                  className="rounded-sm border border-gray-200 dark:border-gray-600 dark:invert"
                />
                <span className="text-xl font-semibold text-gray-900 dark:text-white">
                  SIEP
                </span>
              </Link>
            </div>

            {/* Right side of header with user info */}
            <div className="flex items-center gap-3">
              {/* Theme toggle */}
              <button
                onClick={toggleDarkMode}
                className="h-12 w-12 flex items-center justify-center rounded-lg bg-gray-100/50 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors backdrop-blur-sm"
                title={darkMode ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                )}
              </button>

              {/* Notification Panel */}
              <div className="h-12 flex items-center justify-center px-3 rounded-lg bg-gray-100/50 dark:bg-gray-700/50 backdrop-blur-sm">
                <NotificationPanel />
              </div>
              
              {/* User info */}
              <div className="relative group">
                <button className="h-12 flex items-center gap-3 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 bg-gray-100/50 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors backdrop-blur-sm">
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
                <div className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                    <div className="font-medium truncate">{userEmail || "email@example.com"}</div>
                    <div className="text-xs text-gray-500">Rol: {userRole || "Sin rol"}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium mt-1"
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

        {/* Contenido Principal */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Bienvenido al Sistema de Solicitudes
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Gestiona tus solicitudes de manera fácil y rápida
            </p>
          </div>

          {/* Botones de Acción */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Botón Generar Solicitud */}
            <button
              onClick={() => router.push('/solicitudes/create')}
              className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border-2 border-transparent hover:border-blue-500 dark:hover:border-blue-400"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center group-hover:bg-blue-500 dark:group-hover:bg-blue-600 transition-colors duration-300">
                  <FileText className="w-10 h-10 text-blue-600 dark:text-blue-300 group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Generar Solicitud
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Crea una nueva solicitud para tu proyecto o actividad
                  </p>
                </div>
              </div>
            </button>

            {/* Botón Mis Solicitudes */}
            <button
              onClick={() => router.push('/solicitudes')}
              className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border-2 border-transparent hover:border-indigo-500 dark:hover:border-indigo-400"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center group-hover:bg-indigo-500 dark:group-hover:bg-indigo-600 transition-colors duration-300">
                  <FolderOpen className="w-10 h-10 text-indigo-600 dark:text-indigo-300 group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Mis Solicitudes
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Consulta el estado de tus solicitudes enviadas
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Información Adicional */}
          <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 max-w-2xl mx-auto border border-gray-200 dark:border-gray-700">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 dark:text-yellow-300 font-bold">ℹ</span>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Información Importante
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Actualmente no tienes centros asignados. Puedes crear y gestionar tus solicitudes desde aquí.
                  Si necesitas acceso a un centro específico, contacta al administrador del sistema.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
