/**
 * verificationService.js
 * ----------------------
 * Handles public certificate verification lookups against Supabase.
 *
 * SECURITY:
 *  - No service_role key.
 *  - No RLS bypass.
 *  - The certificates SELECT policy allows anonymous users to read rows
 *    where status = 'active'. Revoked/suspended certs are hidden from
 *    anonymous queries by RLS, which is intentional.
 *  - Verification logs are written using the existing policy:
 *    "Anyone can create verification records" WITH CHECK ( true )
 *    which already permits anonymous INSERT.
 *
 * RLS NOTE ON REVOKED CERTIFICATES:
 *  The existing RLS policy for certificates:
 *    USING ( status = 'active' OR student_id = get_my_student_id()
 *            OR institution_id = get_my_institution_id() OR role = 'admin' )
 *  means anonymous/public users cannot read revoked or suspended certificates.
 *  We query by certificate_number; if the result is empty we return
 *  status: 'not_found'. To surface revoked status publicly, the SELECT policy
 *  would need to expose at minimum the status field for all rows — which would
 *  require a schema policy change we deliberately will NOT make here.
 *  This is the secure default: revoked certs are not publicly queryable.
 */

import { supabase } from '../lib/supabaseClient'

// ---------------------------------------------------------------------------
// verifyCertificate
// Looks up a certificate by its certificate_number and returns structured data.
//
// @param {string} certificateNumber — value from the /verify/:certificateId route
// @returns {{ data: CertData | null, status: string, error: string | null }}
//
// Possible status values:
//   'valid'     — certificate found and is active
//   'not_found' — no certificate matches this identifier (or RLS hides it)
//   'error'     — unexpected database error
// ---------------------------------------------------------------------------
export async function verifyCertificate(certificateNumber) {
  if (!certificateNumber?.trim()) {
    return { data: null, status: 'not_found', error: null }
  }

  try {
    // Query the certificate by certificate_number.
    // The SELECT RLS policy: status='active' OR ... allows anonymous reads of
    // active certificates only. Revoked/suspended certs return no rows for
    // anonymous users — the function will return status:'not_found' for those.
    const { data: cert, error } = await supabase
      .from('certificates')
      .select(`
        id,
        certificate_number,
        title,
        program,
        issue_date,
        status,
        created_at,
        students (
          full_name,
          student_id
        ),
        institutions (
          name,
          code
        )
      `)
      .eq('certificate_number', certificateNumber.trim())
      .single()

    if (error) {
      // PGRST116 = no rows matched (certificate not found, or RLS hid it)
      if (error.code === 'PGRST116') {
        // Log the failed lookup attempt
        await logVerification({
          certificateId: null,
          method: 'certificate_id',
          result: 'not_found',
        })
        return { data: null, status: 'not_found', error: null }
      }

      // Other DB error — do not leak internals
      console.error('[verificationService] Unexpected error:', error.message)
      return { data: null, status: 'error', error: 'Unable to complete verification. Please try again.' }
    }

    // Format for UI consumption
    const formatted = {
      certificateNumber: cert.certificate_number,
      title: cert.title,
      program: cert.program,
      issueDate: new Date(cert.issue_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      status: cert.status, // 'active' | 'revoked' | 'suspended' (lowercase from DB)
      studentName: cert.students?.full_name ?? 'Unknown',
      studentId: cert.students?.student_id ?? 'N/A',
      institutionName: cert.institutions?.name ?? 'Unknown Institution',
      institutionCode: cert.institutions?.code ?? 'N/A',
      certUuid: cert.id,
    }

    // Log the successful verification attempt — non-blocking, failure is tolerated
    await logVerification({
      certificateId: cert.id,
      method: 'certificate_id',
      result: 'valid',
    })

    return { data: formatted, status: cert.status, error: null }

  } catch (err) {
    console.error('[verificationService] verifyCertificate threw:', err)
    return { data: null, status: 'error', error: 'An unexpected error occurred.' }
  }
}

// ---------------------------------------------------------------------------
// logVerification (internal)
// Inserts a verification attempt record into public.verifications.
//
// Columns used:
//   certificate_id       UUID  | nullable — references certificates.id
//   verification_method  TEXT  — 'certificate_id' (from allowed enum)
//   result               TEXT  — 'valid' | 'not_found' (from allowed enum)
//
// This is allowed by: "Anyone can create verification records"
//   WITH CHECK ( true )
// Both authenticated AND anonymous users can INSERT.
//
// Failure is intentionally non-fatal: a logging failure must never cause an
// otherwise valid certificate to appear invalid.
// ---------------------------------------------------------------------------
async function logVerification({ certificateId, method, result }) {
  try {
    await supabase
      .from('verifications')
      .insert({
        certificate_id: certificateId, // nullable — null for not_found lookups
        verification_method: method,
        result: result,
      })
  } catch (err) {
    // Swallow silently — verification logging must never break the UX
    console.warn('[verificationService] logVerification failed (non-fatal):', err?.message)
  }
}
