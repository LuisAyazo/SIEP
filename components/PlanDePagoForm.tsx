'use client';

import { useEffect, useState, useRef } from 'react';

interface PlanDePagoFormProps {
  formData: any;
  onUpdate: (data: any) => void;
  valorProyecto: number;
}

interface Desembolso {
  nombre: string;
  entregables: string;
  valor: number;
  porcentaje: number;
}

export default function PlanDePagoForm({
  formData,
  onUpdate,
  valorProyecto
}: PlanDePagoFormProps) {
  
  const [desembolsos, setDesembolsos] = useState<Desembolso[]>(
    formData._desembolsos || [
      { nombre: '', entregables: '', valor: 0, porcentaje: 0 }
    ]
  );
  
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  // Calcular totales
  const totalValor = desembolsos.reduce((sum, d) => sum + d.valor, 0);
  const totalPorcentaje = desembolsos.reduce((sum, d) => sum + d.porcentaje, 0);

  // Actualizar formData cuando cambian los desembolsos
  useEffect(() => {
    onUpdate({
      _desembolsos: desembolsos,
      totalValor,
      totalPorcentaje
    });
  }, [desembolsos, totalValor, totalPorcentaje]);

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const parseCurrency = (value: string): number => {
    const cleaned = value.replace(/[^0-9]/g, '');
    return cleaned ? parseInt(cleaned, 10) : 0;
  };

  const handleValorInput = (index: number, value: string) => {
    const numericValue = parseCurrency(value);
    const newDesembolsos = [...desembolsos];
    newDesembolsos[index].valor = numericValue;
    
    // Calcular porcentaje automáticamente
    if (valorProyecto > 0) {
      newDesembolsos[index].porcentaje = (numericValue / valorProyecto) * 100;
    }
    
    setDesembolsos(newDesembolsos);
  };

  const handleFieldChange = (index: number, field: 'nombre' | 'entregables', value: string) => {
    const newDesembolsos = [...desembolsos];
    newDesembolsos[index][field] = value;
    setDesembolsos(newDesembolsos);
    
    // Auto-ajustar altura del textarea
    if (field === 'entregables') {
      setTimeout(() => {
        const textarea = textareaRefs.current[index];
        if (textarea) {
          textarea.style.height = 'auto';
          textarea.style.height = textarea.scrollHeight + 'px';
        }
      }, 0);
    }
  };
  
  // Ajustar altura de todos los textareas al montar y cuando cambian los desembolsos
  useEffect(() => {
    textareaRefs.current.forEach((textarea) => {
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      }
    });
  }, [desembolsos]);

  const addDesembolso = () => {
    setDesembolsos([...desembolsos, { nombre: '', entregables: '', valor: 0, porcentaje: 0 }]);
  };

  const removeDesembolso = (index: number) => {
    if (desembolsos.length > 1) {
      setDesembolsos(desembolsos.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <h3 className="text-lg font-semibold text-blue-900">PLAN DE PAGO</h3>
        <p className="text-sm text-blue-700 mt-1">
          El porcentaje se calcula automáticamente: (Valor del Desembolso / Valor del Proyecto) × 100
        </p>
      </div>

      {/* Tabla de desembolsos */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-gray-800">Desembolsos</h4>
          <button
            type="button"
            onClick={addDesembolso}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            + Agregar Desembolso
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">
                  Desembolso
                </th>
                <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">
                  Entregables
                </th>
                <th className="px-4 py-2 border-b text-right text-sm font-semibold text-gray-700 w-48">
                  Valor
                </th>
                <th className="px-4 py-2 border-b text-right text-sm font-semibold text-gray-700 w-32">
                  % Acumulado
                </th>
                <th className="px-4 py-2 border-b text-center text-sm font-semibold text-gray-700 w-24">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {desembolsos.map((desembolso, index) => {
                // Calcular porcentaje acumulado hasta este desembolso
                const porcentajeAcumulado = desembolsos
                  .slice(0, index + 1)
                  .reduce((sum, d) => sum + d.porcentaje, 0);
                
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border-b">
                      <input
                        type="text"
                        value={desembolso.nombre}
                        onChange={(e) => handleFieldChange(index, 'nombre', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: Primer desembolso"
                      />
                    </td>
                    <td className="px-4 py-2 border-b">
                      <textarea
                        ref={(el) => {
                          textareaRefs.current[index] = el;
                        }}
                        value={desembolso.entregables}
                        onChange={(e) => handleFieldChange(index, 'entregables', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden min-h-[40px]"
                        placeholder="Entregables del desembolso"
                        rows={1}
                        style={{ lineHeight: '1.5' }}
                      />
                    </td>
                    <td className="px-4 py-2 border-b">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="text"
                          value={desembolso.valor ? desembolso.valor.toLocaleString('es-CO') : ''}
                          onChange={(e) => handleValorInput(index, e.target.value)}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-right"
                          placeholder="0"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2 border-b text-right">
                      <span className="text-blue-900 font-semibold">
                        {formatPercent(porcentajeAcumulado)}
                      </span>
                    </td>
                    <td className="px-4 py-2 border-b text-center">
                      {desembolsos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDesembolso(index)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Eliminar desembolso"
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              
              {/* Fila de TOTAL */}
              <tr className="bg-yellow-50 font-bold">
                <td className="px-4 py-2 border-b" colSpan={2}>
                  TOTAL
                </td>
                <td className="px-4 py-2 border-b text-right">
                  {formatMoney(totalValor)}
                </td>
                <td className="px-4 py-2 border-b text-right text-blue-900">
                  {formatPercent(totalPorcentaje)}
                </td>
                <td className="px-4 py-2 border-b"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border-2 border-blue-300 p-4">
        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <span className="text-2xl">📊</span>
          Resumen
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Valor del Proyecto:</p>
            <p className="text-lg font-bold text-gray-900">{formatMoney(valorProyecto)}</p>
          </div>
          <div>
            <p className="text-gray-600">Total Desembolsos:</p>
            <p className="text-lg font-bold text-gray-900">{formatMoney(totalValor)}</p>
          </div>
          <div>
            <p className="text-gray-600">% Total:</p>
            <p className={`text-lg font-bold ${totalPorcentaje === 100 ? 'text-green-900' : 'text-red-900'}`}>
              {formatPercent(totalPorcentaje)}
            </p>
          </div>
        </div>
        {totalPorcentaje !== 100 && totalValor > 0 && (
          <div className="mt-3 p-3 bg-yellow-100 border border-yellow-400 rounded">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Advertencia:</strong> El porcentaje total debe ser 100%. Actualmente es {formatPercent(totalPorcentaje)}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}