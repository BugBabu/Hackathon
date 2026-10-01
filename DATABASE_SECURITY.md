# CERTI-VAULT — Database Security

> **Migration file:** `supabase/migrations/20260930_rls_policies.sql`
> **Database:** PostgreSQL (via Supabase)
> **Status:** RLS Enabled. Strict role-based policies applied.

---

## Table of Contents

1. [Authentication Model](#authentication-model)
2. [Role Model](#role-model)
3. [Row Level Security (RLS) Strategy](#row-level-security-rls-strategy)
4. [Policy Summaries](#policy-summaries)
5. [Known Limitations](#known-limitations)

---

## Authentication Model

CERTI-VAULT uses Supabase Auth (GoTrue).
- User credentials (passwords) are strictly managed by Supabase and never touch our application tables or logs.
- We rely on `auth.uid()` in our PostgreSQL policies to securely identify the current requestor.

---

## Role Model

Every authenticated user maps to exactly one row in the `public.profiles` table via their `auth.users.id`.
Their role is defined in `profiles.role`:
- **Student**: Can view their own certificates and verifications.
- **Issuer**: Assigned to an institution. Can issue, view, and revoke certificates strictly for their institution.
- **Admin**: Has overarching platform capabilities (not assignable through public registration).

---

## Row Level Security (RLS) Strategy

RLS is **enabled** on all tables. There are no "allow all" public policies.
We use a robust strategy to prevent recursive policies while keeping rules strict.

### SECURITY DEFINER Helper Functions
To avoid infinite recursion when querying `profiles` or `issuers` inside policies, we define three helper functions that execute with elevated privileges but strictly filter by `auth.uid()`:

1. `auth_helpers.get_my_role()`: Returns the role of the current user.
2. `auth_helpers.get_my_institution_id()`: Returns the assigned institution ID for active issuers.
3. `auth_helpers.get_my_student_id()`: Returns the student ID of the current user.

---

## Policy Summaries

### 1. `profiles`
- **Ownership:** Users can insert their initial profile (Student/Issuer only) and update their safe fields (name).
- **Security:** Users cannot change their own role. Only Admins can modify other profiles or update roles.

### 2. `institutions`
- **Isolation:** Public users and issuers can read verified institutions.
- **Security:** Only Admins can create, update, or delete institutions.

### 3. `students`
- **Ownership:** Students can read and update their own record, but cannot modify ownership (`profile_id`).
- **Security:** Issuers and Admins can view student records.

### 4. `issuers`
- **Isolation:** Issuers can read their own record.
- **Security:** Admins fully manage issuer assignments.

### 5. `certificates`
- **Certificate Access:** 
  - Public/Anon: Can only read active certificates.
  - Students: Can read all their own certificates.
  - Issuers: Can read certificates issued by their institution.
  - Admins: Full access.
- **Issuance:** Issuers can only create or update certificates belonging to their own institution.

### 6. `certificate_documents`
- **Document Access:** Documents are never fully public. Only the owning student, the issuing institution, or admins can read them.
- **Uploads:** Only Issuers for the specific institution can insert documents.

### 7. `verifications`
- **Verification Access:** Public users can insert verification records (attempt logging).
- **Read Access:** Students, Issuers, and Admins can read verification history based on their certificate access scope.

### 8. `revocations`
- **Revocation Access:** Only Issuers (for their institution) and Admins can create revocations.
- **Read Access:** Students and Issuers can see revocation records for certificates they are authorized to view.

### 9. `audit_logs`
- **Audit Log Protection:** Normal users can only insert logs for their own actions (`actor_id = auth.uid()`).
- **Immutability:** Users cannot update or delete logs. Only Admins can read them.

---

## Known Limitations

- **Frontend Enforcement:** The frontend handles UI state (e.g., hiding admin buttons), but the database enforces the strict rules regardless of what the client attempts.
- **No Direct Table Deletes:** We generally prefer soft-deletes or status updates (e.g., `status = 'revoked'`) over hard deletes for auditability.
- **Triggers for Profile Creation:** Profile creation currently happens via an RPC/Frontend call during signup. If email confirmation is enabled, a trigger approach on `auth.users` insert might be more robust in the future.
