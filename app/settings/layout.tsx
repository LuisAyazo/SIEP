'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useIsSuperAdmin } from '../auth/hooks';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isSuperAdmin = useIsSuperAdmin();

  // Redirect if not a superadmin
  useEffect(() => {
    if (!isSuperAdmin) {
      router.push('/dashboard');
    }
  }, [isSuperAdmin, router]);

  if (!isSuperAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-gray-500">Acceso restringido...</span>
      </div>
    );
  }

  // Define navigation items for settings
  const navItems = [
    { name: 'Centros', href: '/settings/centers' },
    { name: 'Integraciones', href: '/settings/integrations' },
    // Agregar más opciones de configuración global según sea necesario
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Configuración Global</h2>
          <p className="text-sm text-gray-500">Administración del sistema</p>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link 
                  href={item.href}
                  className={`block px-4 py-2 rounded-md ${
                    pathname === item.href
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}