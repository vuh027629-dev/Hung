// ============================================================
// Cloud Save — Supabase Auth (email/password style via username)
// Username is stored as: <username>@aetheria.game (fake email)
//
// Env vars (optional — falls back to hardcoded project):
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
//
// Supabase setup required:
//   1. Authentication > Email > tắt "Confirm email"
//   2. Chạy SQL tạo bảng game_saves (xem README)
// ============================================================

import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://pkduypiimwffgdjlzlpc.supabase.co"

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrZHV5cGlpbXdmZmdkamx6bHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5OTcyMzQsImV4cCI6MjA5MzU3MzIzNH0.SAgE3FAgvjcRjv9JJJE385mj1L_3tQk21NBitbKQA1k"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "aetheria-auth",
  },
})

export type CloudSaveStatus = "idle" | "saving" | "loading" | "saved" | "error"

function toEmail(username: string): string {
  return `${username.trim().toLowerCase()}@aetheria.game`
}

// ── Auth ─────────────────────────────────────────────────────

export async function cloudRegister(
  username: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.auth.signUp({
    email: toEmail(username),
    password,
  })

  if (error) {
    if (
      error.message.includes("already registered") ||
      error.message.includes("User already registered")
    ) {
      return { ok: false, error: "Username này đã tồn tại, hãy đăng nhập." }
    }
    if (error.message.includes("Password should be")) {
      return { ok: false, error: "Mật khẩu phải ít nhất 6 ký tự." }
    }
    return { ok: false, error: error.message }
  }

  // Supabase returns user=null when email confirmation is ON (fake emails won't confirm)
  if (!data.user) {
    return {
      ok: false,
      error:
        "Cần tắt 'Confirm email' trong Supabase Dashboard → Authentication → Providers → Email.",
    }
  }

  // If identities is empty = duplicate username (Supabase deduplication)
  if (data.user.identities?.length === 0) {
    return { ok: false, error: "Username này đã tồn tại, hãy đăng nhập." }
  }

  return { ok: true }
}

export async function cloudLogin(
  username: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.auth.signInWithPassword({
    email: toEmail(username),
    password,
  })
  if (error) {
    if (error.message.includes("Invalid login credentials")) {
      return { ok: false, error: "Sai username hoặc mật khẩu." }
    }
    if (error.message.includes("Email not confirmed")) {
      return {
        ok: false,
        error:
          "Tài khoản chưa xác thực. Cần tắt 'Confirm email' trong Supabase Dashboard.",
      }
    }
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

export async function cloudLogout(): Promise<void> {
  await supabase.auth.signOut()
}

export function onAuthStateChange(cb: (username: string | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user?.email) {
      const username = session.user.email.replace("@aetheria.game", "")
      cb(username)
    } else {
      cb(null)
    }
  })
  return data.subscription.unsubscribe
}

// ── Save / Load ───────────────────────────────────────────────

export async function cloudSave(
  saveData: object
): Promise<{ ok: boolean; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: "Chưa đăng nhập" }

    const { error } = await supabase
      .from("game_saves")
      .upsert(
        { user_id: user.id, save_data: saveData },
        { onConflict: "user_id" }
      )

    if (error) {
      // RLS policy violation — bảng chưa setup hoặc policies thiếu
      if (error.code === "42501") {
        return {
          ok: false,
          error: "Lỗi quyền truy cập DB. Kiểm tra RLS policies trong Supabase.",
        }
      }
      // Bảng chưa tồn tại
      if (error.code === "42P01") {
        return {
          ok: false,
          error: "Bảng game_saves chưa tạo. Chạy SQL setup trong Supabase.",
        }
      }
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

export async function cloudLoad(): Promise<{
  ok: boolean
  saveData?: object
  error?: string
}> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: "Chưa đăng nhập" }

    const { data, error } = await supabase
      .from("game_saves")
      .select("save_data")
      .eq("user_id", user.id)
      .single()

    if (error) {
      // PGRST116 = no rows found = tài khoản mới, chưa có save
      if (error.code === "PGRST116") return { ok: true, saveData: undefined }
      if (error.code === "42P01") {
        return {
          ok: false,
          error: "Bảng game_saves chưa tạo. Chạy SQL setup trong Supabase.",
        }
      }
      return { ok: false, error: error.message }
    }

    return { ok: true, saveData: data.save_data }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}
