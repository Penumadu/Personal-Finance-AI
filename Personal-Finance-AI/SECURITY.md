# Security Guidelines

## Overview

This document outlines the security architecture, practices, and requirements for the Personal Finance Assistant application.

---

## 1. Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Defense in Depth Layers                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Layer 1: Physical Security                                               │
│  ├── Cloud provider security (AWS/GCP/Azure)                             │
│  ├── Encrypted storage volumes                                            │
│  └── Secure data centers (SOC 2 Type II)                                 │
│                                                                          │
│  Layer 2: Network Security                                                │
│  ├── VPC with private subnets                                            │
│  ├── Security groups with least privilege                                │
│  ├── WAF for API protection                                              │
│  └── DDoS protection                                                     │
│                                                                          │
│  Layer 3: Application Security                                           │
│  ├── OAuth 2.0 + JWT authentication                                       │
│  ├── API key rotation                                                    │
│  ├── Input validation                                                    │
│  └── Output encoding│
│                                                                          │
│  Layer 4: Data Security                                                   │
│  ├── AES-256 encryption at rest                                          │
│  ├── TLS 1.3 for transit                                                │
│  ├── Field-level encryption for PII                                      │
│  └── Secure key management (HSM)                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication & Authorization

### 2.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│                   Authentication Flow                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. User submits credentials                             │
│         │                                                │
│         ▼                                                │
│  2. Validate against hashed password                     │
│         │                                                │
│         ▼                                                │
│  3. Generate JWT access token (15 min expiry)            │
│  4. Generate refresh token (7 day expiry)                 │
│         │                                                │
│         ▼                                                │
│  5. Store refresh token hash in database                  │
│  6. Return tokens to client                              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Token Configuration

| Token Type | Expiry | Storage |
|------------|--------|---------|
| Access Token | 15 minutes | Memory only |
| Refresh Token | 7 days | HTTPOnly cookie + DB |
| API Key | 90 days | Encrypted |

### 2.3 Password Requirements

```
Minimum Requirements:
├── Length: 8-128 characters
├── Uppercase: At least 1 character
├── Lowercase: At least 1 character
├── Number: At least 1 digit
├── Special: At least 1 special character
└── Breach Check: Not in known breaches
```

### 2.4 Multi-Factor Authentication (MFA)

| Tier | MFA Required |
|------|--------------|
| Free | Optional |
| Premium | Required |
| Enterprise | Required + TOTP |

---

## 3. Data Encryption

### 3.1 Encryption at Rest

```python
# Encryption configuration
ENCRYPTION_ALGORITHM = "AES-256-GCM"
KEY_ROTATION_PERIOD = "90 days"

# Fields requiring field-level encryption
SENSITIVE_FIELDS = [
    "plaid_access_token",
    "password_hash",
    "social_security",
    "bank_account_number",
    "date_of_birth"
]
```

### 3.2 Encryption in Transit

```
Requirements:
├── TLS 1.3 minimum
├── Strong cipher suites only
├── HSTS header enabled
├── Certificate pinning (mobile)
└── No legacy protocol support
```

### 3.3 Key Management

```
┌─────────────────────────────────────────────────────────┐
│                  Key Management System                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Master key stored in HSM (Hardware Security Module)  │
│  2. Data keys encrypted by master key                   │
│  3. Regular key rotation (90 days)                      │
│  4. Key access logged and monitored                     │
│  5. Emergency key revocation procedure                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 4. API Security

### 4.1 Rate Limiting

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 5 requests | per minute |
| Read Operations | 100 requests | per minute |
| Write Operations | 50 requests | per minute |
| Heavy Operations | 10 requests | per minute |

### 4.2 Request Validation

```python
# Required headers
REQUIRED_HEADERS = [
    "Authorization",
    "X-Request-ID",
    "X-API-Version"
]

# Maximum payload size
MAX_REQUEST_SIZE = "10MB"

# Input sanitization
- SQL injection prevention
- XSS prevention
- CSRF tokens for state-changing operations
```

### 4.3 CORS Configuration

```python
ALLOWED_ORIGINS = [
    "https://app.personalfinance.app",
    "https://www.personalfinance.app",
    "http://localhost:3000"  # Development only
]

ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"]
ALLOWED_HEADERS = ["Content-Type", "Authorization"]
EXPOSE_HEADERS = ["X-Request-ID"]
```

---

## 5. Data Protection

### 5.1 Personal Identifiable Information (PII)

| Data Type | Classification | Handling |
|-----------|---------------|----------|
| SSN | Critical | Always encrypted, limited access |
| Bank Account | Critical | Always encrypted, audit logged |
| Date of Birth | Sensitive | Encrypted, optional storage |
| Email | Sensitive | Hashed for analytics, plain for service |
| Phone | Sensitive | Encrypted, optional |
| Address | Sensitive | Encrypted, optional |

### 5.2 Data Retention

| Data Type | Retention Period | Disposal |
|-----------|-----------------|----------|
| Transaction history | 7 years | Secure deletion |
| Account data | Account lifetime + 2 years | Secure deletion |
| Audit logs | 3 years | Secure deletion |
| Session data | 30 days | Automatic purge |

### 5.3 Data Masking

```python
# Display masking for sensitive data
MASKING_RULES = {
    "ssn": "XXX-XX-1234",      # Show last 4
    "account_number": "****1234",  # Show last 4
    "email": "j***@example.com",   # Partial mask
    "phone": "(XXX) XXX-1234"      # Show last 4
}
```

---

## 6. Financial Data Security

### 6.1 Plaid Integration Security

```
Security Measures:
├── Read-only access tokens only
├── Token encryption at rest
├── Automatic token refresh handling
├── Secure webhook verification
└── Institution credential storage (Plaid vault)
```

### 6.2 Transaction Data

```
Transaction Data Handling:
├── Plaid transaction IDs stored
├── Merchant data categorized (not stored raw)
├── Amount stored for calculations
├── Pending transactions marked clearly
└── Categorization done via API (not stored)
```

### 6.3 Third-Party Risk

| Third Party | Data Shared | Risk Level |
|-------------|-------------|------------|
| Plaid | Bank credentials | Low (read-only) |
| AWS/GCP | All data | Low (encrypted) |
| Payment processors | Payment info | Low (PCI compliant) |
| Analytics | Anonymized data | Low |

---

## 7. Compliance

### 7.1 Regulatory Compliance

| Regulation | Requirement | Implementation |
|------------|-------------|----------------|
| GDPR | Data protection | Encryption, consent, deletion |
| CCPA | Consumer rights | Data access, deletion, opt-out |
| SOC 2 Type II | Security controls | Annual audit |
| PCI DSS Level 2 | Payment security | Tokenization, monitoring |

### 7.2 Audit Requirements

```
Audit Logging:
├── All authentication attempts
├── Permission changes
├── Data access (sensitive)
├── API calls (rate limiting)
└── Configuration changes

Log Retention:
├── 1 year: Real-time accessible
├── 3 years: Searchable archive
└── 7 years: Compliance archive
```

---

## 8. Security Monitoring

### 8.1 Anomaly Detection

```python
# Alert triggers
ALERT_THRESHOLDS = {
    "failed_login_attempts": 5,
    "unusual_access_patterns": "statistical",
    "data_export_size": "10MB",
    "api_rate_limit_breach": 10
}
```

### 8.2 Incident Response

```
1. Detection (automated monitoring)
     ↓
2. Analysis (security team review)
     ↓
3. Containment (isolate affected systems)
     ↓
4. Eradication (remove threat)
     ↓
5. Recovery (restore services)
     ↓
6. Post-incident (lessons learned)
```

---

## 9. Secure Development

### 9.1 Code Security

```
Development Requirements:
├── No hardcoded secrets (use environment variables)
├── Dependency scanning (weekly)
├── SAST (Static Application Security Testing)
├── DAST (Dynamic Application Security Testing)
└── Penetration testing (quarterly)
```

### 9.2 Dependency Management

```yaml
# Security scanning configuration
dependency_audit:
  frequency: weekly
  severity_threshold: medium
  auto_update: minor patches
  require_approval: major versions
```

---

## 10. Security Checklist

### Pre-Launch
- [ ] All secrets in environment variables
- [ ] Encryption enabled for all PII
- [ ] Rate limiting configured
- [ ] MFA available
- [ ] Audit logging enabled
- [ ] Security scan completed
- [ ] Penetration test passed
- [ ] SSL certificate valid

### Ongoing
- [ ] Weekly dependency audit
- [ ] Monthly security review
- [ ] Quarterly penetration test
- [ ] Annual SOC 2 audit
- [ ] Regular key rotation

---

**Document Version**: 1.0
**Last Updated**: 2026-04-12