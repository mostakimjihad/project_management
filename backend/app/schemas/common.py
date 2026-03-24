"""Common schema utilities."""
from typing import Generic, TypeVar, Optional, List, Type
from pydantic import BaseModel
from math import ceil


class PaginationParams(BaseModel):
    """Pagination query parameters."""
    page: int = 1
    limit: int = 10
    search: Optional[str] = None


    sort_by: Optional[str] = "created_at"
    sort_order: Optional[str] = "desc"


T = TypeVar("T", bound=BaseModel)


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper."""
    items: List[T]
    total: int
    page: int
    limit: int
    pages: int

    @classmethod
    def create(cls: Type[T], items: List[T], total: int, page: int, limit: int) -> "PaginatedResponse[T]":
        return cls(
            items=items,
            total=total,
            page=page,
            limit=limit,
            pages=ceil(total / limit) if limit > 0 else 0,
        )