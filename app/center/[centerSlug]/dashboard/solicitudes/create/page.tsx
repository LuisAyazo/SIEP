'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

interface Field {
  row: number;
  label: string;
  value: string;
  type: string;
}

interface Subsection {
  name: string;
  startRow: number;
  fields: Field[];
  hasTable: boolean;
  tableHeaders: string[];
  tableRows: Array<{ row: number; data: string[] }>;
}

interface SectionsData {
  'INFORMACIÓN TÉCNICA': Record<string, Subsection>;
  'INFORMACIÓN PRESUPUESTAL': Record<string, Subsection>;
}

interface SectionNames {
  'INFORMACIÓN TÉCNICA': string[];
  'INFORMACIÓN PRESUPUESTAL': string[];
}

export default function CreateSolicitudPage() {
  const router = useRouter();
  const params = useParams();
  const centerSlug = params.centerSlug as string;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingSections, setLoadingSections] = useState(true);
  const [sectionsData, setSectionsData] = useState<SectionsData>({
    'INFORMACIÓN TÉCNICA': {},
    'INFORMACIÓN PRESUPUESTAL': {}
  });
  const [sectionNames, setSectionNames] = useState<SectionNames>({
    'INFORMACIÓN TÉCNICA': [],
    'INFORMACIÓN PRESUPUESTAL': []
  });
  const [currentSection, setCurrentSection] = useState<'INFORMACIÓN TÉCNICA' | 'INFORMACIÓN PRESUPUESTAL'>('INFORMACIÓN TÉCNICA');
  const [currentSubsection, setCurrentSubsection] = useState(0);

  // Datos del formulario
  const [formData, setFormData] = useState({
    // Paso 1: Info de solicitud
    titulo: '',
    descripcion: '',
    prioridad: 'media' as 'baja' | 'media' | 'alta',
    
    // Datos de las secciones
    sections: {
      'INFORMACIÓN TÉCNICA': {} as Record<string, Record<string, any>>,
      'INFORMACIÓN PRESUPUESTAL': {} as Record<string, Record<string, any>>
    }
  });

  // Cargar estructura de secciones
  useEffect(() => {
    async function loadSections() {
      try {
        setLoadingSections(true);
        const response = await fetch('/api/analyze-all-sections');
        const data = await response.json();
        
        if (data.success) {
          setSectionsData(data.sections);
          setSectionNames(data.sectionNames);
          
          // Inicializar datos vacíos para cada sección y subsección
          const initialData = {
            'INFORMACIÓN TÉCNICA': {} as Record<string, Record<string, any>>,
            'INFORMACIÓN PRESUPUESTAL': {} as Record<string, Record<string, any>>
          };
          
          // Inicializar INFORMACIÓN TÉCNICA
          Object.keys(data.sections['INFORMACIÓN TÉCNICA']).forEach(key => {
            initialData['INFORMACIÓN TÉCNICA'][key] = {};
            const subsection = data.sections['INFORMACIÓN TÉCNICA'][key];
            
            subsection.fields.forEach((field: Field) => {
              initialData['INFORMACIÓN TÉCNICA'][key][field.label] = '';
            });
            
            if (subsection.hasTable) {
              // CRONOGRAMA usa estructura de fases
              if (key === 'CRONOGRAMA') {
                initialData['INFORMACIÓN TÉCNICA'][key]['_phases'] = [];
              } else {
                initialData['INFORMACIÓN TÉCNICA'][key]['_table'] = [];
              }
            }
          });
          
          // Inicializar INFORMACIÓN PRESUPUESTAL
          Object.keys(data.sections['INFORMACIÓN PRESUPUESTAL']).forEach(key => {
            initialData['INFORMACIÓN PRESUPUESTAL'][key] = {};
            const subsection = data.sections['INFORMACIÓN PRESUPUESTAL'][key];
            
            subsection.fields.forEach((field: Field) => {
              initialData['INFORMACIÓN PRESUPUESTAL'][key][field.label] = '';
            });
            
            if (subsection.hasTable) {
              initialData['INFORMACIÓN PRESUPUESTAL'][key]['_table'] = [];
            }
          });
          
          setFormData(prev => ({
            ...prev,
            sections: initialData
          }));
        }
      } catch (error) {
        console.error('Error loading sections:', error);
      } finally {
        setLoadingSections(false);
      }
    }
    
    loadSections();
  }, []);

  const handleInputChange = (section: 'INFORMACIÓN TÉCNICA' | 'INFORMACIÓN PRESUPUESTAL', subsectionKey: string, fieldLabel: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: {
          ...prev.sections[section],
          [subsectionKey]: {
            ...prev.sections[section][subsectionKey],
            [fieldLabel]: value
          }
        }
      }
    }));
  };

  const handleTableChange = (section: 'INFORMACIÓN TÉCNICA' | 'INFORMACIÓN PRESUPUESTAL', subsectionKey: string, rowIndex: number, colIndex: number, value: string) => {
    setFormData(prev => {
      const currentTable = prev.sections[section][subsectionKey]._table || [];
      const newTable = [...currentTable];
      
      if (!newTable[rowIndex]) {
        newTable[rowIndex] = [];
      }
      
      newTable[rowIndex][colIndex] = value;
      
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [section]: {
            ...prev.sections[section],
            [subsectionKey]: {
              ...prev.sections[section][subsectionKey],
              _table: newTable
            }
          }
        }
      };
    });
  };

  const addTableRow = (section: 'INFORMACIÓN TÉCNICA' | 'INFORMACIÓN PRESUPUESTAL', subsectionKey: string) => {
    setFormData(prev => {
      const currentTable = prev.sections[section][subsectionKey]._table || [];
      const subsection = sectionsData[section][subsectionKey];
      const newRow = new Array(subsection.tableHeaders.length).fill('');
      
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [section]: {
            ...prev.sections[section],
            [subsectionKey]: {
              ...prev.sections[section][subsectionKey],
              _table: [...currentTable, newRow]
            }
          }
        }
      };
    });
  };

  const removeTableRow = (section: 'INFORMACIÓN TÉCNICA' | 'INFORMACIÓN PRESUPUESTAL', subsectionKey: string, rowIndex: number) => {
    setFormData(prev => {
      const currentTable = prev.sections[section][subsectionKey]._table || [];
      const newTable = currentTable.filter((_row: any, i: number) => i !== rowIndex);
      
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [section]: {
            ...prev.sections[section],
            [subsectionKey]: {
              ...prev.sections[section][subsectionKey],
              _table: newTable
            }
          }
        }
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Datos a guardar:', formData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push(`/center/${centerSlug}/dashboard/solicitudes`);
    } catch (error) {
      console.error('Error al crear solicitud:', error);
      alert('Error al crear la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (section: 'INFORMACIÓN TÉCNICA' | 'INFORMACIÓN PRESUPUESTAL', subsectionKey: string, field: Field) => {
    const value = formData.sections[section][subsectionKey]?.[field.label] || '';
    const baseClasses = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent";
    
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(section, subsectionKey, field.label, e.target.value)}
            className={`${baseClasses} min-h-[100px]`}
            placeholder={`Ingrese ${field.label.toLowerCase()}`}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleInputChange(section, subsectionKey, field.label, e.target.value)}
            className={baseClasses}
          />
        );
      case 'money':
        return (
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              value={value}
              onChange={(e) => handleInputChange(section, subsectionKey, field.label, e.target.value)}
              className={`${baseClasses} pl-8`}
              placeholder="0.00"
            />
          </div>
        );
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(section, subsectionKey, field.label, e.target.value)}
            className={baseClasses}
            placeholder="0"
          />
        );
      case 'email':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => handleInputChange(section, subsectionKey, field.label, e.target.value)}
            className={baseClasses}
            placeholder="correo@ejemplo.com"
          />
        );
      case 'tel':
        return (
          <input
            type="tel"
            value={value}
            onChange={(e) => handleInputChange(section, subsectionKey, field.label, e.target.value)}
            className={baseClasses}
            placeholder="(123) 456-7890"
          />
        );
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(section, subsectionKey, field.label, e.target.value)}
            className={baseClasses}
            placeholder={`Ingrese ${field.label.toLowerCase()}`}
          />
        );
    }
  };

  // Función para formatear fecha a español
  const formatDateToSpanish = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} de ${month} ${year}`;
  };

  // Función para agregar descripción a una fase en CRONOGRAMA
  const addDescriptionToPhase = (section: 'INFORMACIÓN TÉCNICA' | 'INFORMACIÓN PRESUPUESTAL', subsectionKey: string, phaseIndex: number) => {
    setFormData(prev => {
      const currentPhases = prev.sections[section][subsectionKey]._phases || [];
      const newPhases = currentPhases.map((phase: any, idx: number) => {
        if (idx === phaseIndex) {
          return {
            ...phase,
            descriptions: [...phase.descriptions, '']
          };
        }
        return phase;
      });
      
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [section]: {
            ...prev.sections[section],
            [subsectionKey]: {
              ...prev.sections[section][subsectionKey],
              _phases: newPhases
            }
          }
        }
      };
    });
  };

  // Función para actualizar descripción en CRONOGRAMA
  const updatePhaseDescription = (section: 'INFORMACIÓN TÉCNICA' | 'INFORMACIÓN PRESUPUESTAL', subsectionKey: string, phaseIndex: number, descIndex: number, value: string) => {
    setFormData(prev => {
      const currentPhases = prev.sections[section][subsectionKey]._phases || [];
      const newPhases = [...currentPhases];
      newPhases[phaseIndex].descriptions[descIndex] = value;
      
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [section]: {
            ...prev.sections[section],
            [subsectionKey]: {
              ...prev.sections[section][subsectionKey],
              _phases: newPhases
            }
          }
        }
      };
    });
  };

  // Función para eliminar descripción
  const removePhaseDescription = (section: 'INFORMACIÓN TÉCNICA' | 'INFORMACIÓN PRESUPUESTAL', subsectionKey: string, phaseIndex: number, descIndex: number) => {
    setFormData(prev => {
      const currentPhases = prev.sections[section][subsectionKey]._phases || [];
      const newPhases = [...currentPhases];
      newPhases[phaseIndex].descriptions = newPhases[phaseIndex].descriptions.filter((_: any, i: number) => i !== descIndex);
      
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [section]: {
            ...prev.sections[section],
            [subsectionKey]: {
              ...prev.sections[section][subsectionKey],
              _phases: newPhases
            }
          }
        }
      };
    });
  };

  // Función para agregar nueva fase en CRONOGRAMA
  const addPhase = (section: 'INFORMACIÓN TÉCNICA' | 'INFORMACIÓN PRESUPUESTAL', subsectionKey: string) => {
    setFormData(prev => {
      const currentPhases = prev.sections[section][subsectionKey]._phases || [];
      
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [section]: {
            ...prev.sections[section],
            [subsectionKey]: {
              ...prev.sections[section][subsectionKey],
              _phases: [...currentPhases, { name: '', descriptions: [], startDate: '', endDate: '' }]
            }
          }
        }
      };
    });
  };

  // Función para eliminar fase
  const removePhase = (section: 'INFORMACIÓN TÉCNICA' | 'INFORMACIÓN PRESUPUESTAL', subsectionKey: string, phaseIndex: number) => {
    setFormData(prev => {
      const currentPhases = prev.sections[section][subsectionKey]._phases || [];
      const newPhases = currentPhases.filter((_: any, i: number) => i !== phaseIndex);
      
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [section]: {
            ...prev.sections[section],
            [subsectionKey]: {
              ...prev.sections[section][subsectionKey],
              _phases: newPhases
            }
          }
        }
      };
    });
  };

  // Función para actualizar campo de fase
  const updatePhaseField = (section: 'INFORMACIÓN TÉCNICA' | 'INFORMACIÓN PRESUPUESTAL', subsectionKey: string, phaseIndex: number, field: 'name' | 'startDate' | 'endDate', value: string) => {
    setFormData(prev => {
      const currentPhases = prev.sections[section][subsectionKey]._phases || [];
      const newPhases = [...currentPhases];
      newPhases[phaseIndex][field] = value;
      
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [section]: {
            ...prev.sections[section],
            [subsectionKey]: {
              ...prev.sections[section][subsectionKey],
              _phases: newPhases
            }
          }
        }
      };
    });
  };

  const renderSubsectionForm = (section: 'INFORMACIÓN TÉCNICA' | 'INFORMACIÓN PRESUPUESTAL', subsectionKey: string, subsection: Subsection) => {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <h3 className="text-lg font-semibold text-blue-900">{subsection.name}</h3>
          <p className="text-sm text-blue-700 mt-1">Complete todos los campos de esta sección</p>
        </div>

        {/* No mostrar campos simples para CRONOGRAMA ya que usa estructura de fases */}
        {subsection.fields.length > 0 && subsectionKey !== 'CRONOGRAMA' && (
          <div className="space-y-4">
            {subsection.fields.map((field, idx) => (
              <div key={idx}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  {field.value && (
                    <span className="ml-2 text-xs text-gray-500">(Ejemplo: {field.value})</span>
                  )}
                </label>
                {renderField(section, subsectionKey, field)}
              </div>
            ))}
          </div>
        )}

        {/* Renderizado especial para CRONOGRAMA */}
        {subsection.hasTable && subsectionKey === 'CRONOGRAMA' && (
          <div className="mt-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Cómo funciona:</strong> Crea UNA fase (ej: "Diseño") con sus fechas, luego agrega TODAS las descripciones/actividades que necesites para esa fase usando el botón "+ Agregar Descripción"
              </p>
            </div>

            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-semibold text-gray-800">Fases del Cronograma</h4>
              <button
                type="button"
                onClick={() => addPhase(section, subsectionKey)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Nueva Fase
              </button>
            </div>

            <div className="space-y-6">
              {(formData.sections[section][subsectionKey]?._phases || []).map((phase: any, phaseIdx: number) => (
                <div key={phaseIdx} className="border-2 border-blue-300 rounded-lg p-6 bg-gradient-to-r from-blue-50 to-white">
                  {/* Header de la Fase */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <h5 className="text-lg font-bold text-blue-900 mb-2">Fase {phaseIdx + 1}</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de la Fase *</label>
                          <input
                            type="text"
                            value={phase.name || ''}
                            onChange={(e) => updatePhaseField(section, subsectionKey, phaseIdx, 'name', e.target.value)}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ej: Diseño, Ejecución, etc."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Fecha Inicio *
                          </label>
                          <input
                            type="date"
                            value={phase.startDate || ''}
                            onChange={(e) => updatePhaseField(section, subsectionKey, phaseIdx, 'startDate', e.target.value)}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          {phase.startDate && (
                            <p className="text-xs text-blue-600 mt-1 font-medium">{formatDateToSpanish(phase.startDate)}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Fecha Fin *
                          </label>
                          <input
                            type="date"
                            value={phase.endDate || ''}
                            onChange={(e) => updatePhaseField(section, subsectionKey, phaseIdx, 'endDate', e.target.value)}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          {phase.endDate && (
                            <p className="text-xs text-blue-600 mt-1 font-medium">{formatDateToSpanish(phase.endDate)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePhase(section, subsectionKey, phaseIdx)}
                      className="ml-4 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      🗑️ Eliminar Fase
                    </button>
                  </div>

                  {/* Descripciones de la Fase */}
                  <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h6 className="text-sm font-bold text-gray-800">Descripciones/Actividades de esta Fase</h6>
                        <p className="text-xs text-gray-600 mt-1">Agrega todas las actividades que se realizarán en "{phase.name || 'esta fase'}"</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addDescriptionToPhase(section, subsectionKey, phaseIdx)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <span className="text-lg">+</span>
                        <span>Agregar Descripción</span>
                      </button>
                    </div>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {(phase.descriptions || []).map((desc: string, descIdx: number) => (
                        <div key={descIdx} className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg">
                          <span className="text-sm font-semibold text-gray-500 mt-2">{descIdx + 1}.</span>
                          <input
                            type="text"
                            value={desc}
                            onChange={(e) => updatePhaseDescription(section, subsectionKey, phaseIdx, descIdx, e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder={`Descripción ${descIdx + 1}`}
                          />
                          {phase.descriptions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePhaseDescription(section, subsectionKey, phaseIdx, descIdx)}
                              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar descripción"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {phase.descriptions && phase.descriptions.length === 0 && (
                      <p className="text-center text-gray-400 py-4 text-sm">No hay descripciones. Haz clic en "Agregar Descripción"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {(!formData.sections[section][subsectionKey]?._phases || formData.sections[section][subsectionKey]._phases.length === 0) && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500 mb-4">No hay fases creadas</p>
                <button
                  type="button"
                  onClick={() => addPhase(section, subsectionKey)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Crear Primera Fase
                </button>
              </div>
            )}
          </div>
        )}

        {/* Renderizado normal para otras tablas */}
        {subsection.hasTable && subsectionKey !== 'CRONOGRAMA' && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-md font-semibold text-gray-800">Tabla de {subsection.name}</h4>
                {subsectionKey === 'CRONOGRAMA' && (
                  <p className="text-xs text-gray-600 mt-1">
                    💡 Tip: Deja "Fase o hito" vacío para agregar descripciones adicionales a la misma fase
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => addTableRow(section, subsectionKey)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                + Agregar Fila
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    {subsection.tableHeaders.map((header, idx) => (
                      <th key={idx} className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">
                        {header}
                      </th>
                    ))}
                    <th className="px-4 py-2 border-b text-center text-sm font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {(formData.sections[section][subsectionKey]?._table || []).map((row: string[], rowIdx: number) => (
                    <tr key={rowIdx} className="hover:bg-gray-50">
                      {subsection.tableHeaders.map((header, colIdx) => {
                        // Para CRONOGRAMA, determinar el tipo de input según la columna
                        const isCronograma = subsectionKey === 'CRONOGRAMA';
                        const isDateColumn = isCronograma && (header === 'FECHA INICIO' || header === 'FECHA FIN');
                        const inputType = isDateColumn ? 'date' : 'text';
                        
                        return (
                          <td key={colIdx} className="px-4 py-2 border-b">
                            <input
                              type={inputType}
                              value={row[colIdx] || ''}
                              onChange={(e) => handleTableChange(section, subsectionKey, rowIdx, colIdx, e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              placeholder={
                                isCronograma && colIdx === 0
                                  ? '(Opcional si es descripción adicional)'
                                  : ''
                              }
                            />
                          </td>
                        );
                      })}
                      <td className="px-4 py-2 border-b text-center">
                        <button
                          type="button"
                          onClick={() => removeTableRow(section, subsectionKey, rowIdx)}
                          className="text-red-600 hover:text-red-800"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(!formData.sections[section][subsectionKey]?._table || formData.sections[section][subsectionKey]._table.length === 0) && (
              <p className="text-center text-gray-500 py-8">No hay filas. Haga clic en "Agregar Fila" para comenzar.</p>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loadingSections) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando estructura del formulario...</p>
        </div>
      </div>
    );
  }

  const currentSubsectionName = sectionNames[currentSection][currentSubsection];
  const currentSubsectionData = sectionsData[currentSection][currentSubsectionName];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Nueva Solicitud de Ficha Técnica</h1>
          <p className="text-gray-600 mt-2">Complete el formulario para crear una nueva solicitud</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex-1 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>1</div>
                <span className="ml-2 font-medium">Información</span>
              </div>
            </div>
            <div className={`flex-1 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>2</div>
                <span className="ml-2 font-medium">Ficha Técnica</span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Título de la Solicitud *</label>
                <input
                  type="text"
                  required
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Solicitud de Ficha Técnica para Proyecto X"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  placeholder="Descripción breve de la solicitud"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prioridad</label>
                <select
                  value={formData.prioridad}
                  onChange={(e) => setFormData({ ...formData, prioridad: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex gap-6">
              {/* Contenido principal */}
              <div className="flex-1 space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  {currentSubsectionData ? (
                    renderSubsectionForm(currentSection, currentSubsectionName, currentSubsectionData)
                  ) : (
                    <div className="text-center py-8 text-gray-500">Subsección no encontrada</div>
                  )}
                </div>

                <div className="flex justify-between">
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      ← Atrás
                    </button>
                    
                    {currentSubsection > 0 && (
                      <button
                        type="button"
                        onClick={() => setCurrentSubsection(currentSubsection - 1)}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        ← Anterior
                      </button>
                    )}
                  </div>

                  <div className="space-x-2">
                    {currentSubsection < sectionNames[currentSection].length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentSubsection(currentSubsection + 1)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Siguiente →
                      </button>
                    ) : currentSection === 'INFORMACIÓN TÉCNICA' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentSection('INFORMACIÓN PRESUPUESTAL');
                          setCurrentSubsection(0);
                        }}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Ir a Información Presupuestal →
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Guardando...' : '✓ Crear Solicitud'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Menú lateral derecho */}
              <div className="w-80 space-y-4">
                {/* INFORMACIÓN TÉCNICA */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">INFORMACIÓN TÉCNICA</h3>
                  <div className="space-y-1">
                    {sectionNames['INFORMACIÓN TÉCNICA'].map((name, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCurrentSection('INFORMACIÓN TÉCNICA');
                          setCurrentSubsection(idx);
                        }}
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                          currentSection === 'INFORMACIÓN TÉCNICA' && currentSubsection === idx
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {idx + 1}. {name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* INFORMACIÓN PRESUPUESTAL */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">INFORMACIÓN PRESUPUESTAL</h3>
                  <div className="space-y-1">
                    {sectionNames['INFORMACIÓN PRESUPUESTAL'].map((name, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCurrentSection('INFORMACIÓN PRESUPUESTAL');
                          setCurrentSubsection(idx);
                        }}
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                          currentSection === 'INFORMACIÓN PRESUPUESTAL' && currentSubsection === idx
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {idx + 1}. {name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}