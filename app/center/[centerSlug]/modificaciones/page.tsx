'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useCenterContext } from '@/components/providers/CenterContext';

interface Modificacion {
  id: string;
  tipo: string;
  accion: string;
  descripcion: string;
  usuario_nombre: string;
  created_at: string;
  metadata: any;
}

export default function ModificacionesPage() {
  const params = useParams();
  const { currentCenter } = useCenterContext();
  const [modificaciones, setModificaciones] = useState<Modificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroAccion, setFiltroAccion] = useState('todas');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  
  useEffect(() => {
    if (currentCenter?.id) {
      loadModificaciones();
    }
  }, [currentCenter?.id]);

  async function loadModificaciones() {
    try {
      setLoading(true);
      const response = await fetch(`/api/modificaciones?centro_id=${currentCenter?.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setModificaciones(data.modificaciones || []);
      }
    } catch (error) {
      console.error('Error al cargar modificaciones:', error);
    } finally {
      setLoading(false);
    }
  }
  
  const modificacionesFiltradas = modificaciones.filter(mod => {
    const cumpleFiltroAccion = filtroAccion === 'todas' || mod.accion.toLowerCase() === filtroAccion.toLowerCase();
    const cumpleFiltroTipo = filtroTipo === 'todos' || mod.tipo.toLowerCase() === filtroTipo.toLowerCase();
    const cumpleBusqueda =
      mod.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
      mod.usuario_nombre.toLowerCase().includes(busqueda.toLowerCase());
    
    return cumpleFiltroAccion && cumpleFiltroTipo && cumpleBusqueda;
  });

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function getAccionColor(accion: string) {
    switch(accion.toLowerCase()) {
      case 'crear':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300';
      case 'editar':
      case 'modificar':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300';
      case 'aprobar':
        return 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300';
      case 'rechazar':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300';
      case 'cancelar':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modificaciones</h1>
      
      {/* Filtros y búsqueda */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por código, nombre o usuario..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        <div className="flex space-x-2">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:text-white"
          >
            <option value="todos">Todos los tipos</option>
            <option value="solicitud">Solicitudes</option>
            <option value="ficha">Fichas</option>
            <option value="documento">Documentos</option>
          </select>

          <select
            value={filtroAccion}
            onChange={(e) => setFiltroAccion(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:text-white"
          >
            <option value="todas">Todas las acciones</option>
            <option value="crear">Crear</option>
            <option value="editar">Editar</option>
            <option value="aprobar">Aprobar</option>
            <option value="rechazar">Rechazar</option>
            <option value="cancelar">Cancelar</option>
          </select>
        </div>
      </div>

      {/* Lista de entradas de historial */}
      <div className="bg-white dark:bg-gray-800 shadow-sm overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Fecha y Hora
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tipo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acción
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Usuario
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Descripción
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Cargando modificaciones...
                  </td>
                </tr>
              ) : modificacionesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No hay modificaciones registradas
                  </td>
                </tr>
              ) : (
                modificacionesFiltradas.map((mod) => (
                  <tr key={mod.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(mod.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {mod.tipo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getAccionColor(mod.accion)} capitalize`}>
                        {mod.accion}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {mod.usuario_nombre}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {mod.descripcion}
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