# Technical Specification

## 1. System Overview

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │   Web App       │  │  Mobile (React  │  │     Chat Interface          │ │
│  │   (Next.js)     │  │     Native)      │  │     (Voice + Text)          │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        Rate Limiter + Auth                               ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND SERVICES                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   User       │  │   Finance    │  │   AI         │  │   Notific.   │   │
│  │   Service    │  │   Analyzer   │  │   Engine     │  │   Service    │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  PostgreSQL  │  │    Redis     │  │   S3/MinIO   │  │   TimescaleDB│   │
│  │  (Primary)   │  │  (Cache)     │  │  (Documents) │  │  (Analytics) │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | Next.js + React | 14.x |
| **Mobile** | React Native | 0.73.x |
| **Backend** | FastAPI (Python) | 0.109.x |
| **Database** | PostgreSQL | 15.x |
| **Cache** | Redis | 7.x |
| **Search** | Elasticsearch | 8.x |
| **Queue** | RabbitMQ | 3.12.x |
| **Storage** | S3/MinIO | Latest |
| **Analytics** | TimescaleDB | 2.11.x |

---

## 2. API Specification

### 2.1 Base URLs

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:8000` |
| Staging | `https://api-staging.personalfinance.app` |
| Production | `https://api.personalfinance.app` |

### 2.2 Authentication

```yaml
Auth Method: OAuth 2.0 + JWT
Token Expiry: 15 minutes (access), 7 days (refresh)
Algorithm: RS256

Headers:
  Authorization: Bearer <access_token>
  X-Request-ID: <uuid>
```

### 2.3 Core Endpoints

#### User Management
```
POST   /api/v1/auth/register        # Register new user
POST   /api/v1/auth/login           # Login
POST   /api/v1/auth/refresh         # Refresh token
POST   /api/v1/auth/logout           # Logout
GET    /api/v1/users/me             # Get current user
PATCH  /api/v1/users/me             # Update user profile
```

#### Account Integration
```
POST   /api/v1/accounts/connect    # Connect financial account (Plaid)
GET    /api/v1/accounts             # List connected accounts
DELETE /api/v1/accounts/{id}         # Disconnect account
POST   /api/v1/accounts/sync        # Force sync accounts
```

#### Mortgage Analysis
```
POST   /api/v1/mortgage/analyze     # Analyze current mortgage
POST   /api/v1/mortgage/refinance   # Calculate refi scenarios
GET    /api/v1/mortgage/options     # Available refinance options
```

#### Credit Card Analysis
```
GET    /api/v1/cards                # List credit cards
POST   /api/v1/cards/optimize       # Get optimization recommendations
POST   /api/v1/cards/balance-transfer # Calculate balance transfer
```

#### Debt Management
```
GET    /api/v1/debts                # List all debts
POST   /api/v1/debts/payoff-plan    # Generate payoff strategy
GET    /api/v1/debts/snowball       # Snowball method plan
GET    /api/v1/debts/avalanche      # Avalanche method plan
```

#### Budget & Income
```
POST   /api/v1/income/add           # Add income source
GET    /api/v1/income/summary       # Income summary
POST   /api/v1/budget/create        # Create budget
GET    /api/v1/budget/{id}          # Get budget details
```

---

## 3. Data Models

### 3.1 User Model
```python
class User:
    id: UUID
    email: str
    password_hash: str
    first_name: str
    last_name: str
    phone: Optional[str]
    date_of_birth: Optional[date]
    created_at: datetime
    updated_at: datetime
    is_verified: bool
    subscription_tier: SubscriptionTier
```

### 3.2 Account Model
```python
class FinancialAccount:
    id: UUID
    user_id: UUID
    plaid_access_token: str
    plaid_account_id: str
    institution_name: str
    account_type: AccountType  # CHECKING, SAVINGS, CREDIT, INVESTMENT, LOAN
    account_name: str
    account_mask: str  # Last 4 digits
    current_balance: Decimal
    available_balance: Optional[Decimal]
    last_synced: datetime
    is_active: bool
```

### 3.3 Mortgage Model
```python
class Mortgage:
    id: UUID
    account_id: UUID
    original_principal: Decimal
    current_principal: Decimal
    interest_rate: Decimal
    monthly_payment: Decimal
    start_date: date
    term_months: int
    remaining_months: int
    loan_type: LoanType  # CONVENTIONAL, FHA, VA, etc.
    property_value: Decimal
```

### 3.4 Credit Card Model
```python
class CreditCard:
    id: UUID
    account_id: UUID
    card_name: str
    last_four: str
    credit_limit: Decimal
    current_balance: Decimal
    available_credit: Decimal
    apr: Decimal
    rewards_rate: Optional[Decimal]
    rewards_type: Optional[RewardsType]
    annual_fee: Decimal
    is_active: bool
```

---

## 4. Configuration

### 4.1 Environment Variables

```env
# Application
APP_ENV=development
APP_HOST=0.0.0.0
APP_PORT=8000
LOG_LEVEL=INFO

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/finance_db
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=<generated-secret>
ENCRYPTION_KEY=<encryption-key>
JWT_PUBLIC_KEY=<public-key>
JWT_PRIVATE_KEY=<private-key>

# External APIs
PLAID_CLIENT_ID=<plaid-client-id>
PLAID_SECRET=<plaid-secret>
PLAID_ENV=sandbox

# Storage
S3_BUCKET=personal-finance-documents
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
```

---

## 5. Error Handling

### 5.1 Error Response Format

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
    "request_id": "uuid"
  }
}
```

### 5.2 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid input |
| UNAUTHORIZED | 401 | Not authenticated |
| FORBIDDEN | 403 | No permission |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

---

## 6. Performance Requirements

| Metric | Target |
|--------|--------|
| API Response Time (p95) | < 200ms |
| Page Load Time | < 1.5s |
| Database Query Time | < 50ms |
| Sync Frequency | Every 4 hours |
| Max Concurrent Users | 10,000 |
| Data Retention | 7 years |

---

**Document Version**: 1.0
**Last Updated**: 2026-04-12