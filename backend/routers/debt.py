"""
Debt Payoff Planner API Router
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List
from services.debt_service import DebtService

router = APIRouter()
debt_service = DebtService()

class DebtInput(BaseModel):
    id: str
    name: str
    balance: float = Field(..., gt=0)
    interest_rate: float = Field(..., ge=0)
    minimum_payment: float = Field(..., gt=0)

class PayoffPlanRequest(BaseModel):
    debts: List[DebtInput]
    monthly_budget: float = Field(..., gt=0)
    strategy: str = Field(default="avalanche", pattern="^(avalanche|snowball)$")

@router.get("/")
async def list_debts():
    """List all debts."""
    return {"debts": debt_service.get_debts()}

@router.post("/payoff-plan")
async def generate_payoff_plan(data: PayoffPlanRequest):
    """Generate optimal debt payoff plan."""
    try:
        result = debt_service.calculate_payoff_plan(
            debts=[d.dict() for d in data.debts],
            monthly_budget=data.monthly_budget,
            strategy=data.strategy
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/compare")
async def compare_strategies(data: PayoffPlanRequest):
    """Compare snowball vs avalanche strategies."""
    snowball = debt_service.calculate_payoff_plan(
        debts=[d.dict() for d in data.debts],
        monthly_budget=data.monthly_budget,
        strategy="snowball"
    )
    avalanche = debt_service.calculate_payoff_plan(
        debts=[d.dict() for d in data.debts],
        monthly_budget=data.monthly_budget,
        strategy="avalanche"
    )
    return {
        "snowball": snowball,
        "avalanche": avalanche,
        "comparison": {
            "interest_saved_avalanche": snowball["summary"]["total_interest_paid"] - avalanche["summary"]["total_interest_paid"],
            "time_difference_months": snowball["summary"]["months_to_payoff"] - avalanche["summary"]["months_to_payoff"]
        }
    }