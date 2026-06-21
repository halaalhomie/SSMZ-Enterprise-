from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, delete, or_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.models import Product, Category, StockTransaction, TransactionType
from app.schemas.schemas import ProductCreate, ProductUpdate, ProductOut, ProductListOut
from app.services.activity_service import log_activity
from app.services.audit_service import check_low_stock_notification


class ProductService:

    @staticmethod
    async def list_products(
        db: AsyncSession,
        store_id: UUID,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        category_id: Optional[UUID] = None,
        low_stock_only: bool = False,
    ) -> dict:
        query = (
            select(Product)
            .options(selectinload(Product.category))
            .where(Product.store_id == store_id, Product.is_active == True)
        )

        if search:
            query = query.where(
                or_(
                    Product.name.ilike(f"%{search}%"),
                    Product.sku.ilike(f"%{search}%"),
                    Product.barcode.ilike(f"%{search}%"),
                )
            )

        if category_id:
            query = query.where(Product.category_id == category_id)

        if low_stock_only:
            query = query.where(Product.quantity <= Product.min_stock)

        total_result = await db.execute(select(func.count()).select_from(query.subquery()))
        total = total_result.scalar()

        query = query.offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(query)
        products = result.scalars().all()

        return {
            "items": [ProductListOut.model_validate(p) for p in products],
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": (total + page_size - 1) // page_size,
        }

    @staticmethod
    async def get_product(db: AsyncSession, store_id: UUID, product_id: UUID) -> Product:
        result = await db.execute(
            select(Product)
            .options(selectinload(Product.category))
            .where(Product.id == product_id, Product.store_id == store_id)
        )
        product = result.scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        return product

    @staticmethod
    async def get_by_barcode(db: AsyncSession, store_id: UUID, barcode: str) -> Optional[Product]:
        result = await db.execute(
            select(Product).where(Product.barcode == barcode, Product.store_id == store_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create_product(
        db: AsyncSession, store_id: UUID, user_id: UUID, data: ProductCreate
    ) -> Product:
        # Check SKU uniqueness
        existing = await db.execute(select(Product).where(Product.sku == data.sku))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="SKU already exists")

        product = Product(store_id=store_id, **data.model_dump())
        db.add(product)
        await db.flush()

        await log_activity(db, store_id, user_id, "product_created", "product", product.id, {"name": product.name})
        await check_low_stock_notification(db, product)
        return product

    @staticmethod
    async def update_product(
        db: AsyncSession, store_id: UUID, user_id: UUID, product_id: UUID, data: ProductUpdate
    ) -> Product:
        product = await ProductService.get_product(db, store_id, product_id)

        for field, value in data.model_dump(exclude_none=True).items():
            setattr(product, field, value)

        await log_activity(db, store_id, user_id, "product_updated", "product", product_id)
        return product

    @staticmethod
    async def delete_product(db: AsyncSession, store_id: UUID, user_id: UUID, product_id: UUID) -> None:
        product = await ProductService.get_product(db, store_id, product_id)
        product.is_active = False
        await log_activity(db, store_id, user_id, "product_deleted", "product", product_id, {"name": product.name})

    @staticmethod
    async def get_product_history(
        db: AsyncSession, store_id: UUID, product_id: UUID, page: int = 1, page_size: int = 20
    ) -> dict:
        from sqlalchemy.orm import selectinload as sl
        query = (
            select(StockTransaction)
            .options(sl(StockTransaction.user), sl(StockTransaction.supplier))
            .where(
                StockTransaction.product_id == product_id,
                StockTransaction.store_id == store_id,
            )
            .order_by(StockTransaction.created_at.desc())
        )

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
