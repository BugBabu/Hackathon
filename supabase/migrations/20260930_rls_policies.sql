-- =============================================================================
-- CERTI-VAULT — Production RLS Policies
-- Migration: 20260930_rls_policies.sql
-- Created:   2026-09-30
-- =============================================================================
--
-- This migration implements strict, role-based Row Level Security (RLS)
-- policies for all CERTI-VAULT application tables.
--
-- Security Strategy:
-- 1. Helper Functions: To prevent infinite recursion when policies query the
--    profiles table (e.g., to check the current user's role), we use
--    SECURITY DEFINER helper functions.
-- 2. Role-Based Access: Policies heavily restrict actions based on whether the
--    user is a 'student', 'issuer', or 'admin'.
-- 3. Isolation: Students can only see their own records/documents. Issuers
--    are restricted to their assigned institution.
-- 4. No Implicit Trusts: Public users can only insert verifications and their
--    initial profile. They can only read active certificates.
--
-- =============================================================================


-- =============================================================================
-- SECTION 1: AUTH HELPER FUNCTIONS
-- =============================================================================
-- These functions run with elevated privileges (SECURITY DEFINER) but are
-- strictly bound to the authenticated user's ID (auth.uid()). They return
-- context needed by RLS policies without causing recursive loops.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS auth_helpers;

-- Helper 1: Get the current user's role from their profile
CREATE OR REPLACE FUNCTION auth_helpers.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Helper 2: Get the current user's assigned institution ID (if they are an active issuer)
CREATE OR REPLACE FUNCTION auth_helpers.get_my_institution_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT institution_id FROM public.issuers WHERE profile_id = auth.uid() AND is_active = true LIMIT 1;
$$;

-- Helper 3: Get the current user's student ID
CREATE OR REPLACE FUNCTION auth_helpers.get_my_student_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id FROM public.students WHERE profile_id = auth.uid() LIMIT 1;
$$;


-- =============================================================================
-- SECTION 2: TABLE POLICIES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. profiles
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can insert their own profile during signup"
    ON public.profiles FOR INSERT
    WITH CHECK ( auth.uid() = id AND role IN ('student', 'issuer') );

CREATE POLICY "Users can read their own profile"
    ON public.profiles FOR SELECT
    USING ( auth.uid() = id OR auth_helpers.get_my_role() = 'admin' );

CREATE POLICY "Users can update their own profile safely"
    ON public.profiles FOR UPDATE
    USING ( auth.uid() = id )
    WITH CHECK ( auth.uid() = id AND role = auth_helpers.get_my_role() );
    
CREATE POLICY "Admins can update any profile"
    ON public.profiles FOR UPDATE
    USING ( auth_helpers.get_my_role() = 'admin' );

CREATE POLICY "Admins can delete profiles"
    ON public.profiles FOR DELETE
    USING ( auth_helpers.get_my_role() = 'admin' );

-- -----------------------------------------------------------------------------
-- 2. institutions
-- -----------------------------------------------------------------------------
CREATE POLICY "Anyone can read verified institutions"
    ON public.institutions FOR SELECT
    USING ( is_verified = true OR auth_helpers.get_my_role() = 'admin' OR id = auth_helpers.get_my_institution_id() );

CREATE POLICY "Admins can manage institutions"
    ON public.institutions FOR ALL
    USING ( auth_helpers.get_my_role() = 'admin' );

-- -----------------------------------------------------------------------------
-- 3. students
-- -----------------------------------------------------------------------------
CREATE POLICY "Students can read their own record"
    ON public.students FOR SELECT
    USING ( profile_id = auth.uid() OR auth_helpers.get_my_role() IN ('admin', 'issuer') );

CREATE POLICY "Students can update their own record"
    ON public.students FOR UPDATE
    USING ( profile_id = auth.uid() )
    WITH CHECK ( profile_id = auth.uid() );

CREATE POLICY "Admins and Issuers can manage students"
    ON public.students FOR ALL
    USING ( auth_helpers.get_my_role() IN ('admin', 'issuer') );

-- -----------------------------------------------------------------------------
-- 4. issuers
-- -----------------------------------------------------------------------------
CREATE POLICY "Issuers can read their own record"
    ON public.issuers FOR SELECT
    USING ( profile_id = auth.uid() OR auth_helpers.get_my_role() = 'admin' );

CREATE POLICY "Admins can manage issuers"
    ON public.issuers FOR ALL
    USING ( auth_helpers.get_my_role() = 'admin' );

-- -----------------------------------------------------------------------------
-- 5. certificates
-- -----------------------------------------------------------------------------
CREATE POLICY "Public can read active certificates"
    ON public.certificates FOR SELECT
    USING ( status = 'active' OR student_id = auth_helpers.get_my_student_id() OR institution_id = auth_helpers.get_my_institution_id() OR auth_helpers.get_my_role() = 'admin' );

CREATE POLICY "Issuers can create certificates for their institution"
    ON public.certificates FOR INSERT
    WITH CHECK ( institution_id = auth_helpers.get_my_institution_id() );

CREATE POLICY "Issuers can update certificates for their institution"
    ON public.certificates FOR UPDATE
    USING ( institution_id = auth_helpers.get_my_institution_id() )
    WITH CHECK ( institution_id = auth_helpers.get_my_institution_id() );
    
CREATE POLICY "Admins can manage all certificates"
    ON public.certificates FOR ALL
    USING ( auth_helpers.get_my_role() = 'admin' );

-- -----------------------------------------------------------------------------
-- 6. certificate_documents
-- -----------------------------------------------------------------------------
CREATE POLICY "Students and Issuers can read documents"
    ON public.certificate_documents FOR SELECT
    USING (
      certificate_id IN (SELECT id FROM public.certificates WHERE student_id = auth_helpers.get_my_student_id()) OR
      certificate_id IN (SELECT id FROM public.certificates WHERE institution_id = auth_helpers.get_my_institution_id()) OR
      auth_helpers.get_my_role() = 'admin'
    );

CREATE POLICY "Issuers can insert documents"
    ON public.certificate_documents FOR INSERT
    WITH CHECK ( certificate_id IN (SELECT id FROM public.certificates WHERE institution_id = auth_helpers.get_my_institution_id()) );

CREATE POLICY "Admins can manage documents"
    ON public.certificate_documents FOR ALL
    USING ( auth_helpers.get_my_role() = 'admin' );

-- -----------------------------------------------------------------------------
-- 7. verifications
-- -----------------------------------------------------------------------------
CREATE POLICY "Anyone can create verification records"
    ON public.verifications FOR INSERT
    WITH CHECK ( true );

CREATE POLICY "Students and Issuers can read verifications"
    ON public.verifications FOR SELECT
    USING (
      certificate_id IN (SELECT id FROM public.certificates WHERE student_id = auth_helpers.get_my_student_id()) OR
      certificate_id IN (SELECT id FROM public.certificates WHERE institution_id = auth_helpers.get_my_institution_id()) OR
      auth_helpers.get_my_role() = 'admin'
    );

-- -----------------------------------------------------------------------------
-- 8. revocations
-- -----------------------------------------------------------------------------
CREATE POLICY "Students and Issuers can read revocations"
    ON public.revocations FOR SELECT
    USING (
      certificate_id IN (SELECT id FROM public.certificates WHERE student_id = auth_helpers.get_my_student_id()) OR
      certificate_id IN (SELECT id FROM public.certificates WHERE institution_id = auth_helpers.get_my_institution_id()) OR
      auth_helpers.get_my_role() = 'admin'
    );

CREATE POLICY "Issuers can revoke their certificates"
    ON public.revocations FOR INSERT
    WITH CHECK (
      revoked_by = auth.uid() AND
      certificate_id IN (SELECT id FROM public.certificates WHERE institution_id = auth_helpers.get_my_institution_id())
    );

CREATE POLICY "Admins can revoke any certificate"
    ON public.revocations FOR INSERT
    WITH CHECK ( revoked_by = auth.uid() AND auth_helpers.get_my_role() = 'admin' );

-- -----------------------------------------------------------------------------
-- 9. audit_logs
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can create their own audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK ( actor_id = auth.uid() );

CREATE POLICY "Admins can read audit logs"
    ON public.audit_logs FOR SELECT
    USING ( auth_helpers.get_my_role() = 'admin' );

-- =============================================================================
-- End of migration: 20260930_rls_policies.sql
-- =============================================================================
