"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  cloudLogin,
  cloudRegister,
  cloudLogout,
  cloudLoad,
  cloudSave,
  onAuthStateChange,
  type CloudSaveStatus,
} from "./cloud-save"
import { setStorageUsername } from "./store"
import type { GameState } from "./types"

export function useCloudSave(
  state: GameState,
  onLoadSave: (data: GameState) => void
) {
  const [username, setUsername] = useState<string>("")
  const [status, setStatus] = useState<CloudSaveStatus>("idle")
  const [errorMsg, setErrorMsg] = useState<string>("")

  const saveTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isAuthInProgress = useRef(false)   // true khi đang login/register thủ công
  const isFirstRender   = useRef(true)
  const usernameRef     = useRef<string>("")
  const justLoadedRef   = useRef(false)    // true trong 5s sau khi vừa cloud-load → skip auto-save
  // Giữ ref đến onLoadSave để effect không cần re-subscribe khi callback thay đổi
  const onLoadSaveRef   = useRef(onLoadSave)
  useEffect(() => { onLoadSaveRef.current = onLoadSave }, [onLoadSave])

  // ── Load save từ cloud và apply vào store ────────────────
  const loadAndApply = useCallback(async () => {
    setStatus("loading")
    const result = await cloudLoad()
    if (!result.ok) {
      setStatus("error")
      setErrorMsg(result.error ?? "Không load được save")
      return false
    }
    if (result.saveData) {
      try {
        const key = `aetheria-save-v1:${usernameRef.current}`
        const { combat: _, ...persistable } = result.saveData as GameState
        window.localStorage.setItem(key, JSON.stringify(persistable))
      } catch { /* ignore */ }
      // Đánh dấu "vừa load" — auto-save effect sẽ bỏ qua trong 5s tới
      justLoadedRef.current = true
      setTimeout(() => { justLoadedRef.current = false }, 5000)
      onLoadSaveRef.current(result.saveData as GameState)
    }
    setStatus("saved")
    setTimeout(() => setStatus("idle"), 2000)
    return true
  }, []) // ← KHÔNG phụ thuộc onLoadSave nữa (dùng ref)

  // ── Auth state change listener ───────────────────────────
  // Effect này chỉ mount/unmount 1 lần duy nhất (deps=[]) nên KHÔNG bao giờ
  // re-subscribe lại → tránh Supabase fire SIGNED_IN lặp lại gây vòng lặp vô hạn
  useEffect(() => {
    const unsub = onAuthStateChange((uname) => {
      if (uname) {
        usernameRef.current = uname
        setUsername(uname)
        setStorageUsername(uname)
        // Chỉ auto-load khi là session restore (reload trang),
        // KHÔNG load khi chính mình vừa gọi login/register
        if (!isAuthInProgress.current) {
          loadAndApply()
        }
      } else {
        usernameRef.current = ""
        setUsername("")
        setStorageUsername(null)
      }
    })
    return unsub
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // ← mount once only

  // ── Auto cloud-save debounced 3s ─────────────────────────
  useEffect(() => {
    // Bỏ qua render đầu tiên
    if (isFirstRender.current) { isFirstRender.current = false; return }
    // Bỏ qua khi đang login/register
    if (isAuthInProgress.current) return
    // Bỏ qua khi chưa đăng nhập
    if (!usernameRef.current) return
    // Bỏ qua trong 5s sau khi vừa cloud-load (tránh save đè lại ngay state vừa load về)
    if (justLoadedRef.current) return

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      if (!usernameRef.current || isAuthInProgress.current || justLoadedRef.current) return
      const { combat: _, ...persistable } = state
      setStatus("saving")
      const result = await cloudSave(persistable)
      if (result.ok) {
        setStatus("saved")
        setTimeout(() => setStatus("idle"), 2000)
      } else {
        setStatus("error")
        setErrorMsg(result.error ?? "Lỗi kết nối")
      }
    }, 3000)

    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  // ── Login ────────────────────────────────────────────────
  const login = useCallback(async (uname: string, password: string) => {
    const trimmed = uname.trim().toLowerCase()
    if (trimmed.length < 3) { setErrorMsg("Username phải ít nhất 3 ký tự"); return }
    if (password.length < 6) { setErrorMsg("Mật khẩu phải ít nhất 6 ký tự"); return }

    isAuthInProgress.current = true
    if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null }
    setStatus("loading")
    setErrorMsg("")

    try {
      const result = await cloudLogin(trimmed, password)
      if (!result.ok) {
        setStatus("error")
        setErrorMsg(result.error ?? "Đăng nhập thất bại")
        return
      }
      usernameRef.current = trimmed
      setUsername(trimmed)
      setStorageUsername(trimmed)
      await loadAndApply()
    } finally {
      isAuthInProgress.current = false
    }
  }, [loadAndApply])

  // ── Register ─────────────────────────────────────────────
  const register = useCallback(async (uname: string, password: string) => {
    const trimmed = uname.trim().toLowerCase()
    if (trimmed.length < 3) { setErrorMsg("Username phải ít nhất 3 ký tự"); return }
    if (password.length < 6) { setErrorMsg("Mật khẩu phải ít nhất 6 ký tự"); return }

    isAuthInProgress.current = true
    if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null }
    setStatus("loading")
    setErrorMsg("")

    try {
      const regResult = await cloudRegister(trimmed, password)
      if (!regResult.ok) {
        setStatus("error")
        setErrorMsg(regResult.error ?? "Đăng ký thất bại")
        return
      }
      const loginResult = await cloudLogin(trimmed, password)
      if (!loginResult.ok) {
        setStatus("error")
        setErrorMsg(loginResult.error ?? "Đăng ký xong nhưng không thể đăng nhập")
        return
      }
      usernameRef.current = trimmed
      setUsername(trimmed)
      setStorageUsername(trimmed)
      // Tài khoản mới → push save hiện tại lên cloud
      const { combat: _, ...persistable } = state
      const saveResult = await cloudSave(persistable)
      if (saveResult.ok) {
        setStatus("saved")
        setTimeout(() => setStatus("idle"), 2000)
      } else {
        setStatus("error")
        setErrorMsg(saveResult.error ?? "Không lưu được save ban đầu")
      }
    } finally {
      isAuthInProgress.current = false
    }
  }, [state])

  // ── Logout ───────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null }
    await cloudLogout()
    usernameRef.current = ""
    setUsername("")
    setStorageUsername(null)
    setStatus("idle")
    setErrorMsg("")
  }, [])

  // ── Manual save ──────────────────────────────────────────
  const manualSave = useCallback(async () => {
    if (!usernameRef.current) return
    if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null }
    const { combat: _, ...persistable } = state
    setStatus("saving")
    const result = await cloudSave(persistable)
    if (result.ok) {
      setStatus("saved")
      setTimeout(() => setStatus("idle"), 2000)
    } else {
      setStatus("error")
      setErrorMsg(result.error ?? "Lỗi lưu")
    }
  }, [state])

  return { username, status, errorMsg, login, register, logout, manualSave }
}
