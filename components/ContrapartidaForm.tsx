'use client';

import { useEffect, useState } from 'react';

interface ContrapartidaFormProps {
  formData: any;
  onUpdate: (data: any) => void;
}

interface Aporte {
  descripcion: string;
  tipo: string;
  totalAporte: number;
}

export default function ContrapartidaForm({
  formData,
  onUpdate
}: ContrapartidaFormProps) {
  
  const [aportes, setAportes] = useState<Aporte[]>(
    formData._aportes || [
      { descripcion: '', tipo: '', totalAporte: 0 }
    ]
  );

  // Calcular total de contrapartida
  const totalContrapartida = aportes.reduce((sum, aporte) => sum + aporte.totalAporte, 0);

  // Actualizar formData cuando cambian los aportes
  useEffect(() => {
    onUpdate({
      _aportes: aportes,
      totalContrapartida
    });
  }, [aportes, totalContrapartida]);

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const parseCurrency = (value: string): number => {
    const cleaned = value.replace(/[^0-9]/g, '');
    return cleaned ? parseInt(cleaned, 10) : 0;
  };

  const handleFieldChange = (index: number, field: 'descripcion' | 'tipo', value: string) => {
    const newAportes = [...aportes];
    newAportes[index][field] = value;
    setAportes(newAportes);
  };

  const handleMoneyInput = (index: number, value: string) => {
    const numericValue = parseCurrency(value);
    const newAportes = [...aportes];
    newAportes[index].totalAporte = numericValue;
    setAportes(newAportes);
  };

  const addAporte = () => {
    setAportes([...aportes, { descripcion: '', tipo: '', totalAporte: 0 }]);
  };

  const removeAporte = (index: number) => {
    if (aportes.length > 1) {
      setAportes(aportes.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <h3 className="text-lg font-semibold text-blue-900">CONTRAPARTIDA</h3>
        <p className="text-sm text-blue-700 mt-1">
          Registre los aportes de contrapartida del proyecto
        </p>
      </div>

      {/* Tabla de aportes */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-gray-800">Aportes de Contrapartida</h4>
          <button
            type="button"
            onClick={addAporte}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            + Agregar Aporte
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">
                  Descripción de la Contrapartida
                </th>
                <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">
                  Tipo de Contrapartida
                </th>
                <th className="px-4 py-2 border-b text-right text-sm font-semibold text-gray-700 w-48">
                  Total Aporte
                </th>
                <th className="px-4 py-2 border-b text-center text-sm font-semibold text-gray-700 w-24">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {aportes.map((aporte, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-b">
                    <input
                      type="text"
                      value={aporte.descripcion}
                      onChange={(e) => handleFieldChange(index, 'descripcion', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="Descripción del aporte"
                    />
                  </td>
                  <td className="px-4 py-2 border-b">
                    <select
                      value={aporte.tipo}
                      onChange={(e) => handleFieldChange(index, 'tipo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccione tipo...</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Especie">Especie</option>
                      <option value="Mixto">Mixto</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 border-b">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="text"
                        value={aporte.totalAporte ? aporte.totalAporte.toLocaleString('es-CO') : ''}
                        onChange={(e) => handleMoneyInput(index, e.target.value)}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-right"
                        placeholder="0"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2 border-b text-center">
                    {aportes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAporte(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Eliminar aporte"
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              
              {/* Fila de TOTAL CONTRAPARTIDA */}
              <tr className="bg-yellow-50 font-bold">
                <td className="px-4 py-2 border-b" colSpan={2}>
                  TOTAL CONTRAPARTIDA
                </td>
                <td className="px-4 py-2 border-b text-right">
                  {formatMoney(totalContrapartida)}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Total Contrapartida:</p>
            <p className="text-lg font-bold text-gray-900">{formatMoney(totalContrapartida)}</p>
          </div>
          <div>
            <p className="text-gray-600">Número de Aportes:</p>
            <p className="text-lg font-bold text-gray-900">{aportes.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}