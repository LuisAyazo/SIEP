'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSupabaseSession } from './SessionProvider';
import { useRouter, usePathname } from 'next/navigation';

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

// Lista predefinida de centros disponibles con datos específicos para cada uno
export const AVAILABLE_CENTERS: Center[] = [
  {
    id: '1',
    name: 'Centro de educación continua',
    slug: 'centro-educacion-continua',
    description: 'Centro especializado en educación continua',
    isDefault: true,
    stats: {
      activeProjects: 8,
      documents: 32,
      forms: 15,
      activeUsers: 10,
      totalFichas: 65,
      pendingApprovals: 7,
      budget: {
        total: 150000000,
        executed: 89000000,
        available: 61000000
      },
      recentActivity: [
        { user: 'Juan Pérez', action: 'Creación de ficha FC-1001', date: '2025-05-04T15:30:00Z' },
        { user: 'María López', action: 'Actualización de presupuesto', date: '2025-05-03T09:15:00Z' },
        { user: 'Carlos Gómez', action: 'Aprobación de proyecto', date: '2025-05-02T14:20:00Z' }
      ]
    }
  },
  {
    id: '2',
    name: 'Centro de servicios',
    slug: 'centro-servicios',
    description: 'Centro para la prestación de servicios universitarios',
    stats: {
      activeProjects: 12,
      documents: 45,
      forms: 23,
      activeUsers: 17,
      totalFichas: 87,
      pendingApprovals: 5,
      budget: {
        total: 230000000,
        executed: 142000000,
        available: 88000000
      },
      recentActivity: [
        { user: 'Laura Martínez', action: 'Creación de servicio SC-2001', date: '2025-05-05T10:45:00Z' },
        { user: 'Roberto Sánchez', action: 'Asignación de presupuesto', date: '2025-05-04T16:30:00Z' },
        { user: 'Ana García', action: 'Finalización de proyecto', date: '2025-05-01T11:20:00Z' }
      ]
    }
  },
  {
    id: '3',
    name: 'Centro de transferencia',
    slug: 'centro-transferencia',
    description: 'Centro de transferencia de conocimiento y tecnología',
    stats: {
      activeProjects: 6,
      documents: 28,
      forms: 14,
      activeUsers: 8,
      totalFichas: 42,
      pendingApprovals: 3,
      budget: {
        total: 180000000,
        executed: 95000000,
        available: 85000000
      },
      recentActivity: [
        { user: 'Daniela Rojas', action: 'Registro de proyecto de transferencia PT-3001', date: '2025-05-06T11:30:00Z' },
        { user: 'Miguel Torres', action: 'Aprobación de convenio', date: '2025-05-05T14:45:00Z' },
        { user: 'Patricia Díaz', action: 'Actualización de indicadores', date: '2025-05-03T10:15:00Z' }
      ]
    }
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

  // Obtener el centro por defecto de la lista de centros disponibles
  const getDefaultCenter = useCallback(() => {
    const defaultCenter = AVAILABLE_CENTERS.find(center => center.isDefault);
    return defaultCenter || AVAILABLE_CENTERS[0] || null;
  }, []);

  // Memoized function to get center from localStorage
  const getSavedCenter = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    try {
      const savedCenter = localStorage.getItem('selectedCenter');
      if (savedCenter) {
        const centerData = JSON.parse(savedCenter);
        if (centerData && centerData.id && centerData.name && centerData.slug) {
          // Ensure we have the latest stats and other data from AVAILABLE_CENTERS
          const matchingCenter = AVAILABLE_CENTERS.find(c => c.id === centerData.id);
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
    
    if (pathname.includes('/center/')) {
      // Extraer el slug del centro de la URL
      const pathParts = pathname.split('/center/')[1]?.split('/') || [];
      const centerSlugInUrl = pathParts[0];
      
      console.log('[CenterContext] Detectada ruta de centro. Slug en URL:', centerSlugInUrl);
      console.log('[CenterContext] Centro actual:', currentCenter?.slug || 'ninguno');
      console.log('[CenterContext] Loading state:', loading);
      
      // Si no tenemos centro o el centro actual no coincide con la URL
      if (!currentCenter || currentCenter.slug !== centerSlugInUrl) {
        console.log('[CenterContext] Centro en URL no coincide con centro actual, buscando...');
        
        // Buscar el centro que coincida con el slug de la URL
        const matchingCenter = AVAILABLE_CENTERS.find(c => c.slug === centerSlugInUrl);
        
        if (matchingCenter) {
          console.log('[CenterContext] ✅ Centro encontrado en URL:', matchingCenter.name);
          setCurrentCenter(matchingCenter);
          isInitialized.current = true;
          setLoading(false); // Forzar loading a false cuando establecemos el centro
          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem('selectedCenter', JSON.stringify(matchingCenter));
            }
          } catch (error) {
            console.error('Error saving center to localStorage:', error);
          }
        } else {
          console.log('[CenterContext] ❌ No se encontró centro con slug:', centerSlugInUrl, '- usando centro por defecto');
          // Si no se encuentra el centro, usar uno por defecto
          const initialized = fallbackToDefaultCenter();
          isInitialized.current = initialized;
          setLoading(false); // Forzar loading a false
        }
      } else {
        console.log('[CenterContext] ✅ Centro actual ya coincide con URL');
        setLoading(false); // Asegurar que loading esté en false si ya tenemos el centro correcto
      }
    }
  }, [pathname, currentCenter, availableCenters, loading, fallbackToDefaultCenter]);

  // Actualizar la URL cuando cambia el centro o la ruta
  useEffect(() => {
    if (!currentCenter || !pathname || redirectionInProgress.current) return;
    
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
    const updatedCenter = AVAILABLE_CENTERS.find(c => c.id === center.id) || center;
    
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