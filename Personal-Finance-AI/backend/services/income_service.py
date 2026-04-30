"""
Income Aggregation Service
"""
from typing import List, Dict, Any
from datetime import datetime, timedelta

class IncomeService:
    
    def __init__(self):
        self.sources = []
    
    def get_sources(self) -> List[Dict[str, Any]]:
        """Get all income sources."""
        return self.sources if self.sources else []
    
    def add_source(self, source: Dict[str, Any]) -> Dict[str, Any]:
        """Add a new income source."""
        self.sources.append(source)
        return source
    
    def remove_source(self, source_id: str) -> bool:
        """Remove an income source."""
        for i, s in enumerate(self.sources):
            if s.get("id") == source_id:
                self.sources.pop(i)
                return True
        return False
    
    def get_summary(self) -> Dict[str, Any]:
        """Get income summary with calculations."""
        frequency_multipliers = {
            "weekly": 4.33,
            "biweekly": 2.17,
            "monthly": 1,
            "quarterly": 0.33,
            "yearly": 0.0833
        }
        
        if not self.sources:
            return {
                "total_monthly": 0,
                "total_annual": 0,
                "sources": [],
                "monthly_average": 0
            }
        
        total_monthly = sum(
            source.get("amount", 0) * frequency_multipliers.get(source.get("frequency", "monthly"), 1)
            for source in self.sources
        )
        
        sources_data = []
        for s in self.sources:
            multiplier = frequency_multipliers.get(s.get("frequency", "monthly"), 1)
            sources_data.append({
                "id": s.get("id"),
                "name": s.get("source_name"),
                "type": s.get("source_type"),
                "amount": s.get("amount"),
                "frequency": s.get("frequency"),
                "monthly_amount": round(s.get("amount", 0) * multiplier, 2)
            })
        
        return {
            "total_monthly": round(total_monthly, 2),
            "total_annual": round(total_monthly * 12, 2),
            "sources": sources_data,
            "monthly_average": round(total_monthly / max(len(self.sources), 1), 2)
        }
    
    def get_trends(self, months: int = 12) -> Dict[str, Any]:
        """Get income trends over time."""
        summary = self.get_summary()
        monthly = summary["total_monthly"]
        
        return {
            "months": list(range(months, 0, -1)),
            "projected": [monthly] * months,
            "average": monthly
        }
    
    def get_by_type(self) -> Dict[str, Any]:
        """Get income breakdown by type."""
        type_totals = {}
        frequency_multipliers = {"weekly": 4.33, "biweekly": 2.17, "monthly": 1, "quarterly": 0.33, "yearly": 0.0833}
        
        for source in self.sources:
            income_type = source.get("source_type", "other")
            if income_type not in type_totals:
                type_totals[income_type] = 0
            multiplier = frequency_multipliers.get(source.get("frequency", "monthly"), 1)
            type_totals[income_type] += source.get("amount", 0) * multiplier
        
        return {"by_type": type_totals}