from datetime import datetime
from typing import List, Optional
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
