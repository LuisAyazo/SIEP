'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { hasPermission, PermissionLevel, UserRole } from '@/app/auth/permissions';
import { useSupabaseSession } from '@/components/providers/SessionProvider';

// Define proper ficha status types
type StatusType = 'borrador' | 'activo' | 'finalizado' | 'cancelado';

// Define proper form type
interface FormData {
  id: string;
  codigo: string;
  nombre: string;
  fechaApertura: string;
  fechaCierre: string;
  inversion: string;
  proceso: string;
  costo: string;
  tipoPrograma: string;
  tipoModalidad: string;
  unidadEjecutora: string;
  dependencia: string;
  coordinador: string;
  estado: StatusType;
}

// Mock data for forms
const MOCK_FORMS: FormData[] = [
  {
    id: '1',
    codigo: 'FC-2023-001',
    nombre: 'Capacitación en herramientas tecnológicas',
    fechaApertura: '2023-03-15',
    fechaCierre: '2023-12-15',
    inversion: '$5,000,000',
    proceso: 'Formación',
    costo: 'Gratuito',
    tipoPrograma: 'Educación continua',
    tipoModalidad: 'Virtual',
    unidadEjecutora: 'Facultad de Ingeniería',
    dependencia: 'Departamento de Sistemas',
    coordinador: 'Juan Pérez',
    estado: 'activo'
  },
  {
    id: '2',
    codigo: 'FC-2023-002',
    nombre: 'Asesoría empresarial para pequeños negocios',
    fechaApertura: '2023-04-10',
    fechaCierre: '2023-10-10',
    inversion: '$8,500,000',
    proceso: 'Consultoría',
    costo: 'Pago',
    tipoPrograma: 'Proyección social',
    tipoModalidad: 'Presencial',
    unidadEjecutora: 'Facultad de Ciencias Económicas',
    dependencia: 'Departamento de Administración',
    coordinador: 'María Rodríguez',
    estado: 'activo'
  },
  {
    id: '3',
    codigo: 'FC-2023-003',
    nombre: 'Desarrollo de apps móviles para comunidades',
    fechaApertura: '2023-02-20',
    fechaCierre: '2023-08-20',
    inversion: '$12,000,000',
    proceso: 'Desarrollo',
    costo: 'Gratuito',
    tipoPrograma: 'Extensión',
    tipoModalidad: 'Híbrida',
    unidadEjecutora: 'Facultad de Ingeniería',
    dependencia: 'Departamento de Sistemas',
    coordinador: 'Carlos Gómez',
    estado: 'borrador'
  },
  {
    id: '4',
    codigo: 'FC-2023-004',
    nombre: 'Taller de escritura creativa',
    fechaApertura: '2023-05-05',
    fechaCierre: '2023-07-05',
    inversion: '$2,300,000',
    proceso: 'Formación',
    costo: 'Gratuito',
    tipoPrograma: 'Cultural',
    tipoModalidad: 'Presencial',
    unidadEjecutora: 'Facultad de Humanidades',
    dependencia: 'Departamento de Literatura',
    coordinador: 'Laura Martínez',
    estado: 'finalizado'
  },
  {
    id: '5',
    codigo: 'FC-2023-005',
    nombre: 'Consultoría en gestión ambiental',
    fechaApertura: '2023-06-01',
    fechaCierre: '2023-11-30',
    inversion: '$15,700,000',
    proceso: 'Consultoría',
    costo: 'Pago',
    tipoPrograma: 'Extensión',
    tipoModalidad: 'Híbrida',
    unidadEjecutora: 'Facultad de Ciencias Ambientales',
    dependencia: 'Departamento de Gestión Ambiental',
    coordinador: 'Pedro Sánchez',
    estado: 'activo'
  }
];

export default function FormsPage() {
  const [forms, setForms] = useState<FormData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusType | 'todos'>('todos');
  
  // Fix permission hooks
  const { user } = useSupabaseSession();
  const userRole = (user as any)?.role as UserRole | undefined;
  
  // Check permissions manually with correct PermissionLevel values
  const canCreate = hasPermission({ role: userRole }, 'forms', PermissionLevel.WRITE);
  const canEdit = hasPermission({ role: userRole }, 'forms', PermissionLevel.WRITE);
  // Use PermissionLevel.WRITE instead of PermissionLevel.DELETE which doesn't exist
  const canDelete = hasPermission({ role: userRole }, 'forms', PermissionLevel.WRITE);

  // Load data on component mount
  useEffect(() => {
    // Simulate API call
    const loadForms = async () => {
      setIsLoading(true);
      try {
        // In a real app, fetch from API
        // const response = await fetch('/api/forms');
        // const data = await response.json();
        // setForms(data);
        
        // Using mock data for now
        setTimeout(() => {
          setForms(MOCK_FORMS);
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error loading forms:', error);
        setIsLoading(false);
      }
    };
    
    loadForms();
  }, []);
  
  // Filter forms based on search term and status
  const filteredForms = useMemo(() => {
    return forms.filter(form => {
      // Filter by search term
      const matchesSearch = 
        form.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.coordinador.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by status
      const matchesStatus = filterStatus === 'todos' || form.estado === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [forms, searchTerm, filterStatus]);
  
  // Function to get status badge styling
  const getStatusBadgeClass = (status: StatusType) => {
    switch (status) {
      case 'borrador':
        return 'bg-gray-100 text-gray-800';
      case 'activo':
        return 'bg-green-100 text-green-800';
      case 'finalizado':
        return 'bg-blue-100 text-blue-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Helper function to format date strings
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Fichas Creadas</h1>
        
        {canCreate && (
          <Link 
            href="/dashboard/fichas/forms/new" 
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Nueva Ficha
          </Link>
        )}
      </div>
      
      {/* Filters */}
      <div className="bg-white shadow-sm rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre, código o coordinador..."
              className="pl-10 pr-4 py-2 border border-gray-300 focus:ring-amber-500 focus:border-amber-500 block w-full rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <select
              className="border border-gray-300 rounded-md py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as StatusType | 'todos')}
            >
              <option value="todos">Todos los estados</option>
              <option value="borrador">Borrador</option>
              <option value="activo">Activo</option>
              <option value="finalizado">Finalizado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre del Programa
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Apertura
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Cierre
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inversión
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proceso
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Costo/Gratuito
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coordinador
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
                      <span className="ml-2">Cargando...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredForms.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
                    No se encontraron fichas
                  </td>
                </tr>
              ) : (
                filteredForms.map((form) => (
                  <tr key={form.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-600">
                      <Link href={`/dashboard/fichas/forms/${form.id}`} className="hover:underline">
                        {form.codigo}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {form.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(form.fechaApertura)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(form.fechaCierre)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {form.inversion}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {form.proceso}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {form.costo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {form.coordinador}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(form.estado)}`}>
                        {form.estado.charAt(0).toUpperCase() + form.estado.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          href={`/dashboard/fichas/forms/${form.id}`}
                          className="text-amber-600 hover:text-amber-900"
                        >
                          Ver
                        </Link>
                        {canEdit && (
                          <Link
                            href={`/dashboard/fichas/forms/${form.id}/edit`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Editar
                          </Link>
                        )}
                        {canDelete && (
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={() => {
                              if (window.confirm('¿Está seguro de que desea eliminar esta ficha?')) {
                                // Delete logic here
                                console.log('Deleting form:', form.id);
                              }
                            }}
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
