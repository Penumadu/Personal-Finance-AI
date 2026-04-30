"""
Mortgage Analysis Service
"""
from datetime import datetime
from typing import List, Dict, Any

class MortgageService:
    
    def get_current_rates(self) -> Dict[str, Any]:
        """Return current typical refinance rates (mock data)."""
        return {
            "rates": [
                {"term": 30, "rate": 6.5, "apr": 6.75},
                {"term": 20, "rate": 6.25, "apr": 6.5},
                {"term": 15, "rate": 5.875, "apr": 6.0},
                {"term": 10, "rate": 5.625, "apr": 5.75}
            ],
            "last_updated": datetime.now().isoformat(),
            "note": "Rates are estimates. Actual rates depend on credit score and lender."
        }
    
    def analyze(
        self,
        original_principal: float,
        current_principal: float,
        interest_rate: float,
        monthly_payment: float,
        start_date: str,
        term_months: int,
        property_value: float,
        loan_type: str
    ) -> Dict[str, Any]:
        """Analyze current mortgage and generate recommendations."""
        
        # Calculate LTV
        ltv = (current_principal / property_value) * 100
        equity = property_value - current_principal
        
        # Remaining months calculation
        start = datetime.strptime(start_date, "%Y-%m-%d")
        months_elapsed = (datetime.now() - start).days // 30
        remaining_months = max(0, term_months - months_elapsed)
        
        # Calculate remaining interest
        remaining_interest = self._calculate_remaining_interest(
            current_principal, interest_rate, monthly_payment, remaining_months
        )
        
        # PMI check
        pmi_required = ltv > 80
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            ltv=ltv,
            equity=equity,
            property_value=property_value,
            current_rate=interest_rate,
            remaining_months=remaining_months,
            pmi_required=pmi_required
        )
        
        return {
            "remaining_months": remaining_months,
            "total_interest_remaining": round(remaining_interest, 2),
            "monthly_payment": monthly_payment,
            "current_ltv": round(ltv, 2),
            "pmi_required": pmi_required,
            "equity_accumulated": round(equity, 2),
            "recommendations": recommendations
        }
    
    def calculate_refinance(
        self,
        current_principal: float,
        current_rate: float,
        remaining_months: int,
        credit_score: int,
        property_value: float,
        new_rate_options: List[float],
        term_options: List[int]
    ) -> Dict[str, Any]:
        """Calculate refinance scenarios."""
        
        closing_costs = current_principal * 0.03
        scenarios = []
        
        for rate in new_rate_options:
            for term in term_options:
                monthly_rate = rate / 100 / 12
                n_payments = term * 12
                
                if monthly_rate > 0:
                    new_payment = current_principal * (monthly_rate * (1 + monthly_rate)**n_payments) / ((1 + monthly_rate)**n_payments - 1)
                else:
                    new_payment = current_principal / n_payments
                
                total_new_cost = new_payment * n_payments
                total_current_cost = self._estimate_total_remaining(current_principal, current_rate, remaining_months)
                
                monthly_savings = (total_current_cost / remaining_months) - new_payment if remaining_months > 0 else 0
                total_interest_savings = (total_current_cost - total_new_cost) - closing_costs
                breakeven_months = int(closing_costs / monthly_savings) if monthly_savings > 0 else 999
                
                scenarios.append({
                    "new_rate": rate,
                    "term": term,
                    "new_monthly_payment": round(new_payment, 2),
                    "monthly_savings": round(monthly_savings, 2),
                    "total_interest_savings": round(max(0, total_interest_savings), 2),
                    "closing_costs": round(closing_costs, 2),
                    "breakeven_months": breakeven_months if breakeven_months < 999 else "N/A"
                })
        
        best = max(scenarios, key=lambda x: x.get("total_interest_savings", 0) if isinstance(x.get("total_interest_savings"), (int, float)) else 0, default=scenarios[0] if scenarios else None)
        
        return {
            "scenarios": scenarios,
            "recommended_scenario": best,
            "closing_cost_estimate": closing_costs
        }
    
    def _calculate_remaining_interest(self, principal: float, annual_rate: float, monthly_payment: float, remaining_months: int) -> float:
        """Calculate approximate remaining interest."""
        total_payments = monthly_payment * remaining_months
        return max(0, total_payments - principal)
    
    def _estimate_total_remaining(self, principal: float, rate: float, months: int) -> float:
        """Estimate total remaining cost of current loan."""
        if months <= 0:
            return principal
        monthly_rate = rate / 100 / 12
        if monthly_rate > 0:
            payment = principal * (monthly_rate * (1 + monthly_rate)**months) / ((1 + monthly_rate)**months - 1)
            return payment * months
        return principal
    
    def _generate_recommendations(self, ltv: float, equity: float, property_value: float, current_rate: float, remaining_months: int, pmi_required: bool) -> List[Dict[str, Any]]:
        """Generate actionable recommendations."""
        recommendations = []
        
        if current_rate > 6.0:
            recommendations.append({
                "type": "refinance",
                "action": f"Consider refinancing at current rates (est. 6.5% for {int(ltv)}% LTV)",
                "potential_savings": self._estimate_refi_savings(current_rate, remaining_months, equity),
                "new_rate_estimate": 6.5,
                "breakeven_months": 24,
                "confidence": "high" if current_rate > 7 else "medium"
            })
        
        if pmi_required:
            equity_needed = property_value * 0.2 - equity
            if equity_needed > 0:
                recommendations.append({
                    "type": "pmi_removal",
                    "action": f"Reach 80% LTV to remove PMI",
                    "equity_needed": round(equity_needed, 2),
                    "estimated_months": int(equity_needed / 500) if equity_needed > 0 else 0,
                    "monthly_savings_from_pmi": 150
                })
        
        if remaining_months > 120:
            recommendations.append({
                "type": "extra_payments",
                "action": "Make extra payments to shorten loan term",
                "potential_interest_savings": round(remaining_months * 50),
                "impact": "high"
            })
        
        return recommendations
    
    def _estimate_refi_savings(self, current_rate: float, remaining_months: int, equity: float) -> float:
        """Estimate potential refinance savings."""
        new_rate = 6.5
        monthly_rate_current = current_rate / 100 / 12
        monthly_rate_new = new_rate / 100 / 12
        
        if monthly_rate_current > monthly_rate_new:
            return round(remaining_months * 200)
        return 0