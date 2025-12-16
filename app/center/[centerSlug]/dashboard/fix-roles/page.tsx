'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function FixRolesPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fixUsuarioTest = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const supabase = createClient();
      
      // Eliminar el rol "funcionario" (el más antiguo)
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', '88370483-7c0b-47b9-aaae-32a75903c880');
      
      if (error) {
        setResult(`❌ Error: ${error.message}`);
      } else {
        setResult('✅ Rol "funcionario" eliminado exitosamente. El usuario ahora solo tiene el rol "consulta".');
      }
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔧 Arreglar Roles Duplicados</h1>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
        <p className="text-yellow-700">
          <strong>⚠️ Advertencia:</strong> Esta acción eliminará el rol "funcionario" del usuario_test,
          dejando solo el rol "consulta".
        </p>
      </div>

      <button
        onClick={fixUsuarioTest}
        disabled={loading}
        className={`px-6 py-3 rounded-md text-white font-medium ${
          loading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-red-600 hover:bg-red-700'
        }`}
      >
        {loading ? 'Procesando...' : 'Eliminar Rol Duplicado'}
      </button>

      {result && (
        <div className={`mt-6 p-4 rounded-md ${
          result.startsWith('✅') 
            ? 'bg-green-50 border-l-4 border-green-500 text-green-700'
            : 'bg-red-50 border-l-4 border-red-500 text-red-700'
        }`}>
          <p className="font-medium">{result}</p>
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-md">
        <h2 className="font-bold mb-2">Información:</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>Usuario: usuario_test@unicartagena.edu.co</li>
          <li>Rol a eliminar: funcionario (ID: 88370483-7c0b-47b9-aaae-32a75903c880)</li>
          <li>Rol a mantener: consulta (ID: c52b738a-cb5e-49f5-b36f-b3350c4828ce)</li>
        </ul>
      </div>
    </div>
  );
}