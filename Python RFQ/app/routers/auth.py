from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordBearer
from app.config.database import get_db_connection
import bcrypt
import jwt
import os
from datetime import datetime, timedelta

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key")
ALGORITHM = "HS256"

@router.post("/login")
async def login(email: str = Form(...), password: str = Form(...)):
    conn = await get_db_connection()
    try:
        user = await conn.fetchrow("SELECT * FROM users WHERE email = $1", email)
        
        if not user:
            return {"success": False, "message": "Invalid email or password"}
            
        # Verify password
        isValid = bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8'))
        
        if not isValid:
             return {"success": False, "message": "Invalid email or password"}
             
        # Create JWT token
        token_data = {
            "sub": str(user['id']),
            "email": user['email'],
            "role": user['role'],
            "full_name": user['full_name']
        }
        token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
        
        # In a real app, set cookie or return token
        return {"success": True, "token": token, "user": token_data}

    finally:
        await conn.close()

async def get_current_user(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
