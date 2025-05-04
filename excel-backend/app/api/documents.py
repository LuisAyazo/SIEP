from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import JSONResponse
from typing import List, Optional
import os
import shutil
from datetime import datetime
from bson.objectid import ObjectId
import uuid

from ..db.models import Document
from ..db.connection import get_database
from ..auth.security import get_current_user, get_current_active_user

router = APIRouter()
database = get_database()

# Directorio para guardar archivos subidos
UPLOAD_DIR = "./uploads/documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", response_description="Agregar nuevo documento", status_code=status.HTTP_201_CREATED)
async def create_document(title: str, description: Optional[str] = None, 
                         project_id: Optional[str] = None,
                         file: UploadFile = File(...),
                         current_user: dict = Depends(get_current_active_user)):
    """
    Crea un nuevo documento con el archivo subido
    """
    # Crear un nombre único para el archivo
    file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
    file_name = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    
    # Guardar el archivo
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Crear documento en la base de datos
    document = {
        "title": title,
        "description": description,
        "file_path": file_path,
        "file_type": file_extension,
        "uploaded_by": str(current_user["_id"]),
        "project_id": project_id,
        "created_at": datetime.utcnow()
    }
    
    new_document = await database["documents"].insert_one(document)
    
    return {"id": str(new_document.inserted_id), **document}

@router.get("/", response_description="Listar todos los documentos")
async def list_documents(project_id: Optional[str] = None, current_user: dict = Depends(get_current_active_user)):
    """
    Lista todos los documentos, opcionalmente filtrando por proyecto
    """
    query = {}
    if project_id:
        query["project_id"] = project_id
    
    documents = []
    async for doc in database["documents"].find(query).sort("created_at", -1):
        doc["id"] = str(doc.pop("_id"))
        documents.append(doc)
    
    return documents

@router.get("/{document_id}", response_description="Obtener un documento por ID")
async def get_document(document_id: str, current_user: dict = Depends(get_current_active_user)):
    """
    Recupera un documento específico por su ID
    """
    document = await database["documents"].find_one({"_id": ObjectId(document_id)})
    if document:
        document["id"] = str(document.pop("_id"))
        return document
    
    raise HTTPException(status_code=404, detail=f"Documento con ID {document_id} no encontrado")

@router.delete("/{document_id}", response_description="Eliminar un documento")
async def delete_document(document_id: str, current_user: dict = Depends(get_current_active_user)):
    """
    Elimina un documento por su ID
    """
    # Recuperar documento para obtener la ruta del archivo
    document = await database["documents"].find_one({"_id": ObjectId(document_id)})
    
    if not document:
        raise HTTPException(status_code=404, detail=f"Documento con ID {document_id} no encontrado")
    
    # Eliminar el archivo físico
    try:
        os.remove(document["file_path"])
    except OSError:
        # Si no se encuentra el archivo, continuamos con la eliminación de la BD
        pass
    
    # Eliminar el documento de la base de datos
    delete_result = await database["documents"].delete_one({"_id": ObjectId(document_id)})
    
    if delete_result.deleted_count == 1:
        return JSONResponse(content={"detail": "Documento eliminado correctamente"})
    
    raise HTTPException(status_code=404, detail=f"Error al eliminar el documento con ID {document_id}")

@router.put("/{document_id}", response_description="Actualizar un documento")
async def update_document(document_id: str, title: str, description: Optional[str] = None,
                         project_id: Optional[str] = None,
                         current_user: dict = Depends(get_current_active_user)):
    """
    Actualiza la información de un documento existente (sin cambiar el archivo)
    """
    document = await database["documents"].find_one({"_id": ObjectId(document_id)})
    
    if not document:
        raise HTTPException(status_code=404, detail=f"Documento con ID {document_id} no encontrado")
    
    update_data = {
        "title": title,
        "description": description,
        "project_id": project_id,
        "updated_at": datetime.utcnow()
    }
    
    # Filtrar campos None
    update_data = {k: v for k, v in update_data.items() if v is not None}
    
    # Actualizar documento
    await database["documents"].update_one(
        {"_id": ObjectId(document_id)},
        {"$set": update_data}
    )
    
    # Obtener documento actualizado
    updated_document = await database["documents"].find_one({"_id": ObjectId(document_id)})
    updated_document["id"] = str(updated_document.pop("_id"))
    
    return updated_document