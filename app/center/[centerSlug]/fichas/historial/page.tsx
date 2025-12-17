'use client';

import { useState, useEffect } from 'react';

// Datos simulados para mostrar el historial con formato FC-YYYY-XXX
const historialMock = [
  { 
    id: 1, 
    ficha_codigo: 'FC-2025-001', // Updated format
    ficha_nombre: 'Capacitación en herramientas digitales para comunidades rurales',
    usuario: 'Ana López', 
    accion: 'Creación', 
    fecha: '15/04/2025 - 10:23',
    detalles: 'Ficha creada a partir de archivo Excel'
  },
  { 
    id: 2, 
    ficha_codigo: 'FC-2025-001', // Updated format
    ficha_nombre: 'Capacitación en herramientas digitales para comunidades rurales',
    usuario: 'Juan Pérez', 
    accion: 'Modificación', 
    fecha: '18/04/2025 - 14:45',
    detalles: 'Actualización de datos financieros'
  },
  { 
    id: 3, 
    ficha_codigo: 'FC-2025-002', // Updated format
    ficha_nombre: 'Programa de educación ambiental en escuelas públicas',
    usuario: 'María García', 
    accion: 'Creación', 
    fecha: '28/03/2025 - 09:17',
    detalles: 'Ficha creada desde formulario'
  },
  { 
    id: 4, 
    ficha_codigo: 'FC-2025-002', // Updated format
    ficha_nombre: 'Programa de educación ambiental en escuelas públicas',
    usuario: 'Carlos Sánchez', 
    accion: 'Aprobación', 
    fecha: '02/04/2025 - 16:30',
    detalles: 'Aprobación por departamento académico'
  },
  { 
    id: 5, 
    ficha_codigo: 'FC-2025-003', // Updated format
    ficha_nombre: 'Asesoría técnica a microempresas locales',
    usuario: 'Elena Martín', 
    accion: 'Creación', 
    fecha: '10/03/2025 - 11:08',
    detalles: 'Ficha creada a partir de archivo Excel'
  }
];

export default function HistorialFichasPage() {
  const [historial, setHistorial] = useState(historialMock);
  const [filtroAccion, setFiltroAccion] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [periodoFecha, setPeriodoFecha] = useState('todo');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15; // Adjust as needed
  
  // Filtrar historial basado en acción, término de búsqueda y periodo
  const historialFiltrado = historial.filter(entrada => {
    // Filtro por acción
    const cumpleFiltroAccion = filtroAccion === 'todas' || entrada.accion.toLowerCase() === filtroAccion.toLowerCase();
    
    // Filtro por término de búsqueda (código, nombre o usuario)
    const cumpleBusqueda = 
      entrada.ficha_codigo.toLowerCase().includes(busqueda.toLowerCase()) || 
      entrada.ficha_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      entrada.usuario.toLowerCase().includes(busqueda.toLowerCase());
    
    // Filtro por periodo (implementación básica)
    let cumpleFiltroFecha = true;
    if (periodoFecha === 'hoy') {
      // Simulamos que el día actual es 5 de mayo de 2025 según el contexto
      cumpleFiltroFecha = entrada.fecha.includes('05/05/2025');
    } else if (periodoFecha === 'semana') {
      // Simulamos que estamos en la primera semana de mayo 2025
      cumpleFiltroFecha = entrada.fecha.includes('/05/2025') && parseInt(entrada.fecha.split('/')[0]) <= 7;
    } else if (periodoFecha === 'mes') {
      // Mayo 2025
      cumpleFiltroFecha = entrada.fecha.includes('/05/2025');
    }
    
    return cumpleFiltroAccion && cumpleBusqueda && cumpleFiltroFecha;
  });

  // Calcular items para la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = historialFiltrado.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(historialFiltrado.length / itemsPerPage);

  // Cambiar de página
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  // Función para determinar el color de badge según el tipo de acción
  const getAccionColor = (accion: string) => {
    switch(accion.toLowerCase()) {
      case 'creación':
        return 'bg-green-100 text-green-800';
      case 'modificación':
        return 'bg-blue-100 text-blue-800';
      case 'aprobación':
        return 'bg-amber-100 text-amber-800';
      case 'cierre':
        return 'bg-purple-100 text-purple-800';
      case 'cancelación':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Historial de Fichas</h1>
      
      {/* Filtros y búsqueda */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por código, nombre o usuario..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        <div className="flex space-x-2">
          <select 
            value={filtroAccion}
            onChange={(e) => { setFiltroAccion(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="todas">Todas las acciones</option>
            <option value="creación">Creación</option>
            <option value="modificación">Modificación</option>
            <option value="aprobación">Aprobación</option>
            <option value="cierre">Cierre</option>
            <option value="cancelación">Cancelación</option>
          </select>
          
          <select 
            value={periodoFecha}
            onChange={(e) => { setPeriodoFecha(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="todo">Todo el tiempo</option>
            <option value="hoy">Hoy</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mes</option>
          </select>
        </div>
      </div>

      {/* Lista de entradas de historial */}
      <div className="bg-white shadow-sm overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha y Hora
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código Ficha
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre del Proyecto
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acción
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detalles
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((entrada) => (
                <tr key={entrada.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entrada.fecha}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {entrada.ficha_codigo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {entrada.ficha_nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entrada.usuario}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getAccionColor(entrada.accion)}`}>
                      {entrada.accion}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {entrada.detalles}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-b-lg shadow-sm">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a <span className="font-medium">{Math.min(indexOfLastItem, historialFiltrado.length)}</span> de{' '}
                <span className="font-medium">{historialFiltrado.length}</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Anterior</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                {[...Array(totalPages).keys()].map(number => (
                  <button
                    key={number + 1}
                    onClick={() => paginate(number + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${currentPage === number + 1 ? 'z-10 bg-amber-50 border-amber-500 text-amber-600' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    {number + 1}
                  </button>
                ))}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Siguiente</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de historial vacío */}
      {historialFiltrado.length === 0 && (
        <div className="text-center py-10 bg-white rounded-lg shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay registros de actividad</h3>
          <p className="mt-1 text-sm text-gray-500">
            No se encontraron entradas de historial que coincidan con los criterios de búsqueda.
          </p>
          <div className="mt-6">
            <button
              onClick={() => {
                setBusqueda('');
                setFiltroAccion('todas');
                setPeriodoFecha('todo');
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
}