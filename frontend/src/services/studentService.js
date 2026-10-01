/**
 * studentService.js
 * -----------------
 * Handles fetching real student data and certificates from Supabase.
 */

import { supabase } from '../lib/supabaseClient'

/**
 * Fetches the student dashboard data for the currently authenticated user.
 * 
 * Returns:
 * {
 *   data: {
 *     student: object | null,
 *     certificates: array,
 *     verifications: array
 *   },
 *   error: string | null
 * }
 */
export async function getStudentDashboardData() {
  try {
    // 1. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'User is not authenticated.' }
    }

    // 2. Fetch the corresponding student record
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('profile_id', user.id)
      .single()

    if (studentError) {
      // PGRST116 means zero rows returned — this user has no student record yet.
      if (studentError.code === 'PGRST116') {
        return { 
          data: { student: null, certificates: [], verifications: [] }, 
          error: null 
        }
      }
      return { data: null, error: 'Failed to fetch student profile.' }
    }

    // 3. Fetch certificates belonging to this student (including institution name)
    const { data: certificates, error: certsError } = await supabase
      .from('certificates')
      .select(`
        id,
        certificate_number,
        title,
        program,
        issue_date,
        status,
        institutions (
          name
        )
      `)
      .eq('student_id', student.id)
      .order('issue_date', { ascending: false })

    if (certsError) {
      return { data: null, error: 'Failed to fetch certificates.' }
    }

    // Extract certificate IDs to fetch related verifications
    const certIds = certificates.map(c => c.id)

    // 4. Fetch verifications for these certificates
    let verifications = []
    if (certIds.length > 0) {
      const { data: verificationsData, error: verificationsError } = await supabase
        .from('verifications')
        .select(`
          id,
          verification_method,
          result,
          verified_at,
          certificates (
            title
          )
        `)
        .in('certificate_id', certIds)
        .order('verified_at', { ascending: false })
        .limit(20)

      if (!verificationsError && verificationsData) {
        verifications = verificationsData
      }
    }

    // Clean up the structure for the frontend
    const formattedCertificates = certificates.map(cert => {
      // Calculate view count from verifications array
      const views = verifications.filter(v => v.certificates?.title === cert.title).length
      
      return {
        id: cert.certificate_number, // Use the human-readable number for the UI/links
        uuid: cert.id, // Keep the actual UUID just in case
        title: cert.title,
        program: cert.program,
        institution: cert.institutions?.name || 'Unknown Institution',
        issueDate: new Date(cert.issue_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        status: cert.status,
        views: views
      }
    })

    const formattedVerifications = verifications.map(v => ({
      verifier: `Verification Method: ${v.verification_method}`,
      date: new Date(v.verified_at).toLocaleString('en-US', { timeZoneName: 'short' }),
      certificate: v.certificates?.title || 'Unknown Certificate',
      result: v.result
    }))

    return {
      data: {
        student,
        certificates: formattedCertificates,
        verifications: formattedVerifications
      },
      error: null
    }

  } catch (error) {
    console.error('getStudentDashboardData error:', error)
    return { data: null, error: 'An unexpected error occurred.' }
  }
}
