'use client';

import React, { useState } from 'react';
import PermissionGuard from '@/components/PermissionGuard';
import { PermissionLevel } from '@/app/auth/permissions';

// Mock history data for the changes
const historyData = [
  {
    id: '1',
    user: 'Juan Pérez',
    action: 'Subió archivo Excel',
    timestamp: '2025-05-01T14:30:00Z',
    details: 'Formato PP Universidad-Empresa.xlsx',
    module: 'Documentos'
  },
  {
    id: '2',
    user: 'María López',
    action: 'Creó proyecto',
    timestamp: '2025-04-28T10:15:00Z',
    details: 'Proyecto de Extensión Comunitaria',
    module: 'Proyectos'
  },
  {
    id: '3',
    user: 'Carlos Rodríguez',
    action: 'Modificó presupuesto',
    timestamp: '2025-04-25T16:45:00Z',
    details: 'Actualización de partidas presupuestarias',
    module: 'Presupuestos'
  },
  {
    id: '4',
    user: 'Ana Martínez',
    action: 'Eliminó documento',
    timestamp: '2025-04-20T09:20:00Z',
    details: 'Borrador inicial de convenio.docx',
    module: 'Documentos'
  },
  {
    id: '5',
    user: 'Luis Gómez',
    action: 'Agregó usuario',
    timestamp: '2025-04-15T11:05:00Z',
    details: 'Usuario: pedro.hernandez@unicartagena.edu.co',
    module: 'Usuarios'
  },
  {
    id: '6',
    user: 'Diana Torres',
    action: 'Cambió estado de proyecto',
    timestamp: '2025-04-10T15:30:00Z',
    details: 'De "En revisión" a "Aprobado"',
    module: 'Proyectos'
  },
  {
    id: '7',
    user: 'Roberto Sánchez',
    action: 'Generó reporte',
    timestamp: '2025-04-05T14:00:00Z',
    details: 'Reporte trimestral de actividades',
    module: 'Reportes'
  },
  {
    id: '8',
    user: 'Carolina Mendez',
    action: 'Actualizó formulario',
    timestamp: '2025-04-01T10:45:00Z',
    details: 'Formato de inscripción actualizado',
    module: 'Formularios'
  }
];

// Action type options for filtering
const actionTypes = [
  'Todas',
  'Subió archivo',
  'Creó proyecto',
  'Modificó presupuesto',
  'Eliminó documento',
  'Agregó usuario',
  'Cambió estado',
  'Generó reporte',
  'Actualizó formulario'
];

// Module options for filtering
const moduleTypes = [
  'Todos',
  'Documentos',
  'Proyectos',
  'Presupuestos',
  'Usuarios',
  'Formularios',
  'Reportes'
];

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('Todas');
  const [selectedModule, setSelectedModule] = useState('Todos');
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  // Filter history based on search, action type, module type, and date range
  const filteredHistory = historyData.filter(item => {
    const matchesSearch = 
      item.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = selectedAction === 'Todas' || item.action.includes(selectedAction);
    const matchesModule = selectedModule === 'Todos' || item.module === selectedModule;
    
    let matchesDate = true;
    const itemDate = new Date(item.timestamp);
    const today = new Date();
    
    if (selectedDateRange === 'today') {
      const isToday = itemDate.getDate() === today.getDate() &&
        itemDate.getMonth() === today.getMonth() &&
        itemDate.getFullYear() === today.getFullYear();
      matchesDate = isToday;
    } else if (selectedDateRange === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(today.getDate() - 7);
      matchesDate = itemDate >= oneWeekAgo;
    } else if (selectedDateRange === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(today.getMonth() - 1);
      matchesDate = itemDate >= oneMonthAgo;
    }
    
    return matchesSearch && matchesAction && matchesModule && matchesDate;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Get action icon based on action type
  const getActionIcon = (action: string) => {
    if (action.includes('Subió')) {
      return (
        <div className="bg-green-100 p-2 rounded-full">
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
        </div>
      );
    } else if (action.includes('Creó')) {
      return (
        <div className="bg-blue-100 p-2 rounded-full">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
        </div>
      );
    } else if (action.includes('Modificó')) {
      return (
        <div className="bg-amber-100 p-2 rounded-full">
          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
        </div>
      );
    } else if (action.includes('Eliminó')) {
      return (
        <div className="bg-red-100 p-2 rounded-full">
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </div>
      );
    } else {
      return (
        <div className="bg-purple-100 p-2 rounded-full">
          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </div>
      );
    }
  };

  return (
    <PermissionGuard resource="history" requiredPermission={PermissionLevel.READ}>
      <div className="container mx-auto bg-white rounded-lg shadow p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Historial de Cambios</h1>
          <p className="text-gray-600 mt-1">
            Seguimiento cronológico de todas las acciones realizadas en el sistema
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                </svg>
              </div>
              <input 
                id="search"
                type="text" 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full pl-10 p-2.5" 
                placeholder="Buscar por usuario, acción..." 
              />
            </div>
          </div>

          <div>
            <label htmlFor="action" className="block text-sm font-medium text-gray-700 mb-1">Acción</label>
            <select 
              id="action"
              value={selectedAction} 
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full p-2.5"
            >
              {actionTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="module" className="block text-sm font-medium text-gray-700 mb-1">Módulo</label>
            <select 
              id="module"
              value={selectedModule} 
              onChange={(e) => {
                setSelectedModule(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full p-2.5"
            >
              {moduleTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-1">Rango de fechas</label>
            <select 
              id="dateRange"
              value={selectedDateRange} 
              onChange={(e) => {
                setSelectedDateRange(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full p-2.5"
            >
              <option value="all">Todas las fechas</option>
              <option value="today">Hoy</option>
              <option value="week">Última semana</option>
              <option value="month">Último mes</option>
            </select>
          </div>
        </div>

        {/* History Timeline */}
        <div className="relative border-l border-gray-200 ml-3 mt-8">
          {currentItems.length > 0 ? (
            currentItems.map((item) => (
              <div key={item.id} className="mb-10 ml-6">
                <span className="absolute flex items-center justify-center w-6 h-6 rounded-full -left-3 ring-8 ring-white">
                  {getActionIcon(item.action)}
                </span>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-normal text-gray-500">{formatDate(item.timestamp)}</span>
                    <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {item.module}
                    </span>
                  </div>
                  <h3 className="flex items-center text-lg font-semibold text-gray-900">
                    {item.action}
                  </h3>
                  <p className="mb-2 text-base font-normal text-gray-500">
                    {item.details}
                  </p>
                  <div className="flex items-center space-x-2 text-sm font-normal text-gray-900">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <span>{item.user}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="ml-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-center">No se encontraron registros para los criterios seleccionados.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <nav className="block">
              <ul className="flex pl-0 rounded list-none flex-wrap">
                <li>
                  <button
                    onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`rounded-l-lg px-3 py-1 border ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-amber-100'
                    }`}
                  >
                    Anterior
                  </button>
                </li>
                {[...Array(totalPages)].map((_, index) => (
                  <li key={index}>
                    <button
                      onClick={() => paginate(index + 1)}
                      className={`px-3 py-1 border-t border-b ${
                        currentPage === index + 1
                          ? 'bg-amber-500 text-white'
                          : 'bg-white text-gray-700 hover:bg-amber-100'
                      }`}
                    >
                      {index + 1}
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    onClick={() => currentPage < totalPages && paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`rounded-r-lg px-3 py-1 border ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-amber-100'
                    }`}
                  >
                    Siguiente
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}