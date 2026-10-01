/**
 * documentVerificationService.js
 * ------------------------------
 * Handles document upload validation and certificate verification.
 *
 * CURRENT LIMITATIONS:
 *  - No Supabase Storage bucket is configured in this project.
 *  - No OCR capability exists for automatic certificate number extraction.
 *  - No cryptographic document tamper detection exists.
 *  - Documents are NOT permanently stored (Storage not configured).
 *
 * WORKFLOW:
 *  1. Validate file type (PDF, PNG, JPG only)
 *  2. Validate file size (max 25MB)
 *  3. Generate SHA-256 hash of the file
 *  4. User manually enters certificate number (no automatic extraction)
 *  5. Verify certificate via existing verificationService
 *  6. Log verification attempt to verifications table with method='document_upload'
 *
 * SECURITY:
 *  - No service_role key.
 *  - No RLS bypass.
 *  - File validation happens client-side before any network requests.
 *  - Certificate verification uses existing secure verificationService.
 *  - Documents are not stored (no Storage bucket configured).
 */

import { supabase } from '../lib/supabaseClient'

// Configuration
const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg']

// ---------------------------------------------------------------------------
// validateFile
// Validates uploaded file before processing.
//
// @param {File} file - The file to validate
// @returns { valid: boolean, error: string | null }
// ---------------------------------------------------------------------------
export function validateFile(file) {
  if (!file) {
    return { valid: false, error: 'No file provided.' }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit.` }
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only PDF, PNG, and JPG are allowed.' }
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop().toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { valid: false, error: 'Invalid file extension. Only .pdf, .png, and .jpg are allowed.' }
  }

  return { valid: true, error: null }
}

// ---------------------------------------------------------------------------
// generateFileHash
// Generates SHA-256 hash of a file using Web Crypto API.
//
// @param {File} file - The file to hash
// @returns { Promise<string> } - Hex-encoded SHA-256 hash
// ---------------------------------------------------------------------------
export async function generateFileHash(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const buffer = await reader.result
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        resolve(hashHex)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file.'))
    reader.readAsArrayBuffer(file)
  })
}

// ---------------------------------------------------------------------------
// verifyCertificateByDocument
// Verifies a certificate using the uploaded document and manual certificate number.
//
// @param {File} file - The uploaded document file
// @param {string} certificateNumber - Manually entered certificate number
// @returns { Promise<{ data: object | null, status: string, error: string | null }> }
//
// Verification statuses:
//   'valid'     - Certificate found and is active
//   'revoked'   - Certificate found but is revoked
//   'suspended' - Certificate found but is suspended
//   'not_found' - Certificate not found in database
//   'error'     - Unexpected error occurred
// ---------------------------------------------------------------------------
export async function verifyCertificateByDocument(file, certificateNumber) {
  try {
    // 1. Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      return { data: null, status: 'error', error: validation.error }
    }

    // 2. Generate file hash (for future tamper detection capability)
    let documentHash = null
    try {
      documentHash = await generateFileHash(file)
    } catch (hashError) {
      console.warn('[documentVerificationService] Failed to generate file hash:', hashError)
      // Continue without hash - this is non-critical for basic verification
    }

    // 3. Query the certificate by certificate_number
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

    let status = 'valid'
    let result = 'valid'

    if (error) {
      // PGRST116 = no rows matched (certificate not found, or RLS hid it)
      if (error.code === 'PGRST116') {
        status = 'not_found'
        result = 'not_found'
        // Log the failed lookup attempt
        await logVerification({
          certificateId: null,
          method: 'document_upload',
          result: 'not_found',
          documentHash,
        })
        return { data: null, status: 'not_found', error: null }
      }

      // Other DB error — do not leak internals
      console.error('[documentVerificationService] Unexpected error:', error.message)
      return { data: null, status: 'error', error: 'Unable to complete verification. Please try again.' }
    }

    // Determine status based on certificate status
    if (cert.status === 'revoked') {
      status = 'revoked'
      result = 'revoked'
    } else if (cert.status === 'suspended') {
      status = 'suspended'
      result = 'revoked' // Use 'revoked' for suspended in verifications table
    } else {
      status = 'valid'
      result = 'valid'
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
      status: cert.status,
      studentName: cert.students?.full_name ?? 'Unknown',
      studentId: cert.students?.student_id ?? 'N/A',
      institutionName: cert.institutions?.name ?? 'Unknown Institution',
      institutionCode: cert.institutions?.code ?? 'N/A',
      certUuid: cert.id,
    }

    // Add document hash if available
    if (documentHash) {
      formatted.documentHash = documentHash
    }

    // Log the verification attempt — non-blocking, failure is tolerated
    await logVerification({
      certificateId: cert.id,
      method: 'document_upload',
      result: result,
      documentHash,
    })

    return { data: formatted, status: status, error: null }

  } catch (error) {
    console.error('[documentVerificationService] verifyCertificateByDocument error:', error)
    return { data: null, status: 'error', error: 'An unexpected error occurred.' }
  }
}

// ---------------------------------------------------------------------------
// logVerification (internal)
// Inserts a verification attempt record into public.verifications.
//
// Columns used:
//   certificate_id       UUID  | nullable — references certificates.id
//   verification_method  TEXT  — 'document_upload' (from allowed enum)
//   result               TEXT  — 'valid' | 'not_found' | 'revoked' (from allowed enum)
//   document_hash        TEXT  | nullable — SHA-256 hash of uploaded document
//
// This is allowed by: "Anyone can create verification records"
//   WITH CHECK ( true )
// Both authenticated AND anonymous users can INSERT.
//
// Failure is intentionally non-fatal: a logging failure must never cause an
// otherwise valid certificate to appear invalid.
// ---------------------------------------------------------------------------
async function logVerification({ certificateId, method, result, documentHash }) {
  try {
    await supabase
      .from('verifications')
      .insert({
        certificate_id: certificateId, // nullable — null for not_found lookups
        verification_method: method,
        result: result,
        document_hash: documentHash,
      })
  } catch (err) {
    // Swallow silently — verification logging must never break the UX
    console.warn('[documentVerificationService] logVerification failed (non-fatal):', err?.message)
  }
}
