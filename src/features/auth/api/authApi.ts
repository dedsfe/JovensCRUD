import { supabase } from '../../../lib/supabase'

export const authApi = {
  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),

  signUp: (name: string, email: string, password: string) =>
    supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/jovens`,
      },
    }),

  requestPasswordReset: (email: string) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    }),

  updatePassword: (password: string) =>
    supabase.auth.updateUser({ password }),

  signOut: () => supabase.auth.signOut(),
}
