'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSupabaseSession } from './SessionProvider';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Definición del tipo de centro
export interface Center {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isDefault?: boolean;
  active?: boolean;
  stats?: {
    activeProjects: number;
    documents: number;
    forms: number;
    activeUsers: number;
    totalFichas?: number;
    pendingApprovals?: number;
    budget?: {
      total: number;
      executed: number;
      available: number;
    };
    recentActivity?: any[];
  };
}

// Stats por defecto cuando no hay datos
const DEFAULT_STATS = {
  activeProjects: 0,
  documents: 0,
  forms: 0,
  activeUsers: 0,
  totalFichas: 0,
  pendingApprovals: 0,
  budget: {
    total: 0,
    executed: 0,
    available: 0
  },
  recentActivity: []
};

// Lista temporal de centros - se actualizará desde Supabase
export const AVAILABLE_CENTERS: Center[] = [
  {
    id: '08b72eec-a181-42e9-81d1-7c1023597dba',
    name: 'Centro de Educación Continua',
    slug: 'centro-educacion-continua',
    description: 'Centro de formación continua y educación permanente',
    isDefault: true,
    active: true,
    stats: DEFAULT_STATS
  },
  {
    id: 'c82f08c0-e89b-42c4-b35e-ab58267296cc',
    name: 'Centro de Servicios',
    slug: 'centro-servicios',
    description: 'Centro de servicios académicos y administrativos',
    isDefault: false,
    active: true,
    stats: DEFAULT_STATS
  },
  {
    id: '01569738-a2c1-4530-bd42-bf00b8879739',
    name: 'Centro de Transferencia',
    slug: 'centro-transferencia',
    description: 'Centro de transferencia tecnológica',
    isDefault: false,
    active: true,
    stats: DEFAULT_STATS
  }
];

// Tipo para el contexto
interface CenterContextType {
  currentCenter: Center | null;
  availableCenters: Center[];
  setCenter: (center: Center) => void;
  addCenter: (center: Center) => void;
  loading: boolean;
}

const CenterContext = createContext<CenterContextType>({
  currentCenter: null,
  availableCenters: AVAILABLE_CENTERS,
  setCenter: () => {},
  addCenter: () => {},
  loading: true
});

export const useCenterContext = () => useContext(CenterContext);

export const CenterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading: authLoading } = useSupabaseSession();
  const status = authLoading ? 'loading' : session ? 'authenticated' : 'unauthenticated';
  const [currentCenter, setCurrentCenter] = useState<Center | null>(null);
  const [availableCenters, setAvailableCenters] = useState<Center[]>(AVAILABLE_CENTERS);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const isInitialized = useRef(false);
  const redirectionInProgress = useRef(false);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const defaultCenterForcedRef = useRef(false);
  const lastProcessedPathname = useRef<string | null>(null);
  const supabase = createClient();

  // 🔥 Cargar centros asignados al usuario desde Supabase
  useEffect(() => {
    async function loadCenters() {
      console.log('🔄 Cargando centros desde Supabase...');
      
      // Si no hay sesión, usar los centros por defecto
      if (!session?.user?.id) {
        console.log('⚠️ No hay sesión de usuario, usando centros por defecto');
        return;
      }

      try {
        // Primero verificar si el usuario es administrador
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('roles!inner(name)')
          .eq('user_id', session.user.id);

        const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
        const isAdmin = roles.includes('administrador');

        let centers;
        
        if (isAdmin) {
          // Si es admin, cargar todos los centros
          console.log('👑 Usuario es administrador, cargando todos los centros');
          const { data, error } = await supabase
            .from('centers')
            .select('*')
            .order('name');

          if (error) throw error;
          centers = data;
        } else {
          // Si no es admin, cargar solo los centros asignados
          console.log('👤 Usuario regular, cargando centros asignados');
          const { data, error } = await supabase
            .from('user_centers')
            .select('centers(*)')
            .eq('user_id', session.user.id);

          if (error) throw error;
          centers = data?.map((uc: any) => uc.centers).filter(Boolean) || [];
        }

        if (centers && centers.length > 0) {
          console.log(`✅ ${centers.length} centros cargados para el usuario`);
          
          const formattedCenters: Center[] = centers.map((center: any, index: number) => ({
            id: center.id,
            name: center.name,
            slug: center.slug,
            description: center.description || '',
            isDefault: index === 0,
            active: true,
            stats: DEFAULT_STATS
          }));
          
          console.log('📋 Centros del usuario:', formattedCenters.map(c => c.name));
          setAvailableCenters(formattedCenters);
        } else {
          console.warn('⚠️ Usuario no tiene centros asignados');
          // Mantener los centros por defecto si no hay asignaciones
        }
      } catch (err) {
        console.error('❌ Error cargando centros del usuario:', err);
      }
    }

    loadCenters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]); // Solo depender del user ID, no del objeto completo

  // Obtener el centro por defecto de la lista de centros disponibles
  const getDefaultCenter = useCallback(() => {
    const defaultCenter = availableCenters.find(center => center.isDefault);
    return defaultCenter || availableCenters[0] || null;
  }, [availableCenters]);

  // Memoized function to get center from localStorage
  const getSavedCenter = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    try {
      const savedCenter = localStorage.getItem('selectedCenter');
      if (savedCenter) {
        const centerData = JSON.parse(savedCenter);
        if (centerData && centerData.id && centerData.name && centerData.slug) {
          // Ensure we have the latest stats and other data from availableCenters
          const matchingCenter = availableCenters.find(c => c.id === centerData.id);
          if (matchingCenter) {
            return { ...matchingCenter, ...centerData };
          }
          return centerData;
        }
      }
    } catch (error) {
      console.error('Error reading center from localStorage:', error);
    }
    return null;
  }, []);

  // Memoized fallbackToDefaultCenter function
  const fallbackToDefaultCenter = useCallback(() => {
    console.log('Estableciendo centro por defecto...');
    const defaultCenter = getDefaultCenter();
    if (defaultCenter) {
      console.log('Using default center:', defaultCenter.name);
      setCurrentCenter(defaultCenter);
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('selectedCenter', JSON.stringify(defaultCenter));
        }
      } catch (error) {
        console.error('Error saving default center to localStorage:', error);
      }
      return true;
    }
    return false;
  }, [getDefaultCenter]);

  // Efecto para forzar un centro por defecto al inicio
  useEffect(() => {
    // Solo ejecutar una vez al montar el componente
    if (defaultCenterForcedRef.current) return;
    
    console.log("Forzando inicialización de centro por defecto en primer mount...");
    const defaultCenter = getDefaultCenter();
    
    if (defaultCenter && !currentCenter) {
      console.log("Estableciendo centro por defecto al inicio:", defaultCenter.name);
      setCurrentCenter(defaultCenter);
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('selectedCenter', JSON.stringify(defaultCenter));
        }
      } catch (error) {
        console.error('Error saving default center to localStorage:', error);
      }
      
      // Marcamos que ya forzamos el centro por defecto
      defaultCenterForcedRef.current = true;
      isInitialized.current = true;
      setLoading(false);
    }
  }, [getDefaultCenter, currentCenter]);

  // Inicializar centros cuando cambia el estado de autenticación
  useEffect(() => {
    console.log("Auth status changed:", status);
    
    // Limpiar cualquier timeout pendiente
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }
    
    // Si ya está inicializado y tenemos un centro, no hacer nada
    if (isInitialized.current && currentCenter) {
      console.log("Already initialized with center:", currentCenter.name);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    // Si estamos autenticados, inicializar el centro
    if (status === 'authenticated') {
      console.log("User authenticated, initializing center...");
      
      // Intentar cargar desde localStorage
      const savedCenter = getSavedCenter();
      
      if (savedCenter) {
        console.log('Loading saved center from localStorage:', savedCenter.name);
        setCurrentCenter(savedCenter);
        isInitialized.current = true;
        setLoading(false);
      } else {
        // No hay centro guardado, usar el predeterminado
        console.log('No saved center found, falling back to default');
        const initialized = fallbackToDefaultCenter();
        isInitialized.current = initialized;
        setLoading(false);
      }
    } 
    // Si no estamos autenticados pero estamos en un entorno cliente, también inicializamos un centro por defecto
    else if (status === 'unauthenticated' && typeof window !== 'undefined') {
      console.log("User not authenticated, using default center for demo");
      fallbackToDefaultCenter();
      isInitialized.current = true;
      setLoading(false);
    }
    // Si el estado de autenticación está cargando, ponemos un timeout para evitar que se quede cargando indefinidamente
    else if (status === 'loading') {
      console.log("Auth status loading, setting timeout...");
      initTimeoutRef.current = setTimeout(() => {
        console.log("Auth timeout reached, forcing initialization");
        // Si después de 3 segundos aún estamos cargando, forzamos un centro predeterminado
        if (!isInitialized.current && !currentCenter) {
          fallbackToDefaultCenter();
          isInitialized.current = true;
          setLoading(false);
        }
      }, 2000); // Reducido a 2 segundos para una experiencia más rápida
    }
    
    // Limpiar timeout al desmontar
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, [status, getSavedCenter, fallbackToDefaultCenter, currentCenter]);

  // Efecto para detectar cuando estamos en una ruta de centro pero no tenemos centro seleccionado
  useEffect(() => {
    // Solo esperar si no hay centros disponibles o si hay redirección en progreso
    if (redirectionInProgress.current || !pathname || availableCenters.length === 0) {
      console.log('[CenterContext] Esperando...', {
        redirectionInProgress: redirectionInProgress.current,
        pathname,
        availableCentersCount: availableCenters.length
      });
      return;
    }
    
    // 🔥 PREVENIR LOOP: No procesar el mismo pathname dos veces
    if (lastProcessedPathname.current === pathname) {
      console.log('[CenterContext] ⏭️ Pathname ya procesado, saltando:', pathname);
      return;
    }
    
    if (pathname.includes('/center/')) {
      // Extraer el slug del centro de la URL
      const pathParts = pathname.split('/center/')[1]?.split('/') || [];
      const centerSlugInUrl = pathParts[0];
      
      console.log('[CenterContext] Detectada ruta de centro. Slug en URL:', centerSlugInUrl);
      console.log('[CenterContext] Centro actual:', currentCenter?.slug || 'ninguno');
      console.log('[CenterContext] Loading state:', loading);
      console.log('[CenterContext] Centros disponibles:', availableCenters.map(c => c.slug));
      
      // Verificar si el usuario tiene acceso al centro en la URL
      const matchingCenter = availableCenters.find(c => c.slug === centerSlugInUrl);
      
      if (!matchingCenter) {
        // El usuario NO tiene acceso al centro en la URL
        console.log('[CenterContext] ⛔ Usuario no tiene acceso al centro:', centerSlugInUrl);
        
        // Redirigir al primer centro disponible
        const firstAvailableCenter = availableCenters[0];
        if (firstAvailableCenter) {
          console.log('[CenterContext] 🔀 Redirigiendo a centro disponible:', firstAvailableCenter.name);
          setCurrentCenter(firstAvailableCenter);
          isInitialized.current = true;
          setLoading(false);
          
          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem('selectedCenter', JSON.stringify(firstAvailableCenter));
            }
          } catch (error) {
            console.error('Error saving center to localStorage:', error);
          }
          
          // 🔥 MARCAR pathname como procesado ANTES de redirigir
          lastProcessedPathname.current = pathname;
          
          // Redirigir a la misma ruta pero con el centro correcto
          const newPath = pathname.replace(`/center/${centerSlugInUrl}`, `/center/${firstAvailableCenter.slug}`);
          console.log('[CenterContext] Nueva ruta:', newPath);
          redirectionInProgress.current = true;
          router.push(newPath);
          
          setTimeout(() => {
            redirectionInProgress.current = false;
          }, 500);
        }
      } else if (!currentCenter || currentCenter.slug !== centerSlugInUrl) {
        // El usuario SÍ tiene acceso, establecer el centro
        console.log('[CenterContext] ✅ Centro encontrado en URL:', matchingCenter.name);
        setCurrentCenter(matchingCenter);
        isInitialized.current = true;
        setLoading(false);
        
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('selectedCenter', JSON.stringify(matchingCenter));
          }
        } catch (error) {
          console.error('Error saving center to localStorage:', error);
        }
        
        // 🔥 MARCAR pathname como procesado
        lastProcessedPathname.current = pathname;
      } else {
        console.log('[CenterContext] ✅ Centro actual ya coincide con URL');
        setLoading(false);
        
        // 🔥 MARCAR pathname como procesado
        lastProcessedPathname.current = pathname;
      }
    }
  }, [pathname, currentCenter, availableCenters, loading, router]);

  // Actualizar la URL cuando cambia el centro o la ruta
  useEffect(() => {
    if (!currentCenter || !pathname || redirectionInProgress.current) return;
    
    // 🔥 PREVENIR LOOP: No procesar si ya procesamos este pathname
    if (lastProcessedPathname.current === pathname) {
      return;
    }
    
    // Solo actualizar la URL si estamos en una página de centro
    if (pathname.includes('/center/')) {
      // Extraer la parte de la ruta después de /center/
      const pathParts = pathname.split('/center/')[1]?.split('/') || [];
      
      // Comprobar si el centro en la URL no coincide con el centro actual
      if (pathParts[0] !== currentCenter.slug) {
        // Reconstruir la ruta con el centro actual
        pathParts[0] = currentCenter.slug;
        
        // Si no hay una segunda parte (como dashboard), agregar por defecto
        if (!pathParts[1]) {
          pathParts[1] = 'dashboard';
        }
        
        const newPath = `/center/${pathParts.join('/')}`;
        console.log(`URL no coincide con centro actual. Actualizando URL a: ${newPath}`);
        
        // 🔥 MARCAR pathname como procesado ANTES de redirigir
        lastProcessedPathname.current = pathname;
        
        redirectionInProgress.current = true;
        router.push(newPath);
        
        // Resetear el flag después de la redirección
        setTimeout(() => {
          redirectionInProgress.current = false;
        }, 500);
      }
    }
  }, [currentCenter, pathname, router]);

  // Cambiar el centro actual
  const setCenter = useCallback((center: Center) => {
    // Prevent unnecessary state updates
    if (currentCenter && currentCenter.id === center.id) {
      console.log('Center already selected:', center.name);
      return;
    }
    
    // Find the center with latest data
    const updatedCenter = availableCenters.find(c => c.id === center.id) || center;
    
    console.log(`Setting center to: ${updatedCenter.name} (ID: ${updatedCenter.id})`);
    setCurrentCenter(updatedCenter);
    isInitialized.current = true;
    
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedCenter', JSON.stringify(updatedCenter));
      }
    } catch (e) {
      console.error('Error saving center to localStorage:', e);
    }
    
    // Si estamos en una ruta específica de un centro, redirigir al nuevo centro
    if (pathname && pathname.includes('/center/')) {
      // Extract the current path segments
      const pathSegments = pathname.split('/');
      
      // Replace the center slug (third segment) with the new center slug
      if (pathSegments.length > 2) {
        pathSegments[2] = updatedCenter.slug;
        const newPath = pathSegments.join('/');
        console.log('Redirecting to:', newPath);
        redirectionInProgress.current = true;
        router.push(newPath);
        
        // Resetear el flag después de la navegación
        setTimeout(() => {
          redirectionInProgress.current = false;
        }, 500);
      } else {
        // If for some reason we can't determine the correct path, just go to the dashboard
        const newPath = `/center/${updatedCenter.slug}/dashboard`;
        console.log('Redirecting to dashboard:', newPath);
        redirectionInProgress.current = true;
        router.push(newPath);
        
        // Resetear el flag después de la navegación
        setTimeout(() => {
          redirectionInProgress.current = false;
        }, 500);
      }
    }
  }, [currentCenter, pathname, router]);

  // Añadir un nuevo centro a la lista
  const addCenter = (newCenter: Center) => {
    setAvailableCenters(prev => [...prev, newCenter]);
  };
  
  // Debug output
  useEffect(() => {
    console.log("CenterContext state:", {
      currentCenter: currentCenter?.name || "null",
      loading,
      isInitialized: isInitialized.current,
      authStatus: status
    });
  }, [currentCenter, loading, status]);

  return (
    <CenterContext.Provider value={{ 
      currentCenter, 
      availableCenters, 
      setCenter, 
      addCenter,
      loading 
    }}>
      {children}
    </CenterContext.Provider>
  );
};
