"""
Income Aggregation API Router
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from services.income_service import IncomeService

router = APIRouter()
income_service = IncomeService()

class IncomeSourceInput(BaseModel):
    source_type: str = Field(..., pattern="^(salary|freelance|investment|rental|benefits|other)$")
    source_name: str
    amount: float = Field(..., gt=0)
    frequency: str = Field(..., pattern="^(weekly|biweekly|monthly|quarterly|yearly)$")

@router.get("/")
async def list_income_sources():
    """List all income sources."""
    return {"sources": income_service.get_sources()}

@router.post("/add")
async def add_income_source(data: IncomeSourceInput):
    """Add a new income source."""
    source = data.dict()
    source["id"] = str(len(income_service.sources) + 1)
    return income_service.add_source(source)

@router.delete("/{source_id}")
async def remove_income_source(source_id: str):
    """Remove an income source."""
    if income_service.remove_source(source_id):
        return {"message": "Income source removed"}
    raise HTTPException(status_code=404, detail="Income source not found")

@router.get("/summary")
async def get_income_summary():
    """Get income summary with calculations."""
    return income_service.get_summary()

@router.get("/trends")
async def get_income_trends(months: int = 12):
    """Get income trends over time."""
    return income_service.get_trends(months)

@router.get("/by-type")
async def get_by_type():
    """Get income breakdown by type."""
    return income_service.get_by_type()