"use client"

import { useGame } from "@/lib/game/store"
import { HEROES_BY_ID } from "@/lib/game/heroes"
import { RARITY_TEXT_CLASS, RARITY_BG_CLASS } from "@/lib/game/rarity"
import { cn } from "@/lib/utils"
import { HeroCard } from "@/components/game/hero-card"
import {
  Castle, Swords, Trophy, FlameKindling, ShieldOff, Skull, Star, ArrowUp, Flag,
} from "lucide-react"

export function TowerTab() {
  const { state, dispatch, towerStartRun, towerStartFloorCombat, towerGiveUp, towerContinue } = useGame()
  const { towerState, towerRecord, heroes, team } = state

  const teamHeroes = team.map(id => id ? heroes.find(h => h.uid === id) : null)
  const hasTeam = teamHeroes.some(Boolean)
  const isInRun = !!towerState

  // Floor difficulty descriptor
  function floorDesc(floor: number): string {
    if (floor <= 5) return "Khởi đầu — Chỉ có kẻ địch Phổ Thông"
    if (floor <= 15) return "Cấp trung — Bắt đầu xuất hiện kẻ địch Hiếm"
    if (floor <= 30) return "Cấp cao — Kẻ địch Sử Thi xuất hiện"
    if (floor <= 50) return "Huyền Thoại — Kẻ địch Huyền Thoại xuất hiện"
    if (floor <= 70) return "Thần Thoại — Kẻ địch Thần Thoại & Thiên Giới cực hiếm"
    if (floor <= 100) return "Thiên Giới — Kẻ địch Thiên Giới xuất hiện thường xuyên hơn"
    return "SIÊU THẦN — Thiên Giới tràn ngập chiến trường!"
  }

  function floorColor(floor: number): string {
    if (floor <= 5) return "text-green-400"
    if (floor <= 15) return "text-blue-400"
    if (floor <= 30) return "text-orange-400"
    if (floor <= 50) return "text-red-400"
    if (floor <= 80) return "text-rarity-legendary"
    return "text-rarity-celestial"
  }

  // Milestones display — every 10 floors get rewards
  const milestones = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
  const claimedMilestones = state.towerClaimedMilestones ?? []

  function milestoneReward(floor: number): string {
    const tier = Math.floor(floor / 10)
    return `+${(500 * tier + 200).toLocaleString()}🪙 +${10 * tier}💎`
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {/* Main panel */}
      <div className="lg:col-span-2 space-y-4">

        {/* Header card */}
        <div className="rounded-2xl border-2 border-primary/30 bg-card ornate-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Castle className="size-5 text-primary" />
              <h2 className="font-fantasy text-lg font-bold tracking-wide">Tháp Vô Cực</h2>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Trophy className="size-4 text-rarity-legendary" />
              <span className="text-muted-foreground">Kỷ lục:</span>
              <span className="font-bold text-rarity-legendary">
                {towerRecord > 0 ? `Tầng ${towerRecord}` : "Chưa có"}
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Trong chế độ Tháp Vô Cực, bạn chiến đấu liên tục qua các tầng ngày càng khó hơn. Sau mỗi tầng, toàn đội được hồi <span className="text-emerald-400 font-semibold">30% HP tối đa</span> và bạn có thể <span className="text-primary font-semibold">thay thế anh hùng</span> từ kho vào đội. Chọn <span className="text-primary">Tiếp tục</span> để leo tầng cao hơn hoặc <span className="text-destructive">Bỏ cuộc</span> để lưu kết quả.
          </p>

          {/* Milestone bar */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-fantasy">Cột Mốc Phần Thưởng</p>
            <p className="text-[10px] text-amber-400/80 mb-2">Chỉ nhận thưởng tại tầng 10, 20, 30... — mỗi mốc chỉ một lần!</p>
            <div className="flex gap-1.5 flex-wrap">
              {milestones.map(m => {
                const claimed = claimedMilestones.includes(m)
                const reached = towerRecord >= m
                return (
                  <div
                    key={m}
                    title={milestoneReward(m)}
                    className={cn(
                      "px-2 py-1 rounded-lg border text-[10px] font-mono font-bold flex flex-col items-center gap-0.5",
                      claimed
                        ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-400"
                        : reached
                        ? "bg-primary/20 border-primary/60 text-primary"
                        : "bg-muted/30 border-border text-muted-foreground"
                    )}
                  >
                    <span>{claimed ? "✓" : reached ? "!" : ""} T.{m}</span>
                    <span className="text-[9px] opacity-70">{milestoneReward(m)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Active run panel OR start panel */}
        {isInRun ? (
          <div className="rounded-2xl border-2 border-primary/50 bg-card ornate-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlameKindling className="size-5 text-orange-400 animate-pulse" />
                <span className="font-fantasy text-base font-bold text-orange-400">Đang Leo Tháp</span>
              </div>
              <span className="text-[10px] bg-orange-500/15 text-orange-400 border border-orange-500/30 rounded-full px-2 py-0.5">
                ĐANG CHẠY
              </span>
            </div>

            {/* Current floor display */}
            <div className={cn(
              "grid place-items-center border-2 rounded-xl py-8 ornate-border",
              towerState.floor % 10 === 0 && !claimedMilestones.includes(towerState.floor)
                ? "bg-amber-500/10 border-amber-500/60"
                : "bg-muted/30 border-primary/40"
            )}>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Tầng hiện tại</p>
              <p className={cn("font-fantasy font-bold text-6xl mt-1", floorColor(towerState.floor))}>
                {towerState.floor}
              </p>
              <p className="text-xs text-muted-foreground mt-2">{floorDesc(towerState.floor)}</p>
              {towerState.floor % 10 === 0 && !claimedMilestones.includes(towerState.floor) && (
                <div className="mt-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50">
                  <p className="text-[10px] text-amber-400 font-bold">⭐ CỘT MỐC! Thắng để nhận: {milestoneReward(towerState.floor)}</p>
                </div>
              )}
              {towerState.floor % 10 === 0 && claimedMilestones.includes(towerState.floor) && (
                <div className="mt-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                  <p className="text-[10px] text-emerald-400">✓ Đã nhận thưởng cột mốc này</p>
                </div>
              )}
              <div className="mt-2 flex items-center gap-1 text-[10px]">
                <ArrowUp className="size-3 text-muted-foreground" />
                <span className="text-muted-foreground">Kẻ địch mạnh gấp ~{Math.round(towerState.floor * 2)}× tầng thường</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={towerGiveUp}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-destructive/50 text-destructive text-sm font-fantasy hover:bg-destructive/10 transition-colors"
              >
                <Flag className="size-4" />
                Bỏ Cuộc
              </button>
              <button
                onClick={towerStartFloorCombat}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-fantasy font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30"
              >
                <Swords className="size-4" />
                Chiến Đấu Tầng {towerState.floor}
              </button>
            </div>

            <p className="text-[10px] text-center text-muted-foreground">
              Thua hoặc bỏ cuộc sẽ kết thúc lượt leo — kỷ lục sẽ được lưu lại
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card/60 p-5 space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Swords className="size-4" />
              <span className="font-fantasy text-sm font-semibold">Bắt đầu lượt leo mới</span>
            </div>

            {/* Team preview */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-fantasy">Đội hình hiện tại</p>
              {hasTeam ? (
                <div className="flex flex-wrap gap-2">
                  {teamHeroes.map((hero, i) => {
                    if (!hero) return (
                      <div key={i} className="w-16 h-16 rounded-lg border-2 border-dashed border-border/50 grid place-items-center">
                        <span className="text-muted-foreground text-xs">Trống</span>
                      </div>
                    )
                    const tpl = HEROES_BY_ID[hero.templateId]
                    if (!tpl) return null
                    return (
                      <div key={i} className={cn("w-16 h-16 rounded-lg border-2 grid place-items-center text-center p-1", RARITY_BG_CLASS[tpl.rarity])}>
                        <p className={cn("font-fantasy text-[9px] font-bold leading-tight", RARITY_TEXT_CLASS[tpl.rarity])}>{tpl.name.split(" ")[0]}</p>
                        <p className="text-[8px] text-muted-foreground">Lv{hero.level}</p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-destructive">⚠ Chưa có anh hùng trong đội. Hãy vào tab Chiến Đấu để chọn đội.</p>
              )}
            </div>

            <button
              onClick={towerStartRun}
              disabled={!hasTeam}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-fantasy font-bold text-sm transition-all",
                hasTeam
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                  : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
              )}
            >
              <Castle className="size-4" />
              Bắt Đầu Leo Tháp
            </button>
          </div>
        )}
      </div>

      {/* Right panel: info + rules */}
      <div className="space-y-4">
        {/* Rules */}
        <div className="rounded-xl border border-border bg-card/60 p-4 space-y-3">
          <p className="font-fantasy text-xs font-bold uppercase tracking-widest text-muted-foreground">Luật chơi</p>
          <div className="space-y-2 text-xs">
            {[
              { icon: "🗼", text: "Mỗi tầng là 1 trận đấu độc lập" },
              { icon: "💪", text: "Kẻ địch mạnh hơn theo từng tầng" },
              { icon: "💚", text: "Thắng → Toàn đội hồi 30% HP tối đa" },
              { icon: "🔄", text: "Thắng → Được thay anh hùng từ kho" },
              { icon: "⬆", text: "Chọn Tiếp Tục để leo tầng cao hơn" },
              { icon: "🏳", text: "Bỏ Cuộc → Lưu kỷ lục tầng cao nhất" },
              { icon: "💀", text: "Thua → Kết thúc lượt, lưu kỷ lục" },
            ].map((r, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-base leading-none mt-0.5">{r.icon}</span>
                <span className="text-muted-foreground leading-relaxed">{r.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Difficulty scaling */}
        <div className="rounded-xl border border-border bg-card/60 p-4 space-y-2">
          <p className="font-fantasy text-xs font-bold uppercase tracking-widest text-muted-foreground">Độ Khó Theo Tầng</p>
          <div className="space-y-1.5 text-xs">
            {[
              { range: "1–5", label: "Dễ", color: "text-green-400" },
              { range: "6–15", label: "Trung bình", color: "text-blue-400" },
              { range: "16–30", label: "Khó", color: "text-orange-400" },
              { range: "31–50", label: "Cực khó", color: "text-red-400" },
              { range: "51–80", label: "Huyền thoại", color: "text-rarity-legendary" },
              { range: "81+", label: "Siêu thần", color: "text-rarity-celestial" },
            ].map(d => (
              <div key={d.range} className="flex justify-between items-center">
                <span className="text-muted-foreground font-mono">Tầng {d.range}</span>
                <span className={cn("font-fantasy font-semibold", d.color)}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Personal record highlight */}
        {towerRecord > 0 && (
          <div className="rounded-xl border border-rarity-legendary/40 bg-rarity-legendary/5 p-4 text-center">
            <Trophy className="size-6 text-rarity-legendary mx-auto mb-1" />
            <p className="font-fantasy text-xs text-muted-foreground">Kỷ lục của bạn</p>
            <p className="font-fantasy text-3xl font-bold text-rarity-legendary">Tầng {towerRecord}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{floorDesc(towerRecord)}</p>
          </div>
        )}
      </div>
    </div>
  )
}
