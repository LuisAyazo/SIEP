'use client';

import { useState, useEffect } from 'react';

export default function DebugGastosPage() {
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
    return <div className="p-8">Cargando...</div>;
  }

  const gastosGenerales = data?.sections?.['INFORMACIÓN PRESUPUESTAL']?.['GASTOS GENERALES'];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug: GASTOS GENERALES</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Estructura Completa</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
          {JSON.stringify(gastosGenerales, null, 2)}
        </pre>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Fields ({gastosGenerales?.fields?.length || 0})</h2>
          <div className="space-y-2">
            {gastosGenerales?.fields?.map((field: any, idx: number) => (
              <div key={idx} className="bg-gray-50 p-3 rounded">
                <div className="font-semibold text-sm">{field.label}</div>
                <div className="text-xs text-gray-600">Row: {field.row}</div>
                <div className="text-xs text-gray-600">Value: {field.value || '(vacío)'}</div>
                <div className="text-xs text-gray-600">Type: {field.type}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Table Headers ({gastosGenerales?.tableHeaders?.length || 0})</h2>
          <div className="bg-gray-50 p-3 rounded mb-4">
            {gastosGenerales?.tableHeaders?.map((header: string, idx: number) => (
              <div key={idx} className="text-sm">
                {idx + 1}. {header}
              </div>
            ))}
          </div>

          <h2 className="text-lg font-semibold mb-4">Table Rows ({gastosGenerales?.tableRows?.length || 0})</h2>
          <div className="space-y-2 max-h-96 overflow-auto">
            {gastosGenerales?.tableRows?.map((row: any, idx: number) => (
              <div key={idx} className="bg-gray-50 p-2 rounded">
                <div className="text-xs font-semibold mb-1">Row {row.row}:</div>
                <div className="text-xs">
                  {row.data.map((cell: string, cellIdx: number) => (
                    <div key={cellIdx}>
                      <span className="font-semibold">[{cellIdx}]:</span> {cell || '(vacío)'}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}