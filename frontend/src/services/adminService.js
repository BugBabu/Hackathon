/**
 * adminService.js
 * ---------------
 * Handles fetching real admin dashboard data from Supabase.
 *
 * SECURITY:
 *  - No service_role key.
 *  - No RLS bypass.
 *  - All queries respect existing RLS policies.
 *  - Admin-only access enforced by RLS policies at the database level.
 *  - The frontend also checks the user's role via AuthContext for UX.
 *
 * RLS POLICIES FOR ADMIN:
 *  - institutions:    auth_helpers.get_my_role() = 'admin'
 *  - certificates:     auth_helpers.get_my_role() = 'admin'
 *  - students:         auth_helpers.get_my_role() IN ('admin', 'issuer')
 *  - issuers:          auth_helpers.get_my_role() = 'admin'
 *  - verifications:    auth_helpers.get_my_role() = 'admin'
 *  - audit_logs:       auth_helpers.get_my_role() = 'admin'
 *  - revocations:      auth_helpers.get_my_role() = 'admin'
 */

import { supabase } from '../lib/supabaseClient'

// ---------------------------------------------------------------------------
// getAdminDashboardData
// Fetches comprehensive admin dashboard statistics and data.
//
// Returns:
// {
//   data: {
//     stats: {
//       totalInstitutions: number,
//       totalCertificates: number,
//       totalStudents: number,
//       totalIssuers: number,
//       totalVerifications: number,
//       revokedCertificates: number
//     },
//     institutions: array,
//     recentCertificates: array,
//     recentVerifications: array,
//     recentRevocations: array
//   },
//   error: string | null
// }
// ---------------------------------------------------------------------------
export async function getAdminDashboardData() {
  try {
    // 1. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'User is not authenticated.' }
    }

    // 2. Fetch all statistics in parallel (count queries)
    const [
      institutionsCount,
      certificatesCount,
      studentsCount,
      issuersCount,
      verificationsCount,
      revokedCount
    ] = await Promise.all([
      supabase.from('institutions').select('id', { count: 'exact', head: true }),
      supabase.from('certificates').select('id', { count: 'exact', head: true }),
      supabase.from('students').select('id', { count: 'exact', head: true }),
      supabase.from('issuers').select('id', { count: 'exact', head: true }),
      supabase.from('verifications').select('id', { count: 'exact', head: true }),
      supabase.from('certificates').select('id', { count: 'exact', head: true }).in('status', ['revoked', 'suspended'])
    ])

    const stats = {
      totalInstitutions: institutionsCount.count ?? 0,
      totalCertificates: certificatesCount.count ?? 0,
      totalStudents: studentsCount.count ?? 0,
      totalIssuers: issuersCount.count ?? 0,
      totalVerifications: verificationsCount.count ?? 0,
      revokedCertificates: revokedCount.count ?? 0
    }

    // 3. Fetch institutions with certificate counts
    const { data: institutions, error: instError } = await supabase
      .from('institutions')
      .select(`
        id,
        name,
        code,
        is_verified,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (instError) {
      return { data: null, error: 'Failed to fetch institutions.' }
    }

    // Fetch certificate counts per institution
    const institutionsWithCounts = await Promise.all(
      (institutions ?? []).map(async (inst) => {
        const { count } = await supabase
          .from('certificates')
          .select('id', { count: 'exact', head: true })
          .eq('institution_id', inst.id)
        return {
          ...inst,
          certificateCount: count ?? 0
        }
      })
    )

    // 4. Fetch recent certificates (last 10)
    const { data: recentCertificates, error: certsError } = await supabase
      .from('certificates')
      .select(`
        id,
        certificate_number,
        title,
        program,
        status,
        issue_date,
        created_at,
        institutions (
          name,
          code
        ),
        students (
          full_name,
          student_id
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (certsError) {
      return { data: null, error: 'Failed to fetch recent certificates.' }
    }

    // 5. Fetch recent revocations (last 10)
    const { data: recentRevocations, error: revError } = await supabase
      .from('revocations')
      .select(`
        id,
        reason,
        revoked_at,
        certificates (
          certificate_number,
          title
        ),
        profiles (
          full_name,
          email
        )
      `)
      .order('revoked_at', { ascending: false })
      .limit(10)

    if (revError) {
      return { data: null, error: 'Failed to fetch recent revocations.' }
    }

    return {
      data: {
        stats,
        institutions: institutionsWithCounts,
        recentCertificates: recentCertificates ?? [],
        recentRevocations: recentRevocations ?? []
      },
      error: null
    }

  } catch (error) {
    console.error('getAdminDashboardData error:', error)
    return { data: null, error: 'An unexpected error occurred.' }
  }
}
