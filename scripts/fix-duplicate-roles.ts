/**
 * Script para limpiar roles duplicados en user_roles
 * Este script elimina roles duplicados dejando solo el más reciente
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDuplicateRoles() {
  console.log('🔍 Buscando roles duplicados...');

  // Encontrar usuarios con múltiples roles
  const { data: duplicates, error: findError } = await supabase
    .from('user_roles')
    .select('user_id, role_id, created_at, id')
    .order('user_id')
    .order('created_at', { ascending: false });

  if (findError) {
    console.error('❌ Error buscando duplicados:', findError);
    return;
  }

  // Agrupar por user_id
  const userRoles = new Map<string, any[]>();
  duplicates?.forEach(role => {
    if (!userRoles.has(role.user_id)) {
      userRoles.set(role.user_id, []);
    }
    userRoles.get(role.user_id)!.push(role);
  });

  // Encontrar usuarios con más de un rol
  const usersWithDuplicates = Array.from(userRoles.entries())
    .filter(([_, roles]) => roles.length > 1);

  console.log(`📊 Usuarios con roles duplicados: ${usersWithDuplicates.length}`);

  for (const [userId, roles] of usersWithDuplicates) {
    console.log(`\n👤 Usuario: ${userId}`);
    console.log(`   Roles encontrados: ${roles.length}`);
    
    // Obtener email del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    console.log(`   Email: ${profile?.email || 'N/A'}`);

    // Mantener solo el más reciente (primero en el array porque ordenamos DESC)
    const [keepRole, ...deleteRoles] = roles;
    
    console.log(`   ✅ Manteniendo rol: ${keepRole.role_id} (creado: ${keepRole.created_at})`);
    
    // Eliminar los demás
    for (const roleToDelete of deleteRoles) {
      console.log(`   🗑️  Eliminando rol duplicado: ${roleToDelete.role_id} (creado: ${roleToDelete.created_at})`);
      
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleToDelete.id);

      if (deleteError) {
        console.error(`   ❌ Error eliminando rol ${roleToDelete.id}:`, deleteError);
      } else {
        console.log(`   ✅ Rol eliminado exitosamente`);
      }
    }
  }

  console.log('\n✨ Proceso completado!');
}

fixDuplicateRoles().catch(console.error);