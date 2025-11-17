'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCenterContext, Center } from './providers/CenterContext';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

const CenterSelectorMenu: React.FC = () => {
  const { currentCenter, availableCenters, setCenter } = useCenterContext();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Cerrar el menú cuando se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef]);

  // Manejar el cambio de centro
  const handleCenterChange = (center: Center) => {
    console.log("CenterSelectorMenu: Cambiando a centro:", center.name, "con slug:", center.slug);
    
    // Guardar el centro en localStorage
    try {
      localStorage.setItem('selectedCenter', JSON.stringify(center));
      console.log("Centro guardado en localStorage:", center.name);
    } catch (error) {
      console.error("Error al guardar en localStorage:", error);
    }
    
    // Establecer el centro en el contexto
    setCenter(center);
    setIsOpen(false);
    
    // Preservar la ruta actual pero cambiar el slug del centro
    let targetPath = `/center/${center.slug}/dashboard`;
    
    if (pathname && pathname.includes('/center/')) {
      // Extraer la parte después de /dashboard/ si existe
      const pathParts = pathname.split('/dashboard/');
      if (pathParts.length > 1 && pathParts[1]) {
        targetPath = `/center/${center.slug}/dashboard/${pathParts[1]}`;
      }
    }
    
    console.log("Navegando a:", targetPath);
    router.push(targetPath);
  };

  // Manejar la apertura del menú de configuración para centros
  const handleOpenSettings = () => {
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-indigo-600 focus:outline-none"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor" 
          className="w-5 h-5"
        >
          <path 
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" 
          />
        </svg>
        <span className="hidden md:inline">
          {currentCenter?.name || 'Seleccionar centro'}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-64 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <div className="px-4 py-2 text-sm text-gray-900 font-medium border-b border-gray-200">
              Centros disponibles
            </div>
            {availableCenters.map((center) => (
              <button
                key={center.id}
                onClick={() => handleCenterChange(center)}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  currentCenter?.id === center.id 
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  {currentCenter?.id === center.id && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2 text-indigo-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  <div className={currentCenter?.id === center.id ? "ml-0" : "ml-6"}>
                    {center.name}
                    {center.isDefault && (
                      <span className="ml-2 text-xs font-medium text-gray-500">(Principal)</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="py-1">
            <Link
              href="/dashboard/settings/centers"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={handleOpenSettings}
            >
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4 mr-2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Administrar centros
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CenterSelectorMenu;