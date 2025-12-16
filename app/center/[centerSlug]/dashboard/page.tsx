'use client';

import { useState } from 'react';
import { use } from 'react';
import Image from 'next/image';

// Mock data
const MOCK_DATA = {
  totalConvenios: 161,
  totalApalancamiento: 45548300273,
  ingresos: 196554061587,
  contrapartida: 12259201716,
  totalAportes: 208753263303,
  gastosDirectos: 138079584249,
  gastosAdministracion: 9529960866,
  inversiones: 36018339407,
  totalRecaudo: 122527532601,
  saldo: 61662327269,
  
  // Impactos que transforman
  totalBeneficiarios: 723999,
  totalDocentes: 268,
  totalEgresados: 848,
  totalEstudiantes: 294,
  
  lineaAccion: {
    ods1: 15,
    ods3: 25,
    ods4: 30,
    ods8: 20,
    ods11: 10
  },
  
  lugarEjecucion: [
    { lugar: 'CARTAGENA', recorrido: 76 },
    { lugar: 'TERRITORIO NACIONAL', recorrido: 13 },
    { lugar: 'BOLIVAR', recorrido: 12 },
    { lugar: 'BOGOTA', recorrido: 9 },
    { lugar: 'RIONEGRO', recorrido: 5 },
    { lugar: 'SUCRE', recorrido: 4 },
    { lugar: 'BOLIVAR', recorrido: 3 },
    { lugar: 'BARRANCABERMEJA', recorrido: 3 },
    { lugar: 'MOMPOX', recorrido: 2 },
    { lugar: 'BARU', recorrido: 2 },
    { lugar: 'BARRANQUILLA', recorrido: 2 },
    { lugar: 'BOGOTA', recorrido: 2 },
    { lugar: 'TURBACO', recorrido: 2 },
    { lugar: 'CHOCO', recorrido: 1 },
    { lugar: 'LORICA', recorrido: 1 },
    { lugar: 'CORDOBA', recorrido: 1 },
    { lugar: 'ARMENIA', recorrido: 1 },
    { lugar: 'MAGDALENA', recorrido: 1 },
  ],
  
  alcance: {
    local: 51.9,
    nacional: 27.5,
    departamental: 10.2,
    regional: 10,
    internacional: 0.4
  },
  
  modalidadServicios: {
    contratoInteradmin: 70,
    convenioInteradmin: 21.9,
    ventaDirecta: 6.3,
    ventaDirecta2: 1.8
  }
};

// Custom Pie Chart Component (for ALCANCE)
function PieChart({ data, labels, colors }: { data: number[], labels: string[], colors: string[] }) {
  const total = data.reduce((sum, val) => sum + val, 0);
  let currentAngle = -90; // Start from top
  
  const segments = data.map((value, index) => {
    const percentage = (value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    // Calculate path for pie segment
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const radius = 90;
    
    const x1 = 100 + radius * Math.cos(startRad);
    const y1 = 100 + radius * Math.sin(startRad);
    const x2 = 100 + radius * Math.cos(endRad);
    const y2 = 100 + radius * Math.sin(endRad);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    const pathData = [
      `M 100 100`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    // Calculate label position
    const labelAngle = startAngle + angle / 2;
    const labelRad = (labelAngle * Math.PI) / 180;
    const labelRadius = radius * 0.7;
    const labelX = 100 + labelRadius * Math.cos(labelRad);
    const labelY = 100 + labelRadius * Math.sin(labelRad);
    
    currentAngle = endAngle;
    
    return {
      path: pathData,
      color: colors[index],
      percentage: value,
      labelX,
      labelY
    };
  });
  
  return (
    <div className="flex items-center justify-center gap-8">
      <svg viewBox="0 0 200 200" className="w-64 h-64">
        {segments.map((segment, index) => (
          <g key={index}>
            <path
              d={segment.path}
              fill={segment.color}
              stroke="white"
              strokeWidth="2"
            />
            <text
              x={segment.labelX}
              y={segment.labelY}
              fill="white"
              fontSize="12"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {segment.percentage}%
            </text>
          </g>
        ))}
      </svg>
      <div className="space-y-2">
        {labels.map((label, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: colors[index] }}
            />
            <span className="text-gray-700">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Custom Donut Chart Component (for MODALIDAD DE SERVICIOS)
function DonutChart({ data, labels, colors }: { data: number[], labels: string[], colors: string[] }) {
  const total = data.reduce((sum, val) => sum + val, 0);
  let currentAngle = -90; // Start from top
  
  const segments = data.map((value, index) => {
    const percentage = (value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    // Calculate path for donut segment
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const outerRadius = 90;
    const innerRadius = 54; // 60% cutout
    
    const x1 = 100 + outerRadius * Math.cos(startRad);
    const y1 = 100 + outerRadius * Math.sin(startRad);
    const x2 = 100 + outerRadius * Math.cos(endRad);
    const y2 = 100 + outerRadius * Math.sin(endRad);
    
    const x3 = 100 + innerRadius * Math.cos(endRad);
    const y3 = 100 + innerRadius * Math.sin(endRad);
    const x4 = 100 + innerRadius * Math.cos(startRad);
    const y4 = 100 + innerRadius * Math.sin(startRad);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    const pathData = [
      `M ${x1} ${y1}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
      'Z'
    ].join(' ');
    
    // Calculate label position
    const labelAngle = startAngle + angle / 2;
    const labelRad = (labelAngle * Math.PI) / 180;
    const labelRadius = (outerRadius + innerRadius) / 2;
    const labelX = 100 + labelRadius * Math.cos(labelRad);
    const labelY = 100 + labelRadius * Math.sin(labelRad);
    
    currentAngle = endAngle;
    
    return {
      path: pathData,
      color: colors[index],
      percentage: value,
      labelX,
      labelY
    };
  });
  
  return (
    <div className="flex items-center justify-center gap-8">
      <svg viewBox="0 0 200 200" className="w-64 h-64">
        {segments.map((segment, index) => (
          <g key={index}>
            <path
              d={segment.path}
              fill={segment.color}
              stroke="white"
              strokeWidth="1"
            />
            <text
              x={segment.labelX}
              y={segment.labelY}
              fill="white"
              fontSize="12"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {segment.percentage}%
            </text>
          </g>
        ))}
      </svg>
      <div className="space-y-2">
        {labels.map((label, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: colors[index] }}
            />
            <span className="text-gray-700">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Mock convenios data
const CONVENIOS_DATA = [
  "CONTRATAR EL DESARROLLO DE PROCESOS PARTICIPATIVOS Y DE SISTEMATIZACION PARA LA REALIZACION DE LA FASE DE AGENDA PUBLICA DENTRO DEL CICLO DE LAS POLITICAS PUBLICAS DEL DISTRITO DE CARTAGENA.",
  "DESARROLLAR PROGRAMAS DE EDUCACIÓN CONTINUADA DIRIGIDOS A DOCENTES DEL DEPARTAMENTO DE BOLÍVAR, ATENCIÓN A ESTUDIANTES CON TALENTOS Y CAPACIDADES EXCEPCIONALES, Y EL FORTALECIMIENTO A PROCESOS PEDAGÓGICOS EN ESTABLECIMIENTOS EDUCATIVOS OFICIALES DE LOS MUNICIPIOS NO CERTIFICADOS",
  "AUNAR ESFUERZOS ADMINISTRATIVOS, TÉCNICOS Y FINANCIEROS PARA EL FORTALECIMIENTO DE LA GESTIÓN, EDUCACIÓN, INVESTIGACIÓN, CONSERVACIÓN, PUESTA EN VALOR Y APROPIACIÓN SOCIAL DEL PATRIMONIO CULTURAL DE CARTAGENA DE INDIAS",
  "AUNAR ESFUERZOS TECNICOS, ECONOMICOS Y ADMINISTRATIVOS PARA TRAMITAR LA VIABILIDAD TECNICA DEL PROYECTO DE ALCANTARILLADO SANITARIO DE LOS CORREGIMIENTOS DE BAYUCA Y PONTEZUELA DE LA CIUDAD DE CARTAGENA DE INDIAS, DISEÑADOS POR ACUACAR EN EL MARCO DEL PLAN DE DESARROLLO DE LA CIUDAD DE CARTAGENA.",
  "CONTRATAR LAS ACTIVIDADES NECESARIAS CON EL FIN DE APOYAR LAS ACCIONES COMPLEMENTARIAS DEL PLAN DE TRABAJO DE LA MESA DE PARTICIPACIÓN EFECTIVA DE LAS VÍCTIMAS DE BOLÍVAR 2022-2023 PARA LA INCIDENCIA Y SEGUIMIENTO A LA IMPLEMENTACIÓN DE LA POLÍTICA DE VÍCTIMAS EN EL DEPARTAMENTO BOLÍVAR.",
  "PRESTACIÓN DE SERVICIOS PARA REALIZAR ACCIONES DE DESARROLLO DE CAPACIDADES, MONITOREOS DE COBERTURA DE VACUNACIÓN Y SALA SITUACIONAL DEL PROGRAMA AMPLIADO DE INMUNIZACIONES EN EL DISTRITO DE CARTAGENA DE INDIAS, SEGÚN LINEAMIENTOS VIGENTES ESTABLECIDOS POR EL MINISTERIO DE SALUD Y PROTECCIÓN SOCIAL",
  "AUNAR ESFUERZOS TECNICOS, ECONOMICOS Y ADMINISTRATIVOS PARA TRAMITAR LA VIABILIDAD TECNICA DE LOS PROYECTOS \"SOLUCIÓN DEFINITIVA PARA EL SUMINISTRO DE AGUA POTABLE DEL CORREGIMIENTO DE BOCACHICA INCLUIDO CAÑO DEL ORO\" Y \"ALCANTARILLADO SANITARIO EN EL CORREGIMIENTO DE BOCACHICA EN LA ISLA DE TIERRABOMBA DE LA CIUDAD DE CARTAGENA DE INDIAS",
  "AUNAR ESFUERZOS TÉCNICOS, ECONÓMICOS Y ADMINISTRATIVOS PARA TRAMITAR LA VIABILIDAD TÉCNICA DEL PROYECTO DE LA CONDUCCIÓN DE AGUA POTABLE DESDE LA ROTONDA VARIANTE MAMONAL - GAMBOTE HASTA EL PUENTE TURBACO - CARTAGENA.",
  "DIPLOMADO EMPRENDIMIENTO E INNOVACIÓN PARA EL FORTALECIMIENTO DE UNA RED DE GESTORES DEL DESARROLLO SOSTENIBLE SUSCRITO ENTRE LA CORPORACIÓN AUTÓNOMA REGIONAL DEL CANAL DEL DIQUE Y LA UNIVERSIDAD DE CARTAGENA",
  "EVALUAR LA PRESENCIA DE MERCURIO EN ECOSISTEMAS ACUÁTICOS DEL RÍO CAUCA EN INMEDIACIONES DE LAS COMUNIDADES INDÍGENAS DE NÍNERAS Y EL QUINCE EN EL MUNICIPIO DE SOLANO, A TRAVÉS DEL ANÁLISIS DE LA CONCENTRACIÓN DE MERCURIO EN PECES Y SEDIMENTOS CON ÉNFASIS EN EL RECURSO PESQUERO Y LAS ÁREAS DE PESCA DE INTERÉS PARA LAS COMUNIDADES.",
  "APOYAR, ASESORAR Y ACOMPAÑAR EL PROCESO DE EVALUACION DE LOS ASPIRANTES A LA ELECCION DE CONTRALOR MUNICIPAL VIGENCIA 2022-2025 Y SECRETARIO GENERAL DEL CONCEJO DE NEIVA VIGENCIA 2022",
  "FORTALECIMIENTO Y ESTIMULO A LA INVESTIGACION EN ESTUDIOS COLONIALES, EN EL PROGRAMA DE HISTORIA DE LA UNIVERSIDAD DE CARTAGENA",
  "DESARROLLAR EL PROCESO DE CONCERTACION Y CONSTRUCCION CON EL CONSEJO COMUNITARIO DE BARU, DEL INSTRUMENTO DE RECOLECCION DE INFORMACION, POR PARTE DEL CONTRATISTA, PARA EL CENSO QUE SE PRETENDE DESARROLLAR EN LA PENINSULA DE BARU, POSTERIOR A LA EJECUCION DE ESTE CONTRATO.",
];

export default function DashboardPage({ params }: { params: Promise<{ centerSlug: string }> }) {
  const resolvedParams = use(params);
  const [selectedYear, setSelectedYear] = useState('2022-2026');
  const [selectedEstado, setSelectedEstado] = useState('TODOS');
  const [currentPage, setCurrentPage] = useState(1);
  const [conveniosPage, setConveniosPage] = useState(1);
  const itemsPerPage = 39;
  const conveniosPerPage = 20;

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('es-CO').format(value);
  };

  const totalPages = Math.ceil(MOCK_DATA.lugarEjecucion.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = MOCK_DATA.lugarEjecucion.slice(startIndex, endIndex);

  const totalConveniosPages = Math.ceil(CONVENIOS_DATA.length / conveniosPerPage);
  const conveniosStartIndex = (conveniosPage - 1) * conveniosPerPage;
  const conveniosEndIndex = conveniosStartIndex + conveniosPerPage;
  const currentConvenios = CONVENIOS_DATA.slice(conveniosStartIndex, conveniosEndIndex);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-8 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              CIFRAS DE GESTIÓN - CONSOLIDADO PDI <span className="text-amber-500">2022-2026</span>
            </h1>
            <p className="text-cyan-400 text-base mt-0.5">
              Centro de servicios en Consultorías, Asesorías, Interventorías y Donaciones
            </p>
          </div>
          <div className="flex gap-4">
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold cursor-pointer hover:bg-amber-600 transition-colors"
            >
              <option value="2022-2026">AÑO</option>
              <option value="2022">2022</option>
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
            <select 
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold cursor-pointer hover:bg-amber-600 transition-colors"
            >
              <option value="TODOS">ESTADO</option>
              <option value="ACTIVO">ACTIVO</option>
              <option value="FINALIZADO">FINALIZADO</option>
              <option value="EN_PROCESO">EN PROCESO</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-12 gap-6 items-stretch">
          {/* Left Column - Logo and Table */}
          <div className="col-span-3 flex flex-col gap-6">
            {/* Logo */}
            <div className="bg-white rounded-lg p-6 shadow-sm flex items-center justify-center shrink-0">
              <Image 
                src="/images/uni-bicentenaria.png" 
                alt="Universidad de Cartagena 200 años"
                width={200}
                height={200}
                className="object-contain"
              />
            </div>

            {/* Lugar de Ejecución Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-amber-500 text-white px-4 py-3 flex justify-between items-center">
                <span className="font-bold">LUGAR DE EJECUCION</span>
                <span className="font-bold">Recor...</span>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full">
                  <tbody>
                    {currentItems.map((item, index) => (
                      <tr 
                        key={index}
                        className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                      >
                        <td className="px-4 py-1 text-xs text-gray-700">{item.lugar}</td>
                        <td className="px-4 py-1 text-xs text-gray-700 text-right">{item.recorrido}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                      <td className="px-4 py-1 text-xs">Total</td>
                      <td className="px-4 py-1 text-xs text-right">{MOCK_DATA.totalConvenios}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="bg-gray-100 px-4 py-2 flex justify-between items-center text-sm">
                <span>1 - {itemsPerPage} / {itemsPerPage}</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 hover:bg-gray-200 rounded disabled:opacity-50"
                  >
                    ‹
                  </button>
                  <button 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 hover:bg-gray-200 rounded disabled:opacity-50"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Charts */}
          <div className="col-span-5 flex flex-col gap-6">
            {/* ALCANCE Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col min-h-[384px]">
              <h3 className="text-center font-bold text-gray-800 mb-4 text-lg">ALCANCE</h3>
              <div className="flex items-center justify-center flex-1">
                <PieChart
                  data={[
                    MOCK_DATA.alcance.local,
                    MOCK_DATA.alcance.nacional,
                    MOCK_DATA.alcance.departamental,
                    MOCK_DATA.alcance.regional,
                    MOCK_DATA.alcance.internacional
                  ]}
                  labels={['LOCAL', 'NACIONAL', 'DEPARTAMENTAL', 'REGIONAL', 'INTERNACIONAL']}
                  colors={['#1e293b', '#f59e0b', '#06b6d4', '#8b5cf6', '#ef4444']}
                />
              </div>
            </div>

            {/* MODALIDAD DE SERVICIOS Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col min-h-[400px]">
              <h3 className="text-center font-bold text-gray-800 mb-4 text-lg">MODALIDAD DE SERVICIOS</h3>
              <div className="flex items-center justify-center flex-1">
                <DonutChart
                  data={[
                    MOCK_DATA.modalidadServicios.contratoInteradmin,
                    MOCK_DATA.modalidadServicios.convenioInteradmin,
                    MOCK_DATA.modalidadServicios.ventaDirecta,
                    MOCK_DATA.modalidadServicios.ventaDirecta2
                  ]}
                  labels={['CONTRATO INTERADMIN...', 'CONVENIO INTERADMIN...', 'VENTA DIRECTA', 'VENTA DIRECTA']}
                  colors={['#1e293b', '#f59e0b', '#06b6d4', '#10b981']}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Financial Metrics */}
          <div className="col-span-4 space-y-3 flex flex-col">
            {/* Total Convenios */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="text-xs text-gray-600 mb-1">TOTAL CONVENIOS</div>
              <div className="bg-slate-800 text-white text-3xl font-bold text-center py-3 rounded-lg">
                {MOCK_DATA.totalConvenios}
              </div>
            </div>

            {/* Total Apalancamiento */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="text-xs text-gray-600 mb-1">TOTAL APALANCAMIENTO</div>
              <div className="bg-purple-900 text-white text-xl font-bold text-center py-3 rounded-lg">
                $ {formatNumber(MOCK_DATA.totalApalancamiento)}
              </div>
            </div>

            {/* Ingresos and Contrapartida */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg shadow-sm p-3">
                <div className="text-xs text-gray-600 mb-1">INGRESOS</div>
                <div className="bg-amber-500 text-white text-base font-bold text-center py-2 rounded-lg">
                  {formatNumber(MOCK_DATA.ingresos)}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-3">
                <div className="text-xs text-gray-600 mb-1">CONTRAPARTIDA</div>
                <div className="bg-amber-500 text-white text-base font-bold text-center py-2 rounded-lg">
                  {formatNumber(MOCK_DATA.contrapartida)}
                </div>
              </div>
            </div>

            {/* Total Aportes */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="text-xs text-gray-600 mb-1">TOTAL APORTES</div>
              <div className="bg-green-600 text-white text-xl font-bold text-center py-3 rounded-lg">
                {formatNumber(MOCK_DATA.totalAportes)}
              </div>
            </div>

            {/* Gastos Directos and Administración */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg shadow-sm p-3">
                <div className="text-xs text-gray-600 mb-1">GASTOS DIRECTOS</div>
                <div className="bg-slate-800 text-white text-base font-bold text-center py-2 rounded-lg">
                  {formatNumber(MOCK_DATA.gastosDirectos)}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-3">
                <div className="text-xs text-gray-600 mb-1">GASTOS DE ADMINISTRACIÓN</div>
                <div className="bg-slate-800 text-white text-base font-bold text-center py-2 rounded-lg">
                  {formatNumber(MOCK_DATA.gastosAdministracion)}
                </div>
              </div>
            </div>

            {/* Inversiones */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="text-xs text-gray-600 mb-1">INVERSIONES</div>
              <div className="bg-green-600 text-white text-xl font-bold text-center py-3 rounded-lg">
                {formatNumber(MOCK_DATA.inversiones)}
              </div>
            </div>

            {/* Total Recaudo and Saldo */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg shadow-sm p-3">
                <div className="text-xs text-gray-600 mb-1">TOTAL RECAUDO</div>
                <div className="bg-green-600 text-white text-base font-bold text-center py-2 rounded-lg">
                  {formatNumber(MOCK_DATA.totalRecaudo)}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-3">
                <div className="text-xs text-gray-600 mb-1">SALDO</div>
                <div className="bg-green-600 text-white text-base font-bold text-center py-2 rounded-lg">
                  $ {formatNumber(MOCK_DATA.saldo)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* IMPACTOS QUE TRASFORMAN Section */}
        <div className="mt-8">
          <div className="bg-white border border-gray-300 rounded-lg p-4 mb-6">
            <h2 className="text-2xl font-bold text-center text-gray-800">IMPACTOS QUE TRASFORMAN</h2>
          </div>
          
          {/* Stat Cards with Images */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            {/* Total Beneficiarios */}
            <div className="bg-[#f59e0b] text-white rounded-lg px-6 pt-2 pb-0 flex flex-col items-center justify-center">
              <div className="text-sm font-semibold mb-2">TOTAL BENEFICIARIOS</div>
              <div className="text-5xl font-bold mb-4">{formatNumber(MOCK_DATA.totalBeneficiarios)}</div>
              <Image 
                src="/images/01.gente.png" 
                alt="Beneficiarios"
                width={240}
                height={240}
                className="object-contain"
              />
            </div>

            {/* Total Docentes */}
            <div className="bg-slate-800 text-white rounded-lg px-6 pt-2 pb-0 flex flex-col items-center justify-center">
              <div className="text-sm font-semibold mb-2">TOTAL DOCENTES</div>
              <div className="text-5xl font-bold mb-4">{formatNumber(MOCK_DATA.totalDocentes)}</div>
              <Image 
                src="/images/02.man-tablero.png" 
                alt="Docentes"
                width={80}
                height={80}
                className="object-contain"
              />
            </div>

            {/* Total Egresados */}
            <div className="bg-teal-500 text-white rounded-lg px-6 pt-2 pb-0 flex flex-col items-center justify-center">
              <div className="text-sm font-semibold mb-2">TOTAL EGRESADOS</div>
              <div className="text-5xl font-bold mb-4">{formatNumber(MOCK_DATA.totalEgresados)}</div>
              <Image 
                src="/images/03.estudiantes.png" 
                alt="Egresados"
                width={80}
                height={80}
                className="object-contain"
              />
            </div>

            {/* Total Estudiantes */}
            <div className="bg-purple-900 text-white rounded-lg px-6 pt-2 pb-0 flex flex-col items-center justify-center">
              <div className="text-sm font-semibold mb-2">TOTAL ESTUDIANTES</div>
              <div className="text-5xl font-bold mb-4">{formatNumber(MOCK_DATA.totalEstudiantes)}</div>
              <Image 
                src="/images/04.leyendo.png" 
                alt="Estudiantes"
                width={80}
                height={80}
                className="object-contain"
              />
            </div>
          </div>

          {/* LÍNEA DE ACCIÓN Chart - Full Width with detailed legend */}
          <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6">
            <h3 className="text-center font-bold text-gray-800 mb-6 text-lg">LÍNEA DE ACCIÓN</h3>
            <div className="grid grid-cols-2 gap-8">
              {/* Donut Chart with center icon */}
              <div className="flex items-center justify-center">
                <div className="relative">
                  <svg viewBox="0 0 200 200" className="w-80 h-80">
                    {/* Donut segments */}
                    <path d="M 100 10 A 90 90 0 0 1 189.5 69.5 L 154.2 84.7 A 54 54 0 0 0 100 46 Z" fill="#1e3a8a" stroke="white" strokeWidth="1"/>
                    <path d="M 189.5 69.5 A 90 90 0 0 1 189.5 130.5 L 154.2 115.3 A 54 54 0 0 0 154.2 84.7 Z" fill="#f59e0b" stroke="white" strokeWidth="1"/>
                    <path d="M 189.5 130.5 A 90 90 0 0 1 130.5 189.5 L 115.3 154.2 A 54 54 0 0 0 154.2 115.3 Z" fill="#14b8a6" stroke="white" strokeWidth="1"/>
                    <path d="M 130.5 189.5 A 90 90 0 0 1 69.5 189.5 L 84.7 154.2 A 54 54 0 0 0 115.3 154.2 Z" fill="#78350f" stroke="white" strokeWidth="1"/>
                    <path d="M 69.5 189.5 A 90 90 0 0 1 45.5 176.5 L 73.3 149.9 A 54 54 0 0 0 84.7 154.2 Z" fill="#1e293b" stroke="white" strokeWidth="1"/>
                    <path d="M 45.5 176.5 A 90 90 0 0 1 23.5 154.5 L 59.1 132.7 A 54 54 0 0 0 73.3 149.9 Z" fill="#dc2626" stroke="white" strokeWidth="1"/>
                    <path d="M 23.5 154.5 A 90 90 0 0 1 10.5 130.5 L 46.3 115.3 A 54 54 0 0 0 59.1 132.7 Z" fill="#059669" stroke="white" strokeWidth="1"/>
                    <path d="M 10.5 130.5 A 90 90 0 0 1 10.5 69.5 L 46.3 84.7 A 54 54 0 0 0 46.3 115.3 Z" fill="#6b7280" stroke="white" strokeWidth="1"/>
                    <path d="M 10.5 69.5 A 90 90 0 0 1 23.5 45.5 L 59.1 67.3 A 54 54 0 0 0 46.3 84.7 Z" fill="#0891b2" stroke="white" strokeWidth="1"/>
                    <path d="M 23.5 45.5 A 90 90 0 0 1 100 10 L 100 46 A 54 54 0 0 0 59.1 67.3 Z" fill="#d1d5db" stroke="white" strokeWidth="1"/>
                    
                    {/* Center circle */}
                    <circle cx="100" cy="100" r="54" fill="white"/>
                  </svg>
                  
                  {/* Center Image */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <Image 
                      src="/images/manos-ramas.png" 
                      alt="Manos con ramas"
                      width={100}
                      height={100}
                      className="object-contain"
                    />
                  </div>
                  
                  {/* Percentage labels on segments - properly positioned */}
                  <div className="absolute" style={{ top: '15%', left: '50%', transform: 'translateX(-50%)' }}>
                    <span className="text-white font-bold text-sm drop-shadow-lg">31.3%</span>
                  </div>
                  <div className="absolute" style={{ top: '30%', right: '12%' }}>
                    <span className="text-white font-bold text-sm drop-shadow-lg">17.5%</span>
                  </div>
                  <div className="absolute" style={{ bottom: '30%', right: '12%' }}>
                    <span className="text-white font-bold text-sm drop-shadow-lg">11.9%</span>
                  </div>
                  <div className="absolute" style={{ bottom: '15%', right: '35%' }}>
                    <span className="text-white font-bold text-sm drop-shadow-lg">10.6%</span>
                  </div>
                  <div className="absolute" style={{ bottom: '15%', left: '35%' }}>
                    <span className="text-white font-bold text-sm drop-shadow-lg">5%</span>
                  </div>
                  <div className="absolute" style={{ bottom: '30%', left: '12%' }}>
                    <span className="text-white font-bold text-sm drop-shadow-lg">5%</span>
                  </div>
                  <div className="absolute" style={{ top: '40%', left: '8%' }}>
                    <span className="text-white font-bold text-sm drop-shadow-lg">4.4%</span>
                  </div>
                  <div className="absolute" style={{ top: '30%', left: '12%' }}>
                    <span className="text-white font-bold text-sm drop-shadow-lg">6.9%</span>
                  </div>
                </div>
              </div>
              
              {/* Legend with full ODS names */}
              <div className="flex flex-col justify-center space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#1e3a8a]"></div>
                  <span>ODS 16. PAZ, JUSTICIA E INSTITUCIONES</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#f59e0b]"></div>
                  <span>ODS 4. EDUCACIÓN DE CALIDAD</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#14b8a6]"></div>
                  <span>ODS 11. CIUDADES Y COMUNIDADES SO...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#78350f]"></div>
                  <span>ODS 9. INDUSTRIA, INNOVACIÓN E INFR...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#1e293b]"></div>
                  <span>ODS 8. TRABAJO DECENTE Y CRECIMIEN...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#dc2626]"></div>
                  <span>ODS 13. ACCIÓN POR EL CLIMA</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#059669]"></div>
                  <span>ODS 3. SALUD Y BIENESTAR</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#6b7280]"></div>
                  <span>ODS 12. PRODUCCIÓN Y CONSUMO RESP...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#0891b2]"></div>
                  <span>ODS 6. AGUA LIMPIA Y SANEAMIENTO</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#d1d5db]"></div>
                  <span>Otros</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section - Two Buttons */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* ALIANZAS PARA EL DESARROLLO SOCIAL - Button */}
            <button className="bg-white border-2 border-gray-800 rounded-lg p-6 hover:bg-gray-50 transition-colors">
              <h3 className="text-center font-bold text-gray-800 text-lg">ALIANZAS PARA EL DESARROLLO SOCIAL</h3>
            </button>

            {/* RESULTADOS POR PROYECTO - Button */}
            <button className="bg-white border-2 border-gray-800 rounded-lg p-6 hover:bg-gray-50 transition-colors">
              <h3 className="text-center font-bold text-gray-800 text-lg">RESULTADOS POR PROYECTO</h3>
            </button>
          </div>

          {/* Four Tables Section - Adjusted widths */}
          <div className="grid grid-cols-12 gap-6 mb-8">
            {/* CONTRATANTE Table - Wider */}
            <div className="col-span-4 bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-[#f59e0b] text-white px-4 py-3 font-bold">
                CONTRATANTE
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <tbody>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">AGENCIA DE DESARROLLO RURAL</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">GOBERNACIÓN DE BOLÍVAR</td></tr>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">GOBERNACION DE BOLIVAR</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">ALCALDÍA DE CARTAGENA</td></tr>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">UNIVERSIDAD DE CORDOBA - UNIVERSIDAD DEL ATLANTICO</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">ALBERTO SAMUDIO TRAILERO</td></tr>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">FUNDACION CENTRO HISTORICO</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">INSTITUTO DE PATRIMONIO Y CULTURA DE CARTAGENA – IPCC</td></tr>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">ASOCIACION COLOMBIANA DE FACULTADES DE INGENIERIA - ACOFI</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">AGUAS DE CARTAGENA S.A. E.S.P.</td></tr>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">CORPORACION AUTONOMA REGIONAL DEL CANAL DEL DIQUE - CARDIQUE</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">MUNICIPIO DE SAN PABLO - BOLIVAR</td></tr>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">LADRILLERA LA CLAY</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">UNIDAD ADMINISTRATIVA ESPECIAL DE GESTIÓN DE RESTITUCIÓN DE TIERRAS DESPOJADAS UAEGRTD</td></tr>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">INSTITUCION UNIVERSITARIA MAYOR DE CARTAGENA - UNIMAYOR</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">CORPORACION AUTONOMA REGIONAL DEL SUR DE BOLIVAR</td></tr>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">CARIBEMAR DE LA COSTA S.A.S. E.S.P -AFINIA</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">UNIVERSIDAD NACIONAL ABIERTA Y A DISTANCIA - UNAD</td></tr>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">THE NATURE CONSERVANCY</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="bg-gray-100 px-4 py-2 text-sm text-center">
                1 - 20 / 112
              </div>
            </div>

            {/* UNIDAD EJECUTORA Table - Wider */}
            <div className="col-span-4 bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-[#1e293b] text-white px-4 py-3 font-bold">
                UNIDAD EJECUTORA
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <tbody>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">FACULTAD DE INGENIERÍA</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">FACULTAD DE CIENCIAS SOCIALES Y EDUCACIÓN</td></tr>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">OBSERVATORIO PARA LA EQUIDAD Y EL DESARROLLO CON ENFOQUE DE GÉNERO</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">OBSERVATORIO DEL PATRIMONIO CULTURAL</td></tr>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">CENTRO DE EDUCACIÓN CONTINUA</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">VICERRECTORIA DE EXTENSION Y PROYECCION SOCIAL</td></tr>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">OFICINA ASESORA DE GESTIÓN HUMANA Y DESARROLLO DE PERSONAL</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">OFICINA ASESORA DE GESTIÓN HUMANA Y DESARROLLO DE PERSONAL</td></tr>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">VICERRECTORIA DE SEGURAMIENTO DE LA CALIDAD</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">FACULTAD DE CIENCIAS FARMACEUTICAS</td></tr>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">VICERRECTORIA DE EXTENSION Y PROYECCIÓN SOCIAL</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">FACULTAD DE CIENCIAS SOCIALES Y EDUCACIÓN</td></tr>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">FACULTAD DE CIENCIAS EXACTAS Y NATURALES</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">FACULTAD DE INGENIERÍA</td></tr>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">FACULTAD DE MEDICINA</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">FACULTAD DE CIENCIAS EXACTAS Y NATURALES</td></tr>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">FACULTAD DE CIENCIAS HUMANAS</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">DIVISION DE COMUNICACIONES</td></tr>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">DIVISION DE SISTEMAS</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">FACULTAD DE ENFERMERÍA</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="bg-gray-100 px-4 py-2 text-sm text-center">
                1 - 20 / 46
              </div>
            </div>

            {/* COORDINADOR Table */}
            <div className="col-span-3 bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-[#14b8a6] text-white px-4 py-3 font-bold flex justify-between">
                <span>COORDINADOR</span>
                <span>Rec...</span>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <tbody>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">LUIS ALBERTO GARCIA ZAPATEIRO</td><td className="px-4 py-2 text-xs text-right">4</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">RUTH GUTIERREZ MEZA</td><td className="px-4 py-2 text-xs text-right">9</td></tr>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">ARNOLDO BERROCAL OLAVE</td><td className="px-4 py-2 text-xs text-right">3</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">LALIA BLANQUICETT ANAYA</td><td className="px-4 py-2 text-xs text-right">7</td></tr>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">LALIA BLANQUICETT ANAYA</td><td className="px-4 py-2 text-xs text-right">23</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">JESUS OLIVERO VERBEL</td><td className="px-4 py-2 text-xs text-right">2</td></tr>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">JUAN CARLOS VERGARA SCHMALBACH</td><td className="px-4 py-2 text-xs text-right">4</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">BERTA LUCIA ARNEDO REDONDO</td><td className="px-4 py-2 text-xs text-right">2</td></tr>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">CARMEN GONZALEZ HERRERA</td><td className="px-4 py-2 text-xs text-right">2</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">FREDY VERGARA MAXIMO</td><td className="px-4 py-2 text-xs text-right">2</td></tr>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">CARMEN GONZALEZ HERRERA</td><td className="px-4 py-2 text-xs text-right">2</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">ARNOLDO BERROCAL OLAVE</td><td className="px-4 py-2 text-xs text-right">2</td></tr>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">ADRIANA MARGARITA SALADEN SANCHEZ</td><td className="px-4 py-2 text-xs text-right">2</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">RUTH GUTIERREZ MEZA</td><td className="px-4 py-2 text-xs text-right">3</td></tr>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">ALBERTO JULIO ORDOÑEZ</td><td className="px-4 py-2 text-xs text-right">1</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">ALFONSO ARRIETA PASTRAÑA</td><td className="px-4 py-2 text-xs text-right">3</td></tr>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">CARLOS DIAZ ACEVEDO</td><td className="px-4 py-2 text-xs text-right">1</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">ALIX PACHECO TURIZO</td><td className="px-4 py-2 text-xs text-right">1</td></tr>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">JAVIER HERNANDEZ GRACIA</td><td className="px-4 py-2 text-xs text-right">2</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">ANA POMBO GALLARDO</td><td className="px-4 py-2 text-xs text-right">2</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="bg-gray-100 px-4 py-2 text-sm text-center">
                1 - 20 / 83
              </div>
            </div>

            {/* SUPERVISORES Table */}
            <div className="col-span-1 bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-[#581c87] text-white px-4 py-3 font-bold">
                SUPERVISORES
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <tbody>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">CENTRO DE SERVICIOS EN CONSULTORIAS, ASESORÍAS, INTERVENTORÍAS Y DONACIONES</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">CENTRO DE SERVICIOS</td></tr>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">CENTRO DE SERVICIOS EN CONSULTORIAS, ASESORÍAS, INTERVENTORÍAS Y DONACIONES</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">MARTIN DIAZ PINEDA</td></tr>
                    <tr className="bg-gray-100"><td className="px-4 py-2 text-xs">ADRIANA MARGARITA SALADEN SÁNCHEZ</td></tr>
                    <tr className="bg-white"><td className="px-4 py-2 text-xs">KATIA JOLY VILLAREAL</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="bg-gray-100 px-4 py-2 text-sm text-center">
                1 - 20 / 23
              </div>
            </div>
          </div>

          {/* NOMBRE CONVENIO/ OBJETO Section - Table Format */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
            <div className="bg-[#f59e0b] text-white px-4 py-3 font-bold">
              NOMBRE CONVENIO/ OBJETO
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full">
                <tbody>
                  {currentConvenios.map((convenio, index) => (
                    <tr 
                      key={index}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}
                    >
                      <td className="px-4 py-2 text-xs">{convenio}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-100 px-4 py-2 flex justify-between items-center text-sm">
              <span>{conveniosStartIndex + 1} - {Math.min(conveniosEndIndex, CONVENIOS_DATA.length)} / {CONVENIOS_DATA.length}</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setConveniosPage(Math.max(1, conveniosPage - 1))}
                  disabled={conveniosPage === 1}
                  className="px-2 py-1 hover:bg-gray-200 rounded disabled:opacity-50"
                >
                  ‹
                </button>
                <button 
                  onClick={() => setConveniosPage(Math.min(totalConveniosPages, conveniosPage + 1))}
                  disabled={conveniosPage === totalConveniosPages}
                  className="px-2 py-1 hover:bg-gray-200 rounded disabled:opacity-50"
                >
                  ›
                </button>
              </div>
            </div>
          </div>

          {/* ESTADO INDIVIDUAL and DURACIÓN Section */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* ESTADO INDIVIDUAL */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-center font-bold text-gray-800 mb-4">ESTADO INDIVIDUAL</h3>
              <div className="flex justify-center">
                <button className="bg-purple-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-purple-800 transition-colors">
                  LIQUIDADO
                </button>
              </div>
            </div>

            {/* DURACIÓN */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-center font-bold text-gray-800 mb-4">DURACIÓN</h3>
              <div className="flex justify-center">
                <button className="bg-[#f59e0b] text-white px-8 py-3 rounded-lg font-bold hover:bg-amber-600 transition-colors">
                  3 MESES
                </button>
              </div>
            </div>
          </div>

          {/* Footer Images */}
          <div className="grid grid-cols-2 gap-6">
            <div className="flex justify-center">
              <Image 
                src="/images/footer-izq.png" 
                alt="Footer Izquierdo"
                width={400}
                height={100}
                className="object-contain"
              />
            </div>
            <div className="flex justify-center">
              <Image 
                src="/images/footer-der.png" 
                alt="Footer Derecho"
                width={400}
                height={100}
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
