#!/usr/bin/env python3

import pymongo

# Conexión a la base de datos
MONGO_URI = "mongodb://mongo:27017"  # Ajusta según tu configuración
DB_NAME = "excel"

# Definir las descripciones correctas para cada rol
ROLE_DESCRIPTIONS = {
    "admin": "Acceso completo al sistema",
    "operacion": "Gestión de fichas y datos",
    "usuario": "Visualización y funciones básicas",
    "excel_editor": "Edición de ficheros Excel y gestión de datos"
}

def main():
    # Conectar a MongoDB
    client = pymongo.MongoClient(MONGO_URI)
    db = client[DB_NAME]
    
    # Verificar antes de corregir
    print("Roles antes de la corrección:")
    for role in db.roles.find():
        desc = role.get("description", "NO TIENE DESCRIPCIÓN")
        print(f"- {role['name']}: {desc}")
    
    # Corregir cada rol
    for role_name, description in ROLE_DESCRIPTIONS.items():
        # Encontrar el rol y actualizar su descripción
        result = db.roles.update_one(
            {"name": role_name},
            {"$set": {"description": description}}
        )
        print(f"Rol '{role_name}' actualizado: {result.modified_count} documento(s)")
    
    # Verificar después de corregir
    print("\nRoles después de la corrección:")
    for role in db.roles.find():
        print(f"- {role['name']}: {role.get('description', 'NO TIENE DESCRIPCIÓN')}")
    
    client.close()
    print("\n¡Proceso completado!")

if __name__ == "__main__":
    main()
