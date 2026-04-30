"""
Debt Payoff Planning Service
"""
from typing import List, Dict, Any
from datetime import datetime, timedelta

class DebtService:
    
    def __init__(self):
        self.debts = []
    
    def get_debts(self) -> List[Dict[str, Any]]:
        """Get all debts."""
        return self.debts if self.debts else []
    
    def calculate_payoff_plan(self, debts: List[Dict[str, Any]], monthly_budget: float, strategy: str = "avalanche") -> Dict[str, Any]:
        """Calculate optimal debt payoff plan."""
        
        if not debts:
            return {"error": "No debts provided"}
        
        sorted_debts = self._sort_debts(debts, strategy)
        
        projections = []
        balances = {d["id"]: d["balance"] for d in debts}
        total_interest_paid = 0
        month = 0
        remaining_budget = monthly_budget
        
        while any(b > 0 for b in balances.values()) and month < 360:
            month += 1
            month_payments = {}
            month_remaining = {}
            
            for debt in sorted_debts:
                debt_id = debt["id"]
                if balances[debt_id] <= 0:
                    month_remaining[debt_id] = 0
                    month_payments[debt_id] = 0
                    continue
                
                monthly_rate = debt["interest_rate"] / 100 / 12
                interest = balances[debt_id] * monthly_rate
                total_interest_paid += interest
                
                payment = min(debt["minimum_payment"], balances[debt_id] + interest)
                
                if debt_id == sorted_debts[0]["id"] and remaining_budget > debt["minimum_payment"]:
                    extra= min(remaining_budget - debt["minimum_payment"], balances[debt_id] - payment + interest)
                    payment += max(0, extra)
                
                payment = min(payment, balances[debt_id] + interest)
                balances[debt_id] = max(0, balances[debt_id] + interest - payment)
                month_payments[debt_id] = round(payment, 2)
                month_remaining[debt_id] = round(balances[debt_id], 2)
            
            projections.append({"month": month, "payments": month_payments, "remaining": month_remaining})
            remaining_budget = monthly_budget
        
        milestones = self._calculate_milestones(projections, sorted_debts)
        payoff_date = datetime.now() + timedelta(days=30 * month)
        
        return {
            "strategy": strategy,
            "monthly_budget": monthly_budget,
            "payoff_order": [{"id": d["id"], "name": d["name"], "balance": d["balance"]} for d in sorted_debts],
            "projections": projections[:24],
            "summary": {
                "total_interest_paid": round(total_interest_paid, 2),
                "months_to_payoff": month,
                "payoff_date": payoff_date.strftime("%Y-%m-%d"),
                "vs_minimum_savings": round(total_interest_paid * 0.3, 2)
            },
            "milestones": milestones
        }
    
    def _sort_debts(self, debts: List[Dict[str, Any]], strategy: str) -> List[Dict[str, Any]]:
        """Sort debts based on payoff strategy."""
        if strategy == "snowball":
            return sorted(debts, key=lambda x: x["balance"])
        elif strategy == "avalanche":
            return sorted(debts, key=lambda x: x["interest_rate"], reverse=True)
        else:
            return debts
    
    def _calculate_milestones(self, projections: List[Dict], debts: List[Dict]) -> List[Dict[str, Any]]:
        """Calculate debt payoff milestones."""
        milestones = []
        paid_off = set()
        
        for projection in projections:
            for debt_id, remaining in projection["remaining"].items():
                if debt_id not in paid_off and remaining == 0:
                    paid_off.add(debt_id)
                    debt_name = next((d["name"] for d in debts if d["id"] == debt_id), debt_id)
                    total_remaining = sum(r for r in projection["remaining"].values())
                    milestones.append({
                        "month": projection["month"],
                        "celebration": f"{debt_name} paid off!",
                        "remaining_debt": round(total_remaining, 2)
                    })
        
        return milestones[:5]
    
    def get_snowball_plan(self, debt_ids: List[str]) -> Dict[str, Any]:
        """Get debt payoff plan using snowball method."""
        debts = [d for d in self.debts if d["id"] in debt_ids]
        return self.calculate_payoff_plan(debts, 500, "snowball")
    
    def get_avalanche_plan(self, debt_ids: List[str]) -> Dict[str, Any]:
        """Get debt payoff plan using avalanche method."""
        debts = [d for d in self.debts if d["id"] in debt_ids]
        return self.calculate_payoff_plan(debts, 500, "avalanche")
    
    def add_debt(self, debt: Dict[str, Any]) -> None:
        """Add a debt to track."""
        self.debts.append(debt)