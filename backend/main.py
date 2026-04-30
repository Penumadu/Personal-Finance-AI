"""
Personal Finance Assistant - FastAPI Backend
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import mortgage, credit_card, debt, income

app = FastAPI(
    title="Personal Finance Assistant API",
    description="AI-powered personal finance assistant for mortgage analysis, credit card optimization, and debt payoff planning.",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(mortgage.router, prefix="/api/v1/mortgage", tags=["Mortgage"])
app.include_router(credit_card.router, prefix="/api/v1/cards", tags=["Credit Cards"])
app.include_router(debt.router, prefix="/api/v1/debts", tags=["Debt"])
app.include_router(income.router, prefix="/api/v1/income", tags=["Income"])

@app.get("/")
async def root():
    return {
        "message": "Personal Finance Assistant API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": "2026-04-13T05:55:00Z"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)