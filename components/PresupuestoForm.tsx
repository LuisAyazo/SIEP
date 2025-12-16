'use client';

import { useEffect, useState } from 'react';

interface PresupuestoFormProps {
  formData: any;
  onUpdate: (data: any) => void;
  gastosPersonalVinculado: number;
  gastosPersonalInvitado: number;
  gastosGenerales: number;
  gastosRecursosContratar: number;
}

export default function PresupuestoForm({
  formData,
  onUpdate,
  gastosPersonalVinculado,
  gastosPersonalInvitado,
  gastosGenerales,
  gastosRecursosContratar
}: PresupuestoFormProps) {
  
  const [presupuesto, setPresupuesto] = useState({
    valorProyecto: formData.valorProyecto || 0,
    ingresos: formData.ingresos || 0,
    contrapartida: formData.contrapartida || 0,
    inversiones: formData.inversiones || 0
  });

  // Sincronizar con formData cuando cambia (al volver a esta sección)
  useEffect(() => {
    if (formData.valorProyecto !== undefined || formData.ingresos !== undefined) {
      setPresupuesto({
        valorProyecto: formData.valorProyecto || 0,
        ingresos: formData.ingresos || 0,
        contrapartida: formData.contrapartida || 0,
        inversiones: formData.inversiones || 0
      });
    }
  }, [formData.valorProyecto, formData.ingresos, formData.contrapartida, formData.inversiones]);

  // Calcular valores automáticos
  const gastosDirectos = gastosPersonalVinculado + gastosPersonalInvitado + gastosGenerales + gastosRecursosContratar;
  // GASTOS DE ADMINISTRACIÓN = Valor del Proyecto × 15%
  const gastosAdministracion = presupuesto.valorProyecto * 0.15;
  const totalGastos = gastosDirectos + gastosAdministracion;
  
  // Calcular porcentajes según fórmulas de Excel
  // INGRESOS es siempre 100%
  // Todos los demás valores se dividen entre INGRESOS
  const calcularPorcentaje = (valor: number) => {
    if (presupuesto.ingresos === 0) return 0;
    return (valor / presupuesto.ingresos) * 100;
  };
  
  // Porcentaje de INGRESOS (siempre 100% si hay valor)
  const porcentajeIngresos = presupuesto.ingresos > 0 ? 100 : 0;

  // Actualizar formData cuando cambian los valores
  useEffect(() => {
    onUpdate({
      ...presupuesto,
      gastosDirectos,
      gastosPersonalVinculado,
      gastosPersonalInvitado,
      gastosGenerales,
      gastosRecursosContratar,
      gastosAdministracion,
      totalGastos
    });
  }, [presupuesto, gastosDirectos, gastosAdministracion, totalGastos]);

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

  const handleMoneyInput = (field: 'valorProyecto' | 'ingresos' | 'contrapartida' | 'inversiones', value: string) => {
    const numericValue = parseCurrency(value);
    setPresupuesto({...presupuesto, [field]: numericValue});
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <h3 className="text-lg font-semibold text-blue-900">PRESUPUESTO</h3>
        <p className="text-sm text-blue-700 mt-1">
          Los valores de gastos se calculan automáticamente desde las otras subsecciones
        </p>
      </div>

      {/* Campos editables */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6 space-y-4">
        <h4 className="font-semibold text-gray-800 mb-4">Valores Editables</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor del Proyecto *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="text"
                value={presupuesto.valorProyecto ? presupuesto.valorProyecto.toLocaleString('es-CO') : ''}
                onChange={(e) => handleMoneyInput('valorProyecto', e.target.value)}
                className="w-full pl-8 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-right"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              INGRESOS *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="text"
                value={presupuesto.ingresos ? presupuesto.ingresos.toLocaleString('es-CO') : ''}
                onChange={(e) => handleMoneyInput('ingresos', e.target.value)}
                className="w-full pl-8 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-right"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CONTRAPARTIDA
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="text"
                value={presupuesto.contrapartida ? presupuesto.contrapartida.toLocaleString('es-CO') : ''}
                onChange={(e) => handleMoneyInput('contrapartida', e.target.value)}
                className="w-full pl-8 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-right"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              INVERSIONES
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="text"
                value={presupuesto.inversiones ? presupuesto.inversiones.toLocaleString('es-CO') : ''}
                onChange={(e) => handleMoneyInput('inversiones', e.target.value)}
                className="w-full pl-8 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-right"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Resumen calculado */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-300 p-6">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">📊</span>
          Resumen Presupuestal (Calculado Automáticamente)
        </h4>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-2 px-3 font-semibold text-gray-700">PRESUPUESTO</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-700">VALOR</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-700">% PARTICIPACIÓN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-2 px-3 text-gray-900">Valor del Proyecto</td>
                <td className="py-2 px-3 text-right font-medium text-gray-900">{formatMoney(presupuesto.valorProyecto)}</td>
                <td className="py-2 px-3 text-right text-gray-500">-</td>
              </tr>
              <tr className="bg-blue-50">
                <td className="py-2 px-3 font-semibold text-gray-900">INGRESOS</td>
                <td className="py-2 px-3 text-right font-bold text-blue-900">{formatMoney(presupuesto.ingresos)}</td>
                <td className="py-2 px-3 text-right font-semibold text-blue-900">{formatPercent(porcentajeIngresos)}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-gray-900">CONTRAPARTIDA</td>
                <td className="py-2 px-3 text-right font-medium text-gray-900">{formatMoney(presupuesto.contrapartida)}</td>
                <td className="py-2 px-3 text-right text-gray-700">0.0%</td>
              </tr>
              <tr className="bg-yellow-50">
                <td className="py-2 px-3 font-semibold text-gray-900">GASTOS DIRECTOS</td>
                <td className="py-2 px-3 text-right font-bold text-yellow-900">{formatMoney(gastosDirectos)}</td>
                <td className="py-2 px-3 text-right font-semibold text-yellow-900">{formatPercent(calcularPorcentaje(gastosDirectos))}</td>
              </tr>
              <tr className="pl-6">
                <td className="py-2 px-3 pl-8 text-gray-700">→ Gastos personal vinculado</td>
                <td className="py-2 px-3 text-right text-gray-700">{formatMoney(gastosPersonalVinculado)}</td>
                <td className="py-2 px-3 text-right text-gray-600">{formatPercent(calcularPorcentaje(gastosPersonalVinculado))}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 pl-8 text-gray-700">→ Gastos personal invitado</td>
                <td className="py-2 px-3 text-right text-gray-700">{formatMoney(gastosPersonalInvitado)}</td>
                <td className="py-2 px-3 text-right text-gray-600">{formatPercent(calcularPorcentaje(gastosPersonalInvitado))}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 pl-8 text-gray-700">→ Gastos generales</td>
                <td className="py-2 px-3 text-right text-gray-700">{formatMoney(gastosGenerales)}</td>
                <td className="py-2 px-3 text-right text-gray-600">{formatPercent(calcularPorcentaje(gastosGenerales))}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 pl-8 text-gray-700">→ Gastos recursos a contratar</td>
                <td className="py-2 px-3 text-right text-gray-700">{formatMoney(gastosRecursosContratar)}</td>
                <td className="py-2 px-3 text-right text-gray-600">{formatPercent(calcularPorcentaje(gastosRecursosContratar))}</td>
              </tr>
              <tr className="bg-orange-50">
                <td className="py-2 px-3 font-semibold text-gray-900">GASTOS DE ADMINISTRACIÓN (15%)</td>
                <td className="py-2 px-3 text-right font-bold text-orange-900">{formatMoney(gastosAdministracion)}</td>
                <td className="py-2 px-3 text-right font-semibold text-orange-900">{formatPercent(calcularPorcentaje(gastosAdministracion))}</td>
              </tr>
              <tr className="bg-red-50 border-t-2 border-red-300">
                <td className="py-2 px-3 font-bold text-gray-900">TOTAL GASTOS</td>
                <td className="py-2 px-3 text-right font-bold text-red-900 text-lg">{formatMoney(totalGastos)}</td>
                <td className="py-2 px-3 text-right font-bold text-red-900">{formatPercent(calcularPorcentaje(totalGastos))}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-gray-900">INVERSIONES</td>
                <td className="py-2 px-3 text-right font-medium text-gray-900">{formatMoney(presupuesto.inversiones)}</td>
                <td className="py-2 px-3 text-right text-gray-700">{formatPercent(calcularPorcentaje(presupuesto.inversiones))}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Alertas */}
        {totalGastos !== presupuesto.ingresos && presupuesto.ingresos > 0 && (
          <div className="mt-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 text-sm">
            ⚠️ <strong>Advertencia:</strong> El total de gastos ({formatMoney(totalGastos)}) no coincide con los ingresos ({formatMoney(presupuesto.ingresos)})
          </div>
        )}
      </div>
    </div>
  );
}