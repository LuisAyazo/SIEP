'use client';

import { useState, useEffect } from 'react';
import { FileSpreadsheet, Hash, Type, Calendar, DollarSign, Users, CheckCircle2 } from 'lucide-react';

export default function AnalyzeFormatoPPPage() {
  const [structure, setStructure] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStructure();
  }, []);

  async function loadStructure() {
    try {
      const response = await fetch('/api/validate-excel');
      const data = await response.json();
      setStructure(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  function detectFieldType(label: string, value: string) {
    const lowerLabel = label.toLowerCase();
    const lowerValue = value?.toLowerCase() || '';
    
    if (lowerLabel.includes('fecha') || lowerLabel.includes('date')) return 'date';
    if (lowerLabel.includes('valor') || lowerLabel.includes('precio') || lowerLabel.includes('costo') || 
        lowerLabel.includes('presupuesto') || lowerLabel.includes('gasto') || lowerLabel.includes('ingreso') ||
        value?.includes('$')) return 'money';
    if (lowerLabel.includes('plazo') || lowerLabel.includes('meses') || lowerLabel.includes('días') ||
        lowerLabel.includes('cantidad') || lowerLabel.includes('número') || lowerLabel.includes('numero')) return 'number';
    if (lowerLabel.includes('identificación') || lowerLabel.includes('cedula') || lowerLabel.includes('cédula') ||
        lowerLabel.includes('documento')) return 'id';
    if (lowerLabel.includes('nombre') || lowerLabel.includes('coordinador') || lowerLabel.includes('responsable')) return 'person';
    if (lowerLabel.includes('email') || lowerLabel.includes('correo')) return 'email';
    if (lowerLabel.includes('teléfono') || lowerLabel.includes('telefono') || lowerLabel.includes('celular')) return 'phone';
    
    return 'text';
  }

  function getFieldIcon(type: string) {
    switch (type) {
      case 'money': return <DollarSign className="w-4 h-4" />;
      case 'number': return <Hash className="w-4 h-4" />;
      case 'date': return <Calendar className="w-4 h-4" />;
      case 'person': return <Users className="w-4 h-4" />;
      case 'id': return <FileSpreadsheet className="w-4 h-4" />;
      default: return <Type className="w-4 h-4" />;
    }
  }

  function getFieldColor(type: string) {
    switch (type) {
      case 'money': return 'bg-green-100 text-green-800 border-green-300';
      case 'number': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'date': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'person': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'id': return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Analizando FORMATO P&P...</p>
        </div>
      </div>
    );
  }

  if (!structure) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">Error al cargar la estructura</p>
      </div>
    );
  }

  const formatopp = structure.structure.formatopp;
  
  // Agrupar por secciones
  const sections: Record<string, any> = {};
  let currentSection = 'Sin Sección';
  
  formatopp.forEach((el: any) => {
    if (el.type === 'section') {
      currentSection = el.label;
      sections[currentSection] = {
        fields: [],
        subsections: {}
      };
    } else if (el.type === 'field') {
      if (!sections[currentSection]) {
        sections[currentSection] = {
          fields: [],
          subsections: {}
        };
      }
      sections[currentSection].fields.push(el);
    }
  });

  // Estadísticas por tipo de campo
  const fieldTypes: Record<string, number> = {};
  formatopp.forEach((el: any) => {
    if (el.type === 'field') {
      const type = detectFieldType(el.label, el.value);
      fieldTypes[type] = (fieldTypes[type] || 0) + 1;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-blue-600">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-4 rounded-lg">
              <FileSpreadsheet className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Análisis Visual: FORMATO P&P</h1>
              <p className="text-gray-600 mt-1">Estructura completa detectada automáticamente desde Google Sheets</p>
            </div>
          </div>
        </div>

        {/* Estadísticas Generales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="text-3xl font-bold text-blue-600">{structure.formatoPPSummary.total}</div>
            <div className="text-sm text-gray-600 mt-1">Total Elementos</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div className="text-3xl font-bold text-purple-600">{structure.formatoPPSummary.sections}</div>
            <div className="text-sm text-gray-600 mt-1">Secciones</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="text-3xl font-bold text-green-600">{structure.formatoPPSummary.fields}</div>
            <div className="text-sm text-gray-600 mt-1">Campos</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <div className="text-3xl font-bold text-red-600">{structure.formatoPPSummary.requiredFields}</div>
            <div className="text-sm text-gray-600 mt-1">Obligatorios</div>
          </div>
        </div>

        {/* Tipos de Campos Detectados */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🎯 Tipos de Campos Detectados</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(fieldTypes).map(([type, count]) => (
              <div key={type} className={`p-3 rounded-lg border-2 ${getFieldColor(type)}`}>
                <div className="flex items-center gap-2">
                  {getFieldIcon(type)}
                  <span className="font-semibold capitalize">{type}</span>
                </div>
                <div className="text-2xl font-bold mt-1">{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Estructura por Secciones */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">📋 Estructura Completa por Secciones</h2>
          
          {Object.entries(sections).map(([sectionName, sectionData]) => {
            const totalFields = sectionData.fields.length +
              Object.values(sectionData.subsections).reduce((sum: number, fields: any) => sum + fields.length, 0);
            const hasSubsections = Object.keys(sectionData.subsections).length > 0;
            
            return (
              <div key={sectionName} className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Título de Sección */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    📌 {sectionName}
                    <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                      {totalFields} campos
                    </span>
                    {hasSubsections && (
                      <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                        {Object.keys(sectionData.subsections).length} subsecciones
                      </span>
                    )}
                  </h3>
                </div>

                <div className="p-6 space-y-6">
                  {/* Campos directos de la sección (sin subsección) */}
                  {sectionData.fields.length > 0 && (
                    <div className="space-y-3">
                      {sectionData.fields.map((field: any, idx: number) => {
                        const fieldType = detectFieldType(field.label, field.value);
                        const colorClass = getFieldColor(fieldType);
                        
                        return (
                          <div
                            key={idx}
                            className={`p-4 rounded-lg border-2 ${
                              field.required
                                ? 'bg-red-50 border-red-300'
                                : 'bg-gray-50 border-gray-200'
                            } hover:shadow-md transition-shadow`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="bg-gray-200 text-gray-700 px-3 py-1 rounded font-mono text-sm min-w-[60px] text-center">
                                #{field.row}
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {field.required && (
                                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded font-bold">
                                      OBLIGATORIO
                                    </span>
                                  )}
                                  <span className={`px-2 py-1 rounded text-xs font-semibold border ${colorClass} flex items-center gap-1`}>
                                    {getFieldIcon(fieldType)}
                                    {fieldType.toUpperCase()}
                                  </span>
                                </div>
                                
                                <div className="font-semibold text-gray-900 text-lg">
                                  {field.label}
                                </div>

                                {field.value && (
                                  <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                                    <div className="text-sm text-gray-500 mb-1">Valor actual:</div>
                                    <div className={`font-medium ${
                                      fieldType === 'money' ? 'text-green-700 text-xl' :
                                      fieldType === 'number' ? 'text-blue-700' :
                                      fieldType === 'person' ? 'text-orange-700' :
                                      'text-gray-700'
                                    }`}>
                                      {field.value}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {field.value && (
                                <div className="text-green-500">
                                  <CheckCircle2 className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Subsecciones */}
                  {Object.entries(sectionData.subsections).map(([subsectionName, subsectionFields]) => (
                    <div key={subsectionName} className="border-l-4 border-blue-400 pl-6">
                      {/* Título de Subsección */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <h4 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                          📎 {subsectionName}
                          <span className="text-sm bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                            {(subsectionFields as any[]).length} campos
                          </span>
                        </h4>
                      </div>

                      {/* Campos de la Subsección */}
                      <div className="space-y-3">
                        {(subsectionFields as any[]).map((field: any, idx: number) => {
                          const fieldType = detectFieldType(field.label, field.value);
                          const colorClass = getFieldColor(fieldType);
                          
                          return (
                            <div
                              key={idx}
                              className={`p-4 rounded-lg border-2 ${
                                field.required
                                  ? 'bg-red-50 border-red-300'
                                  : 'bg-gray-50 border-gray-200'
                              } hover:shadow-md transition-shadow`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="bg-gray-200 text-gray-700 px-3 py-1 rounded font-mono text-sm min-w-[60px] text-center">
                                  #{field.row}
                                </div>

                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    {field.required && (
                                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded font-bold">
                                        OBLIGATORIO
                                      </span>
                                    )}
                                    <span className={`px-2 py-1 rounded text-xs font-semibold border ${colorClass} flex items-center gap-1`}>
                                      {getFieldIcon(fieldType)}
                                      {fieldType.toUpperCase()}
                                    </span>
                                  </div>
                                  
                                  <div className="font-semibold text-gray-900 text-lg">
                                    {field.label}
                                  </div>

                                  {field.value && (
                                    <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                                      <div className="text-sm text-gray-500 mb-1">Valor actual:</div>
                                      <div className={`font-medium ${
                                        fieldType === 'money' ? 'text-green-700 text-xl' :
                                        fieldType === 'number' ? 'text-blue-700' :
                                        fieldType === 'person' ? 'text-orange-700' :
                                        'text-gray-700'
                                      }`}>
                                        {field.value}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {field.value && (
                                  <div className="text-green-500">
                                    <CheckCircle2 className="w-6 h-6" />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">🔑 Leyenda de Tipos de Campos</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span><strong>Money:</strong> Valores monetarios ($)</span>
            </div>
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-blue-600" />
              <span><strong>Number:</strong> Números, plazos, cantidades</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span><strong>Date:</strong> Fechas</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-600" />
              <span><strong>Person:</strong> Nombres de personas</span>
            </div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-cyan-600" />
              <span><strong>ID:</strong> Cédulas, documentos</span>
            </div>
            <div className="flex items-center gap-2">
              <Type className="w-5 h-5 text-gray-600" />
              <span><strong>Text:</strong> Texto general</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}