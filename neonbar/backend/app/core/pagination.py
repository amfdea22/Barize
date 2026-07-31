from fastapi import Query
from typing import Generic, TypeVar, List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Query as SQLQuery
from sqlalchemy import func

T = TypeVar("T")


class PaginationParams:
    """Reusable pagination dependency: ?limit=50&offset=0"""

    def __init__(
        self,
        limit: int = Query(50, ge=1, le=100, description="Máx. itens por página"),
        offset: int = Query(0, ge=0, description="Itens a pular"),
    ):
        self.limit = limit
        self.offset = offset


class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    total: int
    limit: int
    offset: int
    has_more: bool


def paginate(query: SQLQuery, params: PaginationParams) -> tuple[list, int]:
    """Aplica paginação a uma query SQLAlchemy e retorna (itens, total)."""
    total = query.count()
    items = query.offset(params.offset).limit(params.limit).all()
    return items, total
