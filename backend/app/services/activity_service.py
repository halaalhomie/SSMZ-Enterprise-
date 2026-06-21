from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from sqlalchemy.orm import selectinload

from app.models.models import ActivityLog, Notification


async def log_activity(
    db: AsyncSession,
    store_id: UUID,
    user_id: Optional[UUID],
    action: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[UUID] = None,
    metadata: Optional[dict] = None,
) -> None:
    log = ActivityLog(
        store_id=store_id,
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        extra_data=metadata or {},
    )
    db.add(log)


class ActivityService:
    @staticmethod
    async def get_logs(
        db: AsyncSession,
        store_id: UUID,
        page: int = 1,
        page_size: int = 50,
        action: Optional[str] = None,
    ) -> dict:
        query = (
            select(ActivityLog)
            .options(selectinload(ActivityLog.user))
            .where(ActivityLog.store_id == store_id)
            .order_by(ActivityLog.created_at.desc())
        )
        if action:
            query = query.where(ActivityLog.action == action)

        total_result = await db.execute(select(func.count()).select_from(query.subquery()))
        total = total_result.scalar()
        result = await db.execute(query.offset((page - 1) * page_size).limit(page_size))
        logs = result.scalars().all()

        return {
            "items": logs,
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": (total + page_size - 1) // page_size,
        }


class NotificationService:
    @staticmethod
    async def get_user_notifications(
        db: AsyncSession, user_id: UUID, unread_only: bool = False
    ) -> list:
        query = (
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(50)
        )
        if unread_only:
            query = query.where(Notification.is_read == False)

        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def mark_all_read(db: AsyncSession, user_id: UUID) -> None:
        await db.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)
            .values(is_read=True)
        )
