import { supabase } from "./supabase";
import type { User } from "./supabase";

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: User;
  requiresConfirmation?: boolean;
}

/**
 * Sign up a new user with email and password
 * Creates both auth account and user profile
 */
export async function signUp(data: SignUpData): Promise<AuthResponse> {
  try {
    // Pass name in metadata — the DB trigger uses this to populate profiles
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { name: data.name.trim() },
      },
    });

    if (authError) {
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: "Failed to create account. Please try again." };
    }

    // Upsert profile — trigger already ran, this ensures name is saved even if
    // trigger fired before metadata was available (edge case)
    await supabase.from("profiles").upsert(
      {
        id: authData.user.id,
        email: data.email,
        name: data.name.trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    // Email confirmation disabled → session is returned immediately
    if (!authData.session) {
      return { success: true, requiresConfirmation: true };
    }

    return { success: true, requiresConfirmation: false };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Sign in an existing user with email and password
 */
export async function signIn(data: SignInData): Promise<AuthResponse> {
  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!authData.session) {
      return { success: false, error: "Failed to sign in. Please try again." };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Send password reset email via Supabase
 */
export async function requestPasswordReset(email: string): Promise<AuthResponse> {
  try {
    const redirectTo = `${window.location.origin}/login`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Update current user's password (used in recovery flow)
 */
export async function updatePassword(password: string): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Get current user session
 */
export async function getCurrentSession() {
  try {
    const { data } = await supabase.auth.getSession();
    return { success: true, session: data.session };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<AuthResponse> {
  try {
    const { data } = await supabase.auth.getSession();

    if (!data.session) {
      return { success: false, error: "No active session" };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.session.user.id)
      .single();

    if (profileError) {
      return { success: false, error: "Failed to load user profile." };
    }

    return { success: true, user: profile };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
