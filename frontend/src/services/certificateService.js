/**
 * certificateService.js
 * ---------------------
 * Handles secure certificate creation and student fetching for the issuer flow.
 *
 * SECURITY:
 *  - Never accepts institution_id or issuer_id from form input — always resolves
 *    them server-side from the authenticated user's issuer record.
 *  - Never uses service_role key.
 *  - All inserts are enforced by the existing RLS policy:
 *    "Issuers can create certificates for their institution"
 *    WITH CHECK ( institution_id = auth_helpers.get_my_institution_id() )
 */

import { supabase } from '../lib/supabaseClient'

// ---------------------------------------------------------------------------
// Internal: resolve the current user's issuer context
// Returns { issuerId, institutionId, institutionCode, error }
// ---------------------------------------------------------------------------
async function resolveIssuerContext() {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'User is not authenticated.' }
  }

  const { data: issuer, error: issuerError } = await supabase
    .from('issuers')
    .select('id, institution_id, is_active, institutions(code)')
    .eq('profile_id', user.id)
    .single()

  if (issuerError) {
    if (issuerError.code === 'PGRST116') {
      return { error: 'No issuer record is linked to your account. Contact an administrator.' }
    }
    return { error: 'Failed to resolve issuer context.' }
  }

  if (!issuer.is_active) {
    return { error: 'Your issuer account is inactive. Contact an administrator.' }
  }

  return {
    issuerId: issuer.id,
    institutionId: issuer.institution_id,
    institutionCode: issuer.institutions?.code ?? 'INST',
    error: null,
  }
}

// ---------------------------------------------------------------------------
// generateCertificateNumber
// Produces a candidate like: CV-2026-INST-CODE-4X
// Format avoids realistic institution names.
// ---------------------------------------------------------------------------
function generateCertificateNumber(institutionCode) {
  const year = new Date().getFullYear()
  const code = (institutionCode ?? 'INST').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 8)
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `CV-${year}-${code}-${rand}`
}

// ---------------------------------------------------------------------------
// getStudentsForIssuer
// Fetches students that the currently authenticated issuer can read via RLS.
// The existing RLS policy:
//   "Students can read their own record"
//   USING ( profile_id = auth.uid() OR auth_helpers.get_my_role() IN ('admin', 'issuer') )
// ...grants issuers access to all students.
// ---------------------------------------------------------------------------
export async function getStudentsForIssuer() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'User is not authenticated.' }
    }

    const { data: students, error } = await supabase
      .from('students')
      .select('id, full_name, student_id, email')
      .order('full_name', { ascending: true })

    if (error) {
      return { data: null, error: 'Failed to fetch students.' }
    }

    return { data: students, error: null }
  } catch (err) {
    console.error('getStudentsForIssuer error:', err)
    return { data: null, error: 'An unexpected error occurred.' }
  }
}

// ---------------------------------------------------------------------------
// createCertificate
// Inserts a new certificate row into public.certificates.
//
// @param {object} fields
//   studentId    UUID  — the students.id (UUID primary key, not student_id string)
//   title        TEXT  — degree title
//   program      TEXT  — program / major
//   issueDate    DATE  — ISO date string e.g. "2026-10-01"
//
// Returns { data: { certificate_number }, error }
// ---------------------------------------------------------------------------
export async function createCertificate(fields) {
  try {
    // 1. Resolve issuer context server-side; never from form input
    const ctx = await resolveIssuerContext()
    if (ctx.error) {
      return { data: null, error: ctx.error }
    }

    // 2. Validate required fields
    const { studentId, title, program, issueDate } = fields
    if (!studentId) return { data: null, error: 'Please select a student.' }
    if (!title?.trim()) return { data: null, error: 'Degree title is required.' }
    if (!program?.trim()) return { data: null, error: 'Program / specialization is required.' }
    if (!issueDate) return { data: null, error: 'Issue date is required.' }

    // 3. Attempt insert with generated certificate number, retry once on collision
    for (let attempt = 0; attempt < 3; attempt++) {
      const certNumber = generateCertificateNumber(ctx.institutionCode)

      const { data, error } = await supabase
        .from('certificates')
        .insert({
          certificate_number: certNumber,
          student_id: studentId,
          institution_id: ctx.institutionId, // server-resolved, not from form
          issuer_id: ctx.issuerId,           // server-resolved, not from form
          title: title.trim(),
          program: program.trim(),
          issue_date: issueDate,
          status: 'active',
        })
        .select('certificate_number')
        .single()

      if (error) {
        // 23505 = unique_violation — try a new number
        if (error.code === '23505') {
          continue
        }
        // RLS violation
        if (error.code === '42501' || error.message?.includes('row-level security')) {
          return {
            data: null,
            error:
              'Permission denied: Your issuer account is not authorized to create certificates for this institution. Verify your issuer record is correctly linked.',
          }
        }
        // Other DB error
        return { data: null, error: `Database error: ${error.message}` }
      }

      return { data, error: null }
    }

    return { data: null, error: 'Failed to generate a unique certificate number after several attempts. Please try again.' }
  } catch (err) {
    console.error('createCertificate error:', err)
    return { data: null, error: 'An unexpected error occurred.' }
  }
}

// ---------------------------------------------------------------------------
// getIssuerContext (public)
// Exposes the resolved issuer context for UI use (e.g. showing institution name)
// ---------------------------------------------------------------------------
export async function getIssuerContext() {
  return resolveIssuerContext()
}
