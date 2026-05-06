"use client"

import { useMemo, useState } from "react"
import { useGame } from "@/lib/game/store"
import { HEROES_BY_ID } from "@/lib/game/heroes"
import { computeSynergies } from "@/lib/game/combat"
import { SYNERGY_BY_TRAIT, TRAIT_LABEL } from "@/lib/game/factions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HeroCard } from "@/components/game/hero-card"
import { ChevronDown, ChevronUp, Swords, Trophy, Users, Eye, Info, Shield, Crosshair } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BattleRow } from "@/lib/game/types"

export function BattleTab() {
  const { state, dispatch, startCombat, startWatchCombat, setTeamRow } = useGame()
  const [pickerSlot, setPickerSlot] = useState<number | null>(null)

  const slot6Locked = (state.clearedStage ?? 0) < 15
  const teamHeroes = state.team.map((id) =>
    id ? state.heroes.find((h) => h.uid === id) : null,
  )
  const teamRows: BattleRow[] = state.teamRows?.length === 6
    ? state.teamRows
    : Array(6).fill("back")

  const teamTpls = teamHeroes
    .filter((h): h is NonNullable<typeof h> => !!h)
    .map((h) => HEROES_BY_ID[h.templateId])

  const synergies = useMemo(() => computeSynergies(teamTpls), [teamTpls])

  const counts: Record<string, number> = {}
  for (const t of teamTpls) {
    counts[t.role] = (counts[t.role] || 0) + 1
    for (const o of t.origins) counts[o] = (counts[o] || 0) + 1
  }
  const allCounts = Object.entries(counts).sort((a, b) => b[1] - a[1])

  const clearedStage = state.clearedStage ?? 0
  const canWatch = clearedStage > 0 && state.currentStage <= clearedStage
  const hasTeam = !teamHeroes.every((h) => !h)
  const filledIndices = state.team.map((id, i) => id ? i : -1).filter(i => i >= 0)
  const hasFront = filledIndices.some(i => teamRows[i] === "front")

  function canGoBack(slotIdx: number): boolean {
    const uid = state.team[slotIdx]
    if (!uid) return true
    const owned = state.heroes.find(h => h.uid === uid)
    const tpl = owned ? HEROES_BY_ID[owned.templateId] : null
    return tpl?.range !== "melee"
  }

  function handleRowToggle(slotIdx: number) {
    const current = teamRows[slotIdx]
    const next: BattleRow = current === "front" ? "back" : "front"
    if (next === "back" && !canGoBack(slotIdx)) return
    setTeamRow(slotIdx, next)
  }

  const frontSlots = [0,1,2,3,4,5].filter(i => teamRows[i] === "front")
  const backSlots  = [0,1,2,3,4,5].filter(i => teamRows[i] === "back")

  function SlotCard({ i }: { i: number }) {
    const owned = teamHeroes[i]
    const row = teamRows[i]
    const tpl = owned ? HEROES_BY_ID[owned.templateId] : null
    const isMelee = tpl?.range === "melee"
    const isLocked6 = i === 5 && slot6Locked

    return (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => { if (!isLocked6) setPickerSlot(i) }}
          className={cn(
            "min-h-[110px] rounded-lg border-2 border-dashed transition-colors p-1.5",
            isLocked6 && "opacity-40 cursor-not-allowed border-border/40",
            !isLocked6 && owned && "border-primary/40 bg-card/40",
            !isLocked6 && !owned && "border-border hover:border-primary/50 bg-card/20",
            pickerSlot === i && "border-primary ring-2 ring-primary/50",
          )}
        >
          {isLocked6 ? (
            <div className="h-full grid place-items-center text-muted-foreground/50">
              <div className="text-center">
                <Shield className="size-5 mx-auto mb-1 opacity-40" />
                <p className="text-[10px]">Mở ở tầng 15</p>
              </div>
            </div>
          ) : owned ? (
            <HeroCard hero={owned} compact showStats={false} />
          ) : (
            <div className="h-full grid place-items-center text-muted-foreground/70">
              <div className="text-center">
                <Users className="size-5 mx-auto mb-1 opacity-60" />
                <p className="text-xs">Slot {i + 1}</p>
              </div>
            </div>
          )}
        </button>

        {!isLocked6 && owned && (
          <button
            type="button"
            onClick={() => handleRowToggle(i)}
            title={isMelee ? "Cận chiến: chỉ hàng trước" : `Chuyển sang hàng ${row === "front" ? "sau" : "trước"}`}
            className={cn(
              "text-[10px] rounded px-1.5 py-0.5 flex items-center justify-center gap-1 transition-colors w-full font-medium",
              row === "front"
                ? "bg-orange-500/20 border border-orange-500/50 text-orange-300"
                : "bg-blue-500/20 border border-blue-500/50 text-blue-300",
              isMelee && "opacity-60 cursor-not-allowed",
            )}
          >
            {row === "front" ? (
              <><Swords className="size-3" /> Hàng trước</>
            ) : (
              <><Crosshair className="size-3" /> Hàng sau</>
            )}
          </button>
        )}
      </div>
    )
  }

  const activeEvents = state.activeEvents ?? []

  return (
    <div className="space-y-3">
    {/* Active Event Banner */}
    {activeEvents.length > 0 && (
      <div className="flex flex-wrap gap-2">
        {activeEvents.map(ae => {
          const banners: Record<string, { bg: string; text: string; msg: string }> = {
            blood_moon:  { bg: "bg-red-900/60 border-red-500/50",    text: "text-red-200",    msg: "🩸🌕 Đêm Trăng Máu — Kẻ địch +25% def/hp/dmg!" },
            war_economy: { bg: "bg-yellow-900/60 border-yellow-600/50", text: "text-yellow-200", msg: "💣📈 Chiến Tranh! Giá cả & tiền phạt +25%!" },
            black_market:{ bg: "bg-gray-800/60 border-gray-500/50",  text: "text-gray-300",   msg: "🕵️ Chợ Đen xuất hiện!" },
          }
          const b = banners[ae.eventId]
          return (
            <div key={ae.eventId} className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold ${b.bg} ${b.text} animate-pulse`}>
              {b.msg}
            </div>
          )
        })}
      </div>
    )}
    <div className="grid lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2 ornate-border">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="font-fantasy flex items-center gap-2">
            <Swords className="size-5 text-primary" />
            Tháp Aetheria
          </CardTitle>
          <div className="flex items-center gap-2 text-xs">
            <Trophy className="size-4 text-rarity-legendary" />
            <span className="text-muted-foreground">Cao nhất:</span>
            <span className="font-bold text-rarity-legendary">Tầng {state.highestStage}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon"
              onClick={() => dispatch({ type: "SET_STAGE", stage: state.currentStage - 1 })}
              disabled={state.currentStage <= 1} aria-label="Giảm tầng">
              <ChevronDown className="size-4" />
            </Button>
            <div className="flex-1 grid place-items-center text-center bg-card/60 border-2 border-primary/40 rounded-lg py-6 ornate-border">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Tầng hiện tại</p>
              <p className="font-fantasy font-bold text-4xl text-primary">{state.currentStage}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {state.currentStage <= 5 ? "Chỉ có quái Common"
                  : state.currentStage <= 15 ? "Quái Rare bắt đầu xuất hiện"
                  : state.currentStage <= 30 ? "Quái Epic — thử thách thật sự"
                  : state.currentStage <= 50 ? "Vùng nguy hiểm — Legendary xuất hiện"
                  : state.currentStage <= 70 ? "Mythical & Celestial cực hiếm"
                  : "Thiên Giới tràn ngập chiến trường!"}
              </p>
              {state.currentStage <= clearedStage && (
                <span className="mt-2 text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                  ✓ Đã chinh phục — AI khả dụng
                </span>
              )}
              {state.currentStage <= clearedStage && (
                <span className="mt-1 text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
                  ⚠ Chơi lại: tài nguyên nhận được giảm ½
                </span>
              )}
              {state.currentStage > clearedStage && state.currentStage <= state.highestStage && (
                <span className="mt-2 text-[9px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-2 py-0.5">
                  ⚡ Chỉ đã qua bằng AI
                </span>
              )}
              <span className="mt-1 text-[9px] text-red-400/70 bg-red-500/10 border border-red-500/20 rounded-full px-2 py-0.5">
                💀 Thua: mất {(50 + state.currentStage * 10).toLocaleString()}🪙 (vàng có thể âm)
              </span>
            </div>
            <Button variant="outline" size="icon"
              onClick={() => dispatch({ type: "SET_STAGE", stage: state.currentStage + 1 })}
              disabled={state.currentStage >= state.highestStage + 1} aria-label="Tăng tầng">
              <ChevronUp className="size-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Button size="lg" className="w-full font-fantasy text-lg tracking-wider"
              onClick={() => startCombat()} disabled={!hasTeam || !hasFront}>
              <Swords className="size-5 mr-2" />XUẤT TRẬN — TẦNG {state.currentStage}
            </Button>
            {hasTeam && !hasFront && (
              <p className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-md px-2 py-1.5">
                <Shield className="size-3 flex-shrink-0" />
                Phải có ít nhất 1 tướng ở <strong className="mx-0.5">hàng trước</strong> mới xuất trận được!
              </p>
            )}
            <Button size="lg" variant="outline"
              className={cn("w-full font-fantasy tracking-wider gap-2 transition-all",
                canWatch && hasFront ? "border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-400"
                  : "opacity-40 cursor-not-allowed")}
              onClick={() => canWatch && hasFront && startWatchCombat()} disabled={!hasTeam || !canWatch || !hasFront}>
              <Eye className="size-4" />XEM AI ĐÁNH — TẦNG {state.currentStage}
            </Button>
            {!canWatch && (
              <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Info className="size-3 flex-shrink-0" />
                {clearedStage === 0
                  ? "Hãy tự tay chinh phục tầng đầu tiên để mở khóa chế độ xem AI!"
                  : `Chế độ xem AI chỉ dùng được với tầng ≤ ${clearedStage}`}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <Stat label="Trận thắng" value={state.battlesWon} />
            <Stat label="Tổng triệu hồi" value={state.totalRolls} />
            <Stat label="Tổng đào" value={state.totalDigs} />
          </div>
        </CardContent>
      </Card>

      <Card className="ornate-border">
        <CardHeader>
          <CardTitle className="font-fantasy flex items-center gap-2 text-base">
            <Users className="size-5 text-primary" />Hệ Tộc Đang Hoạt Động
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {synergies.length === 0 && (
            <p className="text-xs text-muted-foreground italic">
              Chưa có hệ tộc nào kích hoạt. Ghép 2+ tướng cùng tộc/role để mở khoá buff.
            </p>
          )}
          {synergies.map((s) => {
            const def = SYNERGY_BY_TRAIT[s.trait]
            return (
              <div key={s.trait} className="rounded-md border border-primary/40 bg-primary/10 p-2">
                <div className="flex items-center justify-between">
                  <span className="font-fantasy font-bold text-sm text-primary">{def.name} ×{s.count}</span>
                  <span className="text-[10px] uppercase tracking-wider text-primary/80">
                    Tier {def.tiers.findIndex((t) => t === s.tier) + 1}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">{s.tier.description}</p>
              </div>
            )
          })}
          {allCounts.length > synergies.length && (
            <div className="border-t border-border/60 pt-2 mt-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Đang gần kích hoạt</p>
              <div className="flex flex-wrap gap-1">
                {allCounts
                  .filter(([t, c]) => c < 2 || !synergies.find((s) => s.trait === t))
                  .slice(0, 6)
                  .map(([t, c]) => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/60 border border-border">
                      {TRAIT_LABEL[t as keyof typeof TRAIT_LABEL]} ×{c}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* === FORMATION EDITOR === */}
      <Card className="lg:col-span-3 ornate-border">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="font-fantasy text-base flex items-center gap-2">
              <Shield className="size-4 text-primary" />
              Đội Hình ({teamHeroes.filter(Boolean).length}/{slot6Locked ? 5 : 6})
              {slot6Locked && (
                <span className="text-[10px] text-muted-foreground font-normal">· Slot 6 mở ở tầng 15</span>
              )}
            </CardTitle>
            <p className="text-[10px] text-muted-foreground">
              Click slot → chọn tướng · Click nhãn hàng → đổi vị trí
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* BACK ROW */}
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
              <Crosshair className="size-3" /> Hàng Sau — Xạ Thủ / Pháp Sư / Hỗ Trợ
              <span className="ml-auto font-normal normal-case text-blue-300/60">Quái đánh hàng sau 30%</span>
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 min-h-[80px]">
              {backSlots.map(i => <SlotCard key={i} i={i} />)}
              {backSlots.length === 0 && (
                <p className="col-span-6 text-center text-xs text-muted-foreground/60 py-6 italic">
                  Chưa có tướng ở hàng sau
                </p>
              )}
            </div>
          </div>

          {/* FRONT ROW */}
          <div className={cn("rounded-lg border p-3", hasTeam && !hasFront ? "border-amber-500/60 bg-amber-500/10" : "border-orange-500/30 bg-orange-500/5")}>
            <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
              <Swords className="size-3" /> Hàng Trước — Cận Chiến / Đấu Sĩ / Tank
              {hasTeam && !hasFront && (
                <span className="ml-2 text-amber-400 normal-case font-normal text-[10px]">⚠ Bắt buộc có ít nhất 1 tướng!</span>
              )}
              <span className="ml-auto font-normal normal-case text-orange-300/60">Quái đánh hàng trước 70%</span>
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 min-h-[80px]">
              {frontSlots.map(i => <SlotCard key={i} i={i} />)}
              {frontSlots.length === 0 && (
                <p className={cn("col-span-6 text-center text-xs py-6 italic", hasTeam ? "text-amber-400/80" : "text-muted-foreground/60")}>
                  {hasTeam ? "⚠ Hàng trước trống — không thể xuất trận!" : "Chưa có tướng ở hàng trước"}
                </p>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground pt-1">
            <span className="flex items-center gap-1">
              <span className="inline-block size-2 rounded-full bg-orange-500/70" />
              Cận chiến: bắt buộc hàng trước
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block size-2 rounded-full bg-blue-500/70" />
              Tầm xa / Hỗ trợ: tự do chọn hàng
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block size-2 rounded-full bg-purple-500/70" />
              Assassin ưu tiên đánh hàng sau 70%
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block size-2 rounded-full bg-yellow-500/70" />
              15% hàng trước đỡ đòn cho hàng sau
            </span>
          </div>

          {/* Picker */}
          {pickerSlot !== null && (
            <div className="mt-2 p-3 rounded-lg bg-card/60 border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="font-fantasy text-sm">Chọn anh hùng cho slot {pickerSlot + 1}
                  <span className={cn("ml-2 text-[10px]",
                    teamRows[pickerSlot] === "front" ? "text-orange-400" : "text-blue-400")}>
                    ({teamRows[pickerSlot] === "front" ? "Hàng trước" : "Hàng sau"})
                  </span>
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline"
                    onClick={() => { dispatch({ type: "SET_TEAM_SLOT", slot: pickerSlot, uid: null }); setPickerSlot(null) }}>
                    Bỏ trống
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPickerSlot(null)}>Đóng</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[360px] overflow-y-auto">
                {state.heroes.length === 0 && (
                  <p className="col-span-full text-center text-sm text-muted-foreground py-6">Chưa có anh hùng nào.</p>
                )}
                {state.heroes.map((h) => {
                  const tpl = HEROES_BY_ID[h.templateId]
                  const willAutoFront = tpl?.range === "melee" && teamRows[pickerSlot] === "back"
                  return (
                    <div key={h.uid} className="relative">
                      <HeroCard hero={h} compact showStats={false}
                        onClick={() => { dispatch({ type: "SET_TEAM_SLOT", slot: pickerSlot, uid: h.uid }); setPickerSlot(null) }}
                      />
                      {willAutoFront && (
                        <div className="absolute bottom-0 left-0 right-0 bg-orange-900/80 rounded-b-lg px-1 py-0.5 text-center">
                          <p className="text-[9px] text-orange-300">→ Tự chuyển hàng trước</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md bg-card/60 border border-border py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-fantasy font-bold text-base text-foreground">{value}</p>
    </div>
  )
}
