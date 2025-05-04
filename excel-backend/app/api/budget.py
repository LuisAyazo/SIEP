from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson.objectid import ObjectId

from ..db.connection import get_database
from ..auth.security import get_current_active_user

router = APIRouter()
database = get_database()

@router.post("/budget/", response_description="Crear nuevo presupuesto", status_code=status.HTTP_201_CREATED)
async def create_budget(
    project_id: str,
    title: str,
    description: Optional[str] = None,
    budget_data: Dict[str, Any] = None,
    total_amount: float = 0,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Crea un nuevo registro de presupuesto
    """
    budget = {
        "project_id": project_id,
        "title": title,
        "description": description,
        "budget_data": budget_data or {},
        "total_amount": total_amount,
        "created_by": str(current_user["_id"]),
        "created_at": datetime.utcnow(),
        "status": "draft"
    }
    
    new_budget = await database["budgets"].insert_one(budget)
    
    return {"id": str(new_budget.inserted_id), **budget}

@router.get("/budget/", response_description="Listar todos los presupuestos")
async def list_budgets(
    project_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Lista todos los presupuestos, opcionalmente filtrando por proyecto y estado
    """
    query = {}
    if project_id:
        query["project_id"] = project_id
    if status:
        query["status"] = status
    
    budgets = []
    async for budget in database["budgets"].find(query).sort("created_at", -1):
        budget["id"] = str(budget.pop("_id"))
        budgets.append(budget)
    
    return budgets

@router.get("/budget/{budget_id}", response_description="Obtener un presupuesto por ID")
async def get_budget(budget_id: str, current_user: dict = Depends(get_current_active_user)):
    """
    Recupera un presupuesto específico por su ID
    """
    try:
        budget = await database["budgets"].find_one({"_id": ObjectId(budget_id)})
        if budget:
            budget["id"] = str(budget.pop("_id"))
            return budget
        
        raise HTTPException(status_code=404, detail=f"Presupuesto con ID {budget_id} no encontrado")
    except:
        raise HTTPException(status_code=400, detail="ID de presupuesto inválido")

@router.get("/budget/project/{project_id}", response_description="Obtener presupuestos por proyecto")
async def get_budgets_by_project(project_id: str, current_user: dict = Depends(get_current_active_user)):
    """
    Recupera todos los presupuestos asociados a un proyecto específico
    """
    budgets = []
    async for budget in database["budgets"].find({"project_id": project_id}).sort("created_at", -1):
        budget["id"] = str(budget.pop("_id"))
        budgets.append(budget)
    
    return budgets

@router.put("/budget/{budget_id}", response_description="Actualizar un presupuesto")
async def update_budget(
    budget_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
    budget_data: Optional[Dict[str, Any]] = None,
    total_amount: Optional[float] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Actualiza la información de un presupuesto existente
    """
    try:
        budget = await database["budgets"].find_one({"_id": ObjectId(budget_id)})
        
        if not budget:
            raise HTTPException(status_code=404, detail=f"Presupuesto con ID {budget_id} no encontrado")
        
        update_data = {
            "updated_at": datetime.utcnow(),
            "updated_by": str(current_user["_id"])
        }
        
        # Solo actualizar campos que fueron proporcionados
        if title is not None:
            update_data["title"] = title
        if description is not None:
            update_data["description"] = description
        if budget_data is not None:
            update_data["budget_data"] = budget_data
        if total_amount is not None:
            update_data["total_amount"] = total_amount
        if status is not None:
            update_data["status"] = status
        
        # Actualizar presupuesto
        await database["budgets"].update_one(
            {"_id": ObjectId(budget_id)},
            {"$set": update_data}
        )
        
        # Obtener presupuesto actualizado
        updated_budget = await database["budgets"].find_one({"_id": ObjectId(budget_id)})
        updated_budget["id"] = str(updated_budget.pop("_id"))
        
        return updated_budget
    except:
        raise HTTPException(status_code=400, detail="ID de presupuesto inválido")

@router.delete("/budget/{budget_id}", response_description="Eliminar un presupuesto")
async def delete_budget(budget_id: str, current_user: dict = Depends(get_current_active_user)):
    """
    Elimina un presupuesto por su ID
    """
    try:
        delete_result = await database["budgets"].delete_one({"_id": ObjectId(budget_id)})
        
        if delete_result.deleted_count == 1:
            return JSONResponse(content={"detail": "Presupuesto eliminado correctamente"})
        
        raise HTTPException(status_code=404, detail=f"Presupuesto con ID {budget_id} no encontrado")
    except:
        raise HTTPException(status_code=400, detail="ID de presupuesto inválido")