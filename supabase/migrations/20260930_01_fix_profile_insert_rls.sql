-- =============================================================================
-- CERTI-VAULT — Patch: Fix Profile Insert RLS
-- Migration: 20260930_01_fix_profile_insert_rls.sql
-- =============================================================================
-- 
-- Fixes the profile insertion flow. When email verification is enabled, 
-- the initial signUp() request is anonymous, so RLS correctly blocks the 
-- profile INSERT.
-- 
-- This patch drops the old policy and creates an explicit, secure policy 
-- ensuring that once a user authenticates (e.g., upon first login after 
-- email verification), they can securely insert their own profile.
-- 
-- Security Rules Enforced:
-- 1. auth.uid() = id (User can only insert a profile for themselves)
-- 2. role IN ('student', 'issuer') (Admin self-registration is blocked)
-- =============================================================================

-- 1. Drop the existing policy to avoid conflicts
DROP POLICY IF EXISTS "Users can insert their own profile during signup" ON public.profiles;

-- 2. Create the strict replacement policy for newly authenticated users
CREATE POLICY "Authenticated users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (
        -- Ensure the inserted row ID matches the JWT authenticated user
        auth.uid() = id
        
        -- Explicitly prevent privilege escalation to 'admin'
        AND role IN ('student', 'issuer')
    );
