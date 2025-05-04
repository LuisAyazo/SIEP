import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.database import Database

# Get MongoDB URI from environment variable (provided in docker-compose)
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/excel_db")

# Create MongoDB client
client = AsyncIOMotorClient(MONGO_URI)

# Connect to database
db = client.get_database()

async def get_db() -> Database:
    """
    Dependency function to get the MongoDB database connection.
    Used as FastAPI dependency injection.
    """
    return db

# Alias for get_db to maintain compatibility with existing code
get_database = get_db
