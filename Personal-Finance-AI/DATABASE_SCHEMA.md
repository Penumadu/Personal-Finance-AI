# Database Schema

## 1. Entity Relationship Diagram

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│    User     │────────▶│   Account    │────────▶│ Transaction │
│             │         │             │         │             │
│ - id        │         │ - id         │         │ - id        │
│ - email     │         │ - user_id    │         │ - account_id│
│ - password  │         │ - plaid_id   │         │ - amount    │
│ - profile   │         │ - type       │         │ - category  │
│ - settings  │         │ - balance    │         │ - date      │
└─────────────┘         └─────────────┘         └─────────────┘
      │                         │
      │                         │
      ▼                         ▼
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Income    │         │   Mortgage  │         │ CreditCard  │
│             │         │             │         │             │
│ - id        │         │ - id        │         │ - id        │
│ - user_id   │         │ - account_id│         │ - account_id│
│ - source    │         │ - principal │         │ - limit     │
│ - amount    │         │ - rate      │         │ - balance   │
│ - frequency │         │ - payment   │         │ - apr       │
└─────────────┘         │ - term      │         │ - rewards   │
                        └─────────────┘         └─────────────┘
```

---

## 2. Tables

### 2.1 users

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    date_of_birth DATE,
    profile_image_url TEXT,
    subscription_tier VARCHAR(20) DEFAULT 'free',
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription ON users(subscription_tier);
```

### 2.2 sessions

```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    user_agent TEXT,
    ip_address INET,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

### 2.3 accounts (Financial Accounts)

```sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plaid_access_token_encrypted TEXT,
    plaid_item_id VARCHAR(255),
    plaid_account_id VARCHAR(255),
    institution_id VARCHAR(100),
    institution_name VARCHAR(255),
    account_type VARCHAR(50) NOT NULL,
    account_subtype VARCHAR(100),
    account_name VARCHAR(255),
    account_mask VARCHAR(10),
    current_balance DECIMAL(15, 2) DEFAULT 0,
    available_balance DECIMAL(15, 2),
    credit_limit DECIMAL(15, 2),
    currency_code VARCHAR(3) DEFAULT 'USD',
    last_synced_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(20) DEFAULT 'idle',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_accounts_user ON accounts(user_id);
CREATE INDEX idx_accounts_type ON accounts(account_type);
CREATE INDEX idx_accounts_institution ON accounts(institution_name);
```

### 2.4 transactions

```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    plaid_transaction_id VARCHAR(255),
    external_id VARCHAR(255),
    amount DECIMAL(15, 2) NOT NULL,
    currency_code VARCHAR(3) DEFAULT 'USD',
    transaction_type VARCHAR(50),
    merchant_name VARCHAR(255),
    merchant_category VARCHAR(100),
    category_id VARCHAR(50),
    category_path TEXT[],
    pending BOOLEAN DEFAULT FALSE,
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_merchant ON transactions(merchant_name);
```

### 2.5 mortgages

```sql
CREATE TABLE mortgages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_principal DECIMAL(15, 2) NOT NULL,
    current_principal DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(5, 3) NOT NULL,
    monthly_payment DECIMAL(15, 2) NOT NULL,
    start_date DATE NOT NULL,
    term_months INTEGER NOT NULL,
    remaining_months INTEGER NOT NULL,
    loan_type VARCHAR(50),
    property_value DECIMAL(15, 2),
    property_address TEXT,
    is_primary_residence BOOLEAN DEFAULT TRUE,
    escrow_balance DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mortgages_user ON mortgages(user_id);
CREATE INDEX idx_mortgages_account ON mortgages(account_id);
```

### 2.6 credit_cards

```sql
CREATE TABLE credit_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_name VARCHAR(255),
    last_four VARCHAR(4),
    credit_limit DECIMAL(15, 2) NOT NULL DEFAULT 0,
    current_balance DECIMAL(15, 2) DEFAULT 0,
    available_credit DECIMAL(15, 2),
    apr DECIMAL(5, 3) DEFAULT 0,
    rewards_rate DECIMAL(5, 3),
    rewards_type VARCHAR(50),
    annual_fee DECIMAL(10, 2) DEFAULT 0,
    payment_due_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cards_user ON credit_cards(user_id);
CREATE INDEX idx_cards_account ON credit_cards(account_id);
```

### 2.7 debts

```sql
CREATE TABLE debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id),
    name VARCHAR(255) NOT NULL,
    debt_type VARCHAR(50) NOT NULL,
    balance DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(5, 3) NOT NULL,
    minimum_payment DECIMAL(15, 2) NOT NULL,
    due_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_debts_user ON debts(user_id);
CREATE INDEX idx_debts_type ON debts(debt_type);
```

### 2.8 income_sources

```sql
CREATE TABLE income_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL,
    source_name VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    frequency VARCHAR(20) NOT NULL,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_income_user ON income_sources(user_id);
CREATE INDEX idx_income_type ON income_sources(source_type);
```

### 2.9 budgets

```sql
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    period VARCHAR(20) DEFAULT 'monthly',
    categories TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_budgets_user ON budgets(user_id);
```

### 2.10 recommendations

```sql
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    potential_savings DECIMAL(15, 2),
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'pending',
    action_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actioned_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_recommendations_user ON recommendations(user_id);
CREATE INDEX idx_recommendations_type ON recommendations(recommendation_type);
CREATE INDEX idx_recommendations_status ON recommendations(status);
```

---

## 3. Migrations

### Migration File Naming Convention
```
YYYYMMDDHHMMSS_<migration_name>.sql
```

### Example Migration
```sql
-- 20260412000001_add_user_preferences.sql

ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}';

CREATE INDEX idx_users_preferences ON users USING GIN (preferences);
```

---

## 4. Indexes

```sql
-- Composite indexes for common queries
CREATE INDEX idx_transactions_user_date ON transactions(t.account_id, t.transaction_date DESC);
CREATE INDEX idx_transactions_category ON transactions USING GIN (category_path);
CREATE INDEX idx_accounts_institution_user ON accounts(institution_name, user_id);
```

---

## 5. Audit Tables

```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id UUID,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_table ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_date ON audit_log(created_at);
```

---

## 6. Time-Series Data (TimescaleDB)

```sql
SELECT create_hypertable('daily_balances', 'date', if_not_exists => TRUE);

CREATE TABLE daily_balances (
    time TIMESTAMPTZ NOT NULL,
    account_id UUID NOT NULL,
    balance DECIMAL(15, 2) NOT NULL,
    UNIQUE (time, account_id)
);
```

---

**Document Version**: 1.0
**Last Updated**: 2026-04-12