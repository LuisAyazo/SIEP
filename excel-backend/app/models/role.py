from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class RoleModel(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: List[str]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class RoleResponse(BaseModel):
    id: str
    name: str
    description: str  # Cambiado de Optional[str] a str para forzar que siempre esté presente
    permissions: List[str]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    users_count: Optional[int] = None  # Añadido para que el campo sea reconocido por Pydantic