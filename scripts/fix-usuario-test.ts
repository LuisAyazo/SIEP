/**
 * Script para limpiar el usuario_test específicamente
 * Elimina el rol "funcionario" y deja solo "consulta"
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUsuarioTest() {
  const userId = 'ce66f644-2aa8-4701-8930-c719df128af3';
  const roleFuncionarioId = '88370483-7c0b-47b9-aaae-32a75903c880';
  
  console.log('🔧 Limpiando usuario_test...');
  console.log('   User ID:', userId);
  console.log('   Eliminando rol "funcionario" (ID:', roleFuncionarioId, ')');
  
  // Eliminar el rol "funcionario" (el más antiguo)
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('id', roleFuncionarioId);
  
  if (error) {
    console.error('❌ Error eliminando rol:', error);
  } else {
    console.log('✅ Rol "funcionario" eliminado exitosamente');
    console.log('✅ El usuario ahora solo tiene el rol "consulta"');
  }
}

fixUsuarioTest().catch(console.error);