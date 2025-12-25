import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def get_db_connection():
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL is not set")
    return await asyncpg.connect(DATABASE_URL)

async def create_pool():
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL is not set")
    return await asyncpg.create_pool(DATABASE_URL)
