# API Specification

## Base Information

| Environment | Base URL |
|-------------|----------|
| Development | `http://localhost:8000/api/v1` |
| Staging | `https://api-staging.personalfinance.app/api/v1` |
| Production | `https://api.personalfinance.app/api/v1` |

---

## Authentication

All endpoints except `/auth/*` require a Bearer token.

```
Authorization: Bearer <access_token>
```

### Request Headers

```yaml
Content-Type: application/json
Authorization: Bearer <token>
X-Request-ID: <uuid>
X-API-Version: 1.0
```

---

## 1. Authentication Endpoints

### POST /auth/register
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "subscription_tier": "free"
  },
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJSUzI1NiIs...",
  "expires_in": 900
}
```

---

### POST /auth/login
Authenticate user and receive tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "subscription_tier": "premium"
  },
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJSUzI1NiIs...",
  "expires_in": 900
}
```

---

### POST /auth/refresh
Refresh access token.

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "expires_in": 900
}
```

---

## 2. Account Management

### POST /accounts/connect
Connect a financial institution via Plaid.

**Request:**
```json
{
  "public_token": "public-sandbox-xxxxx",
  "institution_id": "ins_109508",
  "institution_name": "Chase"
}
```

**Response (201 Created):**
```json
{
  "account": {
    "id": "acc_123456",
    "institution_name": "Chase",
    "account_type": "checking",
    "account_name": "Chase Total Checking",
    "account_mask": "4521",
    "current_balance": 5432.10,
    "last_synced": "2026-04-12T08:30:00Z"
  },
  "transactions_synced": 156
}
```

---

### GET /accounts
List all connected accounts.

**Response (200 OK):**
```json
{
  "accounts": [
    {
      "id": "acc_123456",
      "institution_name": "Chase",
      "account_type": "checking",
      "account_name": "Chase Total Checking",
      "account_mask": "4521",
      "current_balance": 5432.10,
      "last_synced": "2026-04-12T08:30:00Z",
      "is_active": true
    },
    {
      "id": "acc_789012",
      "institution_name": "Chase",
      "account_type": "credit",
      "account_name": "Chase Freedom",
      "account_mask": "9876",
      "current_balance": -1250.00,
      "credit_limit": 5000.00,
      "last_synced": "2026-04-12T08:30:00Z",
      "is_active": true
    }
  ],
  "total_balance": 4182.10,
  "total_credit_used": 1250.00
}
```

---

### DELETE /accounts/{account_id}
Disconnect an account.

**Response (204 No Content)**

---

## 3. Mortgage Analysis

### POST /mortgage/analyze
Analyze current mortgage and provide recommendations.

**Request:**
```json
{
  "original_principal": 350000,
  "current_principal": 320000,
  "interest_rate": 6.5,
  "monthly_payment": 2210.50,
  "start_date": "2024-01-15",
  "term_months": 360,
  "property_value": 450000,
  "loan_type": "conventional"
}
```

**Response (200 OK):**
```json
{
  "current_loan": {
    "remaining_months": 312,
    "total_interest_remaining": 285000,
    "monthly_payment": 2210.50,
    "last_rate_check": "2026-04-12"
  },
  "analysis": {
    "current_ltv": 71.1,
    "pmi_required": true,
    "equity_accumulated": 130000,
    "credit_score_range": "good"
  },
  "recommendations": [
    {
      "type": "refinance",
      "action": "Consider refinancing if current credit score > 720",
      "potential_savings": 45000,
      "new_rate_estimate": 5.75,
      "breakeven_months": 24,
      "confidence": "high"
    },
    {
      "type": "pmi_removal",
      "action": "Reach 80% LTV to remove PMI",
      "equity_needed": 45000,
      "estimated_date": "2027-06"
    }
  ]
}
```

---

### POST /mortgage/refinance
Calculate refinance scenarios.

**Request:**
```json
{
  "current_principal": 320000,
  "current_rate": 6.5,
  "remaining_months": 312,
  "credit_score": 740,
  "property_value": 450000,
  "new_rate_options": [5.0, 5.25, 5.5, 5.75],
  "term_options": [15, 20, 30]
}
```

**Response (200 OK):**
```json
{
  "scenarios": [
    {
      "new_rate": 5.0,
      "term": 30,
      "new_monthly_payment": 1718,
      "monthly_savings": 492,
      "total_interest_savings": 125000,
      "closing_costs": 8500,
      "breakeven_months": 18
    },
    {
      "new_rate": 5.5,
      "term": 15,
      "new_monthly_payment": 2580,
      "monthly_savings": -370,
      "total_interest_savings": 95000,
      "closing_costs": 8500,
      "breakeven_months": 24
    }
  ],
  "recommended_scenario": {
    "new_rate": 5.0,
    "term": 30,
    "monthly_savings": 492,
    "total_savings": 116500,
    "reason": "Best balance of monthly savings and total interest reduction"
  }
}
```

---

## 4. Credit Card Analysis

### GET /cards
List all credit cards with analysis.

**Response (200 OK):**
```json
{
  "cards": [
    {
      "id": "card_123",
      "card_name": "Chase Freedom",
      "last_four": "4521",
      "credit_limit": 5000,
      "current_balance": 1250,
      "available_credit": 3750,
      "apr": 24.99,
      "rewards_rate": 1.5,
      "rewards_type": "cash_back",
      "annual_fee": 0,
      "utilization_rate": 25,
      "payment_due_date": "2026-04-20",
      "is_active": true
    }
  ],
  "total_debt": 1250,
  "total_credit": 5000,
  "overall_utilization": 25,
  "average_apr": 24.99
}
```

---

### POST /cards/optimize
Get credit card optimization recommendations.

**Request:**
```json
{
  "total_debt": 15000,
  "monthly_payment_capacity": 500,
  "credit_score": 720
}
```

**Response (200 OK):**
```json
{
  "current_state": {
    "total_debt": 15000,
    "average_apr": 22.5,
    "monthly_interest": 281.25
  },
  "recommendations": [
    {
      "type": "balance_transfer",
      "action": "Transfer balance to 0% APR card",
      "estimated_savings": 3000,
      "recommended_card": "Chase Slate",
      "promotional_period_months": 18,
      "transfer_fee": 3
    },
    {
      "type": "rate_reduction",
      "action": "Call issuer to negotiate lower APR",
      "potential_apr_reduction": 5,
      "estimated_savings": 1500
    }
  ],
  "action_plan": [
    {
      "step": 1,
      "action": "Apply for balance transfer card",
      "timeline": "This week",
      "impact": "high"
    },
    {
      "step": 2,
      "action": "Pay off high-APR cards first",
      "timeline": "3-6 months",
      "impact": "medium"
    }
  ]
}
```

---

## 5. Debt Payoff

### GET /debts
List all debts.

**Response (200 OK):**
```json
{
  "debts": [
    {
      "id": "debt_123",
      "name": "Chase Credit Card",
      "type": "credit_card",
      "balance": 5000,
      "interest_rate": 24.99,
      "minimum_payment": 100,
      "account_id": "acc_789012"
    },
    {
      "id": "debt_456",
      "name": "Student Loan",
      "type": "student_loan",
      "balance": 25000,
      "interest_rate": 5.5,
      "minimum_payment": 250,
      "account_id": "acc_345678"
    }
  ],
  "total_debt": 30000,
  "total_minimum_payments": 350,
  "average_interest_rate": 8.75
}
```

---

### POST /debts/payoff-plan
Generate optimal debt payoff plan.

**Request:**
```json
{
  "debts": [
    {"id": "debt_123", "balance": 5000, "interest_rate": 24.99, "minimum_payment": 100},
    {"id": "debt_456", "balance": 25000, "interest_rate": 5.5, "minimum_payment": 250}
  ],
  "monthly_budget": 600,
  "strategy": "avalanche"
}
```

**Response (200 OK):**
```json
{
  "strategy": "avalanche",
  "monthly_budget": 600,
  "payoff_order": [
    {"id": "debt_123", "name": "Chase Credit Card", "balance": 5000},
    {"id": "debt_456", "name": "Student Loan", "balance": 25000}
  ],
  "projections": [
    {
      "month": 1,
      "payments": {"debt_123": 500, "debt_456": 100},
      "remaining": {"debt_123": 4520, "debt_456": 24900}
    }
  ],
  "summary": {
    "total_interest_paid": 4200,
    "months_to_payoff": 22,
    "payoff_date": "2028-02-01",
    "vs_minimum_only_savings": 1800
  },
  "milestones": [
    {"month": 6, "celebration": "First debt paid off!", "remaining_debt": 20000},
    {"month": 12, "celebration": "50% debt free", "remaining_debt": 12000}
  ]
}
```

---

## 6. Error Responses

### Standard Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "request_id": "req_abc123"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid input |
| UNAUTHORIZED | 401 | Invalid/expired token |
| FORBIDDEN | 403 | No permission |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

---

## 7. Rate Limits

| Tier | Requests/Minute | Requests/Day |
|------|-----------------|--------------|
| Free | 60 | 1,000 |
| Premium | 300 | 10,000 |
| Enterprise | 1000 | 100,000 |

---

**Document Version**: 1.0
**Last Updated**: 2026-04-12