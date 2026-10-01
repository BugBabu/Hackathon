/**
 * AuthContext.jsx
 * ---------------
 * React context that holds the current Supabase auth state for CERTI-VAULT.
 *
 * Provides:
 *   user        — the authenticated Supabase user object (or null)
 *   session     — the current Supabase session (or null)
 *   profile     — the matching row from public.profiles (or null)
 *   loading     — true while the initial session is being resolved
 *   signUp()    — wrapper around authService.signUp
 *   signIn()    — wrapper around authService.signIn
 *   signOut()   — wrapper around authService.signOut
 *
 * Usage:
 *   Wrap your app with <AuthProvider>.
 *   Consume with the useAuth() hook anywhere in the tree.
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  signUp as authSignUp,
  signIn as authSignIn,
  signOut as authSignOut,
} from '../services/authService'

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const AuthContext = createContext(null)

// ---------------------------------------------------------------------------
// AuthProvider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // -------------------------------------------------------------------------
  // Fetch the profile row from public.profiles for the given user id.
  // Called after every auth state change that results in a logged-in user.
  // -------------------------------------------------------------------------
  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      return
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Profile doesn't exist. This happens for newly authenticated users 
        // because their initial insert during signUp was blocked by RLS.
        // Now that they are authenticated, we can safely insert their profile.
        const { data: authUser } = await supabase.auth.getUser()
        if (authUser?.user) {
          const role = authUser.user.user_metadata?.role || 'student'
          const fullName = authUser.user.user_metadata?.full_name || 'User'
          
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              full_name: fullName,
              email: authUser.user.email,
              role: role,
            })
            .select()
            .single()
            
          if (!insertError && newProfile) {
            setProfile(newProfile)
            return
          } else {
            console.error('[AuthContext] Lazy profile insert failed:', insertError?.message)
          }
        }
      }
      
      console.warn('[AuthContext] Profile not available:', error.message)
      setProfile(null)
    } else {
      setProfile(data)
    }
  }, [])

  // -------------------------------------------------------------------------
  // Bootstrap: resolve the initial session once on mount.
  // -------------------------------------------------------------------------
  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!mounted) return
      setSession(initialSession)
      setUser(initialSession?.user ?? null)
      fetchProfile(initialSession?.user?.id ?? null).finally(() => {
        if (mounted) setLoading(false)
      })
    })

    // -----------------------------------------------------------------------
    // Listen for all future auth state changes (sign in, sign out, token
    // refresh, email confirmed, etc.)
    // -----------------------------------------------------------------------
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mounted) return
        setSession(newSession)
        setUser(newSession?.user ?? null)
        fetchProfile(newSession?.user?.id ?? null)
      }
    )

    // Cleanup: unsubscribe and prevent state updates after unmount
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  // -------------------------------------------------------------------------
  // Context helpers — thin wrappers that keep call sites clean.
  // -------------------------------------------------------------------------
  const signUp  = useCallback((email, password, fullName, role) =>
    authSignUp(email, password, fullName, role), [])

  const signIn  = useCallback((email, password) =>
    authSignIn(email, password), [])

  const signOut = useCallback(async () => {
    const result = await authSignOut()
    // Clear local state immediately on sign-out regardless of Supabase response
    setUser(null)
    setSession(null)
    setProfile(null)
    return result
  }, [])

  // -------------------------------------------------------------------------
  // Value
  // -------------------------------------------------------------------------
  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// useAuth — convenience hook
// ---------------------------------------------------------------------------
/**
 * Returns the AuthContext value.
 * Must be used inside <AuthProvider>.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return context
}
