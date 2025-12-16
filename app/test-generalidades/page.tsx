'use client';

import { useState, useEffect } from 'react';

export default function TestGeneralidadesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const response = await fetch('/api/generalidades');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando GENERALIDADES...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600 font-semibold">Error al cargar datos</p>
          {data?.error && <p className="text-red-500 text-sm mt-2">{data.error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-600">
          <h1 className="text-3xl font-bold text-gray-900">
            📎 {data.subsection}
          </h1>
          <div className="mt-2 flex gap-4 text-sm text-gray-600">
            <span>Fila de inicio: <strong>{data.startRow}</strong></span>
            <span>Total de campos: <strong>{data.totalFields}</strong></span>
          </div>
        </div>

        {/* Raw Data */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Datos Crudos (Raw Data)</h2>
          <div className="space-y-3">
            {data.fields.map((field: any, idx: number) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded font-mono text-sm font-bold">
                    Fila #{field.row}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <div className="text-xs text-gray-500 font-semibold">Columna A (Label)</div>
                        <div className="text-sm font-medium text-gray-900 mt-1">{field.label}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-semibold">Columna B (Value)</div>
                        <div className="text-sm text-gray-700 mt-1">{field.value || <span className="text-gray-400 italic">vacío</span>}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-semibold">Columna C</div>
                        <div className="text-sm text-gray-700 mt-1">{field.cellC || <span className="text-gray-400 italic">vacío</span>}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-semibold">Columna D</div>
                        <div className="text-sm text-gray-700 mt-1">{field.cellD || <span className="text-gray-400 italic">vacío</span>}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* JSON Raw */}
        <div className="bg-gray-900 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">JSON Completo</h2>
          <pre className="text-green-400 text-xs overflow-x-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}