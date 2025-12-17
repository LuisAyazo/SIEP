'use client';

interface ExcelDataViewerProps {
  data: {
    fichatecnica: Record<string, any>;
    formatopp: Record<string, any>;
  };
  structure: {
    fichatecnica: any[];
    formatopp: any[];
  };
}

export default function ExcelDataViewer({ data, structure }: ExcelDataViewerProps) {
  // Agrupar campos por sección y subsección
  const groupBySection = (elements: any[], dataObj: Record<string, any>) => {
    const sections: Record<string, Record<string, any[]>> = {};
    
    elements.forEach(el => {
      if (el.type === 'field' && el.section && el.label) {
        const sectionName = el.section;
        const subsectionName = el.subsection || 'General';
        
        if (!sections[sectionName]) {
          sections[sectionName] = {};
        }
        if (!sections[sectionName][subsectionName]) {
          sections[sectionName][subsectionName] = [];
        }
        
        const value = dataObj[el.label] || '';
        if (value) {
          sections[sectionName][subsectionName].push({
            label: el.label,
            value: value,
            required: el.required
          });
        }
      }
    });
    
    return sections;
  };

  const fichaTecnicaSections = groupBySection(structure.fichatecnica, data.fichatecnica);
  const formatoPPSections = groupBySection(structure.formatopp, data.formatopp);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-2">📄 Vista Previa de Ficha Técnica</h2>
        <p className="text-blue-100 text-sm">Datos extraídos del archivo Excel importado</p>
      </div>

      {/* FICHA TÉCNICA */}
      {Object.keys(fichaTecnicaSections).length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-bold text-gray-900">📋 FICHA TÉCNICA</h3>
          </div>
          
          <div className="p-6 space-y-6">
            {Object.entries(fichaTecnicaSections).map(([sectionName, subsections]) => (
              <div key={sectionName} className="space-y-4">
                {/* Nombre de la sección principal */}
                <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50">
                  <h4 className="font-bold text-blue-900 text-base uppercase">{sectionName}</h4>
                </div>

                {/* Subsecciones */}
                {Object.entries(subsections).map(([subsectionName, fields]) => (
                  <div key={subsectionName} className="ml-4 space-y-3">
                    {subsectionName !== 'General' && (
                      <h5 className="font-semibold text-gray-800 text-sm border-b border-gray-300 pb-1">
                        {subsectionName}
                      </h5>
                    )}
                    
                    {/* Campos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {fields.map((field: any, idx: number) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded border border-gray-200">
                          <dt className="text-xs font-medium text-gray-600 mb-1">
                            {field.label}
                            {field.required && <span className="text-red-600 ml-1">*</span>}
                          </dt>
                          <dd className="text-sm text-gray-900 font-medium break-words">
                            {field.value || <span className="text-gray-400 italic">No especificado</span>}
                          </dd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FORMATO P&P */}
      {Object.keys(formatoPPSections).length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-bold text-gray-900">💰 FORMATO P&P</h3>
          </div>
          
          <div className="p-6 space-y-6">
            {Object.entries(formatoPPSections).map(([sectionName, subsections]) => (
              <div key={sectionName} className="space-y-4">
                {/* Nombre de la sección principal */}
                <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-50">
                  <h4 className="font-bold text-green-900 text-base uppercase">{sectionName}</h4>
                </div>

                {/* Subsecciones */}
                {Object.entries(subsections).map(([subsectionName, fields]) => (
                  <div key={subsectionName} className="ml-4 space-y-3">
                    {subsectionName !== 'General' && (
                      <h5 className="font-semibold text-gray-800 text-sm border-b border-gray-300 pb-1">
                        {subsectionName}
                      </h5>
                    )}
                    
                    {/* Campos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {fields.map((field: any, idx: number) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded border border-gray-200">
                          <dt className="text-xs font-medium text-gray-600 mb-1">
                            {field.label}
                            {field.required && <span className="text-red-600 ml-1">*</span>}
                          </dt>
                          <dd className="text-sm text-gray-900 font-medium break-words">
                            {field.value || <span className="text-gray-400 italic">No especificado</span>}
                          </dd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-4">📊 Resumen de Datos Extraídos</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Object.keys(data.fichatecnica).length}
            </div>
            <div className="text-xs text-gray-600 mt-1">Campos Ficha Técnica</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-green-600">
              {Object.keys(data.formatopp).length}
            </div>
            <div className="text-xs text-gray-600 mt-1">Campos Formato P&P</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Object.keys(fichaTecnicaSections).length}
            </div>
            <div className="text-xs text-gray-600 mt-1">Secciones Principales</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-orange-600">
              {structure.fichatecnica.filter(el => el.type === 'field' && el.required).length}
            </div>
            <div className="text-xs text-gray-600 mt-1">Campos Obligatorios</div>
          </div>
        </div>
      </div>
    </div>
  );
}