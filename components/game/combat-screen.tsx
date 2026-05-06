"use client"

import { useEffect, useMemo, useRef, useState, useCallback, memo } from "react"
import { useGame, useGameSelector } from "@/lib/game/store"
import { canCastSkill } from "@/lib/game/combat"
import { ITEMS_BY_ID } from "@/lib/game/items"
import { HEROES_BY_ID } from "@/lib/game/heroes"
import { RARITY_BG_CLASS, RARITY_TEXT_CLASS } from "@/lib/game/rarity"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAvatar } from "@/hooks/use-avatar"
import { useSound } from "@/hooks/use-sound"
import { preloadAvatars } from "@/lib/game/avatar-cache"
import {
  Sword, Shield, Sparkles, Crosshair, Heart, Zap,
  FlaskConical, X, Wind, Swords, ChevronRight,
  AlertTriangle, Star, ChevronDown, ChevronUp,
  BarChart2, ScrollText, Eye,
} from "lucide-react"
import type { BattleUnit, Skill } from "@/lib/game/types"

const ROLE_ICON = {
  warrior: Sword, assassin: Zap, mage: Sparkles,
  marksman: Crosshair, tank: Shield, support: Heart,
}
const ROLE_LABEL: Record<string, string> = {
  warrior: "Chiến Binh", assassin: "Sát Thủ", mage: "Pháp Sư",
  marksman: "Xạ Thủ", tank: "Hộ Vệ", support: "Hỗ Trợ",
}

// Hoisted at module level — compiled once, not on every render/effect
const RX_DMG   = /^(.+?)\s+[⚔✦✯]\s+(.+?)\s+-(\d+)(\s+\(CRIT!\))?/
const RX_HEAL  = /^(.+?)\s+hồi\s+(\d+)\s+HP\s+cho\s+(.+)$/
const RX_DOT   = /^(.+?)\s+mất\s+(\d+)\s+từ\s+/
const RX_REGEN = /^(.+?)\s+hồi\s+(\d+)\s+HP\s+từ\s+/
const RX_MISS  = /né tránh/
const RX_CRIT  = /CRIT!/
const STATUS_COLOR: Record<string, string> = {
  burn: "bg-orange-500/20 border-orange-500/50 text-orange-300",
  poison: "bg-green-700/20 border-green-700/50 text-green-400",
  bleed: "bg-red-600/20 border-red-600/50 text-red-300",
  stun: "bg-yellow-500/20 border-yellow-500/50 text-yellow-300",
  shield: "bg-sky-500/20 border-sky-500/50 text-sky-300",
  regen: "bg-emerald-500/20 border-emerald-500/50 text-emerald-300",
  atkUp: "bg-blue-500/20 border-blue-500/50 text-blue-300",
  atkDown: "bg-red-500/20 border-red-500/50 text-red-300",
  defUp: "bg-cyan-500/20 border-cyan-500/50 text-cyan-300",
  defDown: "bg-orange-500/20 border-orange-500/50 text-orange-300",
  spdUp: "bg-violet-500/20 border-violet-500/50 text-violet-300",
  spdDown: "bg-slate-500/20 border-slate-500/50 text-slate-300",
}
const STATUS_ICON: Record<string, string> = {
  burn: "🔥", poison: "☠", bleed: "🩸", stun: "💫",
  shield: "🛡", regen: "💚", atkUp: "⬆", atkDown: "⬇",
  defUp: "🔰", defDown: "⚠", spdUp: "💨", spdDown: "🐢",
}
function hpBarColor(pct: number): string {
  if (pct > 0.6) return "bg-emerald-500"
  if (pct > 0.3) return "bg-amber-500"
  return "bg-rose-500"
}

// ── Floating Damage Numbers ─────────────────────────────────────────────────
interface FloatNum { id: number; text: string; color: string; x: number; y: number }
let _floatId = 0

// ── Damage Stats ─────────────────────────────────────────────────────────────
interface DmgStat { uid: string; name: string; side: "player" | "enemy"; dmg: number; heal: number; rarity: string }

const DamageStatsPanel = memo(function DamageStatsPanel({ units, dmgMap }: {
  units: BattleUnit[]
  dmgMap: Record<string, { dmg: number; heal: number }>
}) {
  const stats: DmgStat[] = units.map(u => ({
    uid: u.uid,
    name: u.name.split(" ")[0],
    side: u.side as "player" | "enemy",
    dmg: dmgMap[u.uid]?.dmg ?? 0,
    heal: dmgMap[u.uid]?.heal ?? 0,
    rarity: u.rarity,
  }))

  const playerStats = stats.filter(s => s.side === "player").sort((a, b) => b.dmg - a.dmg)
  const enemyStats  = stats.filter(s => s.side === "enemy").sort((a, b) => b.dmg - a.dmg)
  const maxDmg = Math.max(...stats.map(s => s.dmg), 1)

  const Row = ({ s }: { s: DmgStat }) => (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between gap-1">
        <span className={cn("text-[9px] font-fantasy font-bold truncate max-w-[70px]", RARITY_TEXT_CLASS[s.rarity])}>
          {s.name}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {s.heal > 0 && (
            <span className="text-[8px] text-emerald-400 font-mono">+{s.heal.toLocaleString()}💚</span>
          )}
          <span className={cn("text-[9px] font-mono font-bold", s.side === "player" ? "text-rose-400" : "text-orange-400")}>
            {s.dmg.toLocaleString()}
          </span>
        </div>
      </div>
      <div className="h-1 bg-muted/40 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", s.side === "player" ? "bg-rose-500" : "bg-orange-500")}
          style={{ width: `${(s.dmg / maxDmg) * 100}%` }}
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-2.5 px-2.5 py-2">
      {/* Player team */}
      <div>
        <p className="text-[7px] uppercase tracking-widest text-primary/60 font-fantasy mb-1.5 flex items-center gap-1">
          <Shield className="size-2.5" />Đồng minh
        </p>
        <div className="space-y-1.5">
          {playerStats.map(s => <Row key={s.uid} s={s} />)}
          {playerStats.length === 0 && <p className="text-[9px] text-muted-foreground italic">–</p>}
        </div>
      </div>
      {/* Enemy team */}
      <div>
        <p className="text-[7px] uppercase tracking-widest text-destructive/60 font-fantasy mb-1.5 flex items-center gap-1">
          <Sword className="size-2.5" />Kẻ địch
        </p>
        <div className="space-y-1.5">
          {enemyStats.map(s => <Row key={s.uid} s={s} />)}
          {enemyStats.length === 0 && <p className="text-[9px] text-muted-foreground italic">–</p>}
        </div>
      </div>
    </div>
  )
})

// ── Turn Order Preview ───────────────────────────────────────────────────────
const TurnOrderBar = memo(function TurnOrderBar({ combat }: { combat: NonNullable<ReturnType<typeof useGame>["state"]["combat"]> }) {
  const upcoming = useMemo(() => {
    return combat.order
      .slice(combat.activeUnitIndex, combat.activeUnitIndex + 7)
      .map(uid => combat.units.find(u => u.uid === uid))
      .filter(Boolean) as BattleUnit[]
  }, [combat.order, combat.activeUnitIndex, combat.units])

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-card/60 border-b border-border overflow-x-auto flex-shrink-0">
      <span className="text-[8px] uppercase tracking-widest text-muted-foreground mr-1 flex-shrink-0 font-fantasy">Thứ tự:</span>
      {upcoming.map((u, i) => {
        const Icon = ROLE_ICON[u.role] || Sword
        const isUltReady = u.energy >= u.energyMax
        return (
          <div key={u.uid + i} className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded border flex-shrink-0 transition-all",
            i === 0 ? "bg-primary/20 border-primary/60 scale-110 shadow-sm shadow-primary/30" : "bg-card/40 border-border/50",
            u.side === "enemy" && i !== 0 ? "border-destructive/30" : "",
            u.hp <= 0 && "opacity-30",
          )}>
            {i === 0 && <ChevronRight className="size-2.5 text-primary" />}
            <Icon className={cn("size-2.5", RARITY_TEXT_CLASS[u.rarity])} />
            <span className={cn("text-[8px]", i === 0 ? "text-primary font-bold" : "text-muted-foreground")}>
              {u.name.split(" ")[0]}
            </span>
            {isUltReady && <span className="text-[6px] text-violet-400">★</span>}
          </div>
        )
      })}
    </div>
  )
})

// ── Unit Card ────────────────────────────────────────────────────────────────
// Custom equality: only re-render when fields this card actually displays change
function unitCardPropsEqual(
  prev: { unit: BattleUnit; active: boolean; isPlayer?: boolean; clickable?: boolean; targetHighlight?: "enemy" | "ally"; floatNums?: FloatNum[] },
  next: typeof prev
) {
  if (prev.active !== next.active) return false
  if (prev.clickable !== next.clickable) return false
  if (prev.targetHighlight !== next.targetHighlight) return false
  if (prev.floatNums !== next.floatNums) return false
  const pu = prev.unit, nu = next.unit
  return (
    pu.hp === nu.hp &&
    pu.energy === nu.energy &&
    pu.cooldowns[0] === nu.cooldowns[0] &&
    pu.cooldowns[1] === nu.cooldowns[1] &&
    pu.cooldowns[2] === nu.cooldowns[2] &&
    pu.statuses.length === nu.statuses.length &&
    pu.statuses === nu.statuses
  )
}

const UnitCard = memo(function UnitCard({
  unit, active, isPlayer, clickable, targetHighlight, onClick, floatNums,
}: {
  unit: BattleUnit; active: boolean; isPlayer?: boolean
  clickable?: boolean; targetHighlight?: "enemy" | "ally"; onClick?: () => void
  floatNums?: FloatNum[]
}) {
  const Icon = ROLE_ICON[unit.role] || Sword
  const dead = unit.hp <= 0
  const hpPct = unit.hpMax > 0 ? (unit.hp / unit.hpMax) * 100 : 0
  const energyPct = (unit.energy / unit.energyMax) * 100
  const isUltReady = unit.energy >= unit.energyMax

  const [hitKey, setHitKey] = useState(0)
  const [hitType, setHitType] = useState<"" | "hit-flash" | "hit-shake" | "death-fade">("")
  const [lungeKey, setLungeKey] = useState(0)
  const [lungeDir, setLungeDir] = useState<"" | "attack-lunge" | "attack-lunge-left">("")
  const prevHp = useRef(unit.hp)
  const prevActive = useRef(active)

  useEffect(() => {
    if (unit.hp < prevHp.current && unit.hp > 0) {
      setHitType((prevHp.current - unit.hp) > unit.hpMax * 0.15 ? "hit-shake" : "hit-flash")
      setHitKey(k => k + 1)
    }
    if (unit.hp <= 0 && prevHp.current > 0) {
      setHitType("death-fade")
      setHitKey(k => k + 1)
    }
    prevHp.current = unit.hp
  }, [unit.hp, unit.hpMax])

  useEffect(() => {
    if (active && !prevActive.current && unit.hp > 0) {
      setLungeDir(isPlayer ? "attack-lunge" : "attack-lunge-left")
      setLungeKey(k => k + 1)
    }
    prevActive.current = active
  }, [active, isPlayer, unit.hp])

  const statusGlowClass = (() => {
    if (!unit.statuses.length) return ""
    const kinds = unit.statuses.map(s => s.kind)
    if (kinds.includes("burn"))   return "status-burn"
    if (kinds.includes("bleed"))  return "status-bleed"
    if (kinds.includes("stun"))   return "status-stun"
    if (kinds.includes("poison")) return "status-poison"
    if (kinds.includes("shield")) return "status-shield"
    if (kinds.includes("regen"))  return "status-regen"
    if (kinds.some(k => k.endsWith("Up")))   return "status-buff"
    if (kinds.some(k => k.endsWith("Down"))) return "status-debuff"
    return ""
  })()

  const tpl = HEROES_BY_ID[unit.templateId]
  const avatarSrc = useAvatar(tpl ? {
    templateId: unit.templateId,
    name: unit.name,
    role: unit.role,
    rarity: unit.rarity,
    origins: unit.origins,
    isEnemy: !isPlayer,
    flavor: tpl.flavor,
  } : null)

  return (
    <div className="relative">
    <div key={`lunge-${lungeKey}`} className={lungeDir || undefined}>
    <button
      type="button"
      onClick={onClick}
      disabled={dead || !clickable}
      className={cn(
        "relative rounded-lg border-2 p-2 text-left min-w-[86px] flex-1 max-w-[130px]",
        "transition-[border-color,box-shadow,opacity,filter] duration-200",
        RARITY_BG_CLASS[unit.rarity],
        active && "active-unit-glow scale-[1.03] shadow-lg shadow-primary/25",
        !active && statusGlowClass,
        clickable && !dead && [
          "cursor-pointer",
          targetHighlight === "enemy" && "hover:border-destructive hover:shadow-md hover:shadow-destructive/25 hover:scale-[1.06]",
          targetHighlight === "ally" && "hover:border-blue-400 hover:shadow-md hover:shadow-blue-400/25 hover:scale-[1.06]",
        ],
        dead && "opacity-25 grayscale pointer-events-none",
        !isPlayer && !active && "border-destructive/40",
      )}
    >
      {hitType && (
        <div key={`hit-${hitKey}`}
          className={cn("absolute inset-0 rounded-lg pointer-events-none z-20", hitType)}
          style={{ background: hitType === "death-fade" ? "transparent" : "rgba(255,255,255,0.6)" }}
        />
      )}
      {active && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[7px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-fantasy tracking-wide whitespace-nowrap z-10 animate-pulse">
          ▶ LƯỢT
        </span>
      )}
      {isUltReady && !dead && (
        <span className="absolute -top-2 right-0.5 text-[6px] bg-violet-600 text-white px-1 rounded z-10 animate-pulse">★</span>
      )}

      <div className="flex items-center gap-1.5 mb-1.5">
        <div className={cn("size-10 rounded-md border bg-background/50 flex-shrink-0 overflow-hidden grid place-items-center", RARITY_BG_CLASS[unit.rarity], active && "ring-1 ring-primary/60")}>
          {avatarSrc ? (
            <img src={avatarSrc} alt={unit.name} className="size-full object-cover" />
          ) : (
            <Icon className={cn("size-4", RARITY_TEXT_CLASS[unit.rarity])} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("font-fantasy text-[10px] font-bold leading-tight truncate", RARITY_TEXT_CLASS[unit.rarity])}>
            {unit.name.split(" ")[0]}
          </p>
          <p className="text-[7px] text-muted-foreground leading-none">{ROLE_LABEL[unit.role] || unit.role}</p>
        </div>
      </div>

      <div className="mb-1">
        <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden mb-0.5">
          <div className={cn("h-full rounded-full transition-all duration-500", hpBarColor(hpPct / 100))} style={{ width: `${hpPct}%` }} />
        </div>
        <p className="text-[7px] font-mono text-muted-foreground">{unit.hp.toLocaleString()}/{unit.hpMax.toLocaleString()}</p>
      </div>

      <div className="mb-1">
        <div className="h-1 bg-muted/40 rounded-full overflow-hidden mb-0.5">
          <div className={cn("h-full rounded-full transition-all duration-300", isUltReady ? "bg-violet-400" : "bg-violet-600/60")} style={{ width: `${energyPct}%` }} />
        </div>
        <p className="text-[7px] font-mono text-violet-400/60">⚡{unit.energy}/{unit.energyMax}</p>
      </div>

      {unit.statuses.length > 0 && (
        <div className="flex flex-wrap gap-0.5">
          {unit.statuses.slice(0, 4).map((s) => (
            <span key={s.id} title={`${s.name} (${s.turns}t)`}
              className={cn("text-[6px] px-0.5 rounded border", STATUS_COLOR[s.kind] || "bg-muted border-muted-foreground/30 text-muted-foreground")}>
              {STATUS_ICON[s.kind]}{s.name.slice(0, 4)}
            </span>
          ))}
        </div>
      )}
      <span className="absolute bottom-0.5 right-1 text-[6px] text-muted-foreground/50 font-mono">Lv{unit.level}</span>
      {/* Row indicator badge */}
      <span className={cn(
        "absolute top-0.5 right-1 text-[5px] px-0.5 rounded font-bold",
        unit.row === "front" ? "text-orange-400/70" : "text-blue-400/70"
      )}>
        {unit.row === "front" ? "TRC" : "SAU"}
      </span>
      {/* Equipment badges */}
      {Object.values(unit.equipment).filter(Boolean).length > 0 && (
        <div className="flex flex-wrap gap-0.5 mt-0.5">
          {(["weapon","armor","trinket"] as const).map(slot => {
            const itemId = unit.equipment[slot]
            if (!itemId) return null
            const item = ITEMS_BY_ID[itemId]
            if (!item) return null
            const slotIcon = slot === "weapon" ? "⚔" : slot === "armor" ? "🛡" : "💍"
            const rarityColors: Record<string,string> = {
              common:"text-gray-400", rare:"text-blue-400", epic:"text-purple-400",
              legendary:"text-yellow-400", mythic:"text-red-400", celestial:"text-cyan-400",
              transcendent:"text-pink-400", divine:"text-amber-300", primordial:"text-rose-600"
            }
            return (
              <span key={slot}
                title={`${item.name}\n${item.description}${item.passive ? `\n✦ ${item.passive.description}` : ""}`}
                className={cn("text-[7px] px-0.5 rounded border border-current/30 bg-current/5 cursor-help", rarityColors[item.rarity] || "text-gray-400")}>
                {slotIcon}
              </span>
            )
          })}
        </div>
      )}
    </button>
    {floatNums?.map(fn => (
      <div key={fn.id}
        className="number-pop absolute pointer-events-none z-50 font-fantasy font-bold select-none"
        style={{
          color: fn.color,
          left: fn.x,
          top: fn.y,
          fontSize: fn.text.startsWith("💥") ? "1rem" : fn.text.startsWith("+") ? "0.75rem" : "0.8rem",
          textShadow: `0 0 8px ${fn.color}, 0 2px 4px rgba(0,0,0,0.8)`,
          filter: fn.text.startsWith("💥") ? "drop-shadow(0 0 6px gold)" : "drop-shadow(0 1px 3px rgba(0,0,0,0.9))",
        }}>
        {fn.text}
      </div>
    ))}
    </div>
    </div>
  )
}, unitCardPropsEqual)

// ── Skill Button ─────────────────────────────────────────────────────────────
function SkillButton({ skill, index, unit, selected, onSelect }: {
  skill: Skill; index: 0 | 1 | 2; unit: BattleUnit; selected: boolean; onSelect: () => void
}) {
  const cd = unit.cooldowns[index]
  const isUlt = skill.ultimate === true
  const check = canCastSkill(unit, index)
  const canCast = check.ok
  const isAOE = ["all-enemies", "all-allies", "self"].includes(skill.targeting)
  const [pressing, setPressing] = useState(false)

  const handleClick = useCallback(() => {
    if (!canCast) return
    setPressing(true)
    setTimeout(() => setPressing(false), 200)
    onSelect()
  }, [canCast, onSelect])

  return (
    <Button
      variant={selected ? "default" : isUlt ? "outline" : "secondary"}
      className={cn(
        "h-auto py-2 px-2 flex flex-col items-start gap-0.5 relative overflow-hidden text-left",
        "transition-[transform,box-shadow,background,border-color] duration-150",
        isUlt && "border-violet-500/50 bg-violet-950/30 hover:bg-violet-950/60",
        selected && "ring-2 ring-primary shadow-lg shadow-primary/30 scale-[1.02]",
        !canCast && "opacity-45 cursor-not-allowed",
        pressing && "btn-press",
        canCast && !selected && "hover:scale-[1.03] hover:shadow-md active:scale-[0.97]",
        isUlt && unit.energy >= 100 && "border-violet-400 shadow-md shadow-violet-500/30",
      )}
      disabled={!canCast}
      onClick={handleClick}
    >
      {isUlt && (
        <div className="absolute bottom-0 left-0 h-1 rounded-b transition-all duration-500"
          style={{ width: `${unit.energy}%`, background: unit.energy >= 100 ? "#a78bfa" : "#7c3aed" }} />
      )}
      {isUlt && unit.energy >= 100 && <div className="absolute inset-0 shimmer opacity-30 pointer-events-none" />}
      {selected && <div className="absolute inset-0 bg-primary/10 pointer-events-none rounded" />}
      <div className="flex items-center gap-1 w-full">
        {isUlt && <Star className="size-2.5 text-violet-400 flex-shrink-0" />}
        <span className={cn("font-fantasy text-[10px] font-bold truncate", isUlt ? "text-violet-300" : "")}>{skill.name}</span>
        {isAOE && <span className="ml-auto text-[7px] bg-primary/20 text-primary px-1 rounded shrink-0">AOE</span>}
      </div>
      <span className="text-[9px] opacity-70 text-left line-clamp-2 leading-snug">{skill.description}</span>
      <span className={cn("text-[8px] font-mono mt-0.5", canCast ? "text-emerald-400" : "text-muted-foreground")}>
        {cd > 0 ? `⏳ ${cd}t CD` : isUlt ? (unit.energy >= 100 ? "★ SẴN SÀNG" : `⚡ ${unit.energy}/100`) : "✓ Sẵn sàng"}
      </span>
    </Button>
  )
}

// ── Action Panel ─────────────────────────────────────────────────────────────
function ActionPanel({
  activeUnit, selectedSkill, setSelectedSkill, selectedPotionUid, setSelectedPotionUid, fireAOEorSelf, awaiting, onSkipTurn,
}: {
  activeUnit: BattleUnit | undefined
  selectedSkill: 0 | 1 | 2 | "basic" | "potion" | null
  setSelectedSkill: (v: 0 | 1 | 2 | "basic" | "potion" | null) => void
  selectedPotionUid: string | null
  setSelectedPotionUid: (v: string | null) => void
  fireAOEorSelf: (idx: 0 | 1 | 2) => void
  awaiting: boolean
  onSkipTurn: () => void
}) {
  const inventory = useGameSelector(s => s.inventory)
  const [showPotionPicker, setShowPotionPicker] = useState(false)

  const potions = inventory
    .map((i) => ({ inv: i, item: ITEMS_BY_ID[i.itemId] }))
    .filter((x): x is typeof x & { item: NonNullable<typeof x.item> } => !!x.item && x.item.kind === "potion")
  const potionCount = potions.reduce((a, p) => a + p.inv.quantity, 0)

  if (!activeUnit) return null
  const isPlayerTurn = activeUnit.side === "player" && awaiting

  const requiresTarget = (sk: Skill) => sk.targeting === "enemy" || sk.targeting === "ally"

  const handleSkillClick = (idx: 0 | 1 | 2) => {
    const sk = activeUnit.skills[idx]
    if (!sk) return
    if (requiresTarget(sk)) { setSelectedSkill(selectedSkill === idx ? null : idx) }
    else { fireAOEorSelf(idx) }
  }

  const targetHint = (() => {
    if (selectedSkill === "basic") return "⚔ Chọn 1 kẻ địch để tấn công..."
    if (selectedSkill === "potion" && selectedPotionUid) return "🧪 Chọn 1 đồng minh để dùng thuốc..."
    if (typeof selectedSkill === "number") {
      const sk = activeUnit.skills[selectedSkill]
      if (!sk) return null
      return sk.targeting === "ally" ? `💙 Chọn đồng minh để dùng "${sk.name}"...` : `🎯 Chọn kẻ địch để dùng "${sk.name}"...`
    }
    return null
  })()

  return (
    <div className="rounded-xl border border-primary/20 bg-card/80 backdrop-blur-sm p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <p className={cn("font-fantasy text-[10px] uppercase tracking-wider", isPlayerTurn ? "text-primary" : "text-muted-foreground")}>
          {isPlayerTurn ? `Lượt của ${activeUnit.name}` : "🤖 AI đang hành động..."}
        </p>
        {selectedSkill !== null && (
          <Button size="sm" variant="ghost" className="h-5 px-1.5 text-muted-foreground"
            onClick={() => { setSelectedSkill(null); setSelectedPotionUid(null); setShowPotionPicker(false) }}>
            <X className="size-3" />
          </Button>
        )}
      </div>

      {!isPlayerTurn && (
        <div className="flex items-center justify-center gap-2 py-3">
          <Sparkles className="size-4 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground italic">Đang tính toán...</span>
        </div>
      )}

      {isPlayerTurn && (
        <>
          {targetHint && (
            <div className="flex items-center gap-1.5 text-[10px] text-primary bg-primary/10 border border-primary/20 rounded-md px-2 py-1.5">
              <AlertTriangle className="size-3 shrink-0" />{targetHint}
            </div>
          )}

          <div className="grid grid-cols-3 gap-1.5">
            {activeUnit.skills.map((skill, i) => !skill ? null : (
              <SkillButton key={skill.id} skill={skill} index={i as 0 | 1 | 2}
                unit={activeUnit} selected={selectedSkill === i} onSelect={() => handleSkillClick(i as 0 | 1 | 2)} />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <Button variant="outline" size="sm"
              className="gap-1.5 text-xs text-muted-foreground hover:text-yellow-400 hover:border-yellow-400/50"
              onClick={() => { onSkipTurn(); setSelectedSkill(null) }}>
              <Wind className="size-3.5" />Bỏ qua
            </Button>
            <Button variant="outline" size="sm"
              className={cn("gap-1.5 text-xs", selectedSkill === "basic" && "border-primary bg-primary/10 text-primary")}
              onClick={() => setSelectedSkill(selectedSkill === "basic" ? null : "basic")}>
              <Swords className="size-3.5" />Đánh thường
            </Button>
            <Button variant="outline" size="sm"
              className={cn("gap-1.5 text-xs", showPotionPicker && "border-primary bg-primary/10 text-primary")}
              disabled={potionCount === 0}
              onClick={() => { setShowPotionPicker(v => !v); if (selectedSkill !== "potion") setSelectedSkill(null) }}>
              <FlaskConical className="size-3.5" />Thuốc ({potionCount})
            </Button>
          </div>

          {showPotionPicker && potions.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-border">
              {potions.map(({ inv, item }) => (
                <Button key={inv.uid} size="sm" variant={selectedPotionUid === inv.uid ? "default" : "outline"}
                  className="h-auto py-1.5 px-2 flex flex-col items-start gap-0.5 text-left"
                  onClick={() => { setSelectedPotionUid(inv.uid); setSelectedSkill("potion"); setShowPotionPicker(false) }}>
                  <span className={cn("font-fantasy text-[10px]", RARITY_TEXT_CLASS[item.rarity])}>{item.name}</span>
                  <span className="text-[9px] opacity-70">×{inv.quantity}</span>
                </Button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Side Panel (Log + Stats) ─────────────────────────────────────────────────
type SidePanelTab = "log" | "stats"

function SidePanel({
  combat,
  logRef,
  dmgMap,
  isOpen,
  onToggle,
}: {
  combat: NonNullable<ReturnType<typeof useGame>["state"]["combat"]>
  logRef: React.RefObject<HTMLDivElement>
  dmgMap: Record<string, { dmg: number; heal: number }>
  isOpen: boolean
  onToggle: () => void
}) {
  const [tab, setTab] = useState<SidePanelTab>("log")
  const lastLogCount = combat.log.length

  return (
    <div className={cn(
      "flex flex-col border-t md:border-t-0 md:border-l border-border bg-card/40 transition-all duration-300 flex-shrink-0",
      isOpen
        ? "md:w-64 max-h-[340px] md:max-h-none overflow-hidden"
        : "md:w-9 max-h-[36px] md:max-h-none overflow-hidden",
    )}>
      {/* Header row — always visible */}
      <div className="flex items-center justify-between px-2 pt-2 pb-1.5 border-b border-border flex-shrink-0 min-h-[36px]">
        {isOpen ? (
          <>
            {/* Tabs */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setTab("log")}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-fantasy uppercase tracking-wider transition-colors",
                  tab === "log" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <ScrollText className="size-2.5" />
                Nhật ký
                {lastLogCount > 0 && (
                  <span className="ml-0.5 text-[7px] bg-primary/20 text-primary px-0.5 rounded">{lastLogCount}</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setTab("stats")}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-fantasy uppercase tracking-wider transition-colors",
                  tab === "stats" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <BarChart2 className="size-2.5" />
                Sát thương
              </button>
            </div>
            {/* Close button */}
            <button
              type="button"
              onClick={onToggle}
              className="ml-1 p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              title="Ẩn bảng"
            >
              <ChevronDown className="size-3 md:hidden" />
              <ChevronRight className="size-3 hidden md:block" />
            </button>
          </>
        ) : (
          /* Collapsed — just open button */
          <button
            type="button"
            onClick={onToggle}
            className="w-full flex flex-col items-center justify-center gap-0.5 py-0.5 text-muted-foreground hover:text-foreground transition-colors"
            title="Mở nhật ký / sát thương"
          >
            <ScrollText className="size-3" />
            <ChevronDown className="size-2.5 md:hidden" />
            <ChevronRight className="size-2.5 rotate-180 hidden md:block" />
          </button>
        )}
      </div>

      {/* Content — hidden when collapsed */}
      {isOpen && (
        <>
          {tab === "log" && (
            <div ref={logRef} className="flex-1 overflow-y-auto p-2.5 space-y-0.5 text-[10px] font-mono min-h-0">
              {combat.log.map((l, idx) => (
                <p key={l.id} className={cn(
                  "leading-relaxed py-0.5 border-b border-border/20 transition-all",
                  idx === combat.log.length - 1 && "slide-in-right",
                  l.kind === "damage"  && "text-rose-400",
                  l.kind === "heal"    && "text-emerald-400",
                  l.kind === "status"  && "text-violet-400",
                  l.kind === "victory" && "text-amber-400 font-bold",
                  l.kind === "defeat"  && "text-destructive font-bold",
                  l.kind === "system"  && "text-primary/80 font-semibold",
                  (!l.kind || l.kind === "info") && "text-muted-foreground",
                )}>{l.text}</p>
              ))}
            </div>
          )}

          {tab === "stats" && (
            <div className="flex-1 overflow-y-auto min-h-0">
              <DamageStatsPanel units={combat.units} dmgMap={dmgMap} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Main Combat Screen ───────────────────────────────────────────────────────
export function CombatScreen() {
  const { dispatch, combatChooseSkill, combatBasicAttack, combatUsePotion, combatFlee, combatSkipTurn, towerContinue, towerGiveUp } = useGame()
  const combat = useGameSelector(s => s.combat)
  const towerState = useGameSelector(s => s.towerState)
  const heroes = useGameSelector(s => s.heroes)
  const team = useGameSelector(s => s.team)
  const highestStage = useGameSelector(s => s.highestStage)
  const isTowerMode = !!towerState

  // Compute what rewards will actually be applied (mirrors reducer logic)
  const displayedRewards = useMemo(() => {
    if (!combat?.rewards) return null
    const isWatchMode = !!combat.watchMode
    const isReplay = !isTowerMode && combat.stage < highestStage
    if (isReplay || isWatchMode) {
      return {
        ...combat.rewards,
        gold: Math.floor(combat.rewards.gold / 2),
        gems: Math.floor(combat.rewards.gems / 2),
        xp: Math.floor(combat.rewards.xp / 2),
        items: [],
        isHalved: true,
      }
    }
    return { ...combat.rewards, isHalved: false }
  }, [combat?.rewards, combat?.watchMode, combat?.stage, isTowerMode, highestStage])
  const { play: playSound } = useSound()
  const prevEndedRef = useRef<string | null | undefined>(null)

  const [selectedSkill, setSelectedSkill] = useState<0 | 1 | 2 | "basic" | "potion" | null>(null)
  const [selectedPotionUid, setSelectedPotionUid] = useState<string | null>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const prevLogLen = useRef(0)
  const [floatMap, setFloatMap] = useState<Record<string, FloatNum[]>>({})
  const [sidePanelOpen, setSidePanelOpen] = useState(true)

  // Damage accumulator: uid → { dmg, heal }
  const [dmgMap, setDmgMap] = useState<Record<string, { dmg: number; heal: number }>>({})

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [combat?.log.length])

  // Parse new log entries → floating numbers + damage stats
  useEffect(() => {
    if (!combat) return
    const newEntries = combat.log.slice(prevLogLen.current)
    prevLogLen.current = combat.log.length
    if (!newEntries.length) return

    const floatAdditions: Record<string, FloatNum[]> = {}
    const dmgAdditions: Record<string, { dmg: number; heal: number }> = {}

    for (const entry of newEntries) {
      const text = entry.text
      const dmgMatch  = RX_DMG.exec(text)
      const healMatch = !dmgMatch ? RX_HEAL.exec(text) : null
      const dotMatch  = !dmgMatch && !healMatch ? RX_DOT.exec(text) : null
      const regenMatch = !dmgMatch && !healMatch && !dotMatch ? RX_REGEN.exec(text) : null
      const isMiss = !dmgMatch && !healMatch && !dotMatch && !regenMatch && RX_MISS.test(text)
      const isCrit = RX_CRIT.test(text)

      let attacker: typeof combat.units[0] | undefined
      let target: typeof combat.units[0] | undefined

      if (dmgMatch) {
        attacker = combat.units.find(u => u.name === dmgMatch[1].trim())
        target   = combat.units.find(u => u.name === dmgMatch[2].trim())
        const dmgVal = parseInt(dmgMatch[3], 10) || 0
        const xOff = Math.random() * 20 - 10
        const yOff = Math.random() * 6 - 3
        if (target) {
          const id = ++_floatId
          floatAdditions[target.uid] = [...(floatAdditions[target.uid] || []),
            { id, text: isCrit ? `💥${dmgVal}` : `-${dmgVal}`,
              color: isCrit ? "#fbbf24" : "#f87171",
              x: 16 + xOff, y: isCrit ? -6 + yOff : 4 + yOff }]
        }
        if (attacker) {
          if (!dmgAdditions[attacker.uid]) dmgAdditions[attacker.uid] = { dmg: 0, heal: 0 }
          dmgAdditions[attacker.uid].dmg += dmgVal
        }

      } else if (healMatch) {
        attacker = combat.units.find(u => u.name === healMatch[1].trim())
        target   = combat.units.find(u => u.name === healMatch[3].trim())
        const healVal = parseInt(healMatch[2], 10) || 0
        const xOff = Math.random() * 20 - 10
        const yOff = Math.random() * 6 - 3
        if (target) {
          const id = ++_floatId
          floatAdditions[target.uid] = [...(floatAdditions[target.uid] || []),
            { id, text: `+${healVal}`, color: "#4ade80", x: 20 + xOff, y: 2 + yOff }]
        }
        if (attacker) {
          if (!dmgAdditions[attacker.uid]) dmgAdditions[attacker.uid] = { dmg: 0, heal: 0 }
          dmgAdditions[attacker.uid].heal += healVal
        }

      } else if (dotMatch) {
        target = combat.units.find(u => u.name === dotMatch[1].trim())
        const dotVal = parseInt(dotMatch[2], 10) || 0
        if (target) {
          const id = ++_floatId
          const xOff = Math.random() * 20 - 10
          floatAdditions[target.uid] = [...(floatAdditions[target.uid] || []),
            { id, text: `-${dotVal}`, color: "#fb923c", x: 16 + xOff, y: 4 }]
        }

      } else if (regenMatch) {
        target = combat.units.find(u => u.name === regenMatch[1].trim())
        const regenVal = parseInt(regenMatch[2], 10) || 0
        if (target) {
          const id = ++_floatId
          const xOff = Math.random() * 20 - 10
          floatAdditions[target.uid] = [...(floatAdditions[target.uid] || []),
            { id, text: `+${regenVal}`, color: "#4ade80", x: 20 + xOff, y: 2 }]
        }

      } else if (isMiss) {
        attacker = combat.units.find(u => u.name.length > 2 && text.startsWith(u.name))
        if (attacker) {
          const id = ++_floatId
          floatAdditions[attacker.uid] = [...(floatAdditions[attacker.uid] || []),
            { id, text: "MISS", color: "#94a3b8", x: 20, y: 5 }]
        }
      }

      // ── Sound effects ────────────────────────────────────────────────────
      if (entry.kind === "victory") {
        playSound("victory")
      } else if (entry.kind === "defeat") {
        playSound("defeat")
      } else if (dmgMatch) {
        if (isCrit) playSound("crit")
        else if (text.includes("✦") || text.includes("✯")) playSound("skill")
        else playSound("attack")
      } else if (healMatch || regenMatch) {
        playSound("heal")
      } else if (dotMatch) {
        playSound("dot")
      } else if (isMiss) {
        playSound("miss")
      } else if (/chết|đã ngã|bị tiêu diệt/.test(text)) {
        playSound("death")
      }
    }

    // Batch both state updates together
    if (Object.keys(floatAdditions).length) {
      setFloatMap(prev => {
        const next = { ...prev }
        for (const [uid, nums] of Object.entries(floatAdditions))
          next[uid] = [...(next[uid] || []), ...nums]
        return next
      })
      // Schedule cleanup in one timeout per batch
      const ids = Object.fromEntries(
        Object.entries(floatAdditions).map(([uid, nums]) => [uid, nums.map(n => n.id)])
      )
      setTimeout(() => {
        setFloatMap(prev => {
          const next = { ...prev }
          for (const [uid, idList] of Object.entries(ids)) {
            const s = new Set(idList)
            next[uid] = (next[uid] || []).filter(n => !s.has(n.id))
          }
          return next
        })
      }, 1400)
    }

    if (Object.keys(dmgAdditions).length) {
      setDmgMap(prev => {
        const next = { ...prev }
        for (const [uid, delta] of Object.entries(dmgAdditions)) {
          next[uid] = {
            dmg: (next[uid]?.dmg ?? 0) + delta.dmg,
            heal: (next[uid]?.heal ?? 0) + delta.heal,
          }
        }
        return next
      })
    }
  }, [combat?.log.length])

  useEffect(() => {
    setSelectedSkill(null)
    setSelectedPotionUid(null)
  }, [combat?.activeUnitIndex, combat?.round])

  // Reset dmgMap when a new combat starts
  useEffect(() => {
    if (!combat) return
    setDmgMap({})
    const requests = combat.units.map((u) => {
      const tpl = HEROES_BY_ID[u.templateId]
      return {
        templateId: u.templateId, name: u.name, role: u.role,
        rarity: u.rarity, origins: u.origins,
        isEnemy: u.side === "enemy", flavor: tpl?.flavor,
      }
    })
    preloadAvatars(requests)
    prevLogLen.current = combat.log.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combat?.stage, !!combat])

  // Victory/Defeat sound (triggered by combat.ended changing)
  useEffect(() => {
    if (!combat) return
    const ended = combat.ended
    if (ended && ended !== prevEndedRef.current) {
      if (ended === "victory") playSound("victory")
      else if (ended === "defeat") playSound("defeat")
    }
    prevEndedRef.current = ended
  }, [combat?.ended, playSound])

  const activeUnit = useMemo(() => {
    if (!combat) return undefined
    return combat.units.find((u) => u.uid === combat.order[combat.activeUnitIndex])
  }, [combat])

  if (!combat) return null

  const playerUnits = combat.units.filter((u) => u.side === "player")
  const enemyUnits  = combat.units.filter((u) => u.side === "enemy")

  const targetMode = (() => {
    if (selectedSkill === "basic") return "enemy"
    if (selectedSkill === "potion") return "ally"
    if (typeof selectedSkill === "number") {
      const sk = activeUnit?.skills[selectedSkill]
      if (sk?.targeting === "enemy") return "enemy"
      if (sk?.targeting === "ally")  return "ally"
    }
    return null
  })()

  const onUnitClick = (target: BattleUnit) => {
    if (!combat.awaitingPlayerInput || !activeUnit || activeUnit.side !== "player") return

    // Tanker/tank/defender cannot target back row enemies
    if ((activeUnit.role === "tank" || activeUnit.role === "defender") && target.side === "enemy" && target.row === "back") {
      return // silently blocked
    }

    if (selectedSkill === "basic") {
      if (target.side !== "enemy" || target.hp <= 0) return
      combatBasicAttack(target.uid); setSelectedSkill(null); return
    }
    if (selectedSkill === "potion") {
      if (target.side !== "player" || target.hp <= 0 || !selectedPotionUid) return
      combatUsePotion(selectedPotionUid, target.uid)
      setSelectedSkill(null); setSelectedPotionUid(null); return
    }
    if (typeof selectedSkill === "number") {
      const skill = activeUnit.skills[selectedSkill]
      if (!skill) return
      if (skill.targeting === "enemy" && (target.side !== "enemy" || target.hp <= 0)) return
      if (skill.targeting === "ally"  && (target.side !== "player" || target.hp <= 0)) return
      // Tanker cannot target enemy back row with skills either
      if ((activeUnit.role === "tank" || activeUnit.role === "defender") && target.side === "enemy" && target.row === "back") return
      combatChooseSkill(selectedSkill, target.uid)
      setSelectedSkill(null)
    }
  }

  const fireAOEorSelf = (idx: 0 | 1 | 2) => {
    if (!activeUnit) return
    const skill = activeUnit.skills[idx]
    if (!skill) return
    const needsTarget = skill.targeting === "enemy" || skill.targeting === "ally"
    if (needsTarget) { setSelectedSkill(idx) }
    else { combatChooseSkill(idx, null); setSelectedSkill(null) }
  }

  // ── Victory / Defeat ─────────────────────────────────────────────────────
  if (combat.ended) {
    const isVictory = combat.ended === "victory"
    const isDefeat  = combat.ended === "defeat"

    // ── Tower Post-Victory: Heal + Swap UI ─────────────────────────────
    if (isTowerMode && isVictory && towerState.postVictoryStep === "choose_hero") {
      const benchHeroes = heroes.filter(h => !team.includes(h.uid))
      return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/95 backdrop-blur-md p-4">
          <div className="max-w-lg w-full rounded-2xl border-2 border-primary/30 bg-card ornate-border p-6 space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-1 animate-bounce">🏆</div>
              <h2 className="font-fantasy text-2xl font-bold text-rarity-legendary">TẦNG {towerState.floor} HOÀN THÀNH!</h2>
              <p className="text-sm text-muted-foreground mt-1">Tất cả anh hùng được hồi <span className="text-emerald-400 font-bold">30% HP tối đa</span></p>
            </div>

            {/* Rewards */}
            {displayedRewards && (
              <div className="space-y-1 text-sm bg-muted/30 rounded-lg p-3 text-left">
                <p className="font-fantasy text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Phần thưởng tầng</p>
                <div className="flex justify-between"><span className="text-muted-foreground">Vàng</span><span className="font-bold text-amber-400">+{displayedRewards.gold.toLocaleString()}🪙</span></div>
                {displayedRewards.gems > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Đá quý</span><span className="font-bold text-cyan-400">+{displayedRewards.gems}💎</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Kinh nghiệm</span><span className="font-bold text-primary">+{displayedRewards.xp} XP</span></div>
              </div>
            )}

            {/* Swap hero section */}
            <div>
              <p className="text-xs font-fantasy font-semibold text-muted-foreground mb-2 uppercase tracking-wide">🔄 Thay thế anh hùng từ kho (tùy chọn)</p>
              {benchHeroes.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Không có anh hùng trong kho</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {benchHeroes.map(h => {
                    const tpl = HEROES_BY_ID[h.templateId]
                    if (!tpl) return null
                    const isSelected = towerState.pendingSwapHeroUid === h.uid
                    return (
                      <button
                        key={h.uid}
                        onClick={() => dispatch({ type: "TOWER_SET_PENDING_SWAP", heroUid: isSelected ? null : h.uid, slot: isSelected ? null : (towerState.pendingSwapSlot ?? 0) })}
                        className={cn(
                          "text-left p-2 rounded-lg border text-xs transition-all",
                          isSelected
                            ? "border-primary bg-primary/20 text-primary"
                            : "border-border bg-muted/20 hover:border-primary/50"
                        )}
                      >
                        <div className={cn("font-fantasy font-bold truncate", RARITY_TEXT_CLASS[tpl.rarity])}>{tpl.name}</div>
                        <div className="text-muted-foreground">{tpl.role} · Lv{h.level}</div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* If a bench hero is selected, let player pick which slot */}
              {towerState.pendingSwapHeroUid && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Chọn vị trí thay thế trong đội:</p>
                  <div className="flex gap-1 flex-wrap">
                    {team.map((uid, i) => {
                      const h = uid ? heroes.find(x => x.uid === uid) : null
                      const tpl = h ? HEROES_BY_ID[h.templateId] : null
                      return (
                        <button
                          key={i}
                          onClick={() => dispatch({ type: "TOWER_SET_PENDING_SWAP", heroUid: towerState.pendingSwapHeroUid, slot: i })}
                          className={cn(
                            "px-2 py-1 rounded border text-xs",
                            towerState.pendingSwapSlot === i
                              ? "border-primary bg-primary/20 text-primary"
                              : "border-border bg-muted/20 hover:border-primary/50"
                          )}
                        >
                          {tpl ? <span className={RARITY_TEXT_CLASS[tpl.rarity]}>{tpl.name.split(" ")[0]}</span> : <span className="text-muted-foreground">Trống {i+1}</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Confirm swap button */}
              {towerState.pendingSwapHeroUid && towerState.pendingSwapSlot !== null && (
                <button
                  onClick={() => {
                    dispatch({ type: "TOWER_SWAP_HERO", heroUid: towerState.pendingSwapHeroUid!, slot: towerState.pendingSwapSlot! })
                  }}
                  className="mt-2 w-full py-1.5 rounded-lg bg-primary/20 border border-primary/50 text-primary text-xs font-fantasy font-semibold hover:bg-primary/30"
                >
                  ✅ Xác nhận thay thế
                </button>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={towerGiveUp}
                className="flex-1 py-2 rounded-lg border border-destructive/50 text-destructive text-sm font-fantasy hover:bg-destructive/10 transition-colors"
              >
                🏳 Bỏ Cuộc
              </button>
              <button
                onClick={() => {
                  // Apply 30% heal and advance
                  dispatch({ type: "TOWER_HEAL_TEAM" })
                  dispatch({ type: "END_COMBAT" })
                  towerContinue()
                }}
                className="flex-2 flex-grow py-2 rounded-lg bg-primary text-primary-foreground text-sm font-fantasy font-bold hover:bg-primary/90 transition-colors"
              >
                ⬆ Tiếp Tục — Tầng {towerState.floor + 1}
              </button>
            </div>
          </div>
        </div>
      )
    }

    // ── Standard Victory / Defeat ──────────────────────────────────────
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-background/95 backdrop-blur-md p-4">
        <div className="max-w-md w-full rounded-2xl border-2 border-primary/30 bg-card ornate-border p-8 text-center space-y-4">
          <div className={cn("text-5xl mb-2", isVictory && "animate-bounce")}>
            {isVictory ? "🏆" : isDefeat ? "💀" : "🏃"}
          </div>
          <h2 className={cn("font-fantasy text-3xl font-bold tracking-wide",
            isVictory ? "text-rarity-legendary" : isDefeat ? "text-destructive" : "text-muted-foreground")}>
            {isVictory ? "CHIẾN THẮNG!" : isDefeat ? (isTowerMode ? `THẤT BẠI — Tầng ${towerState?.floor}` : "THẤT BẠI") : "ĐÃ BỎ CHẠY"}
          </h2>
          {displayedRewards && isVictory && (
            <div className="space-y-1.5 text-sm bg-muted/30 rounded-lg p-4 text-left">
              <p className="font-fantasy text-[9px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                Phần thưởng
                {displayedRewards.isHalved && (
                  <span className="text-amber-400 bg-amber-500/15 border border-amber-500/30 rounded px-1.5 py-0.5 text-[9px] normal-case">½ chơi lại</span>
                )}
              </p>
              <div className="flex justify-between"><span className="text-muted-foreground">Vàng</span><span className="font-bold text-amber-400">+{displayedRewards.gold.toLocaleString()}🪙</span></div>
              {displayedRewards.gems > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Đá quý</span><span className="font-bold text-cyan-400">+{displayedRewards.gems}💎</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Kinh nghiệm</span><span className="font-bold text-primary">+{displayedRewards.xp} XP</span></div>
              {displayedRewards.items.map((it, i) => {
                const item = ITEMS_BY_ID[it.itemId]
                return <div key={i} className="flex justify-between"><span className="text-muted-foreground">Vật phẩm</span><span className={cn("font-bold", item ? RARITY_TEXT_CLASS[item.rarity] : "")}>{item?.name} ×{it.quantity}</span></div>
              })}
            </div>
          )}

          {/* Damage summary on end screen */}
          {Object.keys(dmgMap).length > 0 && (
            <div className="text-left bg-muted/20 rounded-lg p-3 border border-border">
              <p className="font-fantasy text-[9px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                <BarChart2 className="size-3" />Thống kê sát thương
              </p>
              <DamageStatsPanel units={combat.units} dmgMap={dmgMap} />
            </div>
          )}

          <Button size="lg" className="w-full font-fantasy tracking-wider" onClick={() => dispatch({ type: "END_COMBAT" })}>
            {isVictory ? "Tiếp tục →" : "Quay lại"}
          </Button>
        </div>
      </div>
    )
  }

  // ── Main Layout ───────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-background/97 backdrop-blur-md flex flex-col">
      <div className="border-b border-border bg-card/80 px-3 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="font-fantasy text-base font-bold text-primary tracking-wide">{isTowerMode ? "🗼" : "⚔"} Tầng {combat.stage}{isTowerMode ? " (Vô Cực)" : ""}</h2>
          <span className="text-[10px] bg-muted/60 rounded px-2 py-0.5 text-muted-foreground font-mono">Vòng {combat.round}</span>
          {combat.watchMode && (
            <span className="flex items-center gap-1 text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full px-2 py-0.5">
              <Eye className="size-2.5" />Chế độ xem
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm" variant="ghost"
            className="text-muted-foreground gap-1 text-[10px]"
            onClick={() => setSidePanelOpen(v => !v)}
          >
            <ScrollText className="size-3.5" />
            {sidePanelOpen ? "Ẩn" : "Nhật ký"}
          </Button>
          {!combat.watchMode && (
            <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => combatFlee()}>
              <Wind className="size-3.5 mr-1" />Bỏ chạy (-50🪙)
            </Button>
          )}
        </div>
      </div>

      <TurnOrderBar combat={combat} />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Main battle area */}
        <div className="flex-1 flex flex-col p-3 gap-2 overflow-y-auto min-h-0">
          {/* Enemies — grouped by row: back row top, front row bottom */}
          <div className="space-y-1">
            <p className="text-[8px] uppercase tracking-widest text-destructive/70 font-fantasy flex items-center gap-1">
              <Sword className="size-2.5" />Kẻ địch ({enemyUnits.filter(u => u.hp > 0).length}/{enemyUnits.length})
            </p>
            {/* Enemy back row */}
            {enemyUnits.some(u => u.row === "back") && (
              <div className="flex gap-2 flex-wrap px-1 pb-1 border-b border-blue-500/20">
                <span className="text-[8px] text-blue-400/60 self-center">↑ Sau</span>
                {enemyUnits.filter(u => u.row === "back").map((u) => {
                  const isTankerBlocked = activeUnit && (activeUnit.role === "tank" || activeUnit.role === "defender") && u.side === "enemy"
                  return (
                    <UnitCard key={u.uid} unit={u} active={u.uid === activeUnit?.uid}
                      clickable={combat.awaitingPlayerInput && targetMode === "enemy" && !u.dead && !isTankerBlocked}
                      targetHighlight={targetMode === "enemy" ? "enemy" : undefined}
                      onClick={() => onUnitClick(u)}
                      floatNums={floatMap[u.uid]} />
                  )
                })}
              </div>
            )}
            {/* Enemy front row */}
            {enemyUnits.some(u => u.row === "front") && (
              <div className="flex gap-2 flex-wrap px-1 pt-1">
                <span className="text-[8px] text-orange-400/60 self-center">↓ Trước</span>
                {enemyUnits.filter(u => u.row === "front").map((u) => (
                  <UnitCard key={u.uid} unit={u} active={u.uid === activeUnit?.uid}
                    clickable={combat.awaitingPlayerInput && targetMode === "enemy" && !u.dead}
                    targetHighlight={targetMode === "enemy" ? "enemy" : undefined}
                    onClick={() => onUnitClick(u)}
                    floatNums={floatMap[u.uid]} />
                ))}
              </div>
            )}
            {/* Fallback if no row data */}
            {!enemyUnits.some(u => u.row === "back") && !enemyUnits.some(u => u.row === "front") && (
              <div className="flex gap-2 flex-wrap">
                {enemyUnits.map((u) => (
                  <UnitCard key={u.uid} unit={u} active={u.uid === activeUnit?.uid}
                    clickable={combat.awaitingPlayerInput && targetMode === "enemy" && !u.dead}
                    targetHighlight={targetMode === "enemy" ? "enemy" : undefined}
                    onClick={() => onUnitClick(u)}
                    floatNums={floatMap[u.uid]} />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            <span className="font-fantasy text-[9px] tracking-widest text-muted-foreground/50">VS</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          {/* Players — front row first (visually closer to enemy), back row behind */}
          <div className="space-y-1">
            <p className="text-[8px] uppercase tracking-widest text-primary/70 font-fantasy flex items-center gap-1">
              <Shield className="size-2.5" />Đồng minh ({playerUnits.filter(u => u.hp > 0).length}/{playerUnits.length})
            </p>
            {/* Player front row */}
            {playerUnits.some(u => u.row === "front") && (
              <div className="flex gap-2 flex-wrap px-1 pb-1 border-b border-orange-500/20">
                <span className="text-[8px] text-orange-400/60 self-center">↑ Trước</span>
                {playerUnits.filter(u => u.row === "front").map((u) => (
                  <UnitCard key={u.uid} unit={u} active={u.uid === activeUnit?.uid} isPlayer
                    clickable={combat.awaitingPlayerInput && targetMode === "ally" && !u.dead}
                    targetHighlight={targetMode === "ally" ? "ally" : undefined}
                    onClick={() => onUnitClick(u)}
                    floatNums={floatMap[u.uid]} />
                ))}
              </div>
            )}
            {/* Player back row */}
            {playerUnits.some(u => u.row === "back") && (
              <div className="flex gap-2 flex-wrap px-1 pt-1">
                <span className="text-[8px] text-blue-400/60 self-center">↓ Sau</span>
                {playerUnits.filter(u => u.row === "back").map((u) => (
                  <UnitCard key={u.uid} unit={u} active={u.uid === activeUnit?.uid} isPlayer
                    clickable={combat.awaitingPlayerInput && targetMode === "ally" && !u.dead}
                    targetHighlight={targetMode === "ally" ? "ally" : undefined}
                    onClick={() => onUnitClick(u)}
                    floatNums={floatMap[u.uid]} />
                ))}
              </div>
            )}
            {/* Fallback */}
            {!playerUnits.some(u => u.row === "front") && !playerUnits.some(u => u.row === "back") && (
              <div className="flex gap-2 flex-wrap">
                {playerUnits.map((u) => (
                  <UnitCard key={u.uid} unit={u} active={u.uid === activeUnit?.uid} isPlayer
                    clickable={combat.awaitingPlayerInput && targetMode === "ally" && !u.dead}
                    targetHighlight={targetMode === "ally" ? "ally" : undefined}
                    onClick={() => onUnitClick(u)}
                    floatNums={floatMap[u.uid]} />
                ))}
              </div>
            )}
          </div>

          <div className="flex-shrink-0">
            {combat.watchMode ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 flex items-center gap-3">
                <div className="size-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-fantasy text-[11px] text-emerald-300 font-bold tracking-wide">
                    👁 Chế độ xem — AI đang điều khiển đội của bạn
                  </p>
                  <p className="text-[9px] text-emerald-500/80 mt-0.5">
                    Vòng {combat.round} · Lượt {combat.turn} · Đang quan sát trận đấu...
                  </p>
                </div>
              </div>
            ) : (
              <ActionPanel
                activeUnit={activeUnit}
                selectedSkill={selectedSkill}
                setSelectedSkill={setSelectedSkill}
                selectedPotionUid={selectedPotionUid}
                setSelectedPotionUid={setSelectedPotionUid}
                fireAOEorSelf={fireAOEorSelf}
                awaiting={combat.awaitingPlayerInput}
                onSkipTurn={combatSkipTurn}
              />
            )}
          </div>
        </div>

        {/* Side panel: Log + Stats, collapsible */}
        <SidePanel
          combat={combat}
          logRef={logRef}
          dmgMap={dmgMap}
          isOpen={sidePanelOpen}
          onToggle={() => setSidePanelOpen(v => !v)}
        />
      </div>
    </div>
  )
}
