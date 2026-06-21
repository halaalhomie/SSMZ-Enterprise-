from __future__ import annotations
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, EmailStr, field_validator, model_validator
from app.models.models import UserRole, TransactionType


# ─── Base helpers ─────────────────────────────────────────────────────────────

class OrmBase(BaseModel):
    model_config = {"from_attributes": True}


class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
    pages: int


# ─── Auth ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class RefreshRequest(BaseModel):
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        from app.core.security import validate_password_strength
        if not validate_password_strength(v):
            raise ValueError("Password must be 8+ chars with uppercase, lowercase, digit and special character.")
        return v


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# ─── User ────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.EMPLOYEE

    @field_validator("password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        from app.core.security import validate_password_strength
        if not validate_password_strength(v):
            raise ValueError("Password must be 8+ chars with uppercase, lowercase, digit and special character.")
        return v


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserOut(OrmBase):
    id: UUID
    store_id: UUID
    name: str
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None


# ─── Category ────────────────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class CategoryOut(OrmBase):
    id: UUID
    store_id: UUID
    name: str
    description: Optional[str]
    is_active: bool
    created_at: datetime


# ─── Supplier ────────────────────────────────────────────────────────────────

class SupplierCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    gst_number: Optional[str] = None


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    gst_number: Optional[str] = None
    is_active: Optional[bool] = None


class SupplierOut(OrmBase):
    id: UUID
    store_id: UUID
    name: str
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]
    gst_number: Optional[str]
    is_active: bool
    created_at: datetime


# ─── Product ─────────────────────────────────────────────────────────────────

class ProductCreate(BaseModel):
    name: str
    sku: str
    barcode: Optional[str] = None
    category_id: Optional[UUID] = None
    purchase_price: Decimal
    selling_price: Decimal
    quantity: int = 0
    min_stock: int = 5

    @field_validator("purchase_price", "selling_price")
    @classmethod
    def non_negative(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("Price cannot be negative.")
        return v

    @field_validator("quantity", "min_stock")
    @classmethod
    def non_negative_int(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Cannot be negative.")
        return v


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    category_id: Optional[UUID] = None
    purchase_price: Optional[Decimal] = None
    selling_price: Optional[Decimal] = None
    min_stock: Optional[int] = None
    is_active: Optional[bool] = None


class ProductOut(OrmBase):
    id: UUID
    store_id: UUID
    name: str
    sku: str
    barcode: Optional[str]
    category_id: Optional[UUID]
    purchase_price: Decimal
    selling_price: Decimal
    quantity: int
    min_stock: int
    image_url: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryOut] = None

    @property
    def is_low_stock(self) -> bool:
        return self.quantity <= self.min_stock


class ProductListOut(OrmBase):
    id: UUID
    name: str
    sku: str
    barcode: Optional[str]
    quantity: int
    min_stock: int
    selling_price: Decimal
    image_url: Optional[str]
    is_active: bool
    category: Optional[CategoryOut] = None


# ─── Stock Transactions ──────────────────────────────────────────────────────

class StockInCreate(BaseModel):
    product_id: UUID
    quantity: int
    supplier_id: Optional[UUID] = None
    invoice_number: Optional[str] = None
    cost_per_unit: Optional[Decimal] = None
    remarks: Optional[str] = None

    @field_validator("quantity")
    @classmethod
    def positive_qty(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Quantity must be positive.")
        return v


class StockOutCreate(BaseModel):
    product_id: UUID
    quantity: int
    reason: Optional[str] = None

    @field_validator("quantity")
    @classmethod
    def positive_qty(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Quantity must be positive.")
        return v


class TransactionOut(OrmBase):
    id: UUID
    store_id: UUID
    product_id: UUID
    user_id: Optional[UUID]
    supplier_id: Optional[UUID]
    type: TransactionType
    quantity: int
    cost_per_unit: Optional[Decimal]
    invoice_number: Optional[str]
    reason: Optional[str]
    remarks: Optional[str]
    created_at: datetime
    product: Optional[ProductListOut] = None
    supplier: Optional[SupplierOut] = None
    user: Optional[UserOut] = None


# ─── Audit ───────────────────────────────────────────────────────────────────

class AuditCreate(BaseModel):
    product_id: UUID
    physical_quantity: int
    notes: Optional[str] = None

    @field_validator("physical_quantity")
    @classmethod
    def non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Physical quantity cannot be negative.")
        return v


class AuditOut(OrmBase):
    id: UUID
    store_id: UUID
    product_id: UUID
    user_id: Optional[UUID]
    db_quantity: int
    physical_quantity: int
    difference: int
    notes: Optional[str]
    created_at: datetime
    product: Optional[ProductListOut] = None
    user: Optional[UserOut] = None


# ─── Note ────────────────────────────────────────────────────────────────────

class NoteCreate(BaseModel):
    title: str
    description: Optional[str] = None


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


class NoteOut(OrmBase):
    id: UUID
    store_id: UUID
    user_id: Optional[UUID]
    title: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime
    user: Optional[UserOut] = None


# ─── Dashboard ───────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_products: int
    total_inventory_value: Decimal
    low_stock_count: int
    today_stock_in: int
    today_stock_out: int
    total_suppliers: int
    total_categories: int


# ─── Notification ────────────────────────────────────────────────────────────

class NotificationOut(OrmBase):
    id: UUID
    type: str
    message: str
    is_read: bool
    created_at: datetime


# ─── Activity Log ────────────────────────────────────────────────────────────

class ActivityLogOut(OrmBase):
    id: UUID
    action: str
    entity_type: Optional[str]
    entity_id: Optional[UUID]
    extra_data: dict
    created_at: datetime
    user: Optional[UserOut] = None


# ─── Pagination query params ──────────────────────────────────────────────────

class PaginationParams(BaseModel):
    page: int = 1
    page_size: int = 20
    search: Optional[str] = None
    sort_by: Optional[str] = None
    sort_order: str = "desc"
