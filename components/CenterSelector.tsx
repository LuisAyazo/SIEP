import React, { useState, useEffect, useCallback, memo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCenterContext, Center } from './providers/CenterContext';

const CenterSelector: React.FC = () => {
  const { currentCenter, setCenter, availableCenters, loading } = useCenterContext();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);
  const [displayedCenter, setDisplayedCenter] = useState<Center | null>(null);

  // Sincronizar el estado local con el currentCenter del contexto
  useEffect(() => {
    if (currentCenter) {
      console.log("CenterSelector: Actualizando centro mostrado a:", currentCenter.name);
      setDisplayedCenter(currentCenter);
      setLocalLoading(false);
    }
  }, [currentCenter]);

  // Force loading state to false after a reasonable timeout to prevent stuck states
  useEffect(() => {
    if (loading) {
      console.log("CenterSelector: Cargando centros...");
      const timer = setTimeout(() => {
        setLocalLoading(false);
        console.log("CenterSelector: Tiempo de carga agotado, forzando estado a 'no cargando'");
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setLocalLoading(false);
      if (currentCenter) {
        console.log("CenterSelector: Centros cargados correctamente");
        console.log("CenterSelector: Estado actual - ", {
          currentCenter: currentCenter?.name || 'ninguno',
          availableCenters: availableCenters.map(c => c.name)
        });
      }
    }
  }, [loading, currentCenter, availableCenters]);

  // Efecto para cerrar el dropdown cuando se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.center-selector-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Función para actualizar URL cuando se selecciona un centro
  const updateUrlToMatchCenter = useCallback((center: Center) => {
    if (!pathname || !center) return;
    
    if (pathname.includes('/center/')) {
      // Construir la nueva ruta con el centro seleccionado
      const basePath = pathname.split('/').slice(0, 2).join('/');
      const remainingPath = pathname.split('/').slice(3).join('/');
      
      // Construir la nueva URL
      let newPath = `${basePath}/${center.slug}`;
      if (remainingPath) {
        newPath += `/${remainingPath}`;
      } else {
        newPath += '/dashboard';
      }
      
      console.log(`CenterSelector: Actualizando URL a ${newPath}`);
      router.push(newPath);
    }
  }, [pathname, router]);

  // Memoized select center handler to prevent recreation
  const handleSelectCenter = useCallback((center: Center) => {
    if (!center) return;
    
    // Only change if selecting a different center
    if (!currentCenter || center.id !== currentCenter.id) {
      console.log('Cambiando centro de', currentCenter?.name || 'ninguno', 'a', center.name);
      
      // Update local state immediately for responsive UI
      setDisplayedCenter(center);
      
      // Close the dropdown
      setIsOpen(false);
      
      // Update the context state
      setCenter(center);

      // Update the URL to match the selected center
      updateUrlToMatchCenter(center);
    } else {
      // Just close the dropdown if selecting the same center
      setIsOpen(false);
    }
  }, [currentCenter, setCenter, updateUrlToMatchCenter]);

  return (
    <div className="relative center-selector-container">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
        data-testid="center-selector-button"
      >
        <span className="flex items-center truncate">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 mr-2 text-amber-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
            />
          </svg>
          {localLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Cargando centros...
            </span>
          ) : (
            displayedCenter ? (
              <span className="truncate max-w-[180px]">{displayedCenter.name}</span>
            ) : currentCenter ? (
              <span className="truncate max-w-[180px]">{currentCenter.name}</span>
            ) : availableCenters.length > 0 ? (
              'Seleccionar centro'
            ) : (
              'No hay centros disponibles'
            )
          )}
        </span>
        <svg
          className={`w-5 h-5 ml-2 -mr-1 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div 
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-300 dark:border-gray-600 max-h-60 overflow-auto"
          data-testid="center-dropdown"
        >
          {availableCenters.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
              No hay centros disponibles
            </div>
          ) : (
            availableCenters.map((center) => (
              <div
                key={center.id}
                className={`cursor-pointer px-4 py-2 hover:bg-amber-50 dark:hover:bg-amber-900/30 ${
                  (displayedCenter?.id === center.id || currentCenter?.id === center.id) 
                    ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300' 
                    : ''
                }`}
                onClick={() => handleSelectCenter(center)}
                data-testid={`center-option-${center.id}`}
              >
                <div className="font-medium text-amber-600 dark:text-amber-400">{center.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{center.description}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(CenterSelector);