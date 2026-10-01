/**
 * auditService.js
 * ---------------
 * Service for reading audit and verification activity data.
 *
 * RLS LIMITATION — audit_logs table:
 *   The existing policy "Admins can read audit logs" restricts SELECT to
 *   role = 'admin' ONLY.
 *   Issuer and student roles cannot read audit_logs rows. We do NOT weaken
 *   this policy.
 *
 *   The AuditLogsPage (/audit-logs) is accessible to issuer-role users.
 *   For issuer-role users, this service instead surfaces the verifications
 *   table (which issuers CAN read under "Students and Issuers can read
 *   verifications"), so the page shows meaningful, real data within the
 *   permitted access scope.
 *
 *   Admin-role users will eventually be able to read audit_logs directly
 *   once admin provisioning is implemented.
 */

import { supabase } from '../lib/supabaseClient'

// ---------------------------------------------------------------------------
// getAuditLogsForAdmin
// Reads from audit_logs — only succeeds if the caller has admin role.
// Returns { data: array, error }
// ---------------------------------------------------------------------------
export async function getAuditLogsForAdmin({ search = '', limit = 100 } = {}) {
  try {
    let query = supabase
      .from('audit_logs')
      .select('id, actor_id, action, entity_type, entity_id, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    const { data, error } = await query

    if (error) {
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        return {
          data: null,
          error: 'Access denied: Only administrators can view the full audit log.',
          isPermissionError: true,
        }
      }
      return { data: null, error: 'Failed to fetch audit logs.', isPermissionError: false }
    }

    // Apply search client-side (audit_logs metadata is JSONB — easier to filter
    // in JS than via PostgREST for general text matching)
    const filtered = search.trim()
      ? data.filter((log) => {
          const needle = search.toLowerCase()
          return (
            log.action?.toLowerCase().includes(needle) ||
            log.entity_type?.toLowerCase().includes(needle) ||
            log.entity_id?.toLowerCase().includes(needle) ||
            JSON.stringify(log.metadata ?? {}).toLowerCase().includes(needle)
          )
        })
      : data

    const formatted = filtered.map((log) => ({
      id: log.id,
      timestamp: new Date(log.created_at).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      }),
      action: log.action,
      entityType: log.entity_type,
      entityId: log.entity_id,
      actorId: log.actor_id,
      metadata: log.metadata,
      // Derive a human-readable severity from the action string
      severity: deriveSeverity(log.action),
    }))

    return { data: formatted, error: null, isPermissionError: false }
  } catch (err) {
    console.error('getAuditLogsForAdmin error:', err)
    return { data: null, error: 'An unexpected error occurred.', isPermissionError: false }
  }
}

// ---------------------------------------------------------------------------
// getVerificationLogsForIssuer
// Reads from verifications, scoped to the authenticated issuer's institution.
// RLS policy: "Students and Issuers can read verifications"
//   USING ( certificate_id IN (SELECT id FROM certificates WHERE
//           institution_id = get_my_institution_id()) OR ... )
// ---------------------------------------------------------------------------
export async function getVerificationLogsForIssuer({ search = '', limit = 100 } = {}) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'User is not authenticated.' }
    }

    const { data: rows, error } = await supabase
      .from('verifications')
      .select(`
        id,
        verification_method,
        result,
        verified_at,
        certificate_id,
        certificates (
          certificate_number,
          title
        )
      `)
      .order('verified_at', { ascending: false })
      .limit(limit)

    if (error) {
      return { data: null, error: 'Failed to fetch verification logs.' }
    }

    const formatted = rows.map((row) => ({
      id: row.id,
      timestamp: new Date(row.verified_at).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      }),
      eventType: formatMethod(row.verification_method),
      targetId: row.certificates?.certificate_number ?? '—',
      certificateTitle: row.certificates?.title ?? 'Unknown Certificate',
      result: row.result,
      severity: resultToSeverity(row.result),
      details: `Certificate lookup via ${formatMethod(row.verification_method)}. Result: ${row.result}.`,
    }))

    // Client-side search
    const filtered = search.trim()
      ? formatted.filter((log) => {
          const needle = search.toLowerCase()
          return (
            log.targetId.toLowerCase().includes(needle) ||
            log.eventType.toLowerCase().includes(needle) ||
            log.result.toLowerCase().includes(needle) ||
            log.details.toLowerCase().includes(needle)
          )
        })
      : formatted

    return { data: filtered, error: null }
  } catch (err) {
    console.error('getVerificationLogsForIssuer error:', err)
    return { data: null, error: 'An unexpected error occurred.' }
  }
}

// ---------------------------------------------------------------------------
// getVerificationsThisMonth
// Returns the count of verifications this calendar month for the issuer's
// institution, by reading only rows accessible under existing RLS.
// ---------------------------------------------------------------------------
export async function getVerificationsThisMonth() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { count: null, error: 'Not authenticated.' }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { data, error } = await supabase
      .from('verifications')
      .select('id', { count: 'exact' })
      .gte('verified_at', startOfMonth)

    if (error) {
      return { count: null, error: 'Failed to fetch verification count.' }
    }

    // Supabase returns count in the response headers via the count option
    // When using count:'exact', the count is in data.length if rows are returned
    return { count: data?.length ?? 0, error: null }
  } catch (err) {
    console.error('getVerificationsThisMonth error:', err)
    return { count: null, error: 'An unexpected error occurred.' }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function deriveSeverity(action = '') {
  const a = action.toLowerCase()
  if (a.includes('revok') || a.includes('suspend') || a.includes('delete')) return 'CRITICAL'
  if (a.includes('warn') || a.includes('fail') || a.includes('tamper')) return 'WARNING'
  return 'INFO'
}

function resultToSeverity(result = '') {
  if (result === 'tampered' || result === 'revoked') return 'CRITICAL'
  if (result === 'invalid' || result === 'not_found') return 'WARNING'
  return 'INFO'
}

function formatMethod(method = '') {
  switch (method) {
    case 'certificate_id': return 'Certificate ID Lookup'
    case 'qr_code': return 'QR Code Scan'
    case 'document_upload': return 'Document Upload Check'
    default: return method
  }
}
