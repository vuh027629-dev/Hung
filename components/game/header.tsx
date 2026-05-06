"use client"

import { useGameSelector, useGameActions, useGameState, useLoadSave } from "@/lib/game/store"
import { useCloudSave } from "@/lib/game/use-cloud-save"
import { playerXpToNextLevel } from "@/lib/game/combat"
import { Coins, Gem, Crown, RefreshCcw, Volume2, VolumeX } from "lucide-react"
import { useState, useCallback } from "react"
import { toggleSoundMuted, getSoundMuted } from "@/hooks/use-sound"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CloudSaveWidget } from "./cloud-save-widget"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { GameState } from "@/lib/game/types"

export function Header() {
  const gold = useGameSelector(s => s.gold)
  const gems = useGameSelector(s => s.gems)
  const level = useGameSelector(s => s.level)
  const xp = useGameSelector(s => s.xp)
  const { resetGame } = useGameActions()
  const state = useGameState()
  const loadSave = useLoadSave()

  const { username, status, errorMsg, login, register, logout, manualSave } = useCloudSave(
    state,
    (data: GameState) => loadSave(data),
  )

  const [isMuted, setIsMuted] = useState(() => getSoundMuted())
  const handleToggleMute = useCallback(() => {
    const next = toggleSoundMuted()
    setIsMuted(next)
  }, [])

  const xpNeed = playerXpToNextLevel(level)
  const xpPct = Math.min(100, (xp / xpNeed) * 100)

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Crown className="size-6 text-primary" />
          <h1 className="font-fantasy text-lg sm:text-xl font-bold tracking-wide text-primary">
            AETHERIA
          </h1>
        </div>

        <div className="hidden md:flex items-center gap-3 ml-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Cấp
            </span>
            <span className="font-fantasy font-bold text-primary text-lg leading-none">
              {level}
            </span>
            <div className="w-32">
              <Progress value={xpPct} className="h-2" />
              <p className="text-[9px] text-muted-foreground mt-0.5">
                {xp} / {xpNeed} XP
              </p>
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <CurrencyChip
            icon={<Coins className="size-4 text-rarity-legendary" />}
            value={gold}
            label="Vàng"
          />
          <CurrencyChip
            icon={<Gem className="size-4 text-rarity-celestial" />}
            value={gems}
            label="Đá Quý"
          />

          <button
          onClick={handleToggleMute}
          title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
          className="flex items-center justify-center w-8 h-8 rounded-md border border-border bg-card/80 text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
        >
          {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>
        <CloudSaveWidget
            username={username}
            status={status}
            errorMsg={errorMsg}
            onLogin={login}
            onRegister={register}
            onLogout={logout}
            onManualSave={manualSave}
          />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Reset game">
                <RefreshCcw className="size-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-fantasy">
                  Đặt lại tiến trình?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Mọi anh hùng, vật phẩm, vàng và đá quý sẽ bị xóa. Hành động
                  không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={() => resetGame()}>
                  Đặt lại
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="md:hidden mx-auto max-w-7xl px-4 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            Cấp {level}
          </span>
          <Progress value={xpPct} className="h-1.5 flex-1" />
          <span className="text-[10px] text-muted-foreground font-mono">
            {xp}/{xpNeed}
          </span>
        </div>
      </div>
    </header>
  )
}

function CurrencyChip({
  icon, value, label,
}: {
  icon: React.ReactNode
  value: number
  label: string
}) {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-card/80"
      aria-label={label}
    >
      {icon}
      <span className="font-mono text-sm font-bold tabular-nums">
        {value.toLocaleString()}
      </span>
    </div>
  )
}
