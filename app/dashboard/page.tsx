'use client';

import React from 'react';
// Keep all the existing imports
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabaseSession } from '@/components/providers/SessionProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { useCenterContext } from '@/components/providers/CenterContext';

// Component imports
import StatCard from '@/components/dashboard/StatCard';
import DashboardChart from '@/components/dashboard/DashboardChart';

// Vista principal del dashboard
export default function DashboardPage() {
  // No need to initialize all the state and useEffects for the demo
  // All commented code is preserved as requested
  /*
  const { user, session, loading: sessionLoading } = useSupabaseSession();
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const { currentCenter, loading, availableCenters, setCenter } = useCenterContext();
  const [redirectAttempts, setRedirectAttempts] = useState(0);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Redirigir inmediatamente al centro correcto
  useEffect(() => {
    // Evitar ciclos infinitos limitando los intentos de redirección
    if (redirectAttempts >= 3 || isRedirecting) return;
    
    // Si está cargando, esperamos
    if (loading) return;

    // Marcamos que estamos en proceso de redirección
    setIsRedirecting(true);
    
    try {
      // Si ya tenemos un centro en el contexto, usamos ese
      let targetCenter = currentCenter;
      
      if (!targetCenter) {
        // Intentar recuperar desde localStorage
        try {
          const savedCenterJson = localStorage.getItem('selectedCenter');
          if (savedCenterJson) {
            targetCenter = JSON.parse(savedCenterJson);
            console.log("Dashboard: Centro recuperado desde localStorage:", targetCenter.name);
            // Actualizar el contexto con este centro
            setCenter(targetCenter);
          }
        } catch (e) {
          console.error("Error al leer centro desde localStorage:", e);
        }
        
        // Si aún no hay centro, usar el predeterminado
        if (!targetCenter && availableCenters && availableCenters.length > 0) {
          targetCenter = availableCenters.find(c => c.isDefault) || availableCenters[0];
          console.log("Dashboard: Usando centro predeterminado:", targetCenter.name);
          // Actualizar el contexto con el centro predeterminado
          setCenter(targetCenter);
        }
      }

      // Realizar la redirección si tenemos un centro válido
      if (targetCenter && targetCenter.slug) {
        const targetUrl = `/center/${targetCenter.slug}/dashboard`;
        console.log(`Dashboard: Redirigiendo a ${targetUrl}`);
        router.push(targetUrl);
      } else {
        console.error("Dashboard: No se pudo determinar un centro válido para redirección");
      }
    } catch (e) {
      console.error("Error en la lógica de redirección:", e);
    } finally {
      setRedirectAttempts(prev => prev + 1);
      setIsRedirecting(false);
    }
  }, [currentCenter, loading, router, availableCenters, setCenter, redirectAttempts, isRedirecting]);

  // Si estamos cargando o no hay centro, mostramos mensaje pero ya iniciamos redirección
  if (loading || !currentCenter || isRedirecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <h1 className="text-xl font-semibold text-gray-700">
          Redirigiendo al dashboard...
        </h1>
        {redirectAttempts > 0 && (
          <p className="text-gray-500 mt-2">Intentos de redirección: {redirectAttempts}</p>
        )}
      </div>
    );
  }
  */

  // Este código es la vista estática para la demo
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">
        Dashboard General
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total de Usuarios" value="256" change={12} changeType="increase" />
        <StatCard title="Documentos Activos" value="124" change={8} changeType="increase" />
        <StatCard title="Presupuesto Utilizado" value="75%" change={3} changeType="decrease" />
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-4">Actividad Reciente</h2>
        <DashboardChart type="line" />
      </div>
    </div>
  );
}