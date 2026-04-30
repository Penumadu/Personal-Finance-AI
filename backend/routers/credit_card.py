"""
Credit Card Optimizer API Router
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from services.credit_card_service import CreditCardService

router = APIRouter()
card_service = CreditCardService()

class OptimizeInput(BaseModel):
    total_debt: float
    monthly_payment_capacity: float
    credit_score: int = Field(..., ge=300, le=850)

class BalanceTransferInput(BaseModel):
    current_balance: float
    current_apr: float
    transfer_fee_percent: float = 3.0
    promotional_apr: float = 0
    promotional_months: int = 18

@router.get("/")
async def list_cards():
    """List all credit cards with analysis."""
    return {"cards": card_service.get_cards()}

@router.post("/optimize")
async def optimize_cards(data: OptimizeInput):
    """Get credit card optimization recommendations."""
    try:
        result = card_service.optimize(
            total_debt=data.total_debt,
            monthly_payment=data.monthly_payment_capacity,
            credit_score=data.credit_score
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/balance-transfer")
async def calculate_balance_transfer(data: BalanceTransferInput):
    """Calculate balance transfer savings."""
    result = card_service.balance_transfer_calculator(
        current_balance=data.current_balance,
        current_apr=data.current_apr,
        transfer_fee=data.transfer_fee_percent,
        promo_apr=data.promotional_apr,
        promo_months=data.promotional_months
    )
    return result

@router.post("/rewards")
async def calculate_rewards(
    monthly_spending: float,
    rewards_rate: float,
    annual_fee: float = 0
):
    """Calculate annual rewards value."""
    return card_service.calculate_rewards_value(
        monthly_spending=monthly_spending,
        rewards_rate=rewards_rate,
        annual_fee=annual_fee
    )