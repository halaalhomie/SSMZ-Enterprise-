from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from fastapi import HTTPException, status

from app.models.models import User, UserRole, Store
from app.schemas.schemas import LoginRequest, UserCreate, TokenResponse, UserOut
from app.core.security import (
    verify_password, hash_password,
    create_access_token, create_refresh_token, decode_token
)
from app.services.activity_service import log_activity


class AuthService:

    @staticmethod
    async def login(db: AsyncSession, data: LoginRequest) -> TokenResponse:
        result = await db.execute(select(User).where(User.email == data.email))
        user = result.scalar_one_or_none()

        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is disabled. Contact your owner.",
            )

        # Update last_login
        await db.execute(
            update(User).where(User.id == user.id).values(last_login=datetime.now(timezone.utc))
        )

        token_data = {"sub": str(user.id), "store_id": str(user.store_id), "role": user.role}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        await log_activity(db, user.store_id, user.id, "user_login", "user", user.id)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserOut.model_validate(user),
        )

    @staticmethod
    async def register_owner(db: AsyncSession, data: UserCreate, store_name: str) -> TokenResponse:
        # Check email uniqueness
        existing = await db.execute(select(User).where(User.email == data.email))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

        # Create store
        store = Store(name=store_name)
        db.add(store)
        await db.flush()

        # Create owner user
        user = User(
            store_id=store.id,
            name=data.name,
            email=data.email,
            password_hash=hash_password(data.password),
            role=UserRole.OWNER,
        )
        db.add(user)
        await db.flush()

        token_data = {"sub": str(user.id), "store_id": str(store.id), "role": user.role}
        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
            user=UserOut.model_validate(user),
        )

    @staticmethod
    async def refresh_token(db: AsyncSession, refresh_token: str) -> TokenResponse:
        payload = decode_token(refresh_token)

        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

        result = await db.execute(select(User).where(User.id == UUID(payload["sub"])))
        user = result.scalar_one_or_none()

        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

        token_data = {"sub": str(user.id), "store_id": str(user.store_id), "role": user.role}
        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
            user=UserOut.model_validate(user),
        )

    @staticmethod
    async def change_password(
        db: AsyncSession, user: User, current_password: str, new_password: str
    ) -> dict:
        if not verify_password(current_password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

        await db.execute(
            update(User).where(User.id == user.id).values(password_hash=hash_password(new_password))
        )
        await log_activity(db, user.store_id, user.id, "password_changed", "user", user.id)
        return {"message": "Password changed successfully"}
