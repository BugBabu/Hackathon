/**
 * issuerService.js
 * ----------------
 * Handles fetching real issuer data and certificates from Supabase.
 */

import { supabase } from '../lib/supabaseClient'
import { getVerificationsThisMonth } from './auditService'

/**
 * Fetches the issuer dashboard data for the currently authenticated user.
 * 
 * Returns:
 * {
 *   data: {
 *     issuer: object | null,
 *     institution: object | null,
 *     certificates: array,
 *     stats: object
 *   },
 *   error: string | null
 * }
 */
export async function getIssuerDashboardData() {
  try {
    // 1. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'User is not authenticated.' }
    }

    // 2. Fetch the corresponding issuer record and join the institution
    const { data: issuer, error: issuerError } = await supabase
      .from('issuers')
      .select(`
        id,
        designation,
        is_active,
        institution_id,
        institutions (
          name,
          code,
          is_verified
        )
      `)
      .eq('profile_id', user.id)
      .single()

    if (issuerError) {
      // PGRST116 means zero rows returned — this user has no issuer record yet.
      if (issuerError.code === 'PGRST116') {
        return { 
          data: { issuer: null, institution: null, certificates: [], stats: null }, 
          error: null 
        }
      }
      return { data: null, error: 'Failed to fetch issuer profile.' }
    }

    const institution = issuer.institutions

    // 3. Fetch certificates belonging to this institution
    // Include student information via foreign key
    const { data: certificates, error: certsError } = await supabase
      .from('certificates')
      .select(`
        id,
        certificate_number,
        title,
        program,
        issue_date,
        status,
        students (
          full_name,
          student_id
        )
      `)
      .eq('institution_id', issuer.institution_id)
      .order('issue_date', { ascending: false })

    if (certsError) {
      return { data: null, error: 'Failed to fetch certificates.' }
    }

    // 4. Calculate stats — verificationCount fetched from verifications table
    const totalCertificates = certificates.length
    const activeCertificates = certificates.filter(c => c.status === 'active').length
    const revokedCertificates = certificates.filter(c => c.status === 'revoked' || c.status === 'suspended').length

    // Fetch verifications this month scoped to what RLS permits the issuer to read
    const { count: verificationsThisMonth } = await getVerificationsThisMonth()

    const stats = {
      total: totalCertificates,
      active: activeCertificates,
      revoked: revokedCertificates,
      verifications: verificationsThisMonth ?? 0
    }

    // Format certificates for the UI
    const formattedCertificates = certificates.map(cert => ({
      id: cert.certificate_number,
      uuid: cert.id,
      title: cert.title,
      degree: cert.title,
      department: cert.program,
      issueDate: new Date(cert.issue_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      status: cert.status.toUpperCase(), // Match existing UI constants ('ACTIVE', 'REVOKED' -> uppercase)
      studentName: cert.students?.full_name || 'Unknown Student',
      studentId: cert.students?.student_id || 'N/A',
    }))

    return {
      data: {
        issuer,
        institution,
        certificates: formattedCertificates,
        stats
      },
      error: null
    }

  } catch (error) {
    console.error('getIssuerDashboardData error:', error)
    return { data: null, error: 'An unexpected error occurred.' }
  }
}
