from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import List
from datetime import datetime, timedelta
# Intentar importar bson desde pymongo y proporcionar una alternativa si no está disponible
try:
    from pymongo.bson import ObjectId
except ImportError:
    try:
        from bson.objectid import ObjectId
    except ImportError:
        # Si bson no está disponible, crear una clase ObjectId simplificada
        class ObjectId:
            def __init__(self, id_str=None):
                self.id_str = id_str if id_str else ""
            
            def __str__(self):
                return self.id_str
            
from jose import JWTError, jwt

from app.db.connection import get_db
from app.db.models import UserCreate, UserResponse, UserDB, Role
from app.auth.security import verify_password, get_password_hash, create_access_token, SECRET_KEY, ALGORITHM

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Helper function to convert MongoDB ObjectId to string
def convert_objectid(user):
    user["id"] = str(user.get("_id"))
    user.pop("_id", None)
    return user

# Auth functions
async def get_user_by_username(db, username: str):
    user = await db.users.find_one({"username": username})
    if user:
        return convert_objectid(user)
    return None

async def get_current_user(db=Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = await get_user_by_username(db, username)
    if user is None:
        raise credentials_exception
    return user

# User endpoints
@router.post("/token", tags=["auth"])
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    user = await get_user_by_username(db, form_data.username)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/users/", response_model=UserResponse, tags=["users"])
async def create_user(user: UserCreate, db=Depends(get_db)):
    # Check if user already exists
    existing_user = await db.users.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    existing_email = await db.users.find_one({"email": user.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check if role exists
    role = await db.roles.find_one({"name": user.role})
    if not role and user.role != "user":
        raise HTTPException(status_code=400, detail=f"Role {user.role} does not exist")
    
    # Create user in database
    user_dict = user.dict()
    hashed_password = get_password_hash(user_dict.pop("password"))
    
    new_user = {
        **user_dict,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow(),
        "updated_at": None
    }
    
    result = await db.users.insert_one(new_user)
    
    created_user = await db.users.find_one({"_id": result.inserted_id})
    return convert_objectid(created_user)

@router.get("/users/", response_model=List[UserResponse], tags=["users"])
async def get_users(skip: int = 0, limit: int = 100, db=Depends(get_db), 
                   current_user: dict = Depends(get_current_user)):
    # Check if current user has admin role
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    users = []
    cursor = db.users.find().skip(skip).limit(limit)
    async for user in cursor:
        users.append(convert_objectid(user))
    return users

@router.get("/users/me", response_model=UserResponse, tags=["users"])
async def get_user_me(current_user: dict = Depends(get_current_user)):
    return current_user

@router.get("/users/{user_id}", response_model=UserResponse, tags=["users"])
async def get_user(user_id: str, db=Depends(get_db),
                  current_user: dict = Depends(get_current_user)):
    # Check if admin or self
    if current_user["role"] != "admin" and current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    try:
        obj_id = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
        
    user = await db.users.find_one({"_id": obj_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return convert_objectid(user)

@router.put("/users/{user_id}", response_model=UserResponse, tags=["users"])
async def update_user(user_id: str, user_update: UserCreate, db=Depends(get_db),
                     current_user: dict = Depends(get_current_user)):
    # Check if admin or self
    if current_user["role"] != "admin" and current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        obj_id = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    user = await db.users.find_one({"_id": obj_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check username uniqueness if changed
    if user_update.username != user["username"]:
        existing_user = await db.users.find_one({"username": user_update.username})
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already taken")
    
    # Check email uniqueness if changed
    if user_update.email != user["email"]:
        existing_email = await db.users.find_one({"email": user_update.email})
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    # Prepare update data
    update_data = user_update.dict(exclude={"password"})
    update_data["updated_at"] = datetime.utcnow()
    
    # Update password if provided
    if user_update.password:
        update_data["hashed_password"] = get_password_hash(user_update.password)
    
    await db.users.update_one(
        {"_id": obj_id},
        {"$set": update_data}
    )
    
    updated_user = await db.users.find_one({"_id": obj_id})
    return convert_objectid(updated_user)

@router.delete("/users/{user_id}", tags=["users"])
async def delete_user(user_id: str, db=Depends(get_db),
                     current_user: dict = Depends(get_current_user)):
    # Only admin can delete users, or users can delete themselves
    if current_user["role"] != "admin" and current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        obj_id = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    result = await db.users.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}
