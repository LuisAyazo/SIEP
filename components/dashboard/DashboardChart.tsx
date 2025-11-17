'use client';

import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { useCenterContext } from '@/components/providers/CenterContext';

// Registrar los componentes necesarios de Chart.js
Chart.register(...registerables);

interface DashboardChartProps {
  type: string;
  height?: number;
  data?: any;
  centerId?: string;
}

const DashboardChart: React.FC<DashboardChartProps> = ({ 
  type, 
  height = 200, 
  data, 
  centerId 
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const { currentCenter } = useCenterContext();
  
  // Función para generar datos según el tipo de gráfico requerido
  const getChartData = () => {
    // Si se proporcionan datos específicos, usarlos
    if (data) return data;
    
    // ID del centro actual (si no se proporciona explícitamente)
    const activeCenterId = centerId || currentCenter?.id || '1';
    
    // Datos predeterminados si no hay datos específicos
    if (type === 'budget' || type === 'pie' || type === 'doughnut') {
      // Datos de presupuesto por proyecto
      // Diferentes para cada centro
      if (activeCenterId === '1') {
        // Centro de educación continua
        return {
          labels: ['Diplomado en Gestión', 'Inglés Avanzado', 'Seminario de Innovación', 'Taller de Escritura', 'Certificación Virtual'],
          datasets: [{
            label: 'Presupuesto (millones COP)',
            data: [45, 28, 18.5, 12, 35],
            backgroundColor: [
              'rgba(255, 99, 132, 0.5)',
              'rgba(54, 162, 235, 0.5)',
              'rgba(255, 206, 86, 0.5)',
              'rgba(75, 192, 192, 0.5)',
              'rgba(153, 102, 255, 0.5)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 1
          }]
        };
      } else {
        // Centro de servicios
        return {
          labels: ['Consultoría Empresarial', 'Desarrollo Software', 'Asesoría Legal', 'Análisis Lab.', 'Impacto Ambiental'],
          datasets: [{
            label: 'Presupuesto (millones COP)',
            data: [78, 95, 35, 42, 67],
            backgroundColor: [
              'rgba(75, 192, 192, 0.5)',
              'rgba(153, 102, 255, 0.5)', 
              'rgba(255, 159, 64, 0.5)',
              'rgba(54, 162, 235, 0.5)',
              'rgba(255, 99, 132, 0.5)',
            ],
            borderColor: [
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 99, 132, 1)',
            ],
            borderWidth: 1
          }]
        };
      }
    } else if (type === 'forms' || type === 'bar') {
      // Datos para el gráfico de fichas por estado
      if (activeCenterId === '1') {
        // Centro de educación continua
        return {
          labels: ['Completadas', 'En Progreso', 'Pendientes'],
          datasets: [{
            label: 'Cantidad de Fichas',
            data: [28, 15, 22],
            backgroundColor: [
              'rgba(16, 185, 129, 0.6)',  // Verde para completadas
              'rgba(245, 158, 11, 0.6)',  // Amarillo para en progreso
              'rgba(99, 102, 241, 0.6)'   // Azul para pendientes
            ],
            borderColor: [
              'rgba(16, 185, 129, 1)',
              'rgba(245, 158, 11, 1)',
              'rgba(99, 102, 241, 1)'
            ],
            borderWidth: 1
          }]
        };
      } else {
        // Centro de servicios
        return {
          labels: ['Completadas', 'En Progreso', 'Pendientes', 'Borradores'],
          datasets: [{
            label: 'Cantidad de Fichas',
            data: [32, 18, 25, 12],
            backgroundColor: [
              'rgba(16, 185, 129, 0.6)',  // Verde para completadas
              'rgba(245, 158, 11, 0.6)',  // Amarillo para en progreso
              'rgba(99, 102, 241, 0.6)',  // Azul para pendientes
              'rgba(156, 163, 175, 0.6)'  // Gris para borradores
            ],
            borderColor: [
              'rgba(16, 185, 129, 1)',
              'rgba(245, 158, 11, 1)',
              'rgba(99, 102, 241, 1)',
              'rgba(156, 163, 175, 1)'
            ],
            borderWidth: 1
          }]
        };
      }
    } else if (type === 'line') {
      // Datos para un gráfico de línea (por ejemplo, tendencias)
      if (activeCenterId === '1') {
        return {
          labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'],
          datasets: [{
            label: 'Fichas Creadas',
            data: [8, 12, 9, 11, 14, 13, 15, 18, 20, 22],
            borderColor: 'rgba(245, 158, 11, 1)',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.4,
            fill: true
          }]
        };
      } else {
        return {
          labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'],
          datasets: [{
            label: 'Fichas Creadas',
            data: [5, 8, 6, 9, 11, 7, 9, 12, 14, 16],
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          }]
        };
      }
    }

    // Datos predeterminados genéricos para cualquier otro tipo de gráfico
    return {
      labels: ['Categoría 1', 'Categoría 2', 'Categoría 3', 'Categoría 4', 'Categoría 5'],
      datasets: [{
        label: 'Datos',
        data: [12, 19, 3, 5, 2],
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1
      }]
    };
  };

  // Función para obtener el tipo de gráfico de Chart.js basado en nuestro tipo
  const getChartType = () => {
    switch (type) {
      case 'budget':
      case 'pie':
        return 'pie';
      case 'forms':
      case 'bar':
        return 'bar';
      case 'line':
        return 'line';
      case 'doughnut':
        return 'doughnut';
      default:
        return 'bar';
    }
  };

  // Configurar y actualizar el gráfico cuando cambian los datos o tipo
  useEffect(() => {
    if (chartRef.current) {
      // Destruir el gráfico anterior si existe
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      // Crear un nuevo gráfico
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: getChartType(),
          data: getChartData(),
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
              },
              tooltip: {
                displayColors: true,
                callbacks: {
                  // Personalizar tooltip para mostrar porcentajes en gráficos de pastel
                  label: function(context) {
                    const chartType = getChartType();
                    if (chartType === 'pie' || chartType === 'doughnut') {
                      const dataset = context.chart.data.datasets[context.datasetIndex];
                      const total = dataset.data.reduce((sum: number, val: any) => {
                        const numValue = typeof val === 'number' ? val : 
                          (val && typeof val === 'object' && 'y' in val ? val.y : 0);
                        return sum + (numValue || 0);
                      }, 0);
                      const value = dataset.data[context.dataIndex] as number;
                      const percentage = Math.round((value / total) * 100);
                      return `${context.chart.data.labels?.[context.dataIndex]}: ${value} (${percentage}%)`;
                    }
                    return context.formattedValue;
                  }
                }
              }
            }
          }
        });
      }
    }

    // Limpiar al desmontar
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [type, data, currentCenter, centerId]);

  return (
    <div style={{ height: `${height}px` }}>
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

export default DashboardChart;
