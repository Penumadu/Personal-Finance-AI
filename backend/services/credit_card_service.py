"""
Credit Card Optimization Service
"""
from typing import List, Dict, Any, Optional

class CreditCardService:
    
    def __init__(self):
        self.cards = []
    
    def get_cards(self) -> List[Dict[str, Any]]:
        """Get all credit cards with analysis."""
        if not self.cards:
            return [{
                "card_name": "Add your cards",
                "balance": 0,
                "apr": 0,
                "utilization_rate": 0,
                "monthly_interest": 0,
                "payoff_months": 0,
                "total_interest": 0
            }]
        return self.cards
    
    def optimize(self, total_debt: float, monthly_payment: float, credit_score: int) -> Dict[str, Any]:
        """Generate credit card optimization recommendations."""
        
        avg_apr = 22.5
        monthly_interest = (total_debt * avg_apr / 100) / 12
        
        recommendations = []
        
        if avg_apr > 18:
            recommendations.append({
                "type": "balance_transfer",
                "action": "Transfer balance to 0% APR card",
                "estimated_savings": round(total_debt * 0.15, 2),
                "promotional_period": 18,
                "transfer_fee": 3,
                "top_cards": ["Chase Slate", "Citi Simplicity", "Discover it"]
            })
        
        recommendations.append({
            "type": "rate_negotiation",
            "action": "Call issuer to negotiate lower APR",
            "potential_apr_reduction": 5 if credit_score >= 700 else 3,
            "estimated_savings": round(total_debt * 0.05, 2),
            "success_rate": "high" if credit_score >= 720 else "medium"
        })
        
        recommendations.append({
            "type": "payment_strategy",
            "action": "Use debt avalanche - pay highest APR first",
            "interest_savings": round(monthly_payment * 2, 2),
            "additional_months_saved": 6
        })
        
        recommendations.append({
            "type": "credit_utilization",
            "action": "Keep utilization below 30%",
            "impact_on_score": "+15-25 points",
            "current_utilization": 50
        })
        
        return {
            "current_state": {
                "total_debt": total_debt,
                "average_apr": avg_apr,
                "monthly_interest": round(monthly_interest, 2)
            },
            "recommendations": recommendations,
            "action_plan": [
                {"step": 1, "action": "Apply for balance transfer card", "timeline": "This week", "impact": "high"},
                {"step": 2, "action": "Call to negotiate rates", "timeline": "Next 2 weeks", "impact": "medium"},
                {"step": 3, "action": "Implement avalanche strategy", "timeline": "Immediately", "impact": "medium"}
            ]
        }
    
    def balance_transfer_calculator(self, current_balance: float, current_apr: float, transfer_fee: float, promo_apr: float, promo_months: int) -> Dict[str, Any]:
        """Calculate balance transfer savings."""
        
        current_monthly_interest = (current_balance * current_apr / 100) / 12
        fee_amount = current_balance * (transfer_fee / 100)
        promo_monthly_interest = 0 if promo_apr == 0 else (current_balance * promo_apr / 100) / 12
        
        interest_without_transfer = current_monthly_interest * promo_months
        interest_with_transfer = fee_amount + (promo_monthly_interest * promo_months)
        
        savings = interest_without_transfer - interest_with_transfer
        post_promo_interest = current_balance * 0.22 / 12 if promo_apr > 0 else 0
        
        return {
            "current_balance": current_balance,
            "current_apr": current_apr,
            "current_monthly_interest": round(current_monthly_interest, 2),
            "transfer_details": {
                "transfer_fee": round(fee_amount, 2),
                "fee_percent": transfer_fee,
                "promotional_apr": promo_apr,
                "promotional_months": promo_months,
                "monthly_interest_during_promo": round(promo_monthly_interest, 2)
            },
            "savings": {
                "during_promo": round(savings, 2),
                "total_with_promo": round(savings - fee_amount, 2)
            },
            "post_promo": {
                "estimated_apr": 22.99,
                "monthly_interest": round(post_promo_interest, 2)
            },
            "recommendation": "Balance transfer recommended" if savings > 500 else "Consider alternatives"
        }
    
    def calculate_rewards_value(self, monthly_spending: float, rewards_rate: float, annual_fee: float = 0) -> Dict[str, Any]:
        """Calculate annual rewards value."""
        
        annual_spending = monthly_spending * 12
        gross_rewards = annual_spending * (rewards_rate / 100)
        net_rewards = gross_rewards - annual_fee
        
        return {
            "annual_spending": annual_spending,
            "rewards_rate": rewards_rate,
            "gross_annual_rewards": round(gross_rewards, 2),
            "annual_fee": annual_fee,
            "net_annual_rewards": round(net_rewards, 2),
            "monthly_rewards": round(gross_rewards / 12, 2),
            "break_even_spending": (annual_fee / (rewards_rate / 100)) if rewards_rate > 0 else 0
        }
    
    def add_card(self, card: Dict[str, Any]) -> None:
        """Add a credit card to track."""
        self.cards.append({
            "card_name": card.get("card_name"),
            "balance": card.get("current_balance", 0),
            "apr": card.get("apr", 0),
            "utilization_rate": round((card.get("current_balance", 0) / card.get("credit_limit", 1)) * 100, 2),
            "monthly_interest": round((card.get("current_balance", 0) * card.get("apr", 0) / 100) / 12, 2),
            "payoff_months": self._calculate_payoff_months(card.get("current_balance", 0), card.get("apr", 0), card.get("minimum_payment", 100)),
            "total_interest": self._estimate_total_interest(card.get("current_balance", 0), card.get("apr", 0), card.get("minimum_payment", 100))
        })
    
    def _calculate_payoff_months(self, balance: float, apr: float, payment: float) -> int:
        """Calculate months to pay off."""
        if balance <= 0 or payment <= 0:
            return 0
        monthly_rate = apr / 100 / 12
        if monthly_rate == 0:
            return int(balance / payment)
        if payment <= balance * monthly_rate:
            return 999
        n = -((payment / monthly_rate) * balance) / (payment - monthly_rate * balance)
        return min(int(n), 999)
    
    def _estimate_total_interest(self, balance: float, apr: float, payment: float) -> float:
        """Estimate total interest paid over payoff period."""
        months = self._calculate_payoff_months(balance, apr, payment)
        if months >= 999:
            return 999999
        total_paid = payment * months
        return max(0, total_paid - balance)