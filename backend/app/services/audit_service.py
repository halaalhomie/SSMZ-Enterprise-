from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.models import StockAudit, Product, ActivityLog, Notification
from app.schemas.schemas import AuditCreate


# ─── Audit Service ────────────────────────────────────────────────────────────

class AuditService:

    @staticmethod
    async def create_audit(
        db: AsyncSession, store_id: UUID, user_id: UUID, data: AuditCreate
    ) -> StockAudit:
        # Fetch current db quantity
        result = await db.execute(
            select(Product).where(Product.id == data.product_id, Product.store_id == store_id)
        )
        product = result.scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

        difference = data.physical_quantity - product.quantity

        audit = StockAudit(
            store_id=store_id,
            product_id=data.product_id,
            user_id=user_id,
            db_quantity=product.quantity,
            physical_quantity=data.physical_quantity,
            difference=difference,
            notes=data.notes,
        )
        db.add(audit)
        await db.flush()

        from app.services.activity_service import log_activity
        await log_activity(
            db, store_id, user_id, "audit_created", "product", data.product_id,
            {"difference": difference, "product_name": product.name}
        )

        return audit

    @staticmethod
    async def list_audits(
        db: AsyncSession,
        store_id: UUID,
        page: int = 1,
        page_size: int = 20,
        product_id: Optional[UUID] = None,
    ) -> dict:
        query = (
            select(StockAudit)
            .options(selectinload(StockAudit.product), selectinload(StockAudit.user))
            .where(StockAudit.store_id == store_id)
            .order_by(StockAudit.created_at.desc())
        )

        if product_id:
            query = query.where(StockAudit.product_id == product_id)

        total_result = await db.execute(select(func.count()).select_from(query.subquery()))
        total = total_result.scalar()
        result = await db.execute(query.offset((page - 1) * page_size).limit(page_size))
        audits = result.scalars().all()

        return {
            "items": audits,
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": (total + page_size - 1) // page_size,
        }

    @staticmethod
    async def get_discrepancy_report(db: AsyncSession, store_id: UUID) -> dict:
        result = await db.execute(
            select(
                StockAudit.product_id,
                func.sum(StockAudit.difference).label("total_diff"),
                func.count(StockAudit.id).label("audit_count"),
            )
            .where(StockAudit.store_id == store_id, StockAudit.difference != 0)
            .group_by(StockAudit.product_id)
            .order_by(func.sum(StockAudit.difference))
        )
        rows = result.all()
        return {"discrepancies": [{"product_id": str(r.product_id), "total_difference": r.total_diff, "audit_count": r.audit_count} for r in rows]}


# ─── Activity Logger ─────────────────────────────────────────────────────────

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


# ─── Notification Helper ──────────────────────────────────────────────────────

async def check_low_stock_notification(
    db,
    product,
    user_id
):
    if product.quantity <= product.min_stock:
        notif = Notification(
            store_id=product.store_id,
            user_id=user_id,
            type="low_stock",
            message=(
                f"Low stock alert: {product.name} "
                f"has only {product.quantity} units left "
                f"(min: {product.min_stock})"
            ),
        )

        db.add(notif)