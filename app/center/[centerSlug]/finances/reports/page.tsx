'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PermissionGuard from '@/components/PermissionGuard';
import { PermissionLevel, RESOURCES } from '@/app/auth/permissions';

// Mock reports data
const reportsData = [
  {
    id: '1',
    name: 'Ejecución Presupuestaria 1T 2025',
    type: 'Presupuesto',
    department: 'Finanzas',
    createdAt: '2025-03-30',
    createdBy: 'Ana Martínez',
    status: 'Aprobado',
    download: '/reports/budget-execution-2025-q1.pdf'
  },
  {
    id: '2',
    name: 'Proyección Financiera 2025-2026',
    type: 'Proyección',
    department: 'Finanzas',
    createdAt: '2025-02-15',
    createdBy: 'Carlos Pérez',
    status: 'Revisión',
    download: '/reports/financial-projection-2025-2026.xlsx'
  },
  {
    id: '3',
    name: 'Análisis de Gastos por Categoría 2024',
    type: 'Analítico',
    department: 'Contabilidad',
    createdAt: '2025-01-20',
    createdBy: 'María López',
    status: 'Aprobado',
    download: '/reports/expense-analysis-2024.pdf'
  },
  {
    id: '4',
    name: 'Informe de Auditoría Financiera 2024',
    type: 'Auditoría',
    department: 'Auditoría Interna',
    createdAt: '2025-02-28',
    createdBy: 'Juan Rodríguez',
    status: 'Aprobado',
    download: '/reports/audit-report-2024.pdf'
  },
  {
    id: '5',
    name: 'Seguimiento de KPIs Financieros Q1 2025',
    type: 'KPI',
    department: 'Control de Gestión',
    createdAt: '2025-04-05',
    createdBy: 'Laura Sánchez',
    status: 'Borrador',
    download: '/reports/financial-kpis-2025-q1.pptx'
  },
  {
    id: '6',
    name: 'Informe Comparativo 2023-2024',
    type: 'Comparativo',
    department: 'Finanzas',
    createdAt: '2025-01-15',
    createdBy: 'Carlos Pérez',
    status: 'Aprobado',
    download: '/reports/comparative-report-2023-2024.pdf'
  },
  {
    id: '7',
    name: 'Proyección de Flujo de Caja 2025',
    type: 'Flujo de Caja',
    department: 'Tesorería',
    createdAt: '2025-03-10',
    createdBy: 'Andrea Gómez',
    status: 'Revisión',
    download: '/reports/cash-flow-projection-2025.xlsx'
  }
];

// Filter options
const reportTypes = [
  'Todos',
  'Presupuesto',
  'Proyección',
  'Analítico',
  'Auditoría',
  'KPI',
  'Comparativo',
  'Flujo de Caja'
];

const reportStatus = [
  'Todos',
  'Borrador',
  'Revisión',
  'Aprobado'
];

export default function FinancialReportsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('Todos');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  
  // Filter reports based on search term, type and status
  const filteredReports = reportsData.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'Todos' || report.type === selectedType;
    const matchesStatus = selectedStatus === 'Todos' || report.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Get file icon based on download path extension
  const getFileIcon = (path: string) => {
    if (path.endsWith('.pdf')) {
      return (
        <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    } else if (path.endsWith('.xlsx') || path.endsWith('.xls')) {
      return (
        <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    } else if (path.endsWith('.pptx') || path.endsWith('.ppt')) {
      return (
        <svg className="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  // Get status badge styling
  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'Aprobado':
        return 'bg-green-100 text-green-800';
      case 'Revisión':
        return 'bg-amber-100 text-amber-800';
      case 'Borrador':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <PermissionGuard 
      resource={RESOURCES.FINANCES} 
      requiredPermission={PermissionLevel.READ}
      redirectTo="/dashboard"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reportes Financieros</h1>
          <p className="text-gray-600 mt-1">
            Informes y análisis financieros disponibles en el sistema
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                  </svg>
                </div>
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full pl-10 p-2.5 sm:w-64" 
                  placeholder="Buscar reportes" 
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <select 
                value={selectedType} 
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 p-2.5"
              >
                {reportTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              
              <select 
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 p-2.5"
              >
                {reportStatus.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              
              <button 
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Crear Reporte
              </button>
            </div>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <motion.div
                key={report.id}
                className="bg-white rounded-lg shadow overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
              >
                <div className="p-5">
                  <div className="flex items-center">
                    {getFileIcon(report.download)}
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">{report.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(report.status)}`}>
                        {report.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                      <div>Tipo:</div>
                      <div className="font-medium text-gray-900">{report.type}</div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                      <div>Departamento:</div>
                      <div className="font-medium text-gray-900">{report.department}</div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                      <div>Fecha:</div>
                      <div className="font-medium text-gray-900">{report.createdAt}</div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <div>Creado por:</div>
                      <div className="font-medium text-gray-900">{report.createdBy}</div>
                    </div>
                  </div>
                  
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button className="flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Ver
                    </button>
                    <button className="flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Descargar
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full bg-gray-50 rounded-lg p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron reportes</h3>
              <p className="mt-1 text-sm text-gray-500">
                No hay reportes que coincidan con los criterios de búsqueda aplicados.
              </p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Estadísticas de Reportes</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">{reportsData.length}</div>
              <div className="text-sm text-gray-500">Total reportes</div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {reportsData.filter(r => r.status === 'Aprobado').length}
              </div>
              <div className="text-sm text-gray-500">Reportes aprobados</div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">
                {reportsData.filter(r => r.status === 'Revisión').length}
              </div>
              <div className="text-sm text-gray-500">En revisión</div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {reportsData.filter(r => r.status === 'Borrador').length}
              </div>
              <div className="text-sm text-gray-500">En borrador</div>
            </div>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
