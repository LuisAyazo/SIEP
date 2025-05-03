from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from bson.objectid import ObjectId

from app.db.connection import get_db
from app.db.models import Role
from app.api.users import get_current_user

router = APIRouter()

# Helper function to convert MongoDB ObjectId to string
def convert_objectid(role):
    role["id"] = str(role.get("_id"))
    role.pop("_id", None)
    return role

@router.post("/roles/", response_model=Role, tags=["roles"])
async def create_role(role: Role, db=Depends(get_db), 
                     current_user: dict = Depends(get_current_user)):
    # Only admins can create roles
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if role already exists
    existing_role = await db.roles.find_one({"name": role.name})
    if existing_role:
        raise HTTPException(status_code=400, detail="Role already exists")
    
    # Create role in database
    role_dict = role.dict()
    result = await db.roles.insert_one(role_dict)
    
    created_role = await db.roles.find_one({"_id": result.inserted_id})
    return convert_objectid(created_role)

@router.get("/roles/", response_model=List[Role], tags=["roles"])
async def get_roles(skip: int = 0, limit: int = 10, db=Depends(get_db),
                   current_user: dict = Depends(get_current_user)):
    roles = []
    cursor = db.roles.find().skip(skip).limit(limit)
    async for role in cursor:
        roles.append(convert_objectid(role))
    return roles

@router.get("/roles/{role_id}", response_model=Role, tags=["roles"])
async def get_role(role_id: str, db=Depends(get_db),
                  current_user: dict = Depends(get_current_user)):
    try:
        obj_id = ObjectId(role_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid role ID format")
        
    role = await db.roles.find_one({"_id": obj_id})
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    return convert_objectid(role)

@router.put("/roles/{role_id}", response_model=Role, tags=["roles"])
async def update_role(role_id: str, role_update: Role, db=Depends(get_db),
                     current_user: dict = Depends(get_current_user)):
    # Only admins can update roles
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        obj_id = ObjectId(role_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid role ID format")
    
    role = await db.roles.find_one({"_id": obj_id})
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Update role
    update_data = role_update.dict()
    update_data["updated_at"] = datetime.utcnow()
    
    await db.roles.update_one(
        {"_id": obj_id},
        {"$set": update_data}
    )
    
    updated_role = await db.roles.find_one({"_id": obj_id})
    return convert_objectid(updated_role)

@router.delete("/roles/{role_id}", tags=["roles"])
async def delete_role(role_id: str, db=Depends(get_db),
                     current_user: dict = Depends(get_current_user)):
    # Only admins can delete roles
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        obj_id = ObjectId(role_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid role ID format")
    
    # Check if role is being used by any user
    user_with_role = await db.users.find_one({"role": role_id})
    if user_with_role:
        raise HTTPException(status_code=400, detail="Cannot delete role that is assigned to users")
    
    result = await db.roles.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Role not found")
    
    return {"message": "Role deleted successfully"}
