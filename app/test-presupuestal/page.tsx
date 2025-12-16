'use client';

import { useState, useEffect } from 'react';

export default function TestPresupuestalPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/api/analyze-all-sections');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando estructura...</p>
        </div>
      </div>
    );
  }

  const presupuestalSections = data?.sections?.['INFORMACIÓN PRESUPUESTAL'] || {};
  const sectionNames = data?.sectionNames?.['INFORMACIÓN PRESUPUESTAL'] || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Análisis de INFORMACIÓN PRESUPUESTAL
        </h1>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <h2 className="text-lg font-semibold text-blue-900">
            Subsecciones detectadas: {sectionNames.length}
          </h2>
          <ul className="mt-2 space-y-1">
            {sectionNames.map((name: string, idx: number) => (
              <li key={idx} className="text-blue-800">
                {idx + 1}. {name}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-8">
          {Object.entries(presupuestalSections).map(([key, section]: [string, any]) => (
            <div key={key} className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-blue-500 pb-2">
                {section.name}
              </h2>

              {/* Campos simples */}
              {section.fields && section.fields.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    📝 Campos ({section.fields.length})
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Fila</th>
                          <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Campo</th>
                          <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Valor Ejemplo</th>
                          <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Tipo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.fields.map((field: any, idx: number) => (
                          <tr key={idx} className="border-b border-gray-200">
                            <td className="py-2 px-3 text-sm text-gray-600">{field.row}</td>
                            <td className="py-2 px-3 text-sm font-medium text-gray-900">{field.label}</td>
                            <td className="py-2 px-3 text-sm text-gray-600">{field.value || '-'}</td>
                            <td className="py-2 px-3">
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                {field.type}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tabla */}
              {section.hasTable && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    📊 Tabla ({section.tableRows?.length || 0} filas)
                  </h3>
                  
                  {/* Headers */}
                  <div className="mb-3">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Columnas:</h4>
                    <div className="flex flex-wrap gap-2">
                      {section.tableHeaders.map((header: string, idx: number) => (
                        <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          {idx + 1}. {header}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Filas de ejemplo */}
                  {section.tableRows && section.tableRows.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Primeras 5 filas de ejemplo:
                      </h4>
                      <table className="min-w-full border border-gray-300">
                        <thead className="bg-gray-200">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b">Fila</th>
                            {section.tableHeaders.map((header: string, idx: number) => (
                              <th key={idx} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {section.tableRows.slice(0, 5).map((row: any, idx: number) => (
                            <tr key={idx} className="border-b border-gray-200">
                              <td className="px-3 py-2 text-xs text-gray-600">{row.row}</td>
                              {row.data.map((cell: string, cellIdx: number) => (
                                <td key={cellIdx} className="px-3 py-2 text-xs text-gray-900">
                                  {cell || '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {!section.fields?.length && !section.hasTable && (
                <p className="text-gray-500 italic">No se detectaron campos ni tablas</p>
              )}
            </div>
          ))}
        </div>

        {/* JSON completo para debugging */}
        <div className="mt-8 bg-gray-900 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            🔍 Datos completos (JSON)
          </h2>
          <pre className="text-xs text-green-400 overflow-x-auto">
            {JSON.stringify(presupuestalSections, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}