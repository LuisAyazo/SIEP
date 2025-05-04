from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr

class Role(BaseModel):
    """Role model for user permissions"""
    name: str
    permissions: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "name": "admin",
                "permissions": ["read", "write", "delete", "admin"]
            }
        }

class UserCreate(BaseModel):
    """Schema for creating a new user"""
    username: str
    email: str
    password: str
    full_name: Optional[str] = None
    role: str = "user"  # default role
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "username": "johndoe",
                "email": "john@example.com",
                "password": "secretpassword",
                "full_name": "John Doe",
                "role": "user"
            }
        }

class UserResponse(BaseModel):
    """Schema for user response (without password)"""
    id: Optional[str] = None
    username: str
    email: str
    full_name: Optional[str] = None
    role: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True

class UserDB(UserResponse):
    """Internal user model with hashed password"""
    hashed_password: str

# Nuevos modelos para otras secciones

class Document(BaseModel):
    """Document model for storing document metadata"""
    title: str
    description: Optional[str] = None
    file_path: str
    file_type: str
    uploaded_by: str  # user ID
    project_id: Optional[str] = None  # project ID if associated
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "title": "Informe de Gastos",
                "description": "Informe mensual de gastos del proyecto X",
                "file_path": "/storage/documents/informe_gastos.pdf",
                "file_type": "pdf",
                "uploaded_by": "user123",
                "project_id": "project456"
            }
        }

class Form(BaseModel):
    """Form model for storing form definitions"""
    title: str
    description: Optional[str] = None
    fields: List[Dict[str, Any]] = []  # JSON schema for the form fields
    created_by: str  # user ID
    is_template: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "title": "Solicitud de Presupuesto",
                "description": "Formulario para solicitar presupuesto para un proyecto",
                "fields": [
                    {
                        "name": "project_name",
                        "type": "text",
                        "label": "Nombre del Proyecto",
                        "required": True
                    },
                    {
                        "name": "amount",
                        "type": "number",
                        "label": "Monto Solicitado",
                        "required": True
                    }
                ],
                "created_by": "user123",
                "is_template": True
            }
        }

class FormSubmission(BaseModel):
    """Model for storing form submissions"""
    form_id: str
    submitted_by: str  # user ID
    project_id: Optional[str] = None  # project ID if associated
    values: Dict[str, Any]  # Key-value pairs of form field values
    status: str = "pendiente"  # pendiente, aprobado, rechazado
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True

class Project(BaseModel):
    """Project model for storing project information"""
    name: str
    description: Optional[str] = None
    status: str = "activo"  # activo, pausado, completado
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    manager_id: str  # user ID of project manager
    team_members: List[str] = []  # list of user IDs
    budget_id: Optional[str] = None  # Budget ID if associated
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "name": "Desarrollo Web",
                "description": "Proyecto para el desarrollo de sitio web corporativo",
                "status": "activo",
                "manager_id": "user123",
                "team_members": ["user456", "user789"]
            }
        }

class BudgetItem(BaseModel):
    """Budget item model for individual budget entries"""
    description: str
    category: str
    amount: float
    status: str = "pendiente"  # pendiente, aprobado, rechazado
    
    class Config:
        populate_by_name = True

class Budget(BaseModel):
    """Budget model for project budgets"""
    title: str
    description: Optional[str] = None
    project_id: Optional[str] = None  # project ID if associated
    total_amount: float
    items: List[BudgetItem] = []
    status: str = "borrador"  # borrador, pendiente, aprobado, rechazado
    created_by: str  # user ID
    approved_by: Optional[str] = None  # user ID of approver
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "title": "Presupuesto 2025 - Proyecto Web",
                "description": "Presupuesto para el proyecto de desarrollo web",
                "project_id": "project456",
                "total_amount": 50000,
                "items": [
                    {
                        "description": "Desarrollo Frontend",
                        "category": "Desarrollo",
                        "amount": 20000,
                        "status": "aprobado"
                    },
                    {
                        "description": "Desarrollo Backend",
                        "category": "Desarrollo",
                        "amount": 30000,
                        "status": "pendiente"
                    }
                ],
                "status": "pendiente",
                "created_by": "user123"
            }
        }
