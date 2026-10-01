# CERTI-VAULT — Database Architecture

> **Migration file:** `supabase/migrations/20260930_initial_schema.sql`
> **Database:** PostgreSQL (via Supabase)
> **Status:** Schema defined. RLS enabled. Auth policies pending.

---

## Table of Contents

1. [Overview](#overview)
2. [Entity Relationship Summary](#entity-relationship-summary)
3. [Table Reference](#table-reference)
4. [Important Constraints](#important-constraints)
5. [Certificate Lifecycle](#certificate-lifecycle)
6. [Verification Lifecycle](#verification-lifecycle)
7. [Audit Trail Design](#audit-trail-design)
8. [Index Strategy](#index-strategy)
9. [Security & RLS](#security--rls)
10. [Planned RLS Policies (Post-Auth)](#planned-rls-policies-post-auth)

---

## Overview

CERTI-VAULT is an Academic Certificate Authenticity Validator. The schema is
designed around four core workflows:

| Workflow | Primary tables |
|---|---|
| Identity & roles | `profiles` |
| Institution management | `institutions`, `issuers` |
| Certificate issuance | `certificates`, `certificate_documents` |
| Public verification | `verifications` |
| Revocation | `revocations` |
| Audit trail | `audit_logs` |

---

## Entity Relationship Summary

```
auth.users (Supabase Auth)
    │
    └─► profiles (1:1)
            │
            ├─► students  (1:1 via profile_id)
            │       │
            │       └─► certificates (1:many via student_id)
            │                   │
            │                   ├─► certificate_documents (1:many)
            │                   ├─► verifications         (1:many)
            │                   └─► revocations           (1:many)
            │
            └─► issuers   (1:1 via profile_id)
                    │
                    └─► institutions (many:1 via institution_id)
                                │
                                └─► certificates (1:many via institution_id)
```

---

## Table Reference

### 1. `profiles`

**Purpose:** Extends Supabase Auth `auth.users` with application-level identity.
One row per authenticated user. The `profiles.id` must mirror `auth.users.id`.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Must equal `auth.users.id` |
| `full_name` | TEXT NOT NULL | Display name |
| `email` | TEXT NOT NULL UNIQUE | Denormalized from Auth for fast lookups |
| `role` | TEXT NOT NULL | `student` \| `issuer` \| `admin` |
| `created_at` | TIMESTAMPTZ | Auto-set |
| `updated_at` | TIMESTAMPTZ | Must be kept current by application |

---

### 2. `institutions`

**Purpose:** Registry of authorized certificate-issuing academic institutions.
Only institutions with `is_verified = true` may issue credentials.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `name` | TEXT NOT NULL | Full institution name |
| `code` | TEXT NOT NULL UNIQUE | Short alphanumeric code, e.g. `EU-DEMO-001` |
| `email` | TEXT NOT NULL UNIQUE | Official contact email |
| `is_verified` | BOOLEAN NOT NULL | Gate for certificate issuance |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

---

### 3. `students`

**Purpose:** Student records. Links to `profiles` for auth identity and carries
an institution-assigned `student_id` string.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `profile_id` | UUID FK → profiles | Cascade-delete |
| `student_id` | TEXT NOT NULL UNIQUE | e.g. `STU-2026-0001` |
| `full_name` | TEXT NOT NULL | |
| `email` | TEXT NOT NULL UNIQUE | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

---

### 4. `issuers`

**Purpose:** Registrar / issuer staff. Each issuer is linked to exactly one
institution and one profile. Inactive issuers cannot issue certificates.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `profile_id` | UUID FK → profiles | Cascade-delete |
| `institution_id` | UUID FK → institutions | Restrict-delete |
| `designation` | TEXT NOT NULL | e.g. `Registrar`, `Deputy Registrar` |
| `is_active` | BOOLEAN NOT NULL | Gate for issuance capability |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

> **Unique constraint:** `(profile_id, institution_id)` — one issuer role per institution per profile.

---

### 5. `certificates`

**Purpose:** Core academic credential records. The central table of the platform.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Internal UUID |
| `certificate_number` | TEXT NOT NULL UNIQUE | Human-readable, e.g. `CV-2026-DEMO-001` |
| `student_id` | UUID FK → students | Restrict-delete |
| `institution_id` | UUID FK → institutions | Restrict-delete |
| `issuer_id` | UUID FK → issuers | Restrict-delete |
| `title` | TEXT NOT NULL | Credential title |
| `program` | TEXT NOT NULL | Degree program name |
| `issue_date` | DATE NOT NULL | Conferred date |
| `status` | TEXT NOT NULL | `active` \| `revoked` \| `suspended` |
| `document_url` | TEXT | Supabase Storage object path |
| `document_hash` | TEXT | SHA-256 of uploaded document |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

> **Status constraint:** `CHECK (status IN ('active', 'revoked', 'suspended'))`

---

### 6. `certificate_documents`

**Purpose:** Tracks every uploaded document file linked to a certificate.
Supports multiple versions (original, reissued copy, etc.).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `certificate_id` | UUID FK → certificates | Cascade-delete |
| `file_path` | TEXT NOT NULL | Supabase Storage path |
| `file_name` | TEXT NOT NULL | Original filename |
| `mime_type` | TEXT NOT NULL | Default `application/pdf` |
| `file_size` | BIGINT NOT NULL | Bytes |
| `document_hash` | TEXT NOT NULL | SHA-256 of this file version |
| `uploaded_at` | TIMESTAMPTZ | |

---

### 7. `verifications`

**Purpose:** Immutable, append-only record of every public verification attempt.
Rows must never be updated or deleted.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `certificate_id` | UUID FK → certificates | SET NULL on cert delete |
| `verification_method` | TEXT NOT NULL | `certificate_id` \| `qr_code` \| `document_upload` |
| `result` | TEXT NOT NULL | `valid` \| `invalid` \| `tampered` \| `revoked` \| `not_found` |
| `document_hash` | TEXT | Only for `document_upload` method |
| `ip_address` | INET | Requester IP (no full PII stored) |
| `verified_at` | TIMESTAMPTZ | |

> **FK behavior:** `certificate_id` uses `SET NULL` on certificate delete so that
> the verification audit record is preserved even if the certificate is removed.

---

### 8. `revocations`

**Purpose:** Records when and why a certificate was revoked or suspended.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `certificate_id` | UUID FK → certificates | Cascade-delete |
| `reason` | TEXT NOT NULL | Human-readable explanation |
| `revoked_by` | UUID FK → profiles | Restrict-delete |
| `revoked_at` | TIMESTAMPTZ | |

---

### 9. `audit_logs`

**Purpose:** Full administrative audit trail. Append-only. Uses JSONB `metadata`
for flexible, schema-free context storage per action type.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `actor_id` | UUID FK → profiles | SET NULL on account delete |
| `action` | TEXT NOT NULL | e.g. `certificate.issued`, `certificate.revoked` |
| `entity_type` | TEXT NOT NULL | Affected table name |
| `entity_id` | UUID | Affected row UUID |
| `metadata` | JSONB | Action-specific context (diffs, reasons, IP…) |
| `created_at` | TIMESTAMPTZ | |

---

## Important Constraints

| Table | Constraint | Type |
|---|---|---|
| `profiles` | `email` | UNIQUE |
| `profiles` | `role` | CHECK: `student \| issuer \| admin` |
| `institutions` | `code` | UNIQUE |
| `institutions` | `email` | UNIQUE |
| `students` | `student_id` | UNIQUE |
| `students` | `email` | UNIQUE |
| `issuers` | `(profile_id, institution_id)` | UNIQUE |
| `certificates` | `certificate_number` | UNIQUE |
| `certificates` | `status` | CHECK: `active \| revoked \| suspended` |
| `verifications` | `verification_method` | CHECK: 3 valid values |
| `verifications` | `result` | CHECK: 5 valid values |

---

## Certificate Lifecycle

```
[Issuer creates certificate]
         │
         ▼
    status = 'active'
         │
         ├──► [Employer/Student verifies] → verifications row inserted
         │
         ├──► [Admin suspends] → status = 'suspended'
         │                           │
         │                           └──► [Admin reinstates] → status = 'active'
         │
         └──► [Admin/Issuer revokes] → status = 'revoked'
                                           │
                                           └──► revocations row inserted
                                                (permanent — cannot be reinstated)
```

**Verification check order:**
1. Look up `certificate_number` in `certificates`.
2. If not found → result = `not_found`.
3. If `status = 'revoked'` → result = `revoked`.
4. If `document_upload` method: compute SHA-256 of uploaded file, compare with `document_hash`.
   - Mismatch → result = `tampered`.
5. All checks pass → result = `valid`.

---

## Verification Lifecycle

```
[Public user submits verification request]
         │
         ├── Method: certificate_id  → lookup by certificate_number
         ├── Method: qr_code        → lookup by embedded certificate_number
         └── Method: document_upload → compute hash, compare with stored hash
                  │
                  ▼
         [Result determined]
                  │
                  ▼
    [verifications row inserted — immutable]
                  │
                  ▼
    [Result returned to user — no PII exposed]
```

---

## Audit Trail Design

`audit_logs` is intentionally schema-free for `metadata`:

```json
// certificate.issued
{ "certificate_number": "CV-2026-DEMO-001", "program": "B.S. Computer Science" }

// certificate.revoked
{ "reason": "Fraudulent submission", "previous_status": "active" }

// user.login
{ "ip": "192.168.1.1", "user_agent": "Mozilla/5.0..." }
```

This allows adding new action types without schema migrations.

---

## Index Strategy

| Index | Purpose |
|---|---|
| `profiles(role)` | Role-based filtering |
| `profiles(email)` | Auth lookup |
| `institutions(code)` | Code-based lookups |
| `students(student_id)` | Student ID search |
| `certificates(certificate_number)` | Primary public verification lookup |
| `certificates(student_id)` | Student's own certificates |
| `certificates(institution_id)` | Issuer dashboard queries |
| `certificates(issuer_id)` | Issuer dashboard queries |
| `certificates(status)` | Active/revoked filtering |
| `certificates(document_hash)` | Document upload tamper detection |
| `verifications(certificate_id)` | Verification history per certificate |
| `verifications(verified_at DESC)` | Time-sorted verification feed |
| `audit_logs(actor_id)` | Actor audit history |
| `audit_logs(entity_id)` | Entity audit history |
| `audit_logs(metadata) GIN` | JSONB metadata search |

---

## Security & RLS

Row Level Security is **enabled on every table** in the migration.

> [!IMPORTANT]
> No permissive policies are created in this migration because Supabase Auth
> has not been integrated yet. This is the **correct and safest pre-auth state**.

**What this means in practice:**
- The **service_role** key (server-side only) bypasses RLS — safe for seeding and admin tasks.
- The **anon key** (used in the frontend) cannot read or write any table until explicit policies are added.
- No accidental public data exposure is possible.

---

## Planned RLS Policies (Post-Auth)

These will be added in a separate migration **after** Supabase Auth is integrated.

| Table | Who | Operation | Condition |
|---|---|---|---|
| `profiles` | self | SELECT, UPDATE | `auth.uid() = id` |
| `profiles` | admin | ALL | role check |
| `institutions` | authenticated | SELECT | `is_verified = true` |
| `institutions` | admin | ALL | role check |
| `students` | self | SELECT | `profile_id = auth.uid()` |
| `students` | issuer | SELECT | own institution's students |
| `students` | admin | ALL | — |
| `issuers` | authenticated | SELECT | `is_active = true` |
| `issuers` | admin | ALL | — |
| `certificates` | **anon** | SELECT | `status = 'active'` (public verification) |
| `certificates` | issuer | INSERT | own institution only |
| `certificates` | admin | ALL | — |
| `certificate_documents` | student | SELECT | own certificates |
| `certificate_documents` | issuer | SELECT, INSERT | own institution |
| `certificate_documents` | admin | ALL | — |
| `verifications` | **anon** | INSERT | allowed (public verification calls) |
| `verifications` | student | SELECT | own certificates |
| `verifications` | admin | SELECT | all |
| `revocations` | issuer | INSERT | own institution |
| `revocations` | admin | ALL | — |
| `audit_logs` | admin | SELECT | — |
| `audit_logs` | service_role | INSERT | server-side triggers only |

---

*Last updated: 2026-09-30*
