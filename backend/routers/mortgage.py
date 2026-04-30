"""
Mortgage Analyzer API Router
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from services.mortgage_service import MortgageService

router = APIRouter()
mortgage_service = MortgageService()

class MortgageInput(BaseModel):
    original_principal: float = Field(..., gt=0, description="Original loan amount")
    current_principal: float = Field(..., gt=0, description="Current remaining balance")
    interest_rate: float = Field(..., gt=0, le=30, description="Current APR (%)")
    monthly_payment: float = Field(..., gt=0, description="Current monthly payment")
    start_date: str = Field(..., description="Loan start date (YYYY-MM-DD)")
    term_months: int = Field(..., gt=0, description="Total loan term in months")
    property_value: float = Field(..., gt=0, description="Current property value")
    loan_type: str = Field(default="conventional", description="Loan type")

class RefinanceInput(BaseModel):
    current_principal: float
    current_rate: float
    remaining_months: int
    credit_score: int = Field(..., ge=300, le=850)
    property_value: float
    new_rate_options: List[float]
    term_options: List[int]

@router.post("/analyze")
async def analyze_mortgage(data: MortgageInput):
    """Analyze current mortgage and provide recommendations."""
    try:
        result = mortgage_service.analyze(
            original_principal=data.original_principal,
            current_principal=data.current_principal,
            interest_rate=data.interest_rate,
            monthly_payment=data.monthly_payment,
            start_date=data.start_date,
            term_months=data.term_months,
            property_value=data.property_value,
            loan_type=data.loan_type
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/refinance")
async def calculate_refinance(data: RefinanceInput):
    """Calculate refinance scenarios."""
    try:
        result = mortgage_service.calculate_refinance(
            current_principal=data.current_principal,
            current_rate=data.current_rate,
            remaining_months=data.remaining_months,
            credit_score=data.credit_score,
            property_value=data.property_value,
            new_rate_options=data.new_rate_options,
            term_options=data.term_options
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/options")
async def get_refi_options():
    """Get current refinance rate options."""
    return mortgage_service.get_current_rates()