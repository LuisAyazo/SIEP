from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson.objectid import ObjectId

from ..db.connection import get_database
from ..auth.security import get_current_active_user

router = APIRouter()
database = get_database()

@router.post("/forms/", response_description="Crear nuevo formulario", status_code=status.HTTP_201_CREATED)
async def create_form(
    title: str,
    description: Optional[str] = None,
    project_id: Optional[str] = None,
    form_data: Dict[str, Any] = None,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Crea un nuevo formulario
    """
    form = {
        "title": title,
        "description": description,
        "project_id": project_id,
        "form_data": form_data or {},
        "created_by": str(current_user["_id"]),
        "created_at": datetime.utcnow(),
        "status": "draft"
    }
    
    new_form = await database["forms"].insert_one(form)
    
    return {"id": str(new_form.inserted_id), **form}

@router.get("/forms/", response_description="Listar todos los formularios")
async def list_forms(
    project_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Lista todos los formularios, opcionalmente filtrando por proyecto y estado
    """
    query = {}
    if project_id:
        query["project_id"] = project_id
    if status:
        query["status"] = status
    
    forms = []
    async for form in database["forms"].find(query).sort("created_at", -1):
        form["id"] = str(form.pop("_id"))
        forms.append(form)
    
    return forms

@router.get("/forms/{form_id}", response_description="Obtener un formulario por ID")
async def get_form(form_id: str, current_user: dict = Depends(get_current_active_user)):
    """
    Recupera un formulario específico por su ID
    """
    try:
        form = await database["forms"].find_one({"_id": ObjectId(form_id)})
        if form:
            form["id"] = str(form.pop("_id"))
            return form
        
        raise HTTPException(status_code=404, detail=f"Formulario con ID {form_id} no encontrado")
    except:
        raise HTTPException(status_code=400, detail="ID de formulario inválido")

@router.put("/forms/{form_id}", response_description="Actualizar un formulario")
async def update_form(
    form_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
    project_id: Optional[str] = None,
    form_data: Optional[Dict[str, Any]] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Actualiza la información de un formulario existente
    """
    try:
        form = await database["forms"].find_one({"_id": ObjectId(form_id)})
        
        if not form:
            raise HTTPException(status_code=404, detail=f"Formulario con ID {form_id} no encontrado")
        
        update_data = {
            "updated_at": datetime.utcnow(),
            "updated_by": str(current_user["_id"])
        }
        
        # Solo actualizar campos que fueron proporcionados
        if title is not None:
            update_data["title"] = title
        if description is not None:
            update_data["description"] = description
        if project_id is not None:
            update_data["project_id"] = project_id
        if form_data is not None:
            update_data["form_data"] = form_data
        if status is not None:
            update_data["status"] = status
        
        # Actualizar formulario
        await database["forms"].update_one(
            {"_id": ObjectId(form_id)},
            {"$set": update_data}
        )
        
        # Obtener formulario actualizado
        updated_form = await database["forms"].find_one({"_id": ObjectId(form_id)})
        updated_form["id"] = str(updated_form.pop("_id"))
        
        return updated_form
    except:
        raise HTTPException(status_code=400, detail="ID de formulario inválido")

@router.delete("/forms/{form_id}", response_description="Eliminar un formulario")
async def delete_form(form_id: str, current_user: dict = Depends(get_current_active_user)):
    """
    Elimina un formulario por su ID
    """
    try:
        delete_result = await database["forms"].delete_one({"_id": ObjectId(form_id)})
        
        if delete_result.deleted_count == 1:
            return JSONResponse(content={"detail": "Formulario eliminado correctamente"})
        
        raise HTTPException(status_code=404, detail=f"Formulario con ID {form_id} no encontrado")
    except:
        raise HTTPException(status_code=400, detail="ID de formulario inválido")