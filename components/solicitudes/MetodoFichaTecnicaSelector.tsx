'use client';

interface MetodoFichaTecnicaSelectorProps {
  onSelectMetodo: (metodo: 'importar' | 'formulario') => void;
}

export default function MetodoFichaTecnicaSelector({ onSelectMetodo }: MetodoFichaTecnicaSelectorProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ficha Técnica</h2>
        <p className="text-gray-600 dark:text-gray-400">Seleccione cómo desea proporcionar la ficha técnica</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          type="button"
          onClick={() => onSelectMetodo('importar')}
          className="p-8 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-left transition-all hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 group"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/70 transition-colors">
              <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              📤 Importar Excel
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Suba un archivo Excel con la ficha técnica ya completada
            </p>
            <ul className="text-xs text-gray-500 dark:text-gray-400 text-left space-y-1">
              <li>✓ Más rápido si ya tiene el archivo</li>
              <li>✓ Validación automática del formato</li>
              <li>✓ Formato estándar requerido</li>
            </ul>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectMetodo('formulario')}
          className="p-8 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-left transition-all hover:border-green-600 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 group"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 dark:group-hover:bg-green-900/70 transition-colors">
              <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              📝 Llenar Formulario
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Complete la ficha técnica paso a paso en el formulario
            </p>
            <ul className="text-xs text-gray-500 dark:text-gray-400 text-left space-y-1">
              <li>✓ Guía paso a paso</li>
              <li>✓ Validación en tiempo real</li>
              <li>✓ No requiere archivo previo</li>
            </ul>
          </div>
        </button>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-500 dark:border-yellow-400 p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-100">
          💡 <strong>Nota:</strong> Ambos métodos generarán el mismo resultado. Elija el que sea más conveniente para usted.
        </p>
      </div>
    </div>
  );
}