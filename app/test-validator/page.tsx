'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function TestValidatorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [structure, setStructure] = useState<any>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  }

  async function handleValidate() {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/validate-excel', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      console.error('Error:', error);
      setResult({
        valid: false,
        errors: [{ row: 0, field: 'General', message: error.message, severity: 'error' }],
        warnings: [],
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadStructure() {
    try {
      const response = await fetch('/api/validate-excel');
      const data = await response.json();
      setStructure(data);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Validador de Fichas Técnicas</h1>
          <p className="text-gray-600 mt-2">Prueba el validador PRO de Excel contra Google Sheets (AMBAS hojas)</p>
        </div>

        {/* Botón para ver estructura */}
        <div className="bg-white rounded-lg shadow p-6">
          <button
            onClick={loadStructure}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Ver Estructura de la Plantilla
          </button>

          {structure && (
            <div className="mt-4 space-y-4">
              {/* Estadísticas Combinadas */}
              <div>
                <h3 className="text-lg font-semibold mb-3">📊 Estadísticas Combinadas (Ambas Hojas)</h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{structure.summary.total}</div>
                    <div className="text-sm text-gray-600">Total Elementos</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{structure.summary.sections}</div>
                    <div className="text-sm text-gray-600">Secciones</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{structure.summary.fields}</div>
                    <div className="text-sm text-gray-600">Campos</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{structure.summary.requiredFields}</div>
                    <div className="text-sm text-gray-600">Obligatorios</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{structure.summary.headers}</div>
                    <div className="text-sm text-gray-600">Encabezados</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">{structure.summary.empty}</div>
                    <div className="text-sm text-gray-600">Vacíos</div>
                  </div>
                </div>
              </div>

              {/* Estadísticas por Hoja */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* FICHA TÉCNICA */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-3">📄 FICHA TÉCNICA</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-semibold">{structure.fichaTecnicaSummary.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Secciones:</span>
                      <span className="font-semibold">{structure.fichaTecnicaSummary.sections}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Campos:</span>
                      <span className="font-semibold">{structure.fichaTecnicaSummary.fields}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Obligatorios:</span>
                      <span className="font-semibold text-red-600">{structure.fichaTecnicaSummary.requiredFields}</span>
                    </div>
                  </div>
                </div>

                {/* FORMATO P&P */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-3">📄 FORMATO P&P</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-semibold">{structure.formatoPPSummary.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Secciones:</span>
                      <span className="font-semibold">{structure.formatoPPSummary.sections}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Campos:</span>
                      <span className="font-semibold">{structure.formatoPPSummary.fields}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Obligatorios:</span>
                      <span className="font-semibold text-red-600">{structure.formatoPPSummary.requiredFields}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estructura Detallada por Tipo */}
              <div className="bg-white p-4 rounded-lg border-2 border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-4">🔍 Análisis Detallado de Estructura</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* FICHA TÉCNICA */}
                  <div>
                    <h5 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      📄 FICHA TÉCNICA
                      <span className="text-xs bg-blue-100 px-2 py-1 rounded">
                        {structure.structure.fichatecnica.length} elementos
                      </span>
                    </h5>
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                      {structure.structure.fichatecnica.map((el: any, idx: number) => (
                        <div
                          key={idx}
                          className={`text-xs p-2 rounded flex items-start gap-2 ${
                            el.type === 'section'
                              ? 'bg-purple-100 border-l-4 border-purple-500'
                              : el.type === 'header'
                              ? 'bg-blue-100 border-l-4 border-blue-500'
                              : el.type === 'field' && el.required
                              ? 'bg-red-50 border-l-4 border-red-500'
                              : el.type === 'field'
                              ? 'bg-green-50 border-l-4 border-green-500'
                              : 'bg-gray-50'
                          }`}
                        >
                          <span className="font-mono text-gray-500 min-w-[40px]">
                            #{el.row}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {el.type === 'section' && <span className="text-purple-600">📌</span>}
                              {el.type === 'header' && <span className="text-blue-600">📋</span>}
                              {el.type === 'field' && el.required && <span className="text-red-600">⚠️</span>}
                              {el.type === 'field' && !el.required && <span className="text-green-600">✓</span>}
                              {el.type === 'empty' && <span className="text-gray-400">∅</span>}
                              
                              <span className={`font-semibold ${
                                el.type === 'section' ? 'text-purple-900 uppercase' :
                                el.type === 'header' ? 'text-blue-900' :
                                el.type === 'field' && el.required ? 'text-red-900' :
                                el.type === 'field' ? 'text-green-900' :
                                'text-gray-500'
                              }`}>
                                {el.label || '(vacío)'}
                              </span>
                            </div>
                            {el.value && (
                              <div className="text-gray-600 mt-1 ml-6">
                                → {el.value.substring(0, 50)}{el.value.length > 50 ? '...' : ''}
                              </div>
                            )}
                            {el.section && el.type === 'field' && (
                              <div className="text-xs text-gray-400 mt-1 ml-6">
                                Sección: {el.section}
                              </div>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            el.type === 'section' ? 'bg-purple-200 text-purple-800' :
                            el.type === 'header' ? 'bg-blue-200 text-blue-800' :
                            el.type === 'field' ? 'bg-green-200 text-green-800' :
                            'bg-gray-200 text-gray-600'
                          }`}>
                            {el.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FORMATO P&P */}
                  <div>
                    <h5 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                      📄 FORMATO P&P
                      <span className="text-xs bg-green-100 px-2 py-1 rounded">
                        {structure.structure.formatopp.length} elementos
                      </span>
                    </h5>
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                      {structure.structure.formatopp.map((el: any, idx: number) => (
                        <div
                          key={idx}
                          className={`text-xs p-2 rounded flex items-start gap-2 ${
                            el.type === 'section'
                              ? 'bg-purple-100 border-l-4 border-purple-500'
                              : el.type === 'header'
                              ? 'bg-blue-100 border-l-4 border-blue-500'
                              : el.type === 'field' && el.required
                              ? 'bg-red-50 border-l-4 border-red-500'
                              : el.type === 'field'
                              ? 'bg-green-50 border-l-4 border-green-500'
                              : 'bg-gray-50'
                          }`}
                        >
                          <span className="font-mono text-gray-500 min-w-[40px]">
                            #{el.row}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {el.type === 'section' && <span className="text-purple-600">📌</span>}
                              {el.type === 'header' && <span className="text-blue-600">📋</span>}
                              {el.type === 'field' && el.required && <span className="text-red-600">⚠️</span>}
                              {el.type === 'field' && !el.required && <span className="text-green-600">✓</span>}
                              {el.type === 'empty' && <span className="text-gray-400">∅</span>}
                              
                              <span className={`font-semibold ${
                                el.type === 'section' ? 'text-purple-900 uppercase' :
                                el.type === 'header' ? 'text-blue-900' :
                                el.type === 'field' && el.required ? 'text-red-900' :
                                el.type === 'field' ? 'text-green-900' :
                                'text-gray-500'
                              }`}>
                                {el.label || '(vacío)'}
                              </span>
                            </div>
                            {el.value && (
                              <div className="text-gray-600 mt-1 ml-6">
                                → {el.value.substring(0, 50)}{el.value.length > 50 ? '...' : ''}
                              </div>
                            )}
                            {el.section && el.type === 'field' && (
                              <div className="text-xs text-gray-400 mt-1 ml-6">
                                Sección: {el.section}
                              </div>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            el.type === 'section' ? 'bg-purple-200 text-purple-800' :
                            el.type === 'header' ? 'bg-blue-200 text-blue-800' :
                            el.type === 'field' ? 'bg-green-200 text-green-800' :
                            'bg-gray-200 text-gray-600'
                          }`}>
                            {el.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Leyenda */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h6 className="text-xs font-semibold text-gray-700 mb-2">Leyenda:</h6>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-600">📌</span>
                      <span>Sección (título)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600">📋</span>
                      <span>Encabezado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-red-600">⚠️</span>
                      <span>Campo obligatorio</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Campo opcional</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">∅</span>
                      <span>Fila vacía</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* JSON Completo (colapsado) */}
              <details className="bg-gray-50 p-4 rounded-lg">
                <summary className="cursor-pointer font-semibold text-sm text-gray-600">
                  Ver JSON Completo (para desarrolladores)
                </summary>
                <div className="mt-4 space-y-4">
                  <div>
                    <h5 className="font-semibold text-blue-900 mb-2">FICHA TÉCNICA</h5>
                    <pre className="text-xs overflow-auto max-h-96 bg-white p-4 rounded">
                      {JSON.stringify(structure.structure.fichatecnica, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h5 className="font-semibold text-green-900 mb-2">FORMATO P&P</h5>
                    <pre className="text-xs overflow-auto max-h-96 bg-white p-4 rounded">
                      {JSON.stringify(structure.structure.formatopp, null, 2)}
                    </pre>
                  </div>
                </div>
              </details>
            </div>
          )}
        </div>

        {/* Upload */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Subir Excel para Validar</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
            <div className="text-center">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    {file ? file.name : 'Selecciona un archivo Excel'}
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    .xlsx o .xls (debe contener FICHA TÉCNICA y FORMATO P&P)
                  </span>
                  <input
                    id="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept=".xlsx,.xls"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Seleccionar Archivo
                  </button>
                </label>
              </div>
            </div>
          </div>

          {file && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleValidate}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Validando...' : 'Validar Excel'}
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Status */}
            <div className={`rounded-lg p-6 ${result.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-3">
                {result.valid ? (
                  <>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-green-900">✅ Validación Exitosa</h3>
                      <p className="text-green-700">El archivo cumple con todos los requisitos de AMBAS hojas</p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-8 h-8 text-red-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-red-900">❌ Validación Fallida</h3>
                      <p className="text-red-700">Se encontraron {result.errors.length} errores</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Errors */}
            {result.errors && result.errors.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Errores ({result.errors.length})
                </h3>
                <div className="space-y-2">
                  {result.errors.map((error: any, index: number) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                      <div className="flex items-start gap-2">
                        <span className="text-red-600 font-mono text-sm">Fila {error.row}</span>
                        <div className="flex-1">
                          <div className="font-medium text-red-900">{error.field}</div>
                          <div className="text-sm text-red-700">{error.message}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {result.warnings && result.warnings.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Advertencias ({result.warnings.length})
                </h3>
                <div className="space-y-2">
                  {result.warnings.map((warning: any, index: number) => (
                    <div key={index} className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <div className="flex items-start gap-2">
                        <span className="text-yellow-600 font-mono text-sm">Fila {warning.row}</span>
                        <div className="flex-1">
                          <div className="font-medium text-yellow-900">{warning.field}</div>
                          <div className="text-sm text-yellow-700">{warning.message}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Extracted - Ambas Hojas */}
            {result.data && (
              <div className="space-y-4">
                {/* FICHA TÉCNICA */}
                {result.data.fichatecnica && Object.keys(result.data.fichatecnica).length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">📄 Datos Extraídos - FICHA TÉCNICA</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(result.data.fichatecnica).slice(0, 20).map(([key, value]: [string, any]) => (
                        <div key={key} className="bg-blue-50 p-3 rounded">
                          <div className="text-xs text-blue-600 font-mono">{key}</div>
                          <div className="text-sm text-gray-900 mt-1">{value || '(vacío)'}</div>
                        </div>
                      ))}
                    </div>
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                        Ver todos los datos (JSON)
                      </summary>
                      <pre className="mt-2 text-xs overflow-auto max-h-96 bg-gray-900 text-green-400 p-4 rounded">
                        {JSON.stringify(result.data.fichatecnica, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}

                {/* FORMATO P&P */}
                {result.data.formatopp && Object.keys(result.data.formatopp).length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-4">📄 Datos Extraídos - FORMATO P&P</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(result.data.formatopp).slice(0, 20).map(([key, value]: [string, any]) => (
                        <div key={key} className="bg-green-50 p-3 rounded">
                          <div className="text-xs text-green-600 font-mono">{key}</div>
                          <div className="text-sm text-gray-900 mt-1">{value || '(vacío)'}</div>
                        </div>
                      ))}
                    </div>
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm text-green-600 hover:text-green-800">
                        Ver todos los datos (JSON)
                      </summary>
                      <pre className="mt-2 text-xs overflow-auto max-h-96 bg-gray-900 text-green-400 p-4 rounded">
                        {JSON.stringify(result.data.formatopp, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            )}

            {/* Report */}
            {result.report && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Reporte Completo</h3>
                <pre className="text-sm whitespace-pre-wrap bg-gray-50 p-4 rounded">
                  {result.report}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}