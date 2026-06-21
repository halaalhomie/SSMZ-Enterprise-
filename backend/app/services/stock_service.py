from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.models import StockTransaction, Product, TransactionType
from app.schemas.schemas import StockInCreate, StockOutCreate
from app.services.activity_service import log_activity
from app.services.audit_service import check_low_stock_notification


class StockService:

    @staticmethod
    async def stock_in(
        db: AsyncSession, store_id: UUID, user_id: UUID, data: StockInCreate
    ) -> StockTransaction:
        # Verify product belongs to store
        result = await db.execute(
            select(Product).where(Product.id == data.product_id, Product.store_id == store_id)
        )
        product = result.scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

        # Create transaction
        txn = StockTransaction(
            store_id=store_id,
            product_id=data.product_id,
            user_id=user_id,
            supplier_id=data.supplier_id,
            type=TransactionType.STOCK_IN,
            quantity=data.quantity,
            cost_per_unit=data.cost_per_unit,
            invoice_number=data.invoice_number,
            remarks=data.remarks,
        )
        db.add(txn)

        # Update product quantity
        product.quantity += data.quantity
        await db.flush()

        await log_activity(
            db, store_id, user_id, "stock_in", "product", data.product_id,
            {"quantity": data.quantity, "product_name": product.name}
        )
        return txn

    @staticmethod
    async def stock_out(
        db: AsyncSession, store_id: UUID, user_id: UUID, data: StockOutCreate
    ) -> StockTransaction:
        result = await db.execute(
            select(Product).where(Product.id == data.product_id, Product.store_id == store_id)
        )
        product = result.scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

        # Prevent negative inventory
        if product.quantity < data.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock. Available: {product.quantity}, Requested: {data.quantity}",
            )

        txn = StockTransaction(
            store_id=store_id,
            product_id=data.product_id,
            user_id=user_id,
            type=TransactionType.STOCK_OUT,
            quantity=data.quantity,
            reason=data.reason,
        )
        db.add(txn)

        product.quantity -= data.quantity
        await db.flush()

        await log_activity(
            db, store_id, user_id, "stock_out", "product", data.product_id,
            {"quantity": data.quantity, "product_name": product.name}
        )
        await check_low_stock_notification(db, product)
        return txn

    @staticmethod
    async def get_ledger(
        db: AsyncSession,
        store_id: UUID,
        page: int = 1,
        page_size: int = 20,
        transaction_type: str = None,
        product_id: UUID = None,
    ) -> dict:
        query = (
            select(StockTransaction)
            .options(
                selectinload(StockTransaction.product),
                selectinload(StockTransaction.user),
                selectinload(StockTransaction.supplier),
            )
            .where(StockTransaction.store_id == store_id)
            .order_by(StockTransaction.created_at.desc())
        )

        if transaction_type:
            query = query.where(StockTransaction.type == transaction_type)

        if product_id:
            query = query.where(StockTransaction.product_id == product_id)

        total_result = await db.execute(select(func.count()).select_from(query.subquery()))
        total = total_result.scalar()

        result = await db.execute(query.offset((page - 1) * page_size).limit(page_size))
        transactions = result.scalars().all()

        return {
            "items": transactions,
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": (total + page_size - 1) // page_size,
        }

    @staticmethod
    async def get_today_summary(db: AsyncSession, store_id: UUID) -> dict:
        from datetime import date, datetime, timezone
        today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)

        result = await db.execute(
            select(
                StockTransaction.type,
                func.sum(StockTransaction.quantity).label("total_qty"),
                func.count(StockTransaction.id).label("count"),
            )
            .where(
                StockTransaction.store_id == store_id,
                StockTransaction.created_at >= today_start,
            )
            .group_by(StockTransaction.type)
        )
        rows = result.all()

        summary = {"stock_in": 0, "stock_out": 0, "in_count": 0, "out_count": 0}
        for row in rows:
            if row.type == TransactionType.STOCK_IN:
                summary["stock_in"] = int(row.total_qty or 0)
                summary["in_count"] = int(row.count or 0)
            elif row.type == TransactionType.STOCK_OUT:
                summary["stock_out"] = int(row.total_qty or 0)
                summary["out_count"] = int(row.count or 0)

        return summary
