'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PermissionGuard from '@/components/PermissionGuard';
import { PermissionLevel, RESOURCES } from '@/app/auth/permissions';

export default function FinancialPlanningPage() {
  const [activeYear, setActiveYear] = useState<string>('2025');
  const [activeQuarter, setActiveQuarter] = useState<string>('Q1');

  const years = ['2024', '2025', '2026'];
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  // Mock planning data
  const planningData = [
    { 
      id: '1',
      category: 'Investigación',
      allocation2024: 250000000,
      allocation2025: 290000000,
      allocation2026: 320000000,
      q1Percentage: 30,
      q2Percentage: 25,
      q3Percentage: 25,
      q4Percentage: 20,
    },
    { 
      id: '2',
      category: 'Extensión',
      allocation2024: 180000000,
      allocation2025: 200000000,
      allocation2026: 220000000,
      q1Percentage: 25,
      q2Percentage: 25,
      q3Percentage: 30,
      q4Percentage: 20,
    },
    { 
      id: '3',
      category: 'Académico',
      allocation2024: 320000000,
      allocation2025: 350000000,
      allocation2026: 380000000,
      q1Percentage: 35,
      q2Percentage: 20,
      q3Percentage: 30,
      q4Percentage: 15,
    },
    { 
      id: '4',
      category: 'Infraestructura',
      allocation2024: 400000000,
      allocation2025: 450000000,
      allocation2026: 500000000,
      q1Percentage: 20,
      q2Percentage: 40,
      q3Percentage: 30,
      q4Percentage: 10,
    },
    { 
      id: '5',
      category: 'Administrativo',
      allocation2024: 150000000,
      allocation2025: 165000000,
      allocation2026: 180000000,
      q1Percentage: 25,
      q2Percentage: 25,
      q3Percentage: 25,
      q4Percentage: 25,
    },
  ];

  // Format currency display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate total budget for a selected year
  const calculateTotalForYear = (year: string) => {
    return planningData.reduce((sum, item) => {
      if (year === '2024') return sum + item.allocation2024;
      if (year === '2025') return sum + item.allocation2025;
      if (year === '2026') return sum + item.allocation2026;
      return sum;
    }, 0);
  };

  // Calculate allocation for a category in a specific year and quarter
  const calculateQuarterAllocation = (item: any, year: string, quarter: string) => {
    let yearAllocation = 0;
    
    if (year === '2024') yearAllocation = item.allocation2024;
    else if (year === '2025') yearAllocation = item.allocation2025;
    else if (year === '2026') yearAllocation = item.allocation2026;
    
    let percentage = 0;
    if (quarter === 'Q1') percentage = item.q1Percentage;
    else if (quarter === 'Q2') percentage = item.q2Percentage;
    else if (quarter === 'Q3') percentage = item.q3Percentage;
    else if (quarter === 'Q4') percentage = item.q4Percentage;
    
    return yearAllocation * (percentage / 100);
  };

  // Check if plan is balanced (percentages sum to 100%)
  const isPlanBalanced = (item: any) => {
    return item.q1Percentage + item.q2Percentage + item.q3Percentage + item.q4Percentage === 100;
  };

  return (
    <PermissionGuard 
      resource={RESOURCES.FINANCES} 
      requiredPermission={PermissionLevel.READ}
      redirectTo="/dashboard"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Planificación Financiera</h1>
          <p className="text-gray-600 mt-1">
            Planificación y asignación presupuestaria por categoría y período
          </p>
        </div>

        {/* Year and Quarter Selector */}
        <div className="bg-white p-4 rounded-lg shadow flex flex-col sm:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
            <div className="flex space-x-2">
              {years.map(year => (
                <button
                  key={year}
                  onClick={() => setActiveYear(year)}
                  className={`px-4 py-2 rounded-md ${
                    activeYear === year 
                      ? 'bg-amber-600 text-white font-medium'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trimestre</label>
            <div className="flex space-x-2">
              {quarters.map(quarter => (
                <button
                  key={quarter}
                  onClick={() => setActiveQuarter(quarter)}
                  className={`px-4 py-2 rounded-md ${
                    activeQuarter === quarter 
                      ? 'bg-amber-600 text-white font-medium'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {quarter}
                </button>
              ))}
            </div>
          </div>
          
          <div className="ml-auto flex items-end">
            <button 
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Exportar Plan
            </button>
          </div>
        </div>

        {/* Summary */}
        <motion.div 
          className="bg-white p-6 rounded-lg shadow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-lg font-medium text-gray-800 mb-4">Resumen Presupuestario {activeYear}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <p className="text-xs font-medium text-amber-800 uppercase">Presupuesto Total</p>
              <h4 className="text-xl font-bold text-amber-900 mt-1">{formatCurrency(calculateTotalForYear(activeYear))}</h4>
              <p className="text-xs text-amber-700 mt-1">Asignado para {activeYear}</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-xs font-medium text-blue-800 uppercase">Trimestre {activeQuarter.replace('Q', '')}</p>
              <h4 className="text-xl font-bold text-blue-900 mt-1">
                {formatCurrency(planningData.reduce((sum, item) => sum + calculateQuarterAllocation(item, activeYear, activeQuarter), 0))}
              </h4>
              <p className="text-xs text-blue-700 mt-1">Asignado para {activeQuarter} de {activeYear}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-xs font-medium text-green-800 uppercase">Mayor Asignación</p>
              <h4 className="text-xl font-bold text-green-900 mt-1">Infraestructura</h4>
              <p className="text-xs text-green-700 mt-1">28% del presupuesto total</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p className="text-xs font-medium text-purple-800 uppercase">Proyectos Financiables</p>
              <h4 className="text-xl font-bold text-purple-900 mt-1">32</h4>
              <p className="text-xs text-purple-700 mt-1">Estimado para {activeYear}</p>
            </div>
          </div>
        </motion.div>

        {/* Planning Table */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Presupuesto Anual
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Q1 (%)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Q2 (%)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Q3 (%)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Q4 (%)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeQuarter}
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {planningData.map((item) => {
                  const yearKey = `allocation${activeYear}` as keyof typeof item;
                  const yearAllocation = item[yearKey] as number;
                  const quarterAllocation = calculateQuarterAllocation(item, activeYear, activeQuarter);
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{item.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(yearAllocation)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${activeQuarter === 'Q1' ? 'font-bold text-amber-600' : 'text-gray-900'}`}>
                          {item.q1Percentage}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${activeQuarter === 'Q2' ? 'font-bold text-amber-600' : 'text-gray-900'}`}>
                          {item.q2Percentage}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${activeQuarter === 'Q3' ? 'font-bold text-amber-600' : 'text-gray-900'}`}>
                          {item.q3Percentage}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${activeQuarter === 'Q4' ? 'font-bold text-amber-600' : 'text-gray-900'}`}>
                          {item.q4Percentage}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(quarterAllocation)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {isPlanBalanced(item) ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Balanceado
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Desbalanceado
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Distribution Guidance */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Guía para Distribución Trimestral</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-800">Q1 - Primer Trimestre</h3>
                <span className="text-xs font-semibold text-white bg-blue-500 rounded-full px-2 py-1">Ene-Mar</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Planificación anual</li>
                <li>• Inicio de proyectos</li>
                <li>• Convocatorias</li>
                <li>• 25-30% del presupuesto</li>
              </ul>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-800">Q2 - Segundo Trimestre</h3>
                <span className="text-xs font-semibold text-white bg-green-500 rounded-full px-2 py-1">Abr-Jun</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Desarrollo de proyectos</li>
                <li>• Evaluación de medio término</li>
                <li>• Ajustes de programas</li>
                <li>• 20-30% del presupuesto</li>
              </ul>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-800">Q3 - Tercer Trimestre</h3>
                <span className="text-xs font-semibold text-white bg-amber-500 rounded-full px-2 py-1">Jul-Sep</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Continuidad de proyectos</li>
                <li>• Inicio preparación del siguiente año</li>
                <li>• Optimización de recursos</li>
                <li>• 20-30% del presupuesto</li>
              </ul>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-800">Q4 - Cuarto Trimestre</h3>
                <span className="text-xs font-semibold text-white bg-purple-500 rounded-full px-2 py-1">Oct-Dic</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Cierre de proyectos anuales</li>
                <li>• Evaluación de resultados</li>
                <li>• Planificación siguiente año</li>
                <li>• 15-25% del presupuesto</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">Nota sobre distribución presupuestaria</h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>
                    La distribución trimestral debe totalizar 100% del presupuesto anual asignado. 
                    Los porcentajes sugeridos son referenciales y pueden ajustarse según las necesidades específicas de cada categoría.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
