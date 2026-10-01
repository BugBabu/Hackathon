-- =============================================================================
-- CERTI-VAULT — Initial Database Schema
-- Migration: 20260930_initial_schema.sql
-- Created:   2026-09-30
-- =============================================================================
--
-- This migration creates the complete initial schema for CERTI-VAULT,
-- an Academic Certificate Authenticity Validator platform.
--
-- Tables created:
--   1. profiles              — Extended user identity linked to Supabase Auth
--   2. institutions          — Authorized certificate-issuing universities
--   3. students              — Student records linked to profiles
--   4. issuers               — Issuer staff records linked to profiles + institutions
--   5. certificates          — Core credential records
--   6. certificate_documents — Uploaded document files associated with certificates
--   7. verifications         — Public verification attempt audit trail
--   8. revocations           — Revocation records for suspended/revoked certificates
--   9. audit_logs            — Full administrative audit trail (JSONB metadata)
--
-- Security:
--   Row Level Security (RLS) is ENABLED on every table.
--   Permissive role-based policies will be added AFTER Supabase Auth
--   integration is complete. See comments at the bottom of this file.
--
-- Idempotency:
--   All CREATE TABLE statements use IF NOT EXISTS so the migration can be
--   safely re-run during development without data loss.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
-- pgcrypto provides gen_random_uuid() for UUID primary key generation.
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =============================================================================
-- TABLE 1: profiles
-- =============================================================================
-- Extends Supabase Auth's auth.users table with application-level identity.
-- One profile row per authenticated user. The profile id MUST match the
-- corresponding auth.users.id so that RLS policies can join them.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name     TEXT        NOT NULL,
    email         TEXT        NOT NULL,
    role          TEXT        NOT NULL DEFAULT 'student',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT profiles_email_unique     UNIQUE (email),
    CONSTRAINT profiles_role_check       CHECK  (role IN ('student', 'issuer', 'admin'))
);

COMMENT ON TABLE  public.profiles           IS 'Extended user profiles. id mirrors auth.users.id.';
COMMENT ON COLUMN public.profiles.id        IS 'Must match auth.users.id for RLS to work correctly.';
COMMENT ON COLUMN public.profiles.role      IS 'Application role: student | issuer | admin';
COMMENT ON COLUMN public.profiles.email     IS 'Denormalized from auth.users for fast lookups.';

CREATE INDEX IF NOT EXISTS idx_profiles_role  ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);


-- =============================================================================
-- TABLE 2: institutions
-- =============================================================================
-- Authorized certificate-issuing academic institutions.
-- Only institutions marked is_verified = true may issue credentials.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.institutions (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT        NOT NULL,
    code         TEXT        NOT NULL,
    email        TEXT        NOT NULL,
    is_verified  BOOLEAN     NOT NULL DEFAULT false,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT institutions_code_unique  UNIQUE (code),
    CONSTRAINT institutions_email_unique UNIQUE (email)
);

COMMENT ON TABLE  public.institutions              IS 'Authorized certificate-issuing universities.';
COMMENT ON COLUMN public.institutions.code         IS 'Short alphanumeric institution code, e.g. EU-DEMO-001. Must be unique.';
COMMENT ON COLUMN public.institutions.is_verified  IS 'Only verified institutions may issue certificates.';

CREATE INDEX IF NOT EXISTS idx_institutions_code        ON public.institutions (code);
CREATE INDEX IF NOT EXISTS idx_institutions_is_verified ON public.institutions (is_verified);


-- =============================================================================
-- TABLE 3: students
-- =============================================================================
-- Student records. Each student links to a profiles row (auth identity)
-- and carries an institution-specific student_id string.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.students (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id    UUID        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    student_id    TEXT        NOT NULL,
    full_name     TEXT        NOT NULL,
    email         TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT students_student_id_unique UNIQUE (student_id),
    CONSTRAINT students_email_unique      UNIQUE (email)
);

COMMENT ON TABLE  public.students            IS 'Student records linked to auth profiles.';
COMMENT ON COLUMN public.students.profile_id IS 'FK → profiles.id. Cascade-delete removes student when profile is deleted.';
COMMENT ON COLUMN public.students.student_id IS 'Institution-assigned student ID string, e.g. STU-2026-0001. Must be globally unique.';

CREATE INDEX IF NOT EXISTS idx_students_profile_id ON public.students (profile_id);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON public.students (student_id);
CREATE INDEX IF NOT EXISTS idx_students_email      ON public.students (email);


-- =============================================================================
-- TABLE 4: issuers
-- =============================================================================
-- Registrar / issuer staff records. Each issuer is linked to exactly one
-- institution and one profile (auth identity).
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.issuers (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id      UUID        NOT NULL REFERENCES public.profiles      (id) ON DELETE CASCADE,
    institution_id  UUID        NOT NULL REFERENCES public.institutions  (id) ON DELETE RESTRICT,
    designation     TEXT        NOT NULL DEFAULT 'Registrar',
    is_active       BOOLEAN     NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- One profile can hold at most one issuer role per institution
    CONSTRAINT issuers_profile_institution_unique UNIQUE (profile_id, institution_id)
);

COMMENT ON TABLE  public.issuers               IS 'Issuer / registrar staff linked to an institution.';
COMMENT ON COLUMN public.issuers.profile_id    IS 'FK → profiles.id.';
COMMENT ON COLUMN public.issuers.institution_id IS 'FK → institutions.id. Restricted delete: institution cannot be deleted while issuers exist.';
COMMENT ON COLUMN public.issuers.is_active     IS 'Inactive issuers cannot issue new certificates.';

CREATE INDEX IF NOT EXISTS idx_issuers_profile_id     ON public.issuers (profile_id);
CREATE INDEX IF NOT EXISTS idx_issuers_institution_id ON public.issuers (institution_id);
CREATE INDEX IF NOT EXISTS idx_issuers_is_active      ON public.issuers (is_active);


-- =============================================================================
-- TABLE 5: certificates
-- =============================================================================
-- Core credential records. Each certificate belongs to a student, issued
-- by an issuer at an institution.
--
-- certificate_number: human-readable unique identifier, e.g. CV-2026-DEMO-001
-- document_hash:      SHA-256 hex digest of the original uploaded document
--                     (populated when document_upload verification is supported)
-- document_url:       Supabase Storage path to the stored document file
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.certificates (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_number  TEXT        NOT NULL,
    student_id          UUID        NOT NULL REFERENCES public.students     (id) ON DELETE RESTRICT,
    institution_id      UUID        NOT NULL REFERENCES public.institutions (id) ON DELETE RESTRICT,
    issuer_id           UUID        NOT NULL REFERENCES public.issuers      (id) ON DELETE RESTRICT,
    title               TEXT        NOT NULL,
    program             TEXT        NOT NULL,
    issue_date          DATE        NOT NULL,
    status              TEXT        NOT NULL DEFAULT 'active',
    document_url        TEXT,
    document_hash       TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT certificates_number_unique UNIQUE (certificate_number),
    CONSTRAINT certificates_status_check  CHECK  (status IN ('active', 'revoked', 'suspended'))
);

COMMENT ON TABLE  public.certificates                    IS 'Core academic credential records.';
COMMENT ON COLUMN public.certificates.certificate_number IS 'Human-readable unique ID, e.g. CV-2026-DEMO-001.';
COMMENT ON COLUMN public.certificates.status             IS 'Lifecycle status: active | revoked | suspended.';
COMMENT ON COLUMN public.certificates.document_hash      IS 'SHA-256 hex digest of the original uploaded PDF. Used for tamper detection.';
COMMENT ON COLUMN public.certificates.document_url       IS 'Supabase Storage object path for the stored credential document.';

CREATE INDEX IF NOT EXISTS idx_certificates_number          ON public.certificates (certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_student_id      ON public.certificates (student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_institution_id  ON public.certificates (institution_id);
CREATE INDEX IF NOT EXISTS idx_certificates_issuer_id       ON public.certificates (issuer_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status          ON public.certificates (status);
CREATE INDEX IF NOT EXISTS idx_certificates_document_hash   ON public.certificates (document_hash);
CREATE INDEX IF NOT EXISTS idx_certificates_issue_date      ON public.certificates (issue_date);


-- =============================================================================
-- TABLE 6: certificate_documents
-- =============================================================================
-- Tracks individual uploaded document files linked to certificates.
-- Supports versioning: multiple document files can be associated with
-- one certificate (e.g. original, reissued copy).
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.certificate_documents (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id  UUID        NOT NULL REFERENCES public.certificates (id) ON DELETE CASCADE,
    file_path       TEXT        NOT NULL,
    file_name       TEXT        NOT NULL,
    mime_type       TEXT        NOT NULL DEFAULT 'application/pdf',
    file_size       BIGINT      NOT NULL,
    document_hash   TEXT        NOT NULL,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.certificate_documents               IS 'Uploaded document files linked to certificates.';
COMMENT ON COLUMN public.certificate_documents.file_path     IS 'Supabase Storage object path.';
COMMENT ON COLUMN public.certificate_documents.document_hash IS 'SHA-256 of this specific file version for tamper detection.';
COMMENT ON COLUMN public.certificate_documents.file_size     IS 'File size in bytes.';

CREATE INDEX IF NOT EXISTS idx_cert_docs_certificate_id ON public.certificate_documents (certificate_id);
CREATE INDEX IF NOT EXISTS idx_cert_docs_document_hash  ON public.certificate_documents (document_hash);


-- =============================================================================
-- TABLE 7: verifications
-- =============================================================================
-- Immutable audit trail of every public verification attempt.
-- Records who tried to verify what, how, and what the result was.
-- This table is append-only — rows should never be updated or deleted.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.verifications (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id       UUID        REFERENCES public.certificates (id) ON DELETE SET NULL,
    verification_method  TEXT        NOT NULL,
    result               TEXT        NOT NULL,
    document_hash        TEXT,
    ip_address           INET,
    verified_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT verifications_method_check CHECK (
        verification_method IN ('certificate_id', 'qr_code', 'document_upload')
    ),
    CONSTRAINT verifications_result_check CHECK (
        result IN ('valid', 'invalid', 'tampered', 'revoked', 'not_found')
    )
);

COMMENT ON TABLE  public.verifications                      IS 'Append-only audit trail of all public verification attempts.';
COMMENT ON COLUMN public.verifications.certificate_id       IS 'FK → certificates.id. SET NULL if certificate is deleted (preserves audit record).';
COMMENT ON COLUMN public.verifications.verification_method  IS 'How the verification was attempted: certificate_id | qr_code | document_upload.';
COMMENT ON COLUMN public.verifications.result               IS 'Outcome: valid | invalid | tampered | revoked | not_found.';
COMMENT ON COLUMN public.verifications.document_hash        IS 'SHA-256 of the uploaded document (only for document_upload method).';
COMMENT ON COLUMN public.verifications.ip_address           IS 'Requester IP for fraud pattern detection. Store only as INET, never full PII.';

CREATE INDEX IF NOT EXISTS idx_verifications_certificate_id ON public.verifications (certificate_id);
CREATE INDEX IF NOT EXISTS idx_verifications_result         ON public.verifications (result);
CREATE INDEX IF NOT EXISTS idx_verifications_verified_at    ON public.verifications (verified_at DESC);
CREATE INDEX IF NOT EXISTS idx_verifications_method         ON public.verifications (verification_method);


-- =============================================================================
-- TABLE 8: revocations
-- =============================================================================
-- Records when and why a certificate was revoked or suspended.
-- Each revocation links to the certificate and the admin/issuer who acted.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.revocations (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id  UUID        NOT NULL REFERENCES public.certificates (id) ON DELETE CASCADE,
    reason          TEXT        NOT NULL,
    revoked_by      UUID        NOT NULL REFERENCES public.profiles     (id) ON DELETE RESTRICT,
    revoked_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.revocations               IS 'Records for revoked or suspended certificates.';
COMMENT ON COLUMN public.revocations.certificate_id IS 'FK → certificates.id. Cascade-delete if certificate is purged.';
COMMENT ON COLUMN public.revocations.reason         IS 'Human-readable explanation of why the credential was revoked.';
COMMENT ON COLUMN public.revocations.revoked_by     IS 'FK → profiles.id of the admin or issuer who performed the revocation.';

CREATE INDEX IF NOT EXISTS idx_revocations_certificate_id ON public.revocations (certificate_id);
CREATE INDEX IF NOT EXISTS idx_revocations_revoked_by     ON public.revocations (revoked_by);
CREATE INDEX IF NOT EXISTS idx_revocations_revoked_at     ON public.revocations (revoked_at DESC);


-- =============================================================================
-- TABLE 9: audit_logs
-- =============================================================================
-- Full administrative audit trail. Records every significant action
-- performed by any actor on any entity. Immutable — no updates/deletes.
-- metadata JSONB allows flexible storage of action-specific context
-- without schema migrations for every new action type.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id     UUID        REFERENCES public.profiles (id) ON DELETE SET NULL,
    action       TEXT        NOT NULL,
    entity_type  TEXT        NOT NULL,
    entity_id    UUID,
    metadata     JSONB,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.audit_logs              IS 'Append-only administrative audit trail for all platform actions.';
COMMENT ON COLUMN public.audit_logs.actor_id     IS 'FK → profiles.id. SET NULL if actor account is deleted (preserves audit integrity).';
COMMENT ON COLUMN public.audit_logs.action       IS 'Action string, e.g. certificate.issued, certificate.revoked, user.login.';
COMMENT ON COLUMN public.audit_logs.entity_type  IS 'Name of the affected table/entity, e.g. certificates, institutions.';
COMMENT ON COLUMN public.audit_logs.entity_id    IS 'UUID of the specific affected row.';
COMMENT ON COLUMN public.audit_logs.metadata     IS 'Flexible JSONB bag for action-specific context (diffs, reasons, IP, etc.).';

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id    ON public.audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id   ON public.audit_logs (entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs (entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action      ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at  ON public.audit_logs (created_at DESC);
-- GIN index for fast JSONB metadata queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata    ON public.audit_logs USING GIN (metadata);


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
-- RLS is enabled on every application table.
--
-- *** IMPORTANT — DEVELOPMENT STAGE ***
-- No permissive policies are created here because Supabase Auth has not
-- been integrated yet. Without auth.uid() available, any policy referencing
-- user identity would be meaningless or insecure.
--
-- What this means in practice:
--   • Supabase service_role key (used only server-side) bypasses RLS and
--     can read/write all tables — safe for seeding and admin operations.
--   • The anon key used in the frontend cannot read or write any table
--     until explicit policies are created after Auth integration.
--   • This is the SAFEST state for a pre-auth schema.
--
-- Planned policies to be added after Auth integration:
--
--   profiles:
--     - SELECT: user can read their own row (auth.uid() = id)
--     - UPDATE: user can update their own row
--     - Admin: full access to all rows
--
--   institutions:
--     - SELECT: any authenticated user can read verified institutions
--     - INSERT/UPDATE/DELETE: admin only
--
--   students:
--     - SELECT: student can read their own row; issuers can read students
--               in their institution; admins see all
--     - INSERT/UPDATE: issuer or admin only
--
--   issuers:
--     - SELECT: authenticated users can read active issuers
--     - INSERT/UPDATE: admin only
--
--   certificates:
--     - SELECT (public): any anon user can read active certificates by
--               certificate_number or id (for public verification)
--     - INSERT: active issuer for their own institution
--     - UPDATE (status): admin or issuer for their institution
--
--   certificate_documents:
--     - SELECT: student (own), issuer (institution), admin (all)
--     - INSERT: issuer for their institution
--
--   verifications:
--     - INSERT: anon allowed (public verification calls)
--     - SELECT: student (own certs), issuer (institution certs), admin (all)
--
--   revocations:
--     - INSERT: admin or issuer (own institution)
--     - SELECT: student (own), issuer (institution), admin (all)
--
--   audit_logs:
--     - INSERT: via server-side triggers or service_role only
--     - SELECT: admin only
-- =============================================================================

ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issuers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revocations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs            ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- End of migration: 20260930_initial_schema.sql
-- =============================================================================
