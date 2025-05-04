#!/usr/bin/env python3
# Script para registrar usuarios de prueba en la base de datos
import asyncio
import os
import sys
from datetime import datetime

# Asegurar que se pueda importar del directorio padre
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db.connection import client
from app.auth.security import get_password_hash

# Los usuarios mockeados con correos de unicartagena.edu.co
mock_users = [
    {
        "username": "admin_test",
        "email": "admin_test@unicartagena.edu.co",
        "full_name": "Administrador del Sistema",
        "role": "admin",
        "password": "admin123",
        "created_at": "2025-04-01T10:00:00Z"
    },
    {
        "username": "operario",
        "email": "operario@unicartagena.edu.co",
        "full_name": "Usuario Operario",
        "role": "operacion",
        "password": "operario123",
        "created_at": "2025-04-02T10:00:00Z"
    },
    {
        "username": "usuario",
        "email": "usuario@unicartagena.edu.co",
        "full_name": "Usuario Regular",
        "role": "usuario",
        "password": "usuario123",
        "created_at": "2025-04-03T10:00:00Z"
    },
    {
        "username": "soporte",
        "email": "soporte@unicartagena.edu.co",
        "full_name": "Equipo Soporte",
        "role": "operacion",
        "password": "soporte123",
        "created_at": "2025-04-04T10:00:00Z"
    },
    {
        "username": "invitado",
        "email": "invitado@unicartagena.edu.co",
        "full_name": "Usuario Invitado",
        "role": "usuario",
        "password": "invitado123",
        "created_at": "2025-04-05T10:00:00Z"
    },
    {
        "username": "luis.ayazo",
        "email": "luis.ayazo@unicartagena.edu.co",
        "full_name": "Luis Ayazo",
        "role": "excel_editor",
        "password": "luis123",
        "created_at": "2025-04-06T10:00:00Z"
    }
]

async def create_roles_if_not_exist():
    """Crear roles si no existen"""
    db = client.get_database()
    
    # Verificar y crear rol admin
    admin_role = await db.roles.find_one({"name": "admin"})
    if not admin_role:
        await db.roles.insert_one({
            "name": "admin",
            "permissions": ["read", "write", "delete", "admin"],
            "created_at": datetime.utcnow()
        })
        print("Rol 'admin' creado")
    
    # Verificar y crear rol operacion
    operacion_role = await db.roles.find_one({"name": "operacion"})
    if not operacion_role:
        await db.roles.insert_one({
            "name": "operacion",
            "permissions": ["read", "write", "edit"],
            "created_at": datetime.utcnow()
        })
        print("Rol 'operacion' creado")
    
    # Verificar y crear rol usuario
    usuario_role = await db.roles.find_one({"name": "usuario"})
    if not usuario_role:
        await db.roles.insert_one({
            "name": "usuario",
            "permissions": ["read"],
            "created_at": datetime.utcnow()
        })
        print("Rol 'usuario' creado")
        
    # Verificar y crear rol excel_editor
    excel_editor_role = await db.roles.find_one({"name": "excel_editor"})
    if not excel_editor_role:
        await db.roles.insert_one({
            "name": "excel_editor",
            "permissions": ["read", "write", "edit_excel"],
            "created_at": datetime.utcnow()
        })
        print("Rol 'excel_editor' creado")

async def register_mock_users():
    """Registrar los usuarios mockeados en la base de datos"""
    db = client.get_database()
    
    # Verificar y crear roles
    await create_roles_if_not_exist()
    
    # Registrar cada usuario mockeado
    for user_data in mock_users:
        # Verificar si el usuario ya existe
        existing_user = await db.users.find_one({"username": user_data["username"]})
        if existing_user:
            print(f"El usuario '{user_data['username']}' ya existe en la base de datos")
            continue
        
        # También verificar por correo electrónico
        existing_email = await db.users.find_one({"email": user_data["email"]})
        if existing_email:
            print(f"Ya existe un usuario con el correo '{user_data['email']}' en la base de datos")
            continue
        
        # Hashear la contraseña
        hashed_password = get_password_hash(user_data["password"])
        
        # Crear el usuario en la base de datos
        new_user = {
            "username": user_data["username"],
            "email": user_data["email"],
            "full_name": user_data["full_name"],
            "hashed_password": hashed_password,
            "role": user_data["role"],
            "created_at": datetime.fromisoformat(user_data["created_at"].replace("Z", "+00:00")),
            "is_active": True
        }
        
        result = await db.users.insert_one(new_user)
        print(f"Usuario '{user_data['username']}' creado con ID: {result.inserted_id}")

async def main():
    """Función principal"""
    print("Iniciando registro de usuarios mockeados...")
    try:
        await register_mock_users()
        print("Registro completado con éxito")
    except Exception as e:
        print(f"Error al registrar usuarios: {str(e)}")
    finally:
        # Cerrar la conexión
        client.close()
        print("Conexión cerrada")

if __name__ == "__main__":
    asyncio.run(main())