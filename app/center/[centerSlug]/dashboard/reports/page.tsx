'use client';

import React, { useState } from 'react';
import PermissionGuard from '@/components/PermissionGuard';
import { PermissionLevel } from '@/app/auth/permissions';

// Mock report data
const reportsData = [
  {
    id: '1',
    name: 'Informe Trimestral Q1 2025',
    type: 'Financiero',
    period: 'Q1 2025',
    createdAt: '2025-04-05',
    createdBy: 'Juan Pérez',
    size: '2.4 MB',
    status: 'Aprobado'
  },
  {
    id: '2',
    name: 'Ejecución Presupuestaria - Proyectos de Extensión',
    type: 'Presupuesto',
    period: 'Q1 2025',
    createdAt: '2025-03-30',
    createdBy: 'María López',
    size: '3.7 MB',
    status: 'Pendiente'
  },
  {
    id: '3',
    name: 'Informe de Auditoría - Programas 2024',
    type: 'Auditoría',
    period: 'Anual 2024',
    createdAt: '2025-02-15',
    createdBy: 'Carlos Rodríguez',
    size: '5.1 MB',
    status: 'Aprobado'
  },
  {
    id: '4',
    name: 'Proyección Financiera - Segundo Semestre 2025',
    type: 'Proyección',
    period: 'S2 2025',
    createdAt: '2025-04-10',
    createdBy: 'Ana Martínez',
    size: '1.8 MB',
    status: 'Borrador'
  },
  {
    id: '5',
    name: 'Balance de Indicadores - Marzo 2025',
    type: 'Indicadores',
    period: 'Marzo 2025',
    createdAt: '2025-04-02',
    createdBy: 'Luis Gómez',
    size: '1.2 MB',
    status: 'Aprobado'
  }
];

// Report categories for filtering
const reportTypes = [
  'Todos',
  'Financiero',
  'Presupuesto',
  'Auditoría',
  'Proyección',
  'Indicadores'
];

// Report periods for filtering
const reportPeriods = [
  'Todos',
  'Q1 2025',
  'Q2 2025',
  'S1 2025',
  'S2 2025',
  'Marzo 2025',
  'Anual 2024'
];

// Report status options
const statusOptions = [
  'Todos',
  'Borrador',
  'Pendiente',
  'Aprobado'
];

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('Todos');
  const [selectedPeriod, setSelectedPeriod] = useState('Todos');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [selectedTab, setSelectedTab] = useState('reports');
  const [showReportModal, setShowReportModal] = useState(false);

  // Filter reports based on search term and selections
  const filteredReports = reportsData.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'Todos' || report.type === selectedType;
    const matchesPeriod = selectedPeriod === 'Todos' || report.period === selectedPeriod;
    const matchesStatus = selectedStatus === 'Todos' || report.status === selectedStatus;
    return matchesSearch && matchesType && matchesPeriod && matchesStatus;
  });

  // Handle report generation
  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    setShowReportModal(false);
    // Simulate report generation
    alert('Reporte generado con éxito. Se puede descargar desde la lista de reportes.');
  };

  return (
    <PermissionGuard resource="reports" requiredPermission={PermissionLevel.READ}>
      <div className="container mx-auto bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Reportes Financieros</h1>
          <p className="text-gray-600 mt-1">
            Generación y consulta de informes financieros del sistema
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <ul className="flex flex-wrap -mb-px">
            <li className="mr-2">
              <button
                onClick={() => setSelectedTab('reports')}
                className={`inline-flex items-center py-2 px-4 text-sm font-medium text-center ${
                  selectedTab === 'reports'
                    ? 'text-amber-600 border-b-2 border-amber-600'
                    : 'text-gray-500 border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Reportes
              </button>
            </li>
            <li className="mr-2">
              <button
                onClick={() => setSelectedTab('templates')}
                className={`inline-flex items-center py-2 px-4 text-sm font-medium text-center ${
                  selectedTab === 'templates'
                    ? 'text-amber-600 border-b-2 border-amber-600'
                    : 'text-gray-500 border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path>
                </svg>
                Plantillas
              </button>
            </li>
            <li className="mr-2">
              <button
                onClick={() => setSelectedTab('scheduling')}
                className={`inline-flex items-center py-2 px-4 text-sm font-medium text-center ${
                  selectedTab === 'scheduling'
                    ? 'text-amber-600 border-b-2 border-amber-600'
                    : 'text-gray-500 border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                Programación
              </button>
            </li>
          </ul>
        </div>

        {/* Search and Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:flex justify-between mb-6 gap-4">
          <div className="flex-1 max-w-sm">
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
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full pl-10 p-2.5" 
                placeholder="Buscar reportes" 
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
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
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 p-2.5"
            >
              {reportPeriods.map(period => (
                <option key={period} value={period}>{period}</option>
              ))}
            </select>

            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 p-2.5"
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
    
          <div>
            <button 
              onClick={() => setShowReportModal(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium flex items-center whitespace-nowrap"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Generar reporte
            </button>
          </div>
        </div>

        {/* Content based on selected tab */}
        {selectedTab === 'reports' ? (
          <div className="overflow-x-auto relative">
            <table className="w-full text-sm text-left text-gray-700">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th scope="col" className="py-3 px-6">Nombre del Reporte</th>
                  <th scope="col" className="py-3 px-6">Tipo</th>
                  <th scope="col" className="py-3 px-6">Período</th>
                  <th scope="col" className="py-3 px-6">Fecha creación</th>
                  <th scope="col" className="py-3 px-6">Creado por</th>
                  <th scope="col" className="py-3 px-6">Estado</th>
                  <th scope="col" className="py-3 px-6">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <tr key={report.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="py-4 px-6 font-medium text-amber-700">
                        <div className="flex items-center">
                          <ReportIcon type={report.type} />
                          <span className="ml-2">{report.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">{report.type}</td>
                      <td className="py-4 px-6">{report.period}</td>
                      <td className="py-4 px-6">{report.createdAt}</td>
                      <td className="py-4 px-6">{report.createdBy}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          report.status === 'Aprobado' 
                            ? 'bg-green-100 text-green-800' 
                            : report.status === 'Pendiente'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-3">
                          <button title="Ver reporte" className="text-blue-600 hover:text-blue-900">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button title="Descargar reporte" className="text-green-600 hover:text-green-900">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          <button title="Compartir reporte" className="text-amber-600 hover:text-amber-900">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="bg-white">
                    <td colSpan={7} className="py-4 px-6 text-center text-gray-500">
                      No se encontraron reportes que coincidan con los criterios de búsqueda
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : selectedTab === 'templates' ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path>
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay plantillas configuradas</h3>
            <p className="mt-1 text-sm text-gray-500">
              Configure plantillas personalizadas para sus reportes financieros.
            </p>
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                Crear plantilla
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay reportes programados</h3>
            <p className="mt-1 text-sm text-gray-500">
              Defina programaciones para la generación automática de reportes.
            </p>
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                Programar reporte
              </button>
            </div>
          </div>
        )}

        {/* Generate Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="relative bg-white rounded-lg shadow-lg max-w-lg w-full mx-4">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-xl font-semibold text-gray-900">Generar nuevo reporte</h3>
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              <form onSubmit={handleGenerateReport} className="p-6">
                <div className="mb-4">
                  <label htmlFor="reportName" className="block mb-2 text-sm font-medium text-gray-700">Nombre del reporte</label>
                  <input 
                    type="text" 
                    id="reportName" 
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full p-2.5" 
                    placeholder="Ej: Informe Financiero Q2 2025" 
                    required 
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="reportType" className="block mb-2 text-sm font-medium text-gray-700">Tipo de reporte</label>
                  <select 
                    id="reportType" 
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full p-2.5"
                    required
                  >
                    {reportTypes.filter(type => type !== 'Todos').map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label htmlFor="reportPeriod" className="block mb-2 text-sm font-medium text-gray-700">Período</label>
                    <select 
                      id="reportPeriod" 
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full p-2.5"
                      required
                    >
                      {reportPeriods.filter(period => period !== 'Todos').map(period => (
                        <option key={period} value={period}>{period}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="reportFormat" className="block mb-2 text-sm font-medium text-gray-700">Formato</label>
                    <select 
                      id="reportFormat" 
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full p-2.5"
                      required
                    >
                      <option value="pdf">PDF</option>
                      <option value="excel">Excel</option>
                      <option value="csv">CSV</option>
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-gray-700">Incluir secciones</label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input id="section1" type="checkbox" className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 focus:ring-2" defaultChecked />
                      <label htmlFor="section1" className="ml-2 text-sm text-gray-700">Resumen ejecutivo</label>
                    </div>
                    <div className="flex items-center">
                      <input id="section2" type="checkbox" className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 focus:ring-2" defaultChecked />
                      <label htmlFor="section2" className="ml-2 text-sm text-gray-700">Detalle de ingresos</label>
                    </div>
                    <div className="flex items-center">
                      <input id="section3" type="checkbox" className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 focus:ring-2" defaultChecked />
                      <label htmlFor="section3" className="ml-2 text-sm text-gray-700">Detalle de gastos</label>
                    </div>
                    <div className="flex items-center">
                      <input id="section4" type="checkbox" className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 focus:ring-2" />
                      <label htmlFor="section4" className="ml-2 text-sm text-gray-700">Gráficos y análisis</label>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-6 space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                  >
                    Generar reporte
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}

// Helper component for report icons based on type
const ReportIcon = ({ type }: { type: string }) => {
  switch(type) {
    case 'Financiero':
      return (
        <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path>
        </svg>
      );
    case 'Presupuesto':
      return (
        <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
        </svg>
      );
    case 'Auditoría':
      return (
        <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path>
        </svg>
      );
    case 'Proyección':
      return (
        <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"></path>
        </svg>
      );
    default:
      return (
        <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd"></path>
        </svg>
      );
  }
};