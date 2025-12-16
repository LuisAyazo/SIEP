'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Eye, Save, FileDown, CheckCircle2 } from 'lucide-react';

interface FormData {
  [key: string]: any;
}

interface Section {
  name: string;
  fields: any[];
}

export default function CrearFichaPage() {
  const [structure, setStructure] = useState<any>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<FormData>({});
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStructure();
  }, []);

  async function loadStructure() {
    try {
      const response = await fetch('/api/validate-excel');
      const data = await response.json();
      
      // Agrupar campos por sección
      const grouped = groupFieldsBySection(data.structure.formatopp);
      setSections(grouped);
      setStructure(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  function groupFieldsBySection(elements: any[]): Section[] {
    const sections: Section[] = [];
    let currentSection: Section = { name: '', fields: [] };

    elements.forEach((el: any) => {
      if (el.type === 'section') {
        // Guardar sección anterior si tiene campos
        if (currentSection.name && currentSection.fields.length > 0) {
          sections.push(currentSection);
        }
        // Crear nueva sección
        currentSection = {
          name: el.label,
          fields: []
        };
      } else if (el.type === 'field') {
        // Agregar campo a la sección actual
        currentSection.fields.push(el);
      }
    });

    // Agregar última sección si tiene campos
    if (currentSection.name && currentSection.fields.length > 0) {
      sections.push(currentSection);
    }

    return sections;
  }

  function detectFieldType(label: string, value: string) {
    const lowerLabel = label.toLowerCase();
    
    if (lowerLabel.includes('fecha') || lowerLabel.includes('date')) return 'date';
    if (lowerLabel.includes('valor') || lowerLabel.includes('precio') || lowerLabel.includes('costo') || 
        lowerLabel.includes('presupuesto') || lowerLabel.includes('gasto') || lowerLabel.includes('ingreso') ||
        value?.includes('$')) return 'money';
    if (lowerLabel.includes('plazo') || lowerLabel.includes('meses') || lowerLabel.includes('días') ||
        lowerLabel.includes('cantidad') || lowerLabel.includes('número') || lowerLabel.includes('numero')) return 'number';
    if (lowerLabel.includes('email') || lowerLabel.includes('correo')) return 'email';
    if (lowerLabel.includes('teléfono') || lowerLabel.includes('telefono') || lowerLabel.includes('celular')) return 'tel';
    if (lowerLabel.length > 100 || lowerLabel.includes('descripción') || lowerLabel.includes('descripcion') ||
        lowerLabel.includes('justificación') || lowerLabel.includes('justificacion') ||
        lowerLabel.includes('objetivo')) return 'textarea';
    
    return 'text';
  }

  function handleFieldChange(fieldLabel: string, value: any) {
    setFormData(prev => ({
      ...prev,
      [fieldLabel]: value
    }));
  }

  function nextSection() {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  }

  function prevSection() {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  }

  function goToSection(index: number) {
    setCurrentSection(index);
    setShowPreview(false);
  }

  function getCompletedFields(section: Section): number {
    return section.fields.filter(field => formData[field.label]).length;
  }

  function getTotalCompletedFields(): number {
    return Object.keys(formData).filter(key => formData[key]).length;
  }

  function getTotalFields(): number {
    return sections.reduce((acc, section) => acc + section.fields.length, 0);
  }

  async function handleSave() {
    // TODO: Guardar en Supabase
    console.log('Guardando...', formData);
    alert('Formulario guardado (pendiente implementar guardado en BD)');
  }

  async function handleGenerateExcel() {
    // TODO: Generar Excel
    console.log('Generando Excel...', formData);
    alert('Generación de Excel pendiente de implementar');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  const currentSectionData = sections[currentSection];
  const progress = (getTotalCompletedFields() / getTotalFields()) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Crear Ficha Técnica</h1>
              <p className="text-sm text-gray-600 mt-1">
                Sección {currentSection + 1} de {sections.length}: {currentSectionData?.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Editar' : 'Preview'}
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progreso: {getTotalCompletedFields()} de {getTotalFields()} campos</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Navegación de Secciones */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow-lg p-4 sticky top-32">
              <h3 className="font-semibold text-gray-900 mb-3">Secciones</h3>
              <div className="space-y-2">
                {sections.map((section, index) => {
                  const completed = getCompletedFields(section);
                  const total = section.fields.length;
                  const isComplete = completed === total;
                  const isCurrent = index === currentSection;

                  return (
                    <button
                      key={index}
                      onClick={() => goToSection(index)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        isCurrent
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : isComplete
                          ? 'bg-green-50 border border-green-300'
                          : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${
                          isCurrent ? 'text-blue-900' : isComplete ? 'text-green-900' : 'text-gray-700'
                        }`}>
                          {index + 1}. {section.name.substring(0, 25)}
                          {section.name.length > 25 ? '...' : ''}
                        </span>
                        {isComplete && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {completed}/{total} campos
                      </div>
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full ${isComplete ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${(completed / total) * 100}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            {showPreview ? (
              /* Preview Mode */
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Preview del Formulario</h2>
                  <button
                    onClick={handleGenerateExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <FileDown className="w-4 h-4" />
                    Generar Excel
                  </button>
                </div>

                {sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="mb-8">
                    <h3 className="text-xl font-bold text-purple-900 mb-4 pb-2 border-b-2 border-purple-200">
                      {section.name}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {section.fields.map((field, fieldIndex) => (
                        <div key={fieldIndex} className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm font-semibold text-gray-700 mb-1">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </div>
                          <div className="text-gray-900">
                            {formData[field.label] || <span className="text-gray-400 italic">Sin completar</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Edit Mode */
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{currentSectionData?.name}</h2>

                <div className="space-y-6">
                  {currentSectionData?.fields.map((field: any, index: number) => {
                    const fieldType = detectFieldType(field.label, field.value);
                    
                    return (
                      <div key={index}>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        
                        {fieldType === 'textarea' ? (
                          <textarea
                            value={formData[field.label] || ''}
                            onChange={(e) => handleFieldChange(field.label, e.target.value)}
                            placeholder={field.value || `Ingrese ${field.label.toLowerCase()}`}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={4}
                          />
                        ) : (
                          <input
                            type={fieldType}
                            value={formData[field.label] || ''}
                            onChange={(e) => handleFieldChange(field.label, e.target.value)}
                            placeholder={field.value || `Ingrese ${field.label.toLowerCase()}`}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        )}
                        
                        {field.value && (
                          <p className="mt-1 text-xs text-gray-500">
                            Ejemplo: {field.value.substring(0, 100)}
                            {field.value.length > 100 ? '...' : ''}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t">
                  <button
                    onClick={prevSection}
                    disabled={currentSection === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </button>

                  <div className="text-sm text-gray-600">
                    {getCompletedFields(currentSectionData)} de {currentSectionData.fields.length} campos completados
                  </div>

                  <button
                    onClick={nextSection}
                    disabled={currentSection === sections.length - 1}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}