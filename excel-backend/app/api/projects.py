from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson.objectid import ObjectId

from ..db.connection import get_database
from ..auth.security import get_current_active_user

router = APIRouter()
database = get_database()

@router.post("/projects/", response_description="Crear nuevo proyecto", status_code=status.HTTP_201_CREATED)
async def create_project(
    name: str,
    description: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    budget: Optional[float] = 0,
    team_members: Optional[List[str]] = None,
    metadata: Optional[Dict[str, Any]] = None,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Crea un nuevo proyecto
    """
    project = {
        "name": name,
        "description": description,
        "start_date": start_date,
        "end_date": end_date,
        "budget": budget,
        "team_members": team_members or [],
        "metadata": metadata or {},
        "created_by": str(current_user["_id"]),
        "created_at": datetime.utcnow(),
        "status": "active"
    }
    
    new_project = await database["projects"].insert_one(project)
    
    return {"id": str(new_project.inserted_id), **project}

@router.get("/projects/", response_description="Listar todos los proyectos")
async def list_projects(
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Lista todos los proyectos, opcionalmente filtrando por estado y término de búsqueda
    """
    query = {}
    if status:
        query["status"] = status
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    projects = []
    async for project in database["projects"].find(query).sort("created_at", -1):
        project["id"] = str(project.pop("_id"))
        projects.append(project)
    
    return projects

@router.get("/projects/{project_id}", response_description="Obtener un proyecto por ID")
async def get_project(project_id: str, current_user: dict = Depends(get_current_active_user)):
    """
    Recupera un proyecto específico por su ID
    """
    try:
        project = await database["projects"].find_one({"_id": ObjectId(project_id)})
        if project:
            project["id"] = str(project.pop("_id"))
            return project
        
        raise HTTPException(status_code=404, detail=f"Proyecto con ID {project_id} no encontrado")
    except:
        raise HTTPException(status_code=400, detail="ID de proyecto inválido")

@router.put("/projects/{project_id}", response_description="Actualizar un proyecto")
async def update_project(
    project_id: str,
    name: Optional[str] = None,
    description: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    budget: Optional[float] = None,
    team_members: Optional[List[str]] = None,
    metadata: Optional[Dict[str, Any]] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Actualiza la información de un proyecto existente
    """
    try:
        project = await database["projects"].find_one({"_id": ObjectId(project_id)})
        
        if not project:
            raise HTTPException(status_code=404, detail=f"Proyecto con ID {project_id} no encontrado")
        
        update_data = {
            "updated_at": datetime.utcnow(),
            "updated_by": str(current_user["_id"])
        }
        
        # Solo actualizar campos que fueron proporcionados
        if name is not None:
            update_data["name"] = name
        if description is not None:
            update_data["description"] = description
        if start_date is not None:
            update_data["start_date"] = start_date
        if end_date is not None:
            update_data["end_date"] = end_date
        if budget is not None:
            update_data["budget"] = budget
        if team_members is not None:
            update_data["team_members"] = team_members
        if metadata is not None:
            update_data["metadata"] = metadata
        if status is not None:
            update_data["status"] = status
        
        # Actualizar proyecto
        await database["projects"].update_one(
            {"_id": ObjectId(project_id)},
            {"$set": update_data}
        )
        
        # Obtener proyecto actualizado
        updated_project = await database["projects"].find_one({"_id": ObjectId(project_id)})
        updated_project["id"] = str(updated_project.pop("_id"))
        
        return updated_project
    except:
        raise HTTPException(status_code=400, detail="ID de proyecto inválido")

@router.delete("/projects/{project_id}", response_description="Eliminar un proyecto")
async def delete_project(project_id: str, current_user: dict = Depends(get_current_active_user)):
    """
    Elimina un proyecto por su ID
    """
    try:
        delete_result = await database["projects"].delete_one({"_id": ObjectId(project_id)})
        
        if delete_result.deleted_count == 1:
            return JSONResponse(content={"detail": "Proyecto eliminado correctamente"})
        
        raise HTTPException(status_code=404, detail=f"Proyecto con ID {project_id} no encontrado")
    except:
        raise HTTPException(status_code=400, detail="ID de proyecto inválido")