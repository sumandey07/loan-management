from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt, JWTError
from typing import Optional
from models import User, get_session
from sqlmodel import select
from dotenv import load_dotenv
import os
from zoneinfo import ZoneInfo

ist = ZoneInfo("Asia/Kolkata")

load_dotenv()

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
SECRET_KEY = "bd81f94bfebc9d41255700a906fa6c657a43aad0272d59e05b97f02f15aa45bf"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24h


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        exp = datetime.now(ist) + expires_delta
    else:
        exp = datetime.now(ist) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": exp})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_user_by_username(username: str) -> Optional[User]:
    session = get_session()
    statement = select(User).where(User.username == username)
    user = session.exec(statement).first()
    session.close()
    return user


def authenticate_user(username: str, password: str) -> Optional[User]:
    user = get_user_by_username(username)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
