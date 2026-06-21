from uuid import UUID
from decimal import Decimal
from datetime import date, datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.models.models import Product, StockTransaction, Supplier, Category, TransactionType
from app.schemas.schemas import DashboardStats


class DashboardService:

    @staticmethod
    async def get_stats(db: AsyncSession, store_id: UUID) -> DashboardStats:
        today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)

        # Total active products
        total_products_result = await db.execute(
            select(func.count(Product.id)).where(Product.store_id == store_id, Product.is_active == True)
        )
        total_products = total_products_result.scalar() or 0

        # Inventory value = sum(quantity * purchase_price)
        inv_value_result = await db.execute(
            select(func.sum(Product.quantity * Product.purchase_price))
            .where(Product.store_id == store_id, Product.is_active == True)
        )
        total_inventory_value = inv_value_result.scalar() or Decimal("0")

        # Low stock count
        low_stock_result = await db.execute(
            select(func.count(Product.id))
            .where(Product.store_id == store_id, Product.is_active == True, Product.quantity <= Product.min_stock)
        )
        low_stock_count = low_stock_result.scalar() or 0

        # Today stock in/out
        today_in_result = await db.execute(
            select(func.count(StockTransaction.id)).where(
                StockTransaction.store_id == store_id,
                StockTransaction.type == TransactionType.STOCK_IN,
                StockTransaction.created_at >= today_start,
            )
        )
        today_out_result = await db.execute(
            select(func.count(StockTransaction.id)).where(
                StockTransaction.store_id == store_id,
                StockTransaction.type == TransactionType.STOCK_OUT,
                StockTransaction.created_at >= today_start,
            )
        )

        # Total suppliers and categories
        suppliers_result = await db.execute(
            select(func.count(Supplier.id)).where(Supplier.store_id == store_id, Supplier.is_active == True)
        )
        categories_result = await db.execute(
            select(func.count(Category.id)).where(Category.store_id == store_id, Category.is_active == True)
        )

        return DashboardStats(
            total_products=total_products,
            total_inventory_value=total_inventory_value,
            low_stock_count=low_stock_count,
            today_stock_in=today_in_result.scalar() or 0,
            today_stock_out=today_out_result.scalar() or 0,
            total_suppliers=suppliers_result.scalar() or 0,
            total_categories=categories_result.scalar() or 0,
        )

    @staticmethod
    async def get_stock_movement_chart(db: AsyncSession, store_id: UUID, days: int = 30) -> list:
        """Daily stock in vs stock out for last N days."""
        since = datetime.now(timezone.utc) - timedelta(days=days)

        result = await db.execute(
            select(
                func.date(StockTransaction.created_at).label("day"),
                StockTransaction.type,
                func.sum(StockTransaction.quantity).label("total"),
            )
            .where(StockTransaction.store_id == store_id, StockTransaction.created_at >= since)
            .group_by(func.date(StockTransaction.created_at), StockTransaction.type)
            .order_by(func.date(StockTransaction.created_at))
        )
        rows = result.all()

        chart_data: dict[str, dict] = {}
        for row in rows:
            day_str = str(row.day)
            if day_str not in chart_data:
                chart_data[day_str] = {"date": day_str, "stock_in": 0, "stock_out": 0}
            if row.type == TransactionType.STOCK_IN:
                chart_data[day_str]["stock_in"] = int(row.total or 0)
            else:
                chart_data[day_str]["stock_out"] = int(row.total or 0)

        return list(chart_data.values())

    @staticmethod
    async def get_category_distribution(db: AsyncSession, store_id: UUID) -> list:
        result = await db.execute(
            select(
                Category.name,
                func.count(Product.id).label("product_count"),
                func.sum(Product.quantity * Product.purchase_price).label("value"),
            )
            .join(Product, Product.category_id == Category.id, isouter=True)
            .where(Category.store_id == store_id, Category.is_active == True)
            .group_by(Category.id, Category.name)
        )
        return [{"category": r.name, "count": r.product_count or 0, "value": float(r.value or 0)} for r in result.all()]

    @staticmethod
    async def get_fast_slow_movers(db: AsyncSession, store_id: UUID, days: int = 30) -> dict:
        since = datetime.now(timezone.utc) - timedelta(days=days)

        result = await db.execute(
            select(
                Product.id,
                Product.name,
                func.sum(StockTransaction.quantity).label("moved"),
            )
            .join(StockTransaction, StockTransaction.product_id == Product.id)
            .where(
                Product.store_id == store_id,
                StockTransaction.type == TransactionType.STOCK_OUT,
                StockTransaction.created_at >= since,
            )
            .group_by(Product.id, Product.name)
            .order_by(func.sum(StockTransaction.quantity).desc())
        )
        rows = result.all()
        items = [{"id": str(r.id), "name": r.name, "moved": int(r.moved or 0)} for r in rows]

        # Dead inventory = products with zero stock out in the period
        all_products_result = await db.execute(
            select(Product.id, Product.name)
            .where(Product.store_id == store_id, Product.is_active == True)
        )
        all_products = {str(r.id): r.name for r in all_products_result.all()}
        moved_ids = {i["id"] for i in items}
        dead = [{"id": pid, "name": pname, "moved": 0} for pid, pname in all_products.items() if pid not in moved_ids]

        return {
            "fast_movers": items[:10],
            "slow_movers": items[-10:] if len(items) > 10 else [],
            "dead_inventory": dead[:20],
        }
