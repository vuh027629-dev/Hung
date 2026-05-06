"use client"

import { useState, useEffect } from "react"
import { Cloud, CloudOff, Save, LogIn, LogOut, Loader2, CheckCircle2, AlertCircle, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CloudSaveStatus } from "@/lib/game/cloud-save"

interface Props {
  username: string
  status: CloudSaveStatus
  errorMsg: string
  onLogin: (username: string, password: string) => void
  onRegister: (username: string, password: string) => void
  onLogout: () => void
  onManualSave: () => void
}

type Mode = "login" | "register"

export function CloudSaveWidget({
  username, status, errorMsg, onLogin, onRegister, onLogout, onManualSave,
}: Props) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>("login")
  const [uname, setUname] = useState("")
  const [pwd, setPwd] = useState("")
  const [pwd2, setPwd2] = useState("")
  const [localErr, setLocalErr] = useState("")

  // Auto-close on successful login
  useEffect(() => {
    if (username && (status === "saved" || status === "idle")) {
      setOpen(false)
      setUname(""); setPwd(""); setPwd2(""); setLocalErr("")
    }
  }, [username, status])

  const handleSubmit = () => {
    setLocalErr("")
    if (uname.trim().length < 3) { setLocalErr("Username phải ít nhất 3 ký tự"); return }
    if (pwd.length < 6) { setLocalErr("Mật khẩu phải ít nhất 6 ký tự"); return }
    if (mode === "register" && pwd !== pwd2) { setLocalErr("Mật khẩu không khớp"); return }
    if (mode === "login") onLogin(uname, pwd)
    else onRegister(uname, pwd)
  }

  const err = localErr || errorMsg

  const StatusIcon = () => {
    if (status === "saving" || status === "loading") return <Loader2 className="size-3.5 animate-spin text-primary" />
    if (status === "saved") return <CheckCircle2 className="size-3.5 text-emerald-400" />
    if (status === "error") return <AlertCircle className="size-3.5 text-destructive" />
    if (username) return <Cloud className="size-3.5 text-primary/70" />
    return <CloudOff className="size-3.5 text-muted-foreground" />
  }

  const statusLabel = () => {
    if (status === "saving") return "Đang lưu..."
    if (status === "loading") return "Đang tải..."
    if (status === "saved") return "Đã lưu"
    if (status === "error") return "Lỗi"
    if (username) return username
    return "Cloud Save"
  }

  const inputCls = cn(
    "w-full bg-background border border-border rounded-md px-3 py-1.5",
    "text-sm text-foreground placeholder:text-muted-foreground outline-none",
    "focus:border-primary transition-colors"
  )

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs transition-all",
          username
            ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
            : "border-border bg-card/80 text-muted-foreground hover:text-foreground",
        )}
      >
        <StatusIcon />
        <span className="hidden sm:inline font-mono">{statusLabel()}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={cn(
            "absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border border-border",
            "bg-card shadow-2xl shadow-black/50 p-4 space-y-3",
          )}>
            <p className="font-fantasy text-sm font-bold text-primary flex items-center gap-2">
              <Cloud className="size-4" /> Cloud Save
            </p>

            {!username ? (
              <div className="space-y-3">
                {/* Mode tabs */}
                <div className="flex rounded-lg overflow-hidden border border-border">
                  <button
                    onClick={() => { setMode("login"); setLocalErr("") }}
                    className={cn(
                      "flex-1 py-1.5 text-xs font-medium transition-colors",
                      mode === "login"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => { setMode("register"); setLocalErr("") }}
                    className={cn(
                      "flex-1 py-1.5 text-xs font-medium transition-colors",
                      mode === "register"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Tạo tài khoản
                  </button>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {mode === "login"
                    ? "Đăng nhập để load save từ cloud."
                    : "Tạo tài khoản mới — save hiện tại sẽ được upload lên cloud."}
                </p>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={uname}
                    onChange={e => setUname(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    placeholder="Username..."
                    maxLength={30}
                    className={inputCls}
                    autoFocus
                  />
                  <input
                    type="password"
                    value={pwd}
                    onChange={e => setPwd(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    placeholder="Mật khẩu (ít nhất 6 ký tự)..."
                    className={inputCls}
                  />
                  {mode === "register" && (
                    <input
                      type="password"
                      value={pwd2}
                      onChange={e => setPwd2(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSubmit()}
                      placeholder="Nhập lại mật khẩu..."
                      className={inputCls}
                    />
                  )}
                </div>

                {err && (
                  <p className="text-[11px] text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3 shrink-0" />{err}
                  </p>
                )}

                <Button
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={handleSubmit}
                  disabled={status === "loading"}
                >
                  {status === "loading"
                    ? <Loader2 className="size-3.5 animate-spin" />
                    : mode === "login"
                      ? <LogIn className="size-3.5" />
                      : <UserPlus className="size-3.5" />
                  }
                  {mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Đang đăng nhập</p>
                    <p className="font-mono text-sm font-bold text-primary">{username}</p>
                  </div>
                  <StatusIcon />
                </div>

                {status === "error" && (
                  <p className="text-[11px] text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3" />{errorMsg}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs"
                    onClick={() => { onManualSave(); setOpen(false) }}
                    disabled={status === "saving" || status === "loading"}
                  >
                    {status === "saving"
                      ? <Loader2 className="size-3.5 animate-spin" />
                      : <Save className="size-3.5" />}
                    Lưu ngay
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-xs text-muted-foreground"
                    onClick={() => { onLogout(); setOpen(false) }}
                  >
                    <LogOut className="size-3.5" />
                    Đăng xuất
                  </Button>
                </div>

                <p className="text-[10px] text-muted-foreground text-center">
                  Auto-save sau mỗi 3 giây khi có thay đổi
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
