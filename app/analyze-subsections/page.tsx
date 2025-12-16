'use client';

import { useState, useEffect } from 'react';
import { Table, FileText, Calendar, DollarSign, Hash, Type } from 'lucide-react';

export default function AnalyzeSubsectionsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const response = await fetch('/api/analyze-subsections');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  function getFieldIcon(type: string) {
    switch (type) {
      case 'date': return <Calendar className="w-4 h-4" />;
      case 'money': return <DollarSign className="w-4 h-4" />;
      case 'number': return <Hash className="w-4 h-4" />;
      case 'textarea': return <FileText className="w-4 h-4" />;
      default: return <Type className="w-4 h-4" />;
    }
  }

  function getFieldColor(type: string) {
    switch (type) {
      case 'date': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'money': return 'bg-green-100 text-green-800 border-green-300';
      case 'number': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'textarea': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Analizando subsecciones...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">Error al cargar datos</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-blue-600">
          <h1 className="text-3xl font-bold text-gray-900">
            Análisis de Subsecciones - INFORMACIÓN TÉCNICA
          </h1>
          <p className="text-gray-600 mt-2">
            Estructura detallada de las 7 subsecciones con sus campos y tipos
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="text-3xl font-bold text-green-600">{data.summary.total}</div>
            <div className="text-sm text-gray-600 mt-1">Subsecciones Encontradas</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="text-lg font-bold text-blue-600">
              {data.summary.found.join(', ')}
            </div>
            <div className="text-sm text-gray-600 mt-1">Detectadas</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <div className="text-lg font-bold text-red-600">
              {data.summary.missing.length > 0 ? data.summary.missing.join(', ') : 'Ninguna'}
            </div>
            <div className="text-sm text-gray-600 mt-1">Faltantes</div>
          </div>
        </div>

        {/* Subsections */}
        <div className="space-y-6">
          {Object.entries(data.subsections).map(([key, subsection]: [string, any]) => (
            <div key={key} className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Subsection Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  📎 {subsection.name}
                  <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                    Fila {subsection.startRow}
                  </span>
                  {subsection.hasTable && (
                    <span className="text-sm bg-green-500 px-3 py-1 rounded-full flex items-center gap-1">
                      <Table className="w-4 h-4" />
                      Tabla
                    </span>
                  )}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                {/* Simple Fields */}
                {subsection.fields.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Campos Simples:</h3>
                    <div className="space-y-2">
                      {subsection.fields.map((field: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-start gap-3"
                        >
                          <div className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-mono">
                            #{field.row}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-1 rounded text-xs font-semibold border ${getFieldColor(field.type)} flex items-center gap-1`}>
                                {getFieldIcon(field.type)}
                                {field.type.toUpperCase()}
                              </span>
                            </div>
                            <div className="font-medium text-gray-900">{field.label}</div>
                            {field.value && (
                              <div className="text-sm text-gray-600 mt-1">
                                Valor: {field.value}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Table */}
                {subsection.hasTable && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Table className="w-5 h-5" />
                      Tabla de Datos:
                    </h3>
                    
                    {/* Table Headers */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${subsection.tableHeaders.length}, 1fr)` }}>
                        {subsection.tableHeaders.map((header: string, idx: number) => (
                          <div key={idx} className="font-bold text-blue-900 text-sm">
                            {header}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Table Rows */}
                    <div className="space-y-1">
                      {subsection.tableRows.slice(0, 5).map((row: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-gray-50 border border-gray-200 rounded p-2"
                        >
                          <div className="text-xs text-gray-500 mb-1">Fila #{row.row}</div>
                          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${row.data.length}, 1fr)` }}>
                            {row.data.map((cell: string, cellIdx: number) => (
                              <div key={cellIdx} className="text-sm text-gray-700">
                                {cell}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {subsection.tableRows.length > 5 && (
                        <div className="text-center text-sm text-gray-500 py-2">
                          ... y {subsection.tableRows.length - 5} filas más
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {subsection.fields.length === 0 && !subsection.hasTable && (
                  <div className="text-center text-gray-500 py-4">
                    No se detectaron campos en esta subsección
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}