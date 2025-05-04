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

# Si quieres roles y permisos más variados, puedes ajustar así:
# admin_test: admin (todos los permisos)
# operario: operacion (gestión de fichas y datos)
# usuario: usuario (solo visualización)
# soporte: operacion (gestión de fichas y datos)
# invitado: usuario (solo visualización)
# luis.ayazo: excel_editor (edición de excel y gestión de datos)

async def create_roles_if_not_exist():
    db = client.get_database()
    # Elimina cualquier rol que no tenga descripción o tenga descripción vacía
    await db.roles.delete_many({"$or": [{"description": {"$exists": False}}, {"description": ""}]})

    # Fuerza la actualización/creación de los roles válidos con descripción obligatoria
    await db.roles.update_one(
        {"name": "admin"},
        {
            "$set": {
                "description": "Acceso completo al sistema",
                "permissions": ["read", "write", "delete", "admin"],
            },
            "$setOnInsert": {"created_at": datetime.utcnow()}
        },
        upsert=True
    )
    await db.roles.update_one(
        {"name": "operacion"},
        {
            "$set": {
                "description": "Gestión de fichas y datos",
                "permissions": ["read", "write", "edit"],
            },
            "$setOnInsert": {"created_at": datetime.utcnow()}
        },
        upsert=True
    )
    await db.roles.update_one(
        {"name": "usuario"},
        {
            "$set": {
                "description": "Visualización y funciones básicas",
                "permissions": ["read"],
            },
            "$setOnInsert": {"created_at": datetime.utcnow()}
        },
        upsert=True
    )
    await db.roles.update_one(
        {"name": "excel_editor"},
        {
            "$set": {
                "description": "Edición de ficheros Excel y gestión de datos",
                "permissions": ["read", "write", "edit_excel"],
            },
            "$setOnInsert": {"created_at": datetime.utcnow()}
        },
        upsert=True
    )

async def register_mock_users():
    """Registrar o actualizar los usuarios mockeados en la base de datos"""
    db = client.get_database()
    await create_roles_if_not_exist()
    for user_data in mock_users:
        # Hashear la contraseña
        hashed_password = get_password_hash(user_data["password"])
        new_user = {
            "username": user_data["username"],
            "email": user_data["email"],
            "full_name": user_data["full_name"],
            "hashed_password": hashed_password,
            "role": user_data["role"],
            "created_at": datetime.fromisoformat(user_data["created_at"].replace("Z", "+00:00")),
            "is_active": True
        }
        # Actualiza si existe, si no, inserta
        result = await db.users.update_one(
            {"username": user_data["username"]},
            {"$set": new_user},
            upsert=True
        )
        if result.matched_count:
            print(f"Usuario '{user_data['username']}' actualizado")
        else:
            print(f"Usuario '{user_data['username']}' creado")

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