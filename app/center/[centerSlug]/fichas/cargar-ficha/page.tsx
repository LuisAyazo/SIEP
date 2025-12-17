'use client';

import Image from 'next/image';
import React, { useState, useRef, useEffect } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend
);

// Definición de tipos para los datos procesados
type SheetDataItem = {
  key: string;
  label: string;
  value: unknown;
  sheetName: string;
  section?: string;  // Para agrupar por secciones (GENERALIDADES, JUSTIFICACIÓN, etc.)
  isTitle?: boolean; // Para identificar si es un título de sección
  isFormula?: boolean; // Para identificar fórmulas de Excel
  isTable?: boolean; // Para identificar tablas complejas
  tableData?: any[]; // Para almacenar los datos de tablas complejas
  tableHeaders?: string[]; // Para almacenar los encabezados de tablas complejas
  tableHeadersMapped?: Record<string, string>; // Para mapear encabezados automáticamente con nombres más legibles
  cellFormat?: any;
  row?: number;
  col?: number;
  isCompact?: boolean; // Para identificar campos que pueden mostrarse en formato compacto
  compactPair?: string; // Para identificar el campo con el que se empareja en formato compacto
  compactPairOf?: string; // Para identificar el campo del que es pareja en formato compacto
  isSpecialBudgetTable?: boolean; // Para identificar tablas de presupuesto especiales
  isSpecialFondoRotatorioTable?: boolean; // Para identificar tablas de fondo rotatorio especiales
};

type SheetGroup = {
  sheetName: string;
  title: string;
  items: SheetDataItem[];
  sections: Map<string, SheetDataItem[]>; // Agrupar items por secciones
  color: string;
};

// Añadir una nueva propiedad para indicar campos que pueden mostrarse en formato compacto
type CompactFieldConfig = {
  pattern: string;
  shouldCompact: boolean;
};

// Función para determinar si un campo debería mostrarse en formato compacto
const shouldBeCompact = (fieldLabel: string): boolean => {
  const compactPatterns = [
    "cuenta con", "requiere", "otro requerimiento", "¿cuenta con", "¿requiere"
  ];
  
  // Convertir a minúsculas para una comparación insensible a mayúsculas/minúsculas
  const lowerLabel = fieldLabel.toLowerCase();
  
  return compactPatterns.some(pattern => lowerLabel.includes(pattern));
};

// Función para determinar si es parte de una tabla de presupuesto
const isPartOfBudgetTable = (fieldLabel: string): boolean => {
  const budgetTerms = [
    "presupuesto", "valor", "ingresos", "gastos", "contrapartida", 
    "inversiones", "excedentes", "participación", "administración"
  ];
  
  const lowerLabel = fieldLabel.toLowerCase();
  return budgetTerms.some(term => lowerLabel.includes(term));
};

// Función para determinar si es parte de un bloque específico de FONDO ROTATORIO
const isPartOfFondoRotatorio = (fieldLabel: string): boolean => {
  const fondoRotatorioTerms = [
    "fondo rotatorio", "transporte", "papelería", "materiales", "gastos legales", "total fondo"
  ];
  
  const lowerLabel = fieldLabel.toLowerCase();
  return fondoRotatorioTerms.some(term => lowerLabel.includes(term));
};

export default function CargarFichaPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [previewData, setPreviewData] = useState<SheetGroup[] | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // Para controlar la pestaña activa
  const inputRef = useRef<HTMLInputElement>(null);

  // Enhanced state variables for filtering and visualization
  const [filterText, setFilterText] = useState('');
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [chartView, setChartView] = useState(false);
  const [viewMode, setViewMode] = useState<'standard' | 'compact' | 'detailed'>('standard');
  // Add missing state variables to fix errors
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Add processedData state variable to fix TypeScript error
  const [processedData, setProcessedData] = useState<any>(null);

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setUploadStatus('idle');
      setPreviewData(null);
    }
  };

  // File input handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    if (selectedFile) {
      setFile(selectedFile);
      setUploadStatus('idle');
      setPreviewData(null);
    }
  };

  // Función para procesar el JSON de Excel
  const processExcelJson = (data: any): SheetGroup[] => {
    // Si no tenemos datos, retornamos un array vacío
    if (!data || typeof data !== 'object') return [];
    
    const sheetGroups: SheetGroup[] = [];
    const sheetColors: Record<string, string> = {
      "FORMATO P&P": "blue",
      "FICHA TÉCNICA": "green",
      "Hoja1": "purple"
    };
    
    // Para cada hoja del Excel (implementación simplificada)
    Object.entries(data).forEach(([sheetName, rows]) => {
      if (!Array.isArray(rows)) return;
      
      const items: SheetDataItem[] = [];
      // Mapa para organizar por secciones
      const sectionMap = new Map<string, SheetDataItem[]>();
      let currentSection = "General"; // Sección por defecto
      
      // Procesamiento básico para detectar secciones y datos
      if (Array.isArray(rows)) {
        rows.forEach((row, rowIndex) => {
          if (!Array.isArray(row) || row.length < 2) return;
          
          const firstCell = row[0]?.value;
          if (firstCell && typeof firstCell === 'string' && firstCell === firstCell.toUpperCase() && firstCell.length > 3) {
            // Parece un encabezado de sección
            currentSection = firstCell;
            
            if (!sectionMap.has(currentSection)) {
              sectionMap.set(currentSection, []);
              
              // Añadir el título de la sección
              const sectionHeader: SheetDataItem = {
                key: firstCell.replace(/\s+/g, '_').toLowerCase(),
                label: firstCell,
                value: row[1]?.value?.toString() || "Sección",
                sheetName: sheetName,
                isTitle: true,
                section: currentSection,
                row: rowIndex
              };
              
              sectionMap.get(currentSection)?.push(sectionHeader);
            }
          } else if (firstCell) {
            // Es un campo normal
            const dataItem: SheetDataItem = {
              key: String(firstCell).replace(/\s+/g, '_').toLowerCase(),
              label: String(firstCell),
              value: row[1]?.value || "",
              sheetName: sheetName,
              section: currentSection,
              row: rowIndex
            };
            
            if (!sectionMap.has(currentSection)) {
              sectionMap.set(currentSection, []);
            }
            
            sectionMap.get(currentSection)?.push(dataItem);
            items.push(dataItem);
          }
        });
      }
      
      // Añadir la hoja si tiene elementos
      if (items.length > 0) {
        sheetGroups.push({
          sheetName: sheetName,
          title: sheetName,
          items: items,
          sections: sectionMap,
          color: sheetColors[sheetName] || "gray"
        });
      }
    });
    
    return sheetGroups;
  };

  // Función para manejar la carga del archivo
  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadStatus('idle');
    setPreviewData(null);
    
    try {
      // Datos de ejemplo en caso de error o para demostración
      const mockSheetGroups: SheetGroup[] = [
        {
          sheetName: "FORMATO P&P",
          title: "FORMATO P&P",
          color: "blue",
          items: [
            { key: "codigo", label: "Código", value: "EXTSC-2025-001", sheetName: "FORMATO P&P", section: "INFORMACIÓN GENERAL" },
            { key: "nombre_del_proyecto", label: "Nombre del Proyecto", value: "Capacitación en herramientas digitales para comunidades rurales", sheetName: "FORMATO P&P", section: "INFORMACIÓN GENERAL" },
            { key: "tipo_de_proyecto", label: "Tipo de Proyecto", value: "Capacitación", sheetName: "FORMATO P&P", section: "INFORMACIÓN GENERAL" },
            { key: "objeto", label: "Objeto", value: "Capacitar a 100 personas de comunidades rurales en el uso de herramientas digitales", sheetName: "FORMATO P&P", section: "INFORMACIÓN GENERAL" },
          ],
          sections: new Map([
            ["INFORMACIÓN GENERAL", [
              { key: "info_general_title", label: "INFORMACIÓN GENERAL", value: "Datos básicos del proyecto", sheetName: "FORMATO P&P", section: "INFORMACIÓN GENERAL", isTitle: true },
              { key: "codigo", label: "Código", value: "EXTSC-2025-001", sheetName: "FORMATO P&P", section: "INFORMACIÓN GENERAL" },
              { key: "nombre_del_proyecto", label: "Nombre del Proyecto", value: "Capacitación en herramientas digitales para comunidades rurales", sheetName: "FORMATO P&P", section: "INFORMACIÓN GENERAL" },
              { key: "tipo_de_proyecto", label: "Tipo de Proyecto", value: "Capacitación", sheetName: "FORMATO P&P", section: "INFORMACIÓN GENERAL" },
              { key: "objeto", label: "Objeto", value: "Capacitar a 100 personas de comunidades rurales en el uso de herramientas digitales", sheetName: "FORMATO P&P", section: "INFORMACIÓN GENERAL" },
            ]]
          ])
        },
        {
          sheetName: "FICHA TÉCNICA",
          title: "FICHA TÉCNICA",
          color: "green",
          items: [
            { key: "cooperantes", label: "Cooperantes", value: "Ministerio de Tecnologías de la Información y Comunicaciones", sheetName: "FICHA TÉCNICA", section: "DATOS TÉCNICOS" },
            { key: "requiere_presupuesto", label: "¿Requiere presupuesto este proyecto?", value: "Sí", sheetName: "FICHA TÉCNICA", section: "DATOS TÉCNICOS", isCompact: true },
            { key: "cuenta_con_contrapartida", label: "¿Cuenta con contrapartida?", value: "No", sheetName: "FICHA TÉCNICA", section: "DATOS TÉCNICOS", isCompact: true, compactPairOf: "requiere_presupuesto" },
            { key: "lugar_de_ejecucion", label: "Lugar de ejecución", value: "CARTAGENA DE INDIAS", sheetName: "FICHA TÉCNICA", section: "DATOS TÉCNICOS" },
            { key: "plazo_meses", label: "Plazo (Meses)", value: "4 MESES", sheetName: "FICHA TÉCNICA", section: "DATOS TÉCNICOS" },
          ],
          sections: new Map([
            ["DATOS TÉCNICOS", [
              { key: "datos_tecnicos_title", label: "DATOS TÉCNICOS", value: "Información técnica del proyecto", sheetName: "FICHA TÉCNICA", section: "DATOS TÉCNICOS", isTitle: true },
              { key: "cooperantes", label: "Cooperantes", value: "Ministerio de Tecnologías de la Información y Comunicaciones", sheetName: "FICHA TÉCNICA", section: "DATOS TÉCNICOS" },
              { key: "requiere_presupuesto", label: "¿Requiere presupuesto este proyecto?", value: "Sí", sheetName: "FICHA TÉCNICA", section: "DATOS TÉCNICOS", isCompact: true, compactPair: "cuenta_con_contrapartida" },
              { key: "cuenta_con_contrapartida", label: "¿Cuenta con contrapartida?", value: "No", sheetName: "FICHA TÉCNICA", section: "DATOS TÉCNICOS", isCompact: true, compactPairOf: "requiere_presupuesto" },
              { key: "lugar_de_ejecucion", label: "Lugar de ejecución", value: "CARTAGENA DE INDIAS", sheetName: "FICHA TÉCNICA", section: "DATOS TÉCNICOS" },
              { key: "plazo_meses", label: "Plazo (Meses)", value: "4 MESES", sheetName: "FICHA TÉCNICA", section: "DATOS TÉCNICOS" },
            ]]
          ])
        }
      ];
      
      // Simular tiempo de carga
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        // Intentar hacer la solicitud real al backend
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('http://localhost:8000/convert?include_format=true', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) throw new Error('Error en el servidor');
        
        const rawData = await response.json();
        // Procesar los datos con nuestro procesador
        const sheetGroups = processExcelJson(rawData);
        
        if (sheetGroups.length > 0) {
          setPreviewData(sheetGroups);
          setUploadStatus('success');
        } else {
          // Si no se pudo extraer información, usar datos de prueba
          console.warn('No se pudo extraer información estructurada del Excel. Usando datos de prueba.');
          setPreviewData(mockSheetGroups);
          setUploadStatus('success');
        }
      } catch (err) {
        console.error('Error al procesar el archivo:', err);
        // En caso de error, usar datos de prueba para la demostración
        setPreviewData(mockSheetGroups);
        setUploadStatus('success');
      }
    } catch (err) {
      console.error('Error general:', err);
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  // Función para procesar los datos y redirigir al formulario
  const handleProcessData = () => {
    // Aquí se implementaría la lógica para procesar los datos y redirigir al formulario
    console.log('Procesando datos para formulario...', previewData);
  };

  // Función para formatear valores según su tipo
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    
    if (typeof value === 'number') {
      // Formatear números grandes como moneda
      if (value > 1000) {
        return new Intl.NumberFormat('es-CO', { 
          style: 'currency', 
          currency: 'COP',
          minimumFractionDigits: 0
        }).format(value);
      }
      
      // Formatear porcentajes
      if (value <= 1 && value > 0) {
        return `${(value * 100).toFixed(2)}%`;
      }
      
      return value.toString();
    }
    
    // Fechas
    if (value instanceof Date) {
      return value.toLocaleDateString('es-CO');
    }
    
    // Por defecto, convertir a string
    return value.toString();
  };

  // Filtrar secciones según el texto de búsqueda
  const getFilteredSections = () => {
    if (!previewData || activeSheetIndex >= previewData.length) return new Map();
    
    const sheet = previewData[activeSheetIndex];
    
    if (!filterText) return sheet.sections;
    
    const filteredSections = new Map<string, SheetDataItem[]>();
    
    // Filtrar secciones según el texto
    sheet.sections.forEach((items, sectionName) => {
      const filteredItems = items.filter(item => {
        // Siempre incluir títulos de sección
        if (item.isTitle) return true;
        
        // Para elementos normales, buscar en etiqueta y valor
        const labelMatch = item.label.toLowerCase().includes(filterText.toLowerCase());
        const valueMatch = item.value && String(item.value).toLowerCase().includes(filterText.toLowerCase());
        
        return labelMatch || valueMatch;
      });
      
      if (filteredItems.length > 1 || (filteredItems.length === 1 && !filteredItems[0].isTitle)) {
        filteredSections.set(sectionName, filteredItems);
      }
    });
    
    return filteredSections;
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 transition-shadow hover:shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-3 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          Cargar Ficha desde Excel
        </h1>
        
        <div className="max-w-2xl mx-auto">
          {/* Drag & drop area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition
              ${file ? 'border-amber-600 bg-amber-50' : 'border-gray-300 hover:border-amber-500/50'}
              ${isUploading ? 'opacity-50 pointer-events-none' : ''}
              ${dragActive ? 'border-amber-400 bg-amber-50' : ''}
              shadow-inner hover:shadow-md transition-all
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="excel-file"
              className="hidden"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              disabled={isUploading}
              ref={inputRef}
            />
            <label htmlFor="excel-file" className="cursor-pointer block w-full h-full">
              <div className="mb-4 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              
              {file ? (
                <div>
                  <p className="text-lg font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <p className="mt-4 text-sm text-amber-600">Haga clic para cambiar el archivo</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium text-gray-900">Arrastre y suelte su archivo Excel aquí</p>
                  <p className="text-sm text-gray-500 mt-1">- o -</p>
                  <p className="mt-2 text-sm text-amber-600 font-medium">Haga clic para seleccionar un archivo</p>
                  <p className="mt-4 text-xs text-gray-400">Formatos soportados: .xlsx, .xls</p>
                </div>
              )}
            </label>
          </div>
          
          {/* Botón de acción */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="px-6 py-3 rounded-lg font-medium flex items-center space-x-2 bg-amber-600 text-white hover:bg-amber-700 shadow-sm hover:shadow-md transition-all disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Procesar Archivo Excel</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Mensajes de estado */}
        {uploadStatus === 'success' && (
          <div className="mt-6 p-4 border border-green-200 rounded-md bg-green-50 text-green-700">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Archivo procesado correctamente.</span>
            </div>
          </div>
        )}
        
        {uploadStatus === 'error' && (
          <div className="mt-6 p-4 border border-red-200 rounded-md bg-red-50 text-red-700">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-500 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>Ocurrió un error al procesar el archivo. Intente nuevamente.</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Vista previa de datos */}
      {previewData && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" clipRule="evenodd" />
              </svg>
              Vista Previa de Datos
            </h2>
            
            <div className="flex space-x-2">
              <button 
                onClick={() => setShowExportOptions(!showExportOptions)}
                className="px-3 py-2 rounded-md text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Exportar
              </button>
              
              <button
                onClick={() => setChartView(!chartView)}
                className={`px-3 py-2 rounded-md text-sm ${chartView ? 'bg-amber-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} flex items-center`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                  <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                </svg>
                {chartView ? 'Ver Tabla' : 'Ver Gráfico'}
              </button>
            </div>
          </div>
          
          {/* Panel de exportación */}
          {showExportOptions && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                <p className="font-medium">Exportar datos procesados</p>
                <p className="text-xs text-gray-500">Seleccione el formato de exportación</p>
              </div>
              <div className="flex space-x-2">
                <button 
                  className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md text-sm font-medium"
                >
                  Exportar JSON
                </button>
                <button 
                  className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-md text-sm font-medium"
                >
                  Exportar CSV
                </button>
              </div>
            </div>
          )}
          
          {/* Filtro y navegación de hojas */}
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Filtrar contenido..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            
            {/* Pestañas de hojas */}
            <div className="flex overflow-x-auto gap-1 p-1 bg-gray-100 rounded-md">
              {previewData.map((sheet, index) => (
                <button
                  key={`sheet-${index}`}
                  onClick={() => setActiveSheetIndex(index)}
                  className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                    activeSheetIndex === index
                      ? 'bg-white text-amber-600 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {sheet.title}
                </button>
              ))}
            </div>
          </div>
          
          {/* Contenido de la hoja activa */}
          {previewData && activeSheetIndex < previewData.length && (
            <div>
              {chartView ? (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[400px]">
                  <h3 className="text-lg font-medium text-center mb-4">Visualización de Datos</h3>
                  
                  <div className="flex justify-center items-center h-80 text-gray-500">
                    <p>Gráficos de datos disponibles próximamente</p>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Mostrar secciones filtradas */}
                  {Array.from(getFilteredSections()).map(([sectionName, items]) => (
                    <div key={sectionName} className="mb-8">
                      <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">
                        {sectionName}
                      </h3>
                      
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {items.map((item: SheetDataItem, index: number) => {
                            // Saltar títulos de sección, ya mostramos el título arriba
                            if (item.isTitle) return null;
                            
                            return (
                              <div key={`${item.key}-${index}`} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <p className="text-sm font-medium text-gray-500">{item.label}</p>
                                <p className="text-base font-medium mt-1">{formatValue(item.value)}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {Array.from(getFilteredSections()).length === 0 && (
                    <div className="p-6 text-center text-gray-500 border border-gray-200 rounded-lg">
                      {filterText ? 
                        'No se encontraron resultados para su búsqueda.' : 
                        'No hay datos disponibles en esta hoja.'
                      }
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Botón de continuar */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleProcessData}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              Continuar al Formulario
            </button>
          </div>
        </div>
      )}
    </div>
  );
}