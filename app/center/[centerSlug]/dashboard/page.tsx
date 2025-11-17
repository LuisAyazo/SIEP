// 'use client';

// import { useEffect, useState, useMemo, useRef } from 'react';
// import Link from 'next/link';
// import { useRouter, usePathname } from 'next/navigation';
// import { useSession } from 'next-auth/react';
// import { usePermission } from '@/app/auth/hooks';
// import { PermissionLevel, RESOURCES } from '@/app/auth/permissions';
// import { motion, AnimatePresence } from 'framer-motion';
// import { useCenterContext } from '@/components/providers/CenterContext';

// // Component imports
// import StatCard from '@/components/dashboard/StatCard';
// import DashboardChart from '@/components/dashboard/DashboardChart';

// // Define interfaces for type safety
// interface ActivityType {
//   id: number;
//   user: string;
//   action: string;
//   target: string;
//   targetId: string;
//   date: string;
//   details: string;
//   type: string;
// }

// // Type for recent activity items from the API
// interface ActivityItem {
//   user: string;
//   action: string;
//   date: string;
// }

// // Define types for our data structures
// interface CenterStats {
//   totalFichas: number;
//   activeProjects: number;
//   pendingApprovals: number;
//   budget: {
//     total: number;
//     executed: number;
//     available: number;
//   };
//   recentActivity: ActivityItem[];
// }

// // Define Center interface with optional stats property
// interface Center {
//   id: string;
//   name: string;
//   stats?: {
//     [key: string]: any;
//     totalFichas: number;
//     activeProjects: number;
//     pendingApprovals: number;
//     budget: {
//       total: number;
//       executed: number;
//       available: number;
//     };
//     recentActivity: ActivityItem[];
//   };
// }

// // Datos de proyectos específicos por centro
// const centerProjects = {
//   '1': [  // Centro de educación continua
//     { id: 'p1', name: 'Diplomado en Gestión Ambiental', budget: 45000000, status: 'active' },
//     { id: 'p2', name: 'Curso de Inglés Avanzado', budget: 28000000, status: 'active' },
//     { id: 'p3', name: 'Seminario de Innovación Educativa', budget: 18500000, status: 'planning' },
//     { id: 'p4', name: 'Taller de Escritura Creativa', budget: 12000000, status: 'active' },
//     { id: 'p5', name: 'Certificación en Docencia Virtual', budget: 35000000, status: 'active' }
//   ],
//   '2': [  // Centro de servicios
//     { id: 'p6', name: 'Consultoría Empresarial', budget: 78000000, status: 'active' },
//     { id: 'p7', name: 'Desarrollo de Software a Medida', budget: 95000000, status: 'active' },
//     { id: 'p8', name: 'Asesoría Legal para PYMES', budget: 35000000, status: 'planning' },
//     { id: 'p9', name: 'Servicio de Análisis de Laboratorio', budget: 42000000, status: 'active' },
//     { id: 'p10', name: 'Estudio de Impacto Ambiental', budget: 67000000, status: 'active' }
//   ]
// };

// // Datos de formas específicas por centro
// const centerForms = {
//   '1': [  // Centro de educación continua
//     { id: 'f1', type: 'Inscripción', status: 'completed', count: 28 },
//     { id: 'f2', type: 'Evaluación Docente', status: 'active', count: 15 },
//     { id: 'f3', type: 'Certificación', status: 'pending', count: 22 }
//   ],
//   '2': [  // Centro de servicios
//     { id: 'f4', type: 'Solicitud de Servicio', status: 'completed', count: 32 },
//     { id: 'f5', type: 'Reporte de Avance', status: 'active', count: 18 },
//     { id: 'f6', type: 'Evaluación de Calidad', status: 'pending', count: 25 },
//     { id: 'f7', type: 'Cotización', status: 'draft', count: 12 }
//   ]
// };

// // Vista principal del dashboard
// export default function DashboardPage() {
//   const { data: session } = useSession();
//   const router = useRouter();
//   const pathname = usePathname();
//   const [selectedPeriod, setSelectedPeriod] = useState('month');
//   const [isLoading, setIsLoading] = useState(true);
//   const { currentCenter, loading: centerLoading, setCenter, availableCenters } = useCenterContext();
//   const [key, setKey] = useState(Date.now()); // Clave única para forzar re-render
//   const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const initializedRef = useRef(false);
//   const centerSlugFromUrl = useRef<string | null>(null);

//   // Extraer centerSlug de la URL
//   useEffect(() => {
//     if (!pathname) return;
    
//     try {
//       // Intentar extraer el slug del centro de la URL
//       const pathParts = pathname.split('/');
//       const centerIndex = pathParts.indexOf('center');
      
//       if (centerIndex !== -1 && pathParts.length > centerIndex + 1) {
//         const slugFromUrl = pathParts[centerIndex + 1];
//         centerSlugFromUrl.current = slugFromUrl;
//         console.log("Dashboard: Slug del centro extraído de URL:", slugFromUrl);
        
//         // Si tenemos un slug válido y no hay centro actual seleccionado,
//         // buscamos el centro correspondiente y lo establecemos
//         if (slugFromUrl && (!currentCenter || currentCenter.slug !== slugFromUrl) && availableCenters.length > 0) {
//           console.log("Buscando centro que coincida con slug:", slugFromUrl);
//           const matchingCenter = availableCenters.find(center => center.slug === slugFromUrl);
          
//           if (matchingCenter) {
//             console.log("Centro encontrado en availableCenters:", matchingCenter.name);
//             // Forzar el centro encontrado en la URL
//             setCenter(matchingCenter);
//             setKey(Date.now());
//           }
//         }
//       }
//     } catch (err) {
//       console.error("Error al extraer el slug del centro de la URL:", err);
//     }
//   }, [pathname, currentCenter, availableCenters, setCenter]);

//   // Detectar y manejar el problema de carga infinita
//   useEffect(() => {
//     // Limpiar el timeout existente si hay uno
//     if (loadingTimeoutRef.current) {
//       clearTimeout(loadingTimeoutRef.current);
//     }

//     // Si está cargando, configurar un timeout de seguridad para evitar carga infinita
//     if (isLoading) {
//       console.log("Dashboard está cargando, configurando timeout de seguridad...");
//       loadingTimeoutRef.current = setTimeout(() => {
//         console.log("Timeout de seguridad activado - forzando fin de carga");
//         setIsLoading(false);
        
//         // Si después del timeout no tenemos centro y hay centros disponibles,
//         // intentamos usar uno por defecto como último recurso
//         if (!currentCenter && availableCenters.length > 0) {
//           console.log("Usando centro por defecto como último recurso");
//           const defaultCenter = availableCenters.find(c => c.isDefault) || availableCenters[0];
//           setCenter(defaultCenter);
//         }
//       }, 3000); // 3 segundos máximo de carga
//     }

//     // Limpieza al desmontar
//     return () => {
//       if (loadingTimeoutRef.current) {
//         clearTimeout(loadingTimeoutRef.current);
//       }
//     };
//   }, [isLoading, currentCenter, availableCenters, setCenter]);

//   // Efecto para sincronizar con el estado de carga del contexto del centro
//   useEffect(() => {
//     console.log("Estado de carga del CenterContext cambió:", centerLoading);
    
//     // Si el contexto del centro ya no está cargando pero no tenemos centro, forzamos el fin de carga
//     if (!centerLoading && !currentCenter) {
//       console.log("El contexto del centro terminó de cargar pero no hay centro");
//       setIsLoading(false);
//     }
//   }, [centerLoading, currentCenter]);

//   // Efecto para sincronizar cuando el centro ha cambiado
//   useEffect(() => {
//     if (currentCenter && !initializedRef.current) {
//       console.log("Dashboard: Centro inicial detectado:", currentCenter.name);
//       initializedRef.current = true;
//       setIsLoading(false);
//     } 
//     else if (currentCenter) {
//       console.log("Dashboard: Centro actualizado a", currentCenter.name);
//       setKey(Date.now());
      
//       // Simulamos una carga breve para mostrar la transición
//       setIsLoading(true);
//       setTimeout(() => {
//         setIsLoading(false);
//       }, 300);

//       // Si estamos en la ruta incorrecta, corregir la URL para que coincida con el centro
//       if (pathname && centerSlugFromUrl.current !== currentCenter.slug) {
//         console.log("URL no coincide con el centro actual, actualizando...");
//         const newPath = pathname.replace(
//           `/center/${centerSlugFromUrl.current}`,
//           `/center/${currentCenter.slug}`
//         );
//         router.push(newPath);
//       }
//     } 
//     else if (!centerLoading && !initializedRef.current) {
//       console.log("No hay centro seleccionado, y no está cargando");
//       // Si hay centros disponibles, usar el primero como fallback
//       if (availableCenters.length > 0) {
//         const defaultCenter = availableCenters.find(c => c.isDefault) || availableCenters[0];
//         console.log("Usando centro por defecto:", defaultCenter.name);
//         setCenter(defaultCenter);
//       }
//       setIsLoading(false);
//     }
//   }, [currentCenter, centerLoading, pathname, router, availableCenters, setCenter]);

//   // Memoizamos los datos específicos del centro para evitar recálculos innecesarios
//   const centerSpecificData = useMemo(() => {
//     if (!currentCenter) return null;
    
//     const centerId = currentCenter.id;
//     const projects = centerProjects[centerId as keyof typeof centerProjects] || [];
//     const forms = centerForms[centerId as keyof typeof centerForms] || [];
    
//     // Datos personalizados según el centro
//     return {
//       projects,
//       forms,
//       recentActivity: [
//         { type: 'project', action: 'created', name: projects[0]?.name || 'Nuevo proyecto', date: '2025-05-04' },
//         { type: 'document', action: 'updated', name: 'Informe de avance', date: '2025-05-03' },
//         { type: 'form', action: 'submitted', name: forms[0]?.type || 'Nueva ficha', date: '2025-05-02' }
//       ],
//       customStats: centerId === '1' 
//         ? { completionRate: 78, satisfactionScore: 4.2, enrollmentGrowth: 12 }  // Centro educación
//         : { serviceDeliveryRate: 92, clientSatisfaction: 4.5, revenueGrowth: 15 }  // Centro servicios
//     };
//   }, [currentCenter]);

//   // Datos ficticios genéricos (se usarán si no hay centro seleccionado)
//   const defaultData = {
//     stats: [
//       { 
//         title: 'Fichas Creadas', 
//         value: 0, 
//         change: 0, 
//         changeType: 'increase' as const, 
//         period: 'vs mes anterior',
//         icon: (
//           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//           </svg>
//         )
//       },
//       { 
//         title: 'Proyectos Activos', 
//         value: 0, 
//         change: 0, 
//         changeType: 'increase' as const, 
//         period: 'vs mes anterior',
//         icon: (
//           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
//           </svg>
//         )
//       },
//       { 
//         title: 'Aprobaciones Pendientes', 
//         value: 0, 
//         change: 0, 
//         changeType: 'increase' as const, 
//         period: 'vs mes anterior',
//         icon: (
//           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
//           </svg>
//         )
//       },
//       { 
//         title: 'Presupuesto Total', 
//         value: '$0', 
//         change: 0, 
//         changeType: 'increase' as const, 
//         period: 'vs mes anterior',
//         icon: (
//           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//           </svg>
//         )
//       },
//       { 
//         title: 'Presupuesto Ejecutado', 
//         value: '$0', 
//         change: 0, 
//         changeType: 'increase' as const, 
//         period: 'vs mes anterior',
//         icon: (
//           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//           </svg>
//         )
//       },
//       { 
//         title: 'Presupuesto Disponible', 
//         value: '$0', 
//         change: 0, 
//         changeType: 'increase' as const, 
//         period: 'vs mes anterior',
//         icon: (
//           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
//           </svg>
//         )
//       }
//     ],
    
//     // Historial de fichas genérico
//     fileHistory: [],
//     history: [],
//     pendingApprovals: [],
//     chartData: {
//       formsCreatedByMonth: {
//         labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'],
//         datasets: [
//           {
//             label: 'Fichas Creadas',
//             data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
//             borderColor: '#f59e0b',
//             backgroundColor: 'rgba(245, 158, 11, 0.1)',
//             tension: 0.4,
//             fill: true
//           }
//         ]
//       },
//       userActivityByDay: {
//         labels: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'],
//         datasets: [
//           {
//             label: 'Usuarios Activos',
//             data: [0, 0, 0, 0, 0, 0, 0],
//             backgroundColor: '#3b82f6',
//             borderRadius: 4
//           }
//         ]
//       },
//       budgetUtilization: {
//         labels: ['Salarios', 'Operaciones', 'Marketing', 'Tecnología', 'Administración', 'Sin Asignar'],
//         datasets: [
//           {
//             data: [0, 0, 0, 0, 0, 0],
//             backgroundColor: [
//               'rgba(245, 158, 11, 0.8)',
//               'rgba(59, 130, 246, 0.8)',
//               'rgba(16, 185, 129, 0.8)',
//               'rgba(139, 92, 246, 0.8)',
//               'rgba(236, 72, 153, 0.8)',
//               'rgba(209, 213, 219, 0.8)'
//             ]
//           }
//         ]
//       }
//     }
//   };

//   // Simular carga inicial de datos
//   useEffect(() => {
//     console.log("Inicializando dashboard...");
    
//     // Si no hay centro seleccionado pero tenemos un slug en la URL, intentar buscar ese centro
//     if (!currentCenter && centerSlugFromUrl.current && availableCenters.length > 0) {
//       const matchingCenter = availableCenters.find(c => c.slug === centerSlugFromUrl.current);
//       if (matchingCenter) {
//         console.log("Estableciendo centro desde URL durante inicialización:", matchingCenter.name);
//         setCenter(matchingCenter);
//         setIsLoading(false);
//         return;
//       }
//     }
    
//     const timer = setTimeout(() => {
//       if (isLoading) {
//         console.log("Finalizando carga inicial del dashboard");
//         setIsLoading(false);
//       }
//     }, 2000); // Tiempo máximo de espera inicial

//     return () => clearTimeout(timer);
//   }, [availableCenters, currentCenter, centerSlugFromUrl, isLoading, setCenter]);

//   // Preparar los datos específicos para el centro seleccionado
//   const getDashboardData = () => {
//     if (!currentCenter) return defaultData;

//     // Datos específicos del centro seleccionado
//     const centerData = {
//       stats: [
//         { 
//           title: 'Fichas Creadas', 
//           value: currentCenter.stats?.totalFichas || 0, 
//           change: 12, 
//           changeType: 'increase' as const, 
//           period: 'vs mes anterior',
//           icon: (
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//             </svg>
//           )
//         },
//         { 
//           title: 'Proyectos Activos', 
//           value: currentCenter.stats?.activeProjects || 0, 
//           change: 4, 
//           changeType: 'increase' as const, 
//           period: 'vs mes anterior',
//           icon: (
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
//             </svg>
//           )
//         },
//         { 
//           title: 'Aprobaciones Pendientes', 
//           value: currentCenter.stats?.pendingApprovals || 0, 
//           change: -3, 
//           changeType: 'decrease' as const, 
//           period: 'vs mes anterior',
//           icon: (
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
//             </svg>
//           )
//         },
//         { 
//           title: 'Presupuesto Total', 
//           value: `$${new Intl.NumberFormat('es-ES').format(currentCenter.stats?.budget?.total || 0)}`, 
//           change: 5, 
//           changeType: 'increase' as const, 
//           period: 'vs mes anterior',
//           icon: (
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//           )
//         },
//         { 
//           title: 'Presupuesto Ejecutado', 
//           value: `$${new Intl.NumberFormat('es-ES').format(currentCenter.stats?.budget?.executed || 0)}`, 
//           change: 8, 
//           changeType: 'increase' as const, 
//           period: 'vs mes anterior',
//           icon: (
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//           )
//         },
//         { 
//           title: 'Presupuesto Disponible', 
//           value: `$${new Intl.NumberFormat('es-ES').format(currentCenter.stats?.budget?.available || 0)}`, 
//           change: 5, 
//           changeType: 'increase' as const, 
//           period: 'vs mes anterior',
//           icon: (
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
//           </svg>
//           )
//         }
//       ],
      
//       // Historial de fichas específico para el centro
//       fileHistory: currentCenter.id === '1' ? [
//         {
//           id: 'FC-1002',
//           title: 'Capacitación en herramientas digitales para comunidades rurales',
//           status: 'Aprobada',
//           date: '2025-05-05T10:30:00Z',
//           user: 'Maria Rodriguez',
//           type: 'project',
//           priority: 'alta'
//         },
//         {
//           id: 'FC-985',
//           title: 'Solicitud de Presupuesto Q2 2025',
//           status: 'Pendiente',
//           date: '2025-05-04T14:15:00Z',
//           user: 'Carlos Mendez',
//           type: 'financial',
//           priority: 'media'
//         },
//         {
//           id: 'FC-952',
//           title: 'Informe de Gastos Abril 2025',
//           status: 'Rechazada',
//           date: '2025-05-02T09:45:00Z',
//           user: 'Luis Ayazo',
//           type: 'financial',
//           priority: 'baja'
//         },
//         {
//           id: 'FC-920',
//           title: 'Plan Operativo Anual - Centro de Educación Continua',
//           status: 'Aprobada',
//           date: '2025-04-28T11:20:00Z',
//           user: 'Ana Martínez',
//           type: 'operational',
//           priority: 'alta'
//         }
//       ] : [
//         {
//           id: 'FC-876',
//           title: 'Propuesta de servicios comunitarios - STEM',
//           status: 'Aprobada',
//           date: '2025-05-06T09:30:00Z',
//           user: 'Javier Pérez',
//           type: 'project',
//           priority: 'alta'
//         },
//         {
//           id: 'FC-845',
//           title: 'Presupuesto para event de innovación',
//           status: 'Pendiente',
//           date: '2025-05-03T11:45:00Z',
//           user: 'Ana Gómez',
//           type: 'financial',
//           priority: 'media'
//         },
//         {
//           id: 'FC-824',
//           title: 'Informe de actividades del primer semestre',
//           status: 'En revisión',
//           date: '2025-05-01T08:30:00Z',
//           user: 'Director de Servicios',
//           type: 'operational',
//           priority: 'alta'
//         },
//         {
//           id: 'FC-810',
//           title: 'Plan de marketing - Centro de Servicios',
//           status: 'Aprobada',
//           date: '2025-04-25T14:20:00Z',
//           user: 'Pablo Sánchez',
//           type: 'project',
//           priority: 'media'
//         }
//       ],
      
//       // Actividad reciente específica para el centro
//       history: (currentCenter.stats?.recentActivity || []).map((activity: ActivityItem, index: number) => ({
//         id: index + 1,
//         user: activity.user,
//         action: 'ha realizado',
//         target: activity.action,
//         targetId: `FC-${1000 + index}`,
//         date: activity.date,
//         details: activity.action,
//         type: index % 2 === 0 ? 'financial' : 'operational'
//       })),
      
//       pendingApprovals: currentCenter.id === '1' ? [
//         {
//           id: 'PA1001',
//           title: 'Presupuesto para programa de certificaciones',
//           requestedBy: 'Luis Ayazo',
//           requestedDate: '2025-05-04T10:00:00Z',
//           amount: '$8,500,000',
//           status: 'pending',
//           priority: 'high'
//         },
//         {
//           id: 'PA1002',
//           title: 'Actualización de plataforma educativa',
//           requestedBy: 'Carmen Rodriguez',
//           requestedDate: '2025-05-03T11:30:00Z',
//           amount: '$15,000,000',
//           status: 'pending',
//           priority: 'medium'
//         },
//         {
//           id: 'PA1003',
//           title: 'Contratación de instructores especializados',
//           requestedBy: 'Director de Centro',
//           requestedDate: '2025-05-01T09:15:00Z',
//           amount: '$12,000,000',
//           status: 'pending',
//           priority: 'low'
//         }
//       ] : [
//         {
//           id: 'PA2001',
//           title: 'Presupuesto para eventos comunitarios',
//           requestedBy: 'Javier Pérez',
//           requestedDate: '2025-05-06T10:00:00Z',
//           amount: '$5,800,000',
//           status: 'pending',
//           priority: 'medium'
//         },
//         {
//           id: 'PA2002',
//           title: 'Renovación de equipamiento de servicio',
//           requestedBy: 'Ana Gómez',
//           requestedDate: '2025-05-03T11:30:00Z',
//           amount: '$9,300,000',
//           status: 'pending',
//           priority: 'high'
//         },
//         {
//           id: 'PA2003',
//           title: 'Campaña de difusión de servicios',
//           requestedBy: 'Director de Servicios',
//           requestedDate: '2025-05-01T09:15:00Z',
//           amount: '$4,200,000',
//           status: 'pending',
//           priority: 'low'
//         }
//       ],
      
//       // Datos para gráficos específicos del centro
//       chartData: {
//         formsCreatedByMonth: {
//           labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'],
//           datasets: [
//             {
//               label: 'Fichas Creadas',
//               data: currentCenter.id === '1' 
//                 ? [8, 12, 9, 11, 14, 13, 15, 18, 20, 22] 
//                 : [5, 8, 6, 9, 11, 7, 9, 12, 14, 16],
//               borderColor: '#f59e0b',
//               backgroundColor: 'rgba(245, 158, 11, 0.1)',
//               tension: 0.4,
//               fill: true
//             }
//           ]
//         },
//         userActivityByDay: {
//           labels: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'],
//           datasets: [
//             {
//               label: 'Usuarios Activos',
//               data: currentCenter.id === '1' 
//                 ? [35, 42, 38, 45, 35, 12, 8]
//                 : [28, 32, 30, 35, 25, 10, 5],
//               backgroundColor: '#3b82f6',
//               borderRadius: 4
//             }
//           ]
//         },
//         budgetUtilization: {
//           labels: ['Personal', 'Operaciones', 'Marketing', 'Tecnología', 'Administración', 'Sin Asignar'],
//           datasets: [
//             {
//               data: currentCenter.id === '1'
//                 ? [40, 25, 10, 15, 7, 3]
//                 : [30, 35, 12, 8, 10, 5],
//               backgroundColor: [
//                 'rgba(245, 158, 11, 0.8)',
//                 'rgba(59, 130, 246, 0.8)',
//                 'rgba(16, 185, 129, 0.8)',
//                 'rgba(139, 92, 246, 0.8)',
//                 'rgba(236, 72, 153, 0.8)',
//                 'rgba(209, 213, 219, 0.8)'
//               ]
//             }
//           ]
//         }
//       }
//     };

//     return centerData;
//   };

//   // Obtener datos para el dashboard basado en el centro seleccionado
//   const dashboardData = getDashboardData();

//   // Variants para animaciones
//   const containerVariants = {
//     hidden: { opacity: 0 },
//     visible: {
//       opacity: 1,
//       transition: {
//         when: "beforeChildren",
//         staggerChildren: 0.1
//       }
//     }
//   };

//   const itemVariants = {
//     hidden: { y: 20, opacity: 0 },
//     visible: {
//       y: 0,
//       opacity: 1,
//       transition: { type: "spring", stiffness: 100 }
//     }
//   };

//   // Determinar el saludo según la hora actual
//   const getGreeting = () => {
//     const hour = new Date().getHours();
//     if (hour < 12) return 'Buenos días';
//     if (hour < 18) return 'Buenas tardes';
//     return 'Buenas noches';
//   };

//   // Renderizar contenido específico según el rol del usuario
//   const renderRoleSpecificContent = () => {
//     // Asumiendo que obtenemos el rol del usuario desde session
//     const userRole = session?.user?.role || 'consulta';
    
//     if (userRole === 'superadmin' || userRole === 'admin') {
//       return (
//         <motion.section 
//           className="mt-6 grid grid-cols-1 gap-5"
//           variants={itemVariants}
//         >
//           <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-6 rounded-lg shadow-lg">
//             <h3 className="text-xl font-bold mb-2">Panel de Administrador</h3>
//             <p className="mb-4">Tienes acceso completo al sistema. Aquí puedes administrar usuarios, roles y configuraciones avanzadas.</p>
//             <div className="flex flex-wrap gap-3">
//               <Link href="/dashboard/users">
//                 <button className="bg-white text-amber-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors">
//                   Gestionar Usuarios
//                 </button>
//               </Link>
//               <Link href="/dashboard/roles">
//                 <button className="bg-white text-amber-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors">
//                   Gestionar Roles
//                 </button>
//               </Link>
//               <Link href="/dashboard/settings">
//                 <button className="bg-white text-amber-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors">
//                   Configuración
//                 </button>
//               </Link>
//             </div>
//           </div>
//         </motion.section>
//       );
//     }
    
//     if (userRole === 'financiero') {
//       return (
//         <motion.section 
//           className="mt-6 grid grid-cols-1 gap-5"
//           variants={itemVariants}
//         >
//           <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
//             <h3 className="text-xl font-bold mb-2">Panel Financiero</h3>
//             <p className="mb-4">Accede a los reportes financieros y gestiona presupuestos y aprobaciones.</p>
//             <div className="flex flex-wrap gap-3">
//               <Link href="/dashboard/finances/reports">
//                 <button className="bg-white text-green-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors">
//                   Ver Reportes
//                 </button>
//               </Link>
//               <Link href="/dashboard/finances/budget">
//                 <button className="bg-white text-green-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors">
//                   Gestionar Presupuesto
//                 </button>
//               </Link>
//             </div>
//           </div>
//         </motion.section>
//       );
//     }

//     return null;
//   };
  
//   // Determinar si estamos en un estado de carga
//   const showLoading = isLoading || (centerLoading && !currentCenter);
  
//   // Pantalla de carga
//   if (showLoading) {
//     return (
//       <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)]">
//         <motion.div 
//           animate={{ rotate: 360 }}
//           transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
//           className="h-12 w-12 border-b-2 border-amber-600 rounded-full mb-4"
//         />
//         <p className="text-gray-500 animate-pulse">Cargando dashboard...</p>
//       </div>
//     );
//   }

//   // Si no hay centro después de la carga, mostrar mensaje amigable con opción para seleccionar
//   if (!currentCenter) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 bg-white rounded-lg shadow">
//         <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-amber-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
//         </svg>
//         <h2 className="text-xl font-semibold text-gray-800 mb-2">No se ha seleccionado ningún centro</h2>
//         <p className="text-gray-600 text-center mb-6">
//           Para ver el dashboard, por favor selecciona un centro de la lista desplegable en la parte superior.
//         </p>
//         <div className="flex gap-4">
//           <button 
//             onClick={() => {
//               if (availableCenters.length > 0) {
//                 const defaultCenter = availableCenters.find(c => c.isDefault) || availableCenters[0];
//                 setCenter(defaultCenter);
//               }
//             }}
//             className="bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-md shadow transition-colors flex items-center"
//           >
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
//             </svg>
//             Seleccionar Centro por Defecto
//           </button>
          
//           <button 
//             onClick={() => router.refresh()}
//             className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md shadow transition-colors flex items-center"
//           >
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//             </svg>
//             Reintentar
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <motion.div 
//       className="space-y-6"
//       key={`dashboard-${currentCenter.id}-${key}`} // Forzar remontado cuando cambia el centro
//       initial="hidden"
//       animate="visible"
//       variants={containerVariants}
//     >
//       {/* Header con saludo, fecha y centro seleccionado */}
//       <motion.div 
//         className="flex flex-col md:flex-row justify-between items-start md:items-center"
//         variants={itemVariants}
//       >
//         <div>
//           <div className="flex items-center">
//             <span className="text-amber-600 font-medium">
//               {currentCenter ? currentCenter.name : 'Seleccione un centro'}
//             </span>
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//             </svg>
//             <span className="text-gray-900 font-medium">Dashboard</span>
//           </div>
//           <h1 className="text-2xl font-bold text-gray-800">
//             {getGreeting()}, {session?.user?.name || 'Usuario'}
//           </h1>
//           <p className="text-gray-600">
//             {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
//           </p>
//         </div>
//         <div className="mt-4 md:mt-0 space-x-2">
//           <select 
//             value={selectedPeriod}
//             onChange={e => setSelectedPeriod(e.target.value)}
//             className="border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-700 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
//           >
//             <option value="week">Esta Semana</option>
//             <option value="month">Este Mes</option>
//             <option value="quarter">Este Trimestre</option>
//             <option value="year">Este Año</option>
//           </select>
//           <button className="bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-md shadow transition-colors">
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
//             </svg>
//             Exportar
//           </button>
//         </div>
//       </motion.div>

//       {/* Tarjetas de estadísticas */}
//       <motion.div 
//         className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5"
//         variants={itemVariants}
//       >
//         {dashboardData.stats.map((stat, index) => (
//           <motion.div 
//             key={index}
//             whileHover={{ scale: 1.03, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
//             transition={{ duration: 0.2 }}
//           >
//             <StatCard
//               title={stat.title}
//               value={stat.value}
//               change={stat.change}
//               changeType={stat.changeType}
//               period={stat.period}
//               icon={stat.icon}
//             />
//           </motion.div>
//         ))}
//       </motion.div>
      
//       {/* Contenido específico por rol */}
//       {renderRoleSpecificContent()}
      
//       {/* Historial de Fichas con botón Ver Más */}
//       <motion.div 
//         className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
//         variants={itemVariants}
//       >
//         <div className="flex justify-between items-center mb-4">
//           <h3 className="text-lg font-medium text-gray-900">Historial de Fichas</h3>
//           <Link href="/dashboard/historial-fichas">
//             <button className="text-amber-600 hover:text-amber-700 flex items-center text-sm font-medium transition-colors">
//               Ver Más
//               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//               </svg>
//             </button>
//           </Link>
//         </div>
        
//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
//                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
//                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
//                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
//                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
//                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
//                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {dashboardData.fileHistory.slice(0, 4).map((file, index) => (
//                 <motion.tr 
//                   key={file.id}
//                   initial={{ opacity: 0, y: 10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ delay: index * 0.05 }}
//                   whileHover={{ backgroundColor: "#f9fafb" }}
//                   className="cursor-pointer"
//                 >
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="text-sm font-medium text-gray-900">{file.id}</div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="text-sm text-gray-900">{file.title}</div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
//                       ${file.status === 'Aprobada' ? 'bg-green-100 text-green-800' : 
//                         file.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' : 
//                         file.status === 'Rechazada' ? 'bg-red-100 text-red-800' : 
//                         'bg-blue-100 text-blue-800'}`}>
//                       {file.status}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="text-sm text-gray-500">{file.user}</div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
//                       ${file.type === 'financial' ? 'bg-indigo-100 text-indigo-800' : 
//                         file.type === 'project' ? 'bg-purple-100 text-purple-800' : 
//                         'bg-amber-100 text-amber-800'}`}>
//                       {file.type === 'financial' ? 'Financiero' : 
//                        file.type === 'project' ? 'Proyecto' : 'Operacional'}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                     {new Date(file.date).toLocaleString('es-ES')}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
//                     <button className="text-amber-600 hover:text-amber-900">
//                       Ver detalle
//                     </button>
//                   </td>
//                 </motion.tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </motion.div>

//       {/* Actividad Reciente con botón Ver Más */}
//       <motion.div 
//         className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
//         variants={itemVariants}
//       >
//         <div className="flex justify-between items-center mb-4">
//           <h3 className="text-lg font-medium text-gray-900">Actividad Reciente</h3>
//           <Link href="/dashboard/history">
//             <button className="text-amber-600 hover:text-amber-700 flex items-center text-sm font-medium transition-colors">
//               Ver Más
//               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//               </svg>
//             </button>
//           </Link>
//         </div>
        
//         {dashboardData.history.slice(0, 3).map((activity: ActivityType, index: number) => (
//           <motion.div 
//             key={activity.id}
//             className={`border-l-4 ${
//               activity.type === 'financial' ? 'border-indigo-500' : 'border-amber-500'
//             } p-4 mb-4 bg-white shadow-sm rounded-md`}
//             initial={{ opacity: 0, x: -20 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ delay: index * 0.05 }}
//             whileHover={{ x: 5, backgroundColor: "#f9fafb" }}
//           >
//             <div className="flex items-start">
//               <div className={`p-2 rounded-full ${
//                 activity.type === 'financial' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'
//               } mr-4`}>
//                 {activity.type === 'financial' ? (
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                 ) : (
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
//                   </svg>
//                 )}
//               </div>
//               <div className="flex-1">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <span className="font-medium">{activity.user} </span>
//                     <span className="text-gray-600">{activity.action} </span>
//                     <span className="text-gray-900">{activity.target} </span>
//                     <span className="font-medium text-amber-600">{activity.targetId}</span>
//                   </div>
//                   <div className="text-sm text-gray-500">
//                     {new Date(activity.date).toLocaleString('es-ES')}
//                   </div>
//                 </div>
//                 <p className="mt-1 text-sm text-gray-600">{activity.details}</p>
//                 <div className="mt-2">
//                   <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
//                     activity.type === 'financial' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
//                   }`}>
//                     {activity.type === 'financial' ? 'Financiero' : 'Operacional'}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </motion.div>
//         ))}
//       </motion.div>
      
//       {/* Gráficos */}
//       <motion.div 
//         className="space-y-6"
//         variants={itemVariants}
//       >
//         <h3 className="text-lg font-medium text-gray-900 mt-4">Estadísticas y Gráficos</h3>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <motion.div 
//             className="bg-white p-4 rounded-lg shadow-sm"
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.1 }}
//             whileHover={{ boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
//           >
//             <h4 className="text-lg font-medium mb-4">Fichas Creadas por Mes</h4>
//             <div className="h-72">
//               <DashboardChart 
//                 type="line"
//                 data={dashboardData.chartData.formsCreatedByMonth}
//               />
//             </div>
//           </motion.div>
          
//           <motion.div 
//             className="bg-white p-4 rounded-lg shadow-sm"
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.2 }}
//             whileHover={{ boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
//           >
//             <h4 className="text-lg font-medium mb-4">Distribución del Presupuesto</h4>
//             <div className="h-72">
//               <DashboardChart 
//                 type="doughnut"
//                 data={dashboardData.chartData.budgetUtilization}
//               />
//             </div>
//           </motion.div>
//         </div>
//       </motion.div>
      
//       {/* Aprobaciones Pendientes */}
//       <motion.div 
//         className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
//         variants={itemVariants}
//       >
//         <h3 className="text-lg font-medium text-gray-900 mb-4">Aprobaciones Pendientes</h3>
//         <div className="space-y-4">
//           {dashboardData.pendingApprovals.map((approval, index) => (
//             <motion.div 
//               key={approval.id}
//               className="bg-white shadow-sm rounded-lg border border-gray-200 p-4"
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: index * 0.1 }}
//               whileHover={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
//             >
//               <div className="flex items-start justify-between">
//                 <div>
//                   <div className="flex items-center">
//                     <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
//                       approval.priority === 'high' ? 'bg-red-500' : 
//                       approval.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
//                     }`}></span>
//                     <h4 className="text-lg font-medium">{approval.title}</h4>
//                   </div>
//                   <div className="mt-2 text-sm text-gray-600">
//                     <p>Solicitado por: <span className="font-medium">{approval.requestedBy}</span></p>
//                     <p>Fecha: {new Date(approval.requestedDate).toLocaleDateString()}</p>
//                     <p>Monto: <span className="font-medium text-gray-900">{approval.amount}</span></p>
//                   </div>
//                 </div>
//                 <div className="flex space-x-2">
//                   <motion.button
//                     className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md font-medium text-sm"
//                     whileHover={{ scale: 1.05 }}
//                     whileTap={{ scale: 0.95 }}
//                   >
//                     Aprobar
//                   </motion.button>
//                   <motion.button
//                     className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md font-medium text-sm"
//                     whileHover={{ scale: 1.05 }}
//                     whileTap={{ scale: 0.95 }}
//                   >
//                     Rechazar
//                   </motion.button>
//                   <motion.button
//                     className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1 rounded-md font-medium text-sm"
//                     whileHover={{ scale: 1.05 }}
//                     whileTap={{ scale: 0.95 }}
//                   >
//                     Detalles
//                   </motion.button>
//                 </div>
//               </div>
//             </motion.div>
//           ))}
//         </div>
//       </motion.div>
//     </motion.div>
//   );
// }

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabaseSession } from '@/components/providers/SessionProvider';
import { usePermission } from '@/app/auth/hooks';
import { PermissionLevel, RESOURCES } from '@/app/auth/permissions';
import { motion, AnimatePresence } from 'framer-motion';

// Component imports
import StatCard from '@/components/dashboard/StatCard';
import DashboardChart from '@/components/dashboard/DashboardChart';

// Datos ficticios para el dashboard
const MOCK_DATA = {
  stats: [
    { 
      title: 'Fichas Creadas', 
      value: 128, 
      change: 12, 
      changeType: 'increase' as const, 
      period: 'vs mes anterior',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      title: 'Usuarios Activos', 
      value: 24, 
      change: 4, 
      changeType: 'increase' as const, 
      period: 'vs mes anterior',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    { 
      title: 'Documentos Subidos', 
      value: 56, 
      change: -3, 
      changeType: 'decrease' as const, 
      period: 'vs mes anterior',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
      )
    },
    { 
      title: 'Procesos Pendientes', 
      value: 14, 
      change: -5, 
      changeType: 'decrease' as const, 
      period: 'vs mes anterior',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      title: 'Aprobaciones Financieras', 
      value: 32, 
      change: 8, 
      changeType: 'increase' as const, 
      period: 'vs mes anterior',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      title: 'Presupuesto Utilizado', 
      value: '75%', 
      change: 5, 
      changeType: 'increase' as const, 
      period: 'vs mes anterior',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    }
  ],
  
  // Historial de fichas actualizado (con códigos FC-)
  fileHistory: [
    {
      id: 'FC-1002',
      title: 'Capacitación en herramientas digitales para comunidades rurales',
      status: 'Aprobada',
      date: '2023-10-15T10:30:00Z',
      user: 'Maria Rodriguez',
      type: 'project',
      priority: 'alta'
    },
    {
      id: 'FC-985',
      title: 'Solicitud de Presupuesto Q4',
      status: 'Pendiente',
      date: '2023-10-14T14:15:00Z',
      user: 'Carlos Mendez',
      type: 'financial',
      priority: 'media'
    },
    {
      id: 'FC-952',
      title: 'Informe de Gastos Septiembre',
      status: 'Rechazada',
      date: '2023-10-12T09:45:00Z',
      user: 'Juan González',
      type: 'financial',
      priority: 'baja'
    },
    {
      id: 'FC-920',
      title: 'Plan Operativo Anual',
      status: 'Aprobada',
      date: '2023-10-10T11:20:00Z',
      user: 'Ana Martínez',
      type: 'operational',
      priority: 'alta'
    },
    {
      id: 'FC-898',
      title: 'Evaluación de Riesgos',
      status: 'En revisión',
      date: '2023-10-08T16:05:00Z',
      user: 'Roberto Pérez',
      type: 'project',
      priority: 'media'
    }
  ],

  // Historial actualizado
  history: [
    {
      id: 1,
      user: 'Roberto Pérez',
      action: 'ha actualizado',
      target: 'presupuesto',
      targetId: 'FC-102',
      date: '2023-10-15T08:30:00Z',
      details: 'Ajuste presupuestario Q4',
      type: 'financial'
    },
    {
      id: 2,
      user: 'María López',
      action: 'ha creado',
      target: 'ficha',
      targetId: 'FC-1002',
      date: '2023-10-15T07:45:00Z',
      details: 'Nueva ficha de proyecto',
      type: 'operational'
    },
    {
      id: 3,
      user: 'admin_test',
      action: 'ha aprobado',
      target: 'solicitud',
      targetId: 'FC-87',
      date: '2023-10-14T15:20:00Z',
      details: 'Aprobación de fondos emergentes',
      type: 'financial'
    },
    {
      id: 4,
      user: 'Juan Gómez',
      action: 'ha rechazado',
      target: 'reporte',
      targetId: 'FC-45',
      date: '2023-10-14T12:10:00Z',
      details: 'Reporte con inconsistencias',
      type: 'operational'
    },
    {
      id: 5,
      user: 'Carmen Ruiz',
      action: 'ha modificado',
      target: 'proceso',
      targetId: 'FC-12',
      date: '2023-10-13T14:30:00Z',
      details: 'Actualización protocolo operativo',
      type: 'operational'
    }
  ],
  
  pendingApprovals: [
    {
      id: 'PA1001',
      title: 'Presupuesto para evento de fin de año',
      requestedBy: 'Juan Pérez',
      requestedDate: '2023-10-12T10:00:00Z',
      amount: '$5,000',
      status: 'pending',
      priority: 'high'
    },
    {
      id: 'PA1002',
      title: 'Actualización de equipos informáticos',
      requestedBy: 'María Gómez',
      requestedDate: '2023-10-13T11:30:00Z',
      amount: '$12,500',
      status: 'pending',
      priority: 'medium'
    },
    {
      id: 'PA1003',
      title: 'Contratación de servicios de consultoría',
      requestedBy: 'Carlos Ruiz',
      requestedDate: '2023-10-14T09:15:00Z',
      amount: '$8,750',
      status: 'pending',
      priority: 'low'
    }
  ],
  
  // Datos para gráficos
  chartData: {
    formsCreatedByMonth: {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'],
      datasets: [
        {
          label: 'Fichas Creadas',
          data: [12, 15, 10, 14, 18, 16, 19, 22, 25, 28],
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    },
    userActivityByDay: {
      labels: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'],
      datasets: [
        {
          label: 'Usuarios Activos',
          data: [42, 38, 45, 50, 38, 15, 12],
          backgroundColor: '#3b82f6',
          borderRadius: 4
        }
      ]
    },
    budgetUtilization: {
      labels: ['Salarios', 'Operaciones', 'Marketing', 'Tecnología', 'Administración', 'Sin Asignar'],
      datasets: [
        {
          data: [35, 25, 15, 10, 10, 5],
          backgroundColor: [
            'rgba(245, 158, 11, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(209, 213, 219, 0.8)'
          ]
        }
      ]
    }
  }
};

// Vista principal del dashboard
export default function DashboardPage() {
  const { user, session, loading: authLoading } = useSupabaseSession();
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Variants para animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  // Determinar el saludo según la hora actual
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // Renderizar contenido específico según el rol del usuario
  const renderRoleSpecificContent = () => {
    // Asumiendo que obtenemos el rol del usuario desde session
    const userRole = (user as any)?.role || 'funcionario';
    
    if (userRole === 'superadmin' || userRole === 'admin') {
      return (
        <motion.section 
          className="mt-6 grid grid-cols-1 gap-5"
          variants={itemVariants}
        >
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-2">Panel de Administrador</h3>
            <p className="mb-4">Tienes acceso completo al sistema. Aquí puedes administrar usuarios, roles y configuraciones avanzadas.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/users">
                <button className="bg-white text-amber-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors">
                  Gestionar Usuarios
                </button>
              </Link>
              <Link href="/dashboard/roles">
                <button className="bg-white text-amber-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors">
                  Gestionar Roles
                </button>
              </Link>
              <Link href="/dashboard/settings">
                <button className="bg-white text-amber-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors">
                  Configuración
                </button>
              </Link>
            </div>
          </div>
        </motion.section>
      );
    }
    
    if (userRole === 'financiero') {
      return (
        <motion.section 
          className="mt-6 grid grid-cols-1 gap-5"
          variants={itemVariants}
        >
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-2">Panel Financiero</h3>
            <p className="mb-4">Accede a los reportes financieros y gestiona presupuestos y aprobaciones.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/finances/reports">
                <button className="bg-white text-green-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors">
                  Ver Reportes
                </button>
              </Link>
              <Link href="/dashboard/finances/budget">
                <button className="bg-white text-green-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors">
                  Gestionar Presupuesto
                </button>
              </Link>
            </div>
          </div>
        </motion.section>
      );
    }

    return null;
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 border-b-2 border-amber-600 rounded-full"
        />
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header con saludo y fecha */}
      <motion.div 
        className="flex flex-col md:flex-row justify-between items-start md:items-center"
        variants={itemVariants}
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {getGreeting()}, {user?.email?.split('@')[0] || user?.user_metadata?.full_name || 'Usuario'}
          </h1>
          <p className="text-gray-600">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="mt-4 md:mt-0 space-x-2">
          <select 
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-700 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="week">Esta Semana</option>
            <option value="month">Este Mes</option>
            <option value="quarter">Este Trimestre</option>
            <option value="year">Este Año</option>
          </select>
          <button className="bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-md shadow transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Exportar
          </button>
        </div>
      </motion.div>

      {/* Tarjetas de estadísticas */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5"
        variants={itemVariants}
      >
        {MOCK_DATA.stats.map((stat, index) => (
          <motion.div 
            key={index}
            whileHover={{ scale: 1.03, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
            transition={{ duration: 0.2 }}
          >
            <StatCard
              title={stat.title}
              value={stat.value}
              change={stat.change}
              changeType={stat.changeType}
              period={stat.period}
              icon={stat.icon}
            />
          </motion.div>
        ))}
      </motion.div>
      
      {/* Contenido específico por rol */}
      {renderRoleSpecificContent()}
      
      {/* Historial de Fichas con botón Ver Más */}
      <motion.div 
        className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        variants={itemVariants}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Historial de Fichas</h3>
          <Link href="/dashboard/historial-fichas">
            <button className="text-amber-600 hover:text-amber-700 flex items-center text-sm font-medium transition-colors">
              Ver Más
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {MOCK_DATA.fileHistory.slice(0, 4).map((file, index) => (
                <motion.tr 
                  key={file.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ backgroundColor: "#f9fafb" }}
                  className="cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{file.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{file.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${file.status === 'Aprobada' ? 'bg-green-100 text-green-800' : 
                        file.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' : 
                        file.status === 'Rechazada' ? 'bg-red-100 text-red-800' : 
                        'bg-blue-100 text-blue-800'}`}>
                      {file.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{file.user}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${file.type === 'financial' ? 'bg-indigo-100 text-indigo-800' : 
                        file.type === 'project' ? 'bg-purple-100 text-purple-800' : 
                        'bg-amber-100 text-amber-800'}`}>
                      {file.type === 'financial' ? 'Financiero' : 
                       file.type === 'project' ? 'Proyecto' : 'Operacional'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(file.date).toLocaleString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-amber-600 hover:text-amber-900">
                      Ver detalle
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Actividad Reciente con botón Ver Más */}
      <motion.div 
        className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        variants={itemVariants}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Actividad Reciente</h3>
          <Link href="/dashboard/history">
            <button className="text-amber-600 hover:text-amber-700 flex items-center text-sm font-medium transition-colors">
              Ver Más
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </Link>
        </div>
        
        {MOCK_DATA.history.slice(0, 3).map((activity, index) => (
          <motion.div 
            key={activity.id}
            className={`border-l-4 ${
              activity.type === 'financial' ? 'border-indigo-500' : 'border-amber-500'
            } p-4 mb-4 bg-white shadow-sm rounded-md`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ x: 5, backgroundColor: "#f9fafb" }}
          >
            <div className="flex items-start">
              <div className={`p-2 rounded-full ${
                activity.type === 'financial' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'
              } mr-4`}>
                {activity.type === 'financial' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{activity.user} </span>
                    <span className="text-gray-600">{activity.action} </span>
                    <span className="text-gray-900">{activity.target} </span>
                    <span className="font-medium text-amber-600">{activity.targetId}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(activity.date).toLocaleString('es-ES')}
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-600">{activity.details}</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    activity.type === 'financial' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {activity.type === 'financial' ? 'Financiero' : 'Operacional'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
      
      {/* Gráficos */}
      <motion.div 
        className="space-y-6"
        variants={itemVariants}
      >
        <h3 className="text-lg font-medium text-gray-900 mt-4">Estadísticas y Gráficos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            className="bg-white p-4 rounded-lg shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
          >
            <h4 className="text-lg font-medium mb-4">Fichas Creadas por Mes</h4>
            <div className="h-72">
              <DashboardChart 
                type="line"
                data={MOCK_DATA.chartData.formsCreatedByMonth}
              />
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-white p-4 rounded-lg shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
          >
            <h4 className="text-lg font-medium mb-4">Actividad de Usuarios por Día</h4>
            <div className="h-72">
              <DashboardChart 
                type="bar"
                data={MOCK_DATA.chartData.userActivityByDay}
              />
            </div>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Aprobaciones Pendientes */}
      <motion.div 
        className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        variants={itemVariants}
      >
        <h3 className="text-lg font-medium text-gray-900 mb-4">Aprobaciones Pendientes</h3>
        <div className="space-y-4">
          {MOCK_DATA.pendingApprovals.map((approval, index) => (
            <motion.div 
              key={approval.id}
              className="bg-white shadow-sm rounded-lg border border-gray-200 p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                      approval.priority === 'high' ? 'bg-red-500' : 
                      approval.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></span>
                    <h4 className="text-lg font-medium">{approval.title}</h4>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Solicitado por: <span className="font-medium">{approval.requestedBy}</span></p>
                    <p>Fecha: {new Date(approval.requestedDate).toLocaleDateString()}</p>
                    <p>Monto: <span className="font-medium text-gray-900">{approval.amount}</span></p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <motion.button
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md font-medium text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Aprobar
                  </motion.button>
                  <motion.button
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md font-medium text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Rechazar
                  </motion.button>
                  <motion.button
                    className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1 rounded-md font-medium text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Detalles
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}