'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Datos simulados para mostrar fichas
const fichasMock = [
  {
    id: 1, 
    codigo: 'EXTSC-2025-001',
    nombre: 'Capacitación en herramientas digitales para comunidades rurales',
    fecha: '15/04/2025',
    tipo: 'Capacitación',
    estado: 'Activa'
  },
  {
    id: 2, 
    codigo: 'EXTSC-2025-002',
    nombre: 'Programa de educación ambiental en escuelas públicas',
    fecha: '28/03/2025',
    tipo: 'Educación',
    estado: 'Activa'
  },
  {
    id: 3, 
    codigo: 'EXTSC-2025-003',
    nombre: 'Asesoría técnica a microempresas locales',
    fecha: '10/03/2025',
    tipo: 'Asesoría',
    estado: 'En revisión'
  },
  {
    id: 4, 
    codigo: 'EXTSC-2024-045',
    nombre: 'Taller de emprendimiento social',
    fecha: '15/12/2024',
    tipo: 'Taller',
    estado: 'Completada'
  },
  {
    id: 5, 
    codigo: 'EXTSC-2024-038',
    nombre: 'Consultoría para gestión de residuos municipales',
    fecha: '05/11/2024',
    tipo: 'Consultoría',
    estado: 'Inactiva'
  }
];

export default function FichasPage() {
  const [fichas, setFichas] = useState(fichasMock);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  // Filtrar fichas basado en estado y término de búsqueda
  const fichasFiltradas = fichas.filter(ficha => {
    const cumpleFiltroEstado = filtroEstado === 'todos' || ficha.estado.toLowerCase() === filtroEstado.toLowerCase();
    const cumpleBusqueda = 
      ficha.codigo.toLowerCase().includes(busqueda.toLowerCase()) || 
      ficha.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      ficha.tipo.toLowerCase().includes(busqueda.toLowerCase());
    
    return cumpleFiltroEstado && cumpleBusqueda;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Fichas</h1>

        <Link href="/dashboard/fichas/cargar-ficha" className="px-4 py-2 bg-amber-600 text-white rounded-md flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Cargar Ficha
        </Link>
      </div>

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
              placeholder="Buscar por código, nombre o tipo..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-shrink-0">
          <div className="flex space-x-2">
            <select 
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="todos">Todos los estados</option>
              <option value="activa">Activa</option>
              <option value="en revisión">En revisión</option>
              <option value="completada">Completada</option>
              <option value="inactiva">Inactiva</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de fichas */}
      <div className="bg-white shadow-sm overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre del Proyecto
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
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
              {fichasFiltradas.map((ficha) => (
                <tr key={ficha.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {ficha.codigo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {ficha.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ficha.fecha}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ficha.tipo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${ficha.estado === 'Activa' ? 'bg-green-100 text-green-800' : ''} 
                      ${ficha.estado === 'En revisión' ? 'bg-yellow-100 text-yellow-800' : ''} 
                      ${ficha.estado === 'Completada' ? 'bg-blue-100 text-blue-800' : ''} 
                      ${ficha.estado === 'Inactiva' ? 'bg-gray-100 text-gray-800' : ''}`
                    }>
                      {ficha.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button className="text-amber-600 hover:text-amber-900">
                        Ver
                      </button>
                      <button className="text-blue-600 hover:text-blue-900">
                        Editar
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        Descargar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Indicador de fichas vacías */}
      {fichasFiltradas.length === 0 && (
        <div className="text-center py-10 bg-white rounded-lg shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay fichas disponibles</h3>
          <p className="mt-1 text-sm text-gray-500">
            No se encontraron fichas que coincidan con los criterios de búsqueda.
          </p>
          <div className="mt-6">
            <Link href="/dashboard/fichas/cargar-ficha" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500">
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Cargar Ficha
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}