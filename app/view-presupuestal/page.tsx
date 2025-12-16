'use client';

import { useState, useEffect } from 'react';

export default function ViewPresupuestalPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/api/analyze-presupuestal');
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

  if (!data?.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-xl font-bold">Error</p>
          <p>{data?.error || 'Error desconocido'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          INFORMACIÓN PRESUPUESTAL
        </h1>
        <p className="text-gray-600 mb-8">
          Análisis completo de estructura y datos
        </p>

        {/* Resumen */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-4">📊 Resumen</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/20 rounded-lg p-4">
              <p className="text-sm opacity-90">Total Subsecciones</p>
              <p className="text-3xl font-bold">{data.totalSubsections}</p>
            </div>
            {data.subsectionNames.map((name: string, idx: number) => {
              const subsection = data.subsections[name];
              return (
                <div key={idx} className="bg-white/20 rounded-lg p-4">
                  <p className="text-sm opacity-90">{name}</p>
                  <p className="text-2xl font-bold">{subsection.rows.length} filas</p>
                  <p className="text-xs opacity-75">{subsection.headers.length} columnas</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subsecciones */}
        <div className="space-y-8">
          {Object.entries(data.subsections).map(([key, subsection]: [string, any]) => (
            <div key={key} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
                <h2 className="text-2xl font-bold text-white">{subsection.name}</h2>
                <p className="text-indigo-100 text-sm mt-1">
                  {subsection.headers.length} columnas • {subsection.rows.length} filas de datos
                </p>
              </div>

              {/* Columnas */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Columnas:</h3>
                <div className="flex flex-wrap gap-2">
                  {subsection.headers.map((header: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium"
                    >
                      {idx + 1}. {header}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tabla de datos */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        #
                      </th>
                      {subsection.headers.map((header: string, idx: number) => (
                        <th
                          key={idx}
                          className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subsection.rows.map((row: any, rowIdx: number) => (
                      <tr key={rowIdx} className={`hover:bg-gray-50 ${row.isSubtotal ? 'bg-yellow-50 font-semibold' : ''}`}>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {rowIdx + 1}
                        </td>
                        {subsection.headers.map((_: string, colIdx: number) => (
                          <td
                            key={colIdx}
                            className={`px-4 py-3 text-sm ${row.isSubtotal ? 'font-bold text-gray-900' : 'text-gray-900'}`}
                          >
                            {row.data[colIdx] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer con total de filas */}
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
                Total: {subsection.rows.length} filas
              </div>
            </div>
          ))}
        </div>

        {/* JSON Raw */}
        <div className="mt-8 bg-gray-900 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            🔍 Datos JSON Completos
          </h2>
          <pre className="text-xs text-green-400 overflow-x-auto max-h-96">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}