'use client';

import { useEffect, useState } from 'react';

interface FondoRotatorioFormProps {
  formData: any;
  onUpdate: (data: any) => void;
  ingresos: number;
}

export default function FondoRotatorioForm({
  formData,
  onUpdate,
  ingresos
}: FondoRotatorioFormProps) {
  
  const [items, setItems] = useState<Array<{concepto: string, monto: number}>>(
    formData._items || [
      { concepto: 'Utiles de Oficina papelería', monto: 0 },
      { concepto: 'Impresiones', monto: 0 },
      { concepto: 'Materiales didácticos', monto: 0 },
      { concepto: 'transporte', monto: 0 },
      { concepto: 'cafetería', monto: 0 },
      { concepto: 'elementos de aseo', monto: 0 },
      { concepto: 'otros', monto: 0 }
    ]
  );

  // Calcular total
  const totalFondoRotatorio = items.reduce((sum, item) => sum + item.monto, 0);
  
  // Calcular porcentaje de participación
  const porcentajeParticipacion = ingresos > 0 ? (totalFondoRotatorio / ingresos) * 100 : 0;

  // Actualizar formData cuando cambian los items
  useEffect(() => {
    onUpdate({
      _items: items,
      totalFondoRotatorio,
      porcentajeParticipacion
    });
  }, [items, totalFondoRotatorio, porcentajeParticipacion]);

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

  const handleMoneyInput = (index: number, value: string) => {
    const numericValue = parseCurrency(value);
    const newItems = [...items];
    newItems[index].monto = numericValue;
    setItems(newItems);
  };

  const handleConceptoChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index].concepto = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { concepto: '', monto: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <h3 className="text-lg font-semibold text-blue-900">FONDO ROTATORIO</h3>
        <p className="text-sm text-blue-700 mt-1">
          El porcentaje de participación se calcula automáticamente: (Total Fondo Rotatorio / Ingresos) × 100
        </p>
      </div>

      {/* Tabla de items */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-gray-800">Items del Fondo Rotatorio</h4>
          <button
            type="button"
            onClick={addItem}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            + Agregar Item
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">
                  FONDO ROTATORIO
                </th>
                <th className="px-4 py-2 border-b text-right text-sm font-semibold text-gray-700">
                  ASIGNACIÓN TOTAL
                </th>
                <th className="px-4 py-2 border-b text-center text-sm font-semibold text-gray-700 w-24">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-b">
                    <input
                      type="text"
                      value={item.concepto}
                      onChange={(e) => handleConceptoChange(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="Concepto"
                    />
                  </td>
                  <td className="px-4 py-2 border-b">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="text"
                        value={item.monto ? item.monto.toLocaleString('es-CO') : ''}
                        onChange={(e) => handleMoneyInput(index, e.target.value)}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-right"
                        placeholder="0"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2 border-b text-center">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Eliminar item"
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              
              {/* Fila de TOTAL */}
              <tr className="bg-yellow-50 font-bold">
                <td className="px-4 py-2 border-b">
                  TOTAL FONDO ROTATORIO
                </td>
                <td className="px-4 py-2 border-b text-right">
                  {formatMoney(totalFondoRotatorio)}
                </td>
                <td className="px-4 py-2 border-b"></td>
              </tr>
              
              {/* Fila de % PARTICIPACIÓN */}
              <tr className="bg-blue-50 font-bold">
                <td className="px-4 py-2 border-b">
                  % PARTICIPACIÓN
                </td>
                <td className="px-4 py-2 border-b text-right text-blue-900">
                  {formatPercent(porcentajeParticipacion)}
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
            <p className="text-gray-600">Total Fondo Rotatorio:</p>
            <p className="text-lg font-bold text-gray-900">{formatMoney(totalFondoRotatorio)}</p>
          </div>
          <div>
            <p className="text-gray-600">Ingresos (Presupuesto):</p>
            <p className="text-lg font-bold text-gray-900">{formatMoney(ingresos)}</p>
          </div>
          <div>
            <p className="text-gray-600">% Participación:</p>
            <p className="text-lg font-bold text-blue-900">{formatPercent(porcentajeParticipacion)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}