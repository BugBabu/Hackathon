/**
 * authService.js
 * --------------
 * Clean abstraction over Supabase Auth for CERTI-VAULT.
 *
 * All functions return a consistent shape:
 *   { data, error }
 * where error is either null or a human-readable string.
 *
 * SECURITY:
 *   - Never stores or logs passwords.
 *   - Uses only the anon/publishable key via the shared supabase client.
 *   - Service-role key is never used in this file.
 */

import { supabase } from '../lib/supabaseClient'

// ---------------------------------------------------------------------------
// Error message mapper
// Converts Supabase/Auth error codes into user-friendly strings.
// ---------------------------------------------------------------------------
function friendlyError(error) {
  if (!error) return null

  const msg = error.message || ''

  if (msg.includes('Invalid login credentials'))
    return 'Incorrect email or password. Please try again.'

  if (msg.includes('Email not confirmed'))
    return 'Your email address has not been verified yet. Please check your inbox and click the confirmation link.'

  if (msg.includes('User already registered') || msg.includes('already been registered'))
    return 'An account with this email address already exists. Please sign in instead.'

  if (msg.includes('Password should be at least'))
    return 'Password must be at least 6 characters long.'

  if (msg.includes('Unable to validate email address') || msg.includes('invalid email'))
    return 'Please enter a valid email address.'

  if (msg.includes('Email rate limit exceeded'))
    return 'Too many email requests. Please wait a few minutes before trying again.'

  if (msg.includes('fetch') || msg.includes('NetworkError') || msg.includes('Failed to fetch'))
    return 'Network error. Please check your internet connection and try again.'

  if (msg.includes('VITE_SUPABASE') || msg.includes('supabaseUrl') || msg.includes('supabaseKey'))
    return 'Authentication service is not configured. Please contact support.'

  // Fallback to original message so nothing is silently swallowed
  return msg || 'An unexpected error occurred. Please try again.'
}

// ---------------------------------------------------------------------------
// signUp
// ---------------------------------------------------------------------------
/**
 * Registers a new user with Supabase Auth and creates their profile row.
 *
 * @param {string} email
 * @param {string} password
 * @param {string} fullName
 * @param {'student'|'issuer'} role  - 'admin' is NOT accepted here.
 * @returns {{ data: object|null, error: string|null }}
 */
export async function signUp(email, password, fullName, role) {
  // Guard: admin registration is not allowed through the public form.
  if (role === 'admin') {
    return { data: null, error: 'Admin accounts cannot be created through public registration.' }
  }

  if (!['student', 'issuer'].includes(role)) {
    return { data: null, error: 'Please select a valid role: Student or Issuer.' }
  }

  // 1. Create the Auth user. Pass profile metadata so the profile can be
  //    populated by a trigger later, and so it is available in the session.
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
      },
    },
  })

  if (authError) {
    return { data: null, error: friendlyError(authError) }
  }

  // 2. We no longer attempt to insert the profile row here.
  //    If email confirmation is enabled, authData.session is null, so the
  //    request is anonymous and correctly blocked by RLS.
  //    Instead, AuthContext handles lazy profile creation upon first login.

  return { data: authData, error: null }
}

// ---------------------------------------------------------------------------
// signIn
// ---------------------------------------------------------------------------
/**
 * Signs in an existing user with email + password.
 *
 * @param {string} email
 * @param {string} password
 * @returns {{ data: object|null, error: string|null }}
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data: error ? null : data, error: friendlyError(error) }
}

// ---------------------------------------------------------------------------
// signOut
// ---------------------------------------------------------------------------
/**
 * Signs the current user out of Supabase Auth.
 *
 * @returns {{ error: string|null }}
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error: friendlyError(error) }
}

// ---------------------------------------------------------------------------
// getCurrentUser
// ---------------------------------------------------------------------------
/**
 * Returns the currently authenticated user object, or null.
 *
 * @returns {{ data: object|null, error: string|null }}
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()
  return { data: data?.user ?? null, error: friendlyError(error) }
}

// ---------------------------------------------------------------------------
// getSession
// ---------------------------------------------------------------------------
/**
 * Returns the current session (includes access_token, user, etc.), or null.
 *
 * @returns {{ data: object|null, error: string|null }}
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  return { data: data?.session ?? null, error: friendlyError(error) }
}

// ---------------------------------------------------------------------------
// resendVerificationEmail
// ---------------------------------------------------------------------------
/**
 * Resends the email confirmation link to the given address.
 *
 * @param {string} email
 * @returns {{ error: string|null }}
 */
export async function resendVerificationEmail(email) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  })
  return { error: friendlyError(error) }
}

// ---------------------------------------------------------------------------
// resetPassword
// ---------------------------------------------------------------------------
/**
 * Sends a password reset email to the given address.
 *
 * @param {string} email
 * @returns {{ error: string|null }}
 */
export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  return { error: friendlyError(error) }
}

// ---------------------------------------------------------------------------
// updatePassword
// ---------------------------------------------------------------------------
/**
 * Updates the user's password after password reset.
 *
 * @param {string} newPassword
 * @returns {{ error: string|null }}
 */
export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })
  return { error: friendlyError(error) }
}
