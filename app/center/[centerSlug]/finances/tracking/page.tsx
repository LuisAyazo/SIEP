'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PermissionGuard from '@/components/PermissionGuard';
import { PermissionLevel, RESOURCES } from '@/app/auth/permissions';

// Mock financial tracking data
const trackingData = [
  {
    id: '1',
    projectCode: 'PS-2025-001',
    projectName: 'Proyecto investigación C',
    budget: 95000000,
    totalExecuted: 45000000,
    assigned: 65000000,
    available: 50000000,
    lastMonth: 12000000,
    lastUpdate: '2025-03-15',
    status: 'En curso',
    category: 'Investigación'
  },
  {
    id: '2',
    projectCode: 'PS-2025-002',
    projectName: 'Programa extensión D',
    budget: 75000000,
    totalExecuted: 25000000,
    assigned: 40000000,
    available: 50000000,
    lastMonth: 8000000,
    lastUpdate: '2025-03-10',
    status: 'En curso',
    category: 'Extensión'
  },
  {
    id: '3',
    projectCode: 'PS-2025-003',
    projectName: 'Servicios académicos',
    budget: 130000000,
    totalExecuted: 85000000,
    assigned: 110000000,
    available: 45000000,
    lastMonth: 15000000,
    lastUpdate: '2025-03-20',
    status: 'En curso',
    category: 'Académico'
  },
  {
    id: '4',
    projectCode: 'PS-2025-004',
    projectName: 'Infraestructura',
    budget: 200000000,
    totalExecuted: 150000000,
    assigned: 180000000,
    available: 50000000,
    lastMonth: 30000000,
    lastUpdate: '2025-03-17',
    status: 'En curso',
    category: 'Infraestructura'
  },
  {
    id: '5',
    projectCode: 'PS-2025-005',
    projectName: 'Capacitación docente',
    budget: 45000000,
    totalExecuted: 15000000,
    assigned: 25000000,
    available: 30000000,
    lastMonth: 5000000,
    lastUpdate: '2025-03-12',
    status: 'En curso',
    category: 'Académico'
  },
];

// Filter options
const categoryOptions = [
  'Todos',
  'Investigación',
  'Extensión',
  'Académico',
  'Infraestructura'
];

export default function FinancialTrackingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortField, setSortField] = useState<string>('totalExecuted');

  // Format currency display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate progress percentage
  const calculateProgress = (executed: number, total: number) => {
    return Math.round((executed / total) * 100);
  };

  // Calculate summary totals
  const calculateSummary = () => {
    return trackingData.reduce(
      (acc, item) => {
        acc.totalBudget += item.budget;
        acc.totalExecuted += item.totalExecuted;
        acc.totalAssigned += item.assigned;
        acc.totalAvailable += item.available;
        acc.lastMonth += item.lastMonth;
        return acc;
      },
      { totalBudget: 0, totalExecuted: 0, totalAssigned: 0, totalAvailable: 0, lastMonth: 0 }
    );
  };
  
  // Sort tracking data
  const sortTracking = (a: any, b: any) => {
    if (sortField === 'projectName') {
      const comparison = a.projectName.localeCompare(b.projectName);
      return sortOrder === 'asc' ? comparison : -comparison;
    } else {
      const comparison = a[sortField] - b[sortField];
      return sortOrder === 'asc' ? comparison : -comparison;
    }
  };

  // Toggle sort order and field
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Filter tracking data
  const filteredTracking = trackingData
    .filter(item => {
      const matchesSearch = 
        item.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.projectCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort(sortTracking);

  const summary = calculateSummary();

  return (
    <PermissionGuard 
      resource={RESOURCES.FINANCES} 
      requiredPermission={PermissionLevel.READ}
      redirectTo="/dashboard"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Seguimiento Financiero</h1>
          <p className="text-gray-600 mt-1">
            Seguimiento de ejecución presupuestaria de proyectos y programas
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <motion.div 
            className="bg-white p-6 rounded-lg shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-sm font-medium text-gray-500 uppercase">Presupuesto Total</h2>
            <p className="mt-2 text-3xl font-bold text-gray-900">{formatCurrency(summary.totalBudget)}</p>
            <div className="mt-1 flex items-center">
              <span className="text-sm text-gray-700">Año fiscal 2025</span>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white p-6 rounded-lg shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h2 className="text-sm font-medium text-gray-500 uppercase">Total Ejecutado</h2>
            <p className="mt-2 text-3xl font-bold text-green-600">{formatCurrency(summary.totalExecuted)}</p>
            <div className="mt-1 flex items-center">
              <span className="text-sm text-gray-700">
                {calculateProgress(summary.totalExecuted, summary.totalBudget)}% del presupuesto
              </span>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white p-6 rounded-lg shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <h2 className="text-sm font-medium text-gray-500 uppercase">Monto Asignado</h2>
            <p className="mt-2 text-3xl font-bold text-blue-600">{formatCurrency(summary.totalAssigned)}</p>
            <div className="mt-1 flex items-center">
              <span className="text-sm text-gray-700">
                {calculateProgress(summary.totalAssigned, summary.totalBudget)}% del presupuesto
              </span>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-white p-6 rounded-lg shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <h2 className="text-sm font-medium text-gray-500 uppercase">Disponible</h2>
            <p className="mt-2 text-3xl font-bold text-emerald-600">{formatCurrency(summary.totalAvailable)}</p>
            <div className="mt-1 flex items-center">
              <span className="text-sm text-gray-700">
                {calculateProgress(summary.totalAvailable, summary.totalBudget)}% del presupuesto
              </span>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white p-6 rounded-lg shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <h2 className="text-sm font-medium text-gray-500 uppercase">Último Mes</h2>
            <p className="mt-2 text-3xl font-bold text-amber-600">{formatCurrency(summary.lastMonth)}</p>
            <div className="mt-1 flex items-center">
              <span className="text-sm text-gray-700">
                {calculateProgress(summary.lastMonth, summary.totalBudget)}% del presupuesto total
              </span>
            </div>
          </motion.div>
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
                  placeholder="Buscar proyectos" 
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 p-2.5"
              >
                {categoryOptions.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              <button 
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* Tracking Table */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSort('projectName')}
                  >
                    <div className="flex items-center">
                      Proyecto
                      {sortField === 'projectName' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSort('budget')}
                  >
                    <div className="flex items-center">
                      Presupuesto
                      {sortField === 'budget' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSort('assigned')}
                  >
                    <div className="flex items-center">
                      Monto Asignado
                      {sortField === 'assigned' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSort('totalExecuted')}
                  >
                    <div className="flex items-center">
                      Ejecutado
                      {sortField === 'totalExecuted' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSort('available')}
                  >
                    <div className="flex items-center">
                      Disponible
                      {sortField === 'available' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progreso
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSort('lastMonth')}
                  >
                    <div className="flex items-center">
                      Último Mes
                      {sortField === 'lastMonth' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTracking.map((item) => {
                  const progressPercentage = calculateProgress(item.totalExecuted, item.budget);
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{item.projectCode}</div>
                        <div className="text-sm text-gray-500">{item.projectName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(item.budget)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(item.assigned)}</div>
                        <div className="text-xs text-gray-500">{Math.round((item.assigned/item.budget)*100)}% del presupuesto</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(item.totalExecuted)}</div>
                        <div className="text-xs text-gray-500">Actualizado: {item.lastUpdate}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-green-600 font-medium">{formatCurrency(item.available)}</div>
                        <div className="text-xs text-gray-500">{Math.round((item.available/item.budget)*100)}% restante</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              progressPercentage >= 90 ? 'bg-green-600' :
                              progressPercentage >= 70 ? 'bg-amber-500' :
                              progressPercentage >= 40 ? 'bg-blue-500' : 'bg-gray-400'
                            }`}
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{progressPercentage}% ejecutado</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(item.lastMonth)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.category === 'Investigación' ? 'bg-purple-100 text-purple-800' : 
                          item.category === 'Extensión' ? 'bg-blue-100 text-blue-800' : 
                          item.category === 'Académico' ? 'bg-green-100 text-green-800' : 
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <button className="text-blue-600 hover:text-blue-900">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button className="text-amber-600 hover:text-amber-900">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
