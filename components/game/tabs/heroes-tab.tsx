"use client"

import { useState } from "react"
import { useGame, computeHeroStats, RARITY_LABEL } from "@/lib/game/store"
import { xpToNextLevel } from "@/lib/game/combat"
import { HEROES_BY_ID } from "@/lib/game/heroes"
import { ITEMS_BY_ID } from "@/lib/game/items"
import { ORIGIN_LABEL, ROLE_LABEL } from "@/lib/game/factions"
import { PASSIVES, SKILLS, SKILL_EVOLUTION_MAP, SKILL_LEVEL_REQUIREMENTS, checkSkillUnlockCondition, getUnlockConditionText } from "@/lib/game/skills"
import {
  RARITY_BG_CLASS,
  RARITY_GLOW,
  RARITY_TEXT_CLASS,
  RARITY_ORDER,
} from "@/lib/game/rarity"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { HeroCard } from "@/components/game/hero-card"
import { cn } from "@/lib/utils"
import {
  Sparkles,
  Trash2,
  Plus,
  ArrowUpCircle,
  Shield as ShieldIcon,
  Sword as SwordIcon,
  Gem as GemIcon,
  Zap,
} from "lucide-react"
import type { EquipSlot, Rarity } from "@/lib/game/types"
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

// ── Auto-Sell Panel ─────────────────────────────────────────────────────────
function AutoSellPanel() {
  const { state, setAutoSellRarities } = useGame()
  const current = new Set(state.autoSellRarities as Rarity[])

  // Only allow auto-sell of common/rare (never epic+ to avoid accidents)
  const SELLABLE: Rarity[] = ["common", "rare", "epic"]

  const toggle = (rarity: Rarity) => {
    const next = new Set(current)
    next.has(rarity) ? next.delete(rarity) : next.add(rarity)
    setAutoSellRarities([...next] as Rarity[])
  }

  const RARITY_COLOR: Record<string, string> = {
    common:    "border-gray-400 text-gray-300",
    rare:      "border-blue-400 text-blue-300",
    epic:      "border-purple-400 text-purple-300",
  }
  const RARITY_ACTIVE: Record<string, string> = {
    common:    "bg-gray-500/30 border-gray-300",
    rare:      "bg-blue-500/30 border-blue-300",
    epic:      "bg-purple-500/30 border-purple-300",
  }
  const RARITY_LABEL_VI: Record<string, string> = {
    common: "Thường", rare: "Hiếm", epic: "Sử Thi",
  }

  return (
    <Card className="ornate-border border-orange-500/40">
      <CardHeader className="pb-2">
        <CardTitle className="font-fantasy text-base flex items-center gap-2">
          <Zap className="size-4 text-orange-400" />
          Bán Tướng Nhanh
          {current.size > 0 && (
            <span className="ml-auto text-xs font-normal text-orange-300 bg-orange-500/20 border border-orange-500/40 rounded px-2 py-0.5">
              Đang bật · {current.size} bậc
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Tướng có bậc hiếm được chọn sẽ <span className="text-orange-300 font-semibold">tự động bán ngay</span> khi roll — nhận vàng tương đương hi sinh. Không áp dụng cho Legendary trở lên.
        </p>
        <div className="flex flex-wrap gap-2">
          {SELLABLE.map((rarity) => {
            const active = current.has(rarity)
            return (
              <button
                key={rarity}
                onClick={() => toggle(rarity)}
                className={cn(
                  "px-3 py-1.5 rounded-lg border-2 text-sm font-fantasy font-bold transition-all",
                  active ? RARITY_ACTIVE[rarity] : "bg-card/50 opacity-60",
                  RARITY_COLOR[rarity],
                )}
              >
                {active ? "✓ " : ""}{RARITY_LABEL_VI[rarity]}
              </button>
            )
          })}
        </div>
        {current.size > 0 && (
          <p className="text-[11px] text-orange-300/80">
            ⚠ Đang tự bán: {[...current].map(r => RARITY_LABEL_VI[r]).join(", ")}. Nhấn lại để tắt.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
// ────────────────────────────────────────────────────────────────────────────

export function HeroesTab() {
  const { state } = useGame()
  const [selectedUid, setSelectedUid] = useState<string | null>(
    state.heroes[0]?.uid || null,
  )
  const selected =
    state.heroes.find((h) => h.uid === selectedUid) ||
    state.heroes[0] ||
    null

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-1 space-y-3">
        <AutoSellPanel />
        <Card className="ornate-border">
          <CardHeader>
            <CardTitle className="font-fantasy text-base">
              Anh hùng ({state.heroes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 max-h-[600px] overflow-y-auto pr-1">
              {state.heroes.map((h) => (
                <HeroCard
                  key={h.uid}
                  hero={h}
                  compact
                  showStats={false}
                  selected={h.uid === selected?.uid}
                  onClick={() => setSelectedUid(h.uid)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-3">
        {selected ? (
          <HeroDetail uid={selected.uid} />
        ) : (
          <Card className="ornate-border">
            <CardContent className="py-12 text-center text-muted-foreground">
              Chưa có anh hùng. Hãy đến Triệu hồi.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function HeroDetail({ uid }: { uid: string }) {
  const { state, dispatch, equipBest } = useGame()
  const owned = state.heroes.find((h) => h.uid === uid)
  if (!owned) return null
  const tpl = HEROES_BY_ID[owned.templateId]
  const stats = computeHeroStats(owned, tpl)
  const passive = PASSIVES[tpl.passive]
  const xpNeed = xpToNextLevel(owned.level)
  const xpPct = Math.min(100, (owned.xp / xpNeed) * 100)

  return (
    <>
      <Card
        className={cn(
          "ornate-border",
          RARITY_GLOW[tpl.rarity],
        )}
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3
                className={cn(
                  "font-fantasy text-2xl font-bold",
                  RARITY_TEXT_CLASS[tpl.rarity],
                )}
              >
                {tpl.name}
              </h3>
              <p className="text-sm text-muted-foreground italic">
                {tpl.title}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                {RARITY_LABEL[tpl.rarity]} · Lv.{owned.level}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
                {ROLE_LABEL[tpl.role]}
              </span>
              {tpl.origins.map((o) => (
                <span
                  key={o}
                  className="text-[10px] px-2 py-0.5 rounded bg-secondary/60 text-secondary-foreground border border-border"
                >
                  {ORIGIN_LABEL[o]}
                </span>
              ))}
              <span className="text-[10px] px-2 py-0.5 rounded bg-accent/30 text-accent-foreground border border-accent/40">
                {tpl.range === "melee" ? "Cận Chiến" : "Tầm Xa"}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 italic leading-relaxed">
            "{tpl.flavor}"
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span>Kinh nghiệm</span>
              <span className="font-mono">
                {owned.xp} / {xpNeed}
              </span>
            </div>
            <Progress value={xpPct} className="h-2" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
            {(
              [
                ["HP", stats.hp],
                ["ATK", stats.atk],
                ["MAG", stats.mag],
                ["DEF", stats.def],
                ["RES", stats.res],
                ["SPD", stats.spd],
                ["CRIT", `${stats.crit}%`],
                ["CR.DMG", `${stats.critDmg}%`],
                ["LIFE", `${stats.lifesteal}%`],
              ] as const
            ).map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between rounded border border-border bg-background/50 px-2 py-1"
              >
                <span className="text-muted-foreground">{k}</span>
                <span className="font-mono">{v}</span>
              </div>
            ))}
          </div>

          {/* Passive */}
          {passive && (
            <div className="rounded-lg border border-rarity-legendary/40 bg-rarity-legendary/10 p-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-rarity-legendary" />
                <span className="font-fantasy font-bold text-sm text-rarity-legendary">
                  Nội tại — {passive.name}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {passive.description}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => equipBest(uid)}>
              <ArrowUpCircle className="size-4 mr-1" />
              Trang bị tốt nhất
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                dispatch({ type: "ADD_GOLD", amount: -100 })
                dispatch({ type: "ADD_HERO_XP", uid, amount: 200 })
              }}
              disabled={state.gold < 100}
              title="Mất 100 vàng để huấn luyện"
            >
              <Plus className="size-4 mr-1" />
              Huấn luyện (+200 XP, -100 vàng)
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  <Trash2 className="size-4 mr-1" />
                  Hi sinh
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-fantasy">
                    Hi sinh {tpl.name}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Anh hùng sẽ biến mất vĩnh viễn — đổi lại ngươi nhận được
                    vàng và đá quý theo độ hiếm.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      dispatch({ type: "SACRIFICE_HERO", uid })
                    }
                  >
                    Hi sinh
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <Card className="ornate-border">
        <CardHeader>
          <CardTitle className="font-fantasy text-base">Kỹ năng & Trang Bị Loadout</CardTitle>
        </CardHeader>
        <CardContent>
          <SkillLoadoutEditor uid={uid} owned={owned} tpl={tpl} />
        </CardContent>
      </Card>

      {/* Equipment */}
      <Card className="ornate-border">
        <CardHeader>
          <CardTitle className="font-fantasy text-base">Trang bị</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-3">
          {(["weapon", "armor", "trinket"] as EquipSlot[]).map((slot) => (
            <EquipSlotPicker key={slot} heroUid={uid} slot={slot} />
          ))}
        </CardContent>
      </Card>
    </>
  )
}

function EquipSlotPicker({
  heroUid,
  slot,
}: {
  heroUid: string
  slot: EquipSlot
}) {
  const { state, dispatch } = useGame()
  const owned = state.heroes.find((h) => h.uid === heroUid)
  const equippedId = owned?.equipment[slot]
  const equipped = equippedId ? ITEMS_BY_ID[equippedId] : null
  const equippedInvEntry = equippedId ? state.inventory.find(i => i.itemId === equippedId && i.innate) : null
  const candidates = state.inventory
    .map((i) => ({ inv: i, item: ITEMS_BY_ID[i.itemId] }))
    .filter(
      (x) =>
        x.item &&
        x.item.kind === "equip" &&
        x.item.slot === slot,
    )

  const SLOT_ICON =
    slot === "weapon"
      ? SwordIcon
      : slot === "armor"
      ? ShieldIcon
      : GemIcon
  const SLOT_LABEL =
    slot === "weapon"
      ? "Vũ Khí"
      : slot === "armor"
      ? "Giáp"
      : "Trang Sức"

  return (
    <div className="rounded-lg border border-border bg-card/60 p-2">
      <div className="flex items-center gap-2">
        <SLOT_ICON className="size-4 text-primary" />
        <span className="font-fantasy text-xs uppercase tracking-wider text-muted-foreground">
          {SLOT_LABEL}
        </span>
      </div>
      {equipped ? (
        <div
          className={cn(
            "mt-1 rounded border p-2",
            RARITY_BG_CLASS[equipped.rarity],
          )}
        >
          <p
            className={cn(
              "font-fantasy text-sm font-bold",
              RARITY_TEXT_CLASS[equipped.rarity],
            )}
          >
            {equipped.name}
          </p>
          {equippedInvEntry?.innate && (
            <p className="text-[10px] text-rarity-legendary">⚡ +{equippedInvEntry.innate.value} {equippedInvEntry.innate.label}</p>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="mt-1 h-6 px-2 text-[10px]"
            onClick={() =>
              dispatch({
                type: "EQUIP_ITEM",
                heroUid,
                slot,
                itemId: null,
              })
            }
          >
            Tháo
          </Button>
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground italic mt-1">
          Trống
        </p>
      )}
      {candidates.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-[11px] text-primary/80 hover:text-primary">
            Đổi trang bị ({candidates.length})
          </summary>
          <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
            {candidates.map(({ inv, item }) => (
              <button
                key={inv.uid}
                type="button"
                className={cn(
                  "w-full text-left rounded border p-1.5 text-[11px]",
                  RARITY_BG_CLASS[item.rarity],
                  "hover:border-primary",
                )}
                onClick={() =>
                  dispatch({
                    type: "EQUIP_ITEM",
                    heroUid,
                    slot,
                    itemId: item.id,
                  })
                }
              >
                <span
                  className={cn(
                    "font-fantasy font-bold",
                    RARITY_TEXT_CLASS[item.rarity],
                  )}
                >
                  {item.name}
                </span>
                <span className="text-muted-foreground"> ×{inv.quantity}</span>
                {inv.innate && (
                  <span className="ml-1 text-rarity-legendary text-[9px]">⚡+{inv.innate.value} {inv.innate.label}</span>
                )}
              </button>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

// ============================================================
// Skill Loadout Editor
// ============================================================

function SkillLoadoutEditor({
  uid,
  owned,
  tpl,
}: {
  uid: string
  owned: import("@/lib/game/types").OwnedHero
  tpl: import("@/lib/game/types").HeroTemplate
}) {
  const { state, dispatch } = useGame()
  const [swapSlot, setSwapSlot] = useState<0 | 1 | 2 | null>(null)

  const loadout: [string, string, string] = owned.equippedSkillIds ?? [...tpl.skills] as [string, string, string]

  const allUnlocked = owned.unlockedSkills ?? []
  const bonusUnlocked = (tpl.bonusSkills ?? []).filter(bs =>
    allUnlocked.includes(bs.skillId) ||
    checkSkillUnlockCondition(bs.unlockCondition, owned, state.battlesWon)
  ).map(bs => bs.skillId)

  const ultimateSkillIds = [...tpl.skills, ...bonusUnlocked].filter(sid => SKILLS[sid]?.ultimate)
  const regularSkillIds = [...tpl.skills, ...bonusUnlocked].filter(sid => !SKILLS[sid]?.ultimate)
  const lockedBonusSkills = (tpl.bonusSkills ?? []).filter(bs => !bonusUnlocked.includes(bs.skillId))

  function getAvailableForSlot(slot: 0 | 1 | 2): string[] {
    if (slot === 2) return ultimateSkillIds
    const others = [loadout[0], loadout[1], loadout[2]].filter((_, i) => i !== slot)
    return regularSkillIds.filter(sid => !others.includes(sid))
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
          Loadout Chiến Đấu (3 kỹ năng)
        </p>
        <div className="grid sm:grid-cols-3 gap-2">
          {([0, 1, 2] as const).map(i => {
            const sid = loadout[i]
            const isBonus = !tpl.skills.includes(sid as any)
            const lvl = isBonus ? ((owned.bonusSkillLevels ?? {})[sid] ?? 1) : owned.skillLevels[i]
            const evoId = SKILL_EVOLUTION_MAP[sid]
            const isEvolved = lvl >= 5 && !!evoId
            const displaySid = isEvolved ? evoId : sid
            const skill = SKILLS[displaySid]
            const reqs = SKILL_LEVEL_REQUIREMENTS[i] || [1, 5, 10, 20, 35]
            const nextReq = lvl < 5 ? reqs[lvl] : null
            const canUpgrade = lvl < 5 && owned.level >= (nextReq ?? 999)
            const isSwapping = swapSlot === i
            const available = getAvailableForSlot(i)

            return (
              <div
                key={i}
                className={cn(
                  "rounded-lg border-2 p-3 bg-card/70 transition-all",
                  isSwapping ? "border-primary ring-2 ring-primary/30" :
                  i === 2 ? "border-rarity-legendary/60 bg-rarity-legendary/10" :
                  isEvolved ? "border-rarity-mythic/60 bg-rarity-mythic/10" :
                  isBonus ? "border-rarity-epic/60 bg-rarity-epic/5" :
                  "border-border",
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    "font-fantasy font-bold text-sm",
                    i === 2 ? "text-rarity-legendary" : isEvolved ? "text-rarity-mythic" : isBonus ? "text-rarity-epic" : "",
                  )}>
                    {skill?.name ?? sid}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                    {i === 2 ? "Ultimate" : `Slot ${i + 1}`}
                  </span>
                </div>
                {isBonus && (
                  <span className="text-[9px] text-rarity-epic uppercase tracking-wider block mb-1">⚡ Bonus</span>
                )}
                {isEvolved && (
                  <span className="text-[9px] text-rarity-mythic uppercase tracking-wider block mb-1">✦ Tiến Hóa</span>
                )}
                <p className="text-[10px] text-muted-foreground leading-snug mb-2">
                  {skill?.description}
                </p>
                <div className="text-[10px] text-muted-foreground mb-2">
                  CD: {skill?.cooldown ?? "?"} lượt · Cấp {lvl}/5
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {lvl < 5 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-[10px]"
                      disabled={!canUpgrade}
                      title={nextReq && owned.level < nextReq ? `Cần Lv.${nextReq}` : "Nâng cấp"}
                      onClick={() => dispatch({ type: "ADD_SKILL_POINT_HERO", uid, index: i })}
                    >
                      <Plus className="size-3" />
                      {nextReq && owned.level < nextReq ? `Lv.${nextReq}` : "UP"}
                    </Button>
                  )}
                  {available.length > 1 && (
                    <Button
                      size="sm"
                      variant={isSwapping ? "default" : "outline"}
                      className="h-6 px-2 text-[10px]"
                      onClick={() => setSwapSlot(isSwapping ? null : i)}
                    >
                      ⇄ Đổi
                    </Button>
                  )}
                  {lvl >= 5 && !isEvolved && evoId && (
                    <span className="text-[9px] text-rarity-epic">⚡→{SKILLS[evoId]?.name}</span>
                  )}
                  {lvl >= 5 && !evoId && (
                    <span className="text-[9px] text-yellow-400">✦ MAX</span>
                  )}
                </div>

                {isSwapping && (
                  <div className="mt-2 space-y-1 border-t border-border pt-2">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Chọn kỹ năng thay thế:</p>
                    {available.map(altSid => {
                      const altSkill = SKILLS[altSid]
                      if (!altSkill) return null
                      const isCurrent = altSid === sid
                      return (
                        <button
                          key={altSid}
                          type="button"
                          className={cn(
                            "w-full text-left rounded border p-1.5 text-[10px] transition-colors",
                            isCurrent
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/60 bg-background/60",
                          )}
                          onClick={() => {
                            if (!isCurrent) {
                              dispatch({ type: "EQUIP_HERO_SKILL", uid, slot: i, skillId: altSid })
                            }
                            setSwapSlot(null)
                          }}
                        >
                          <span className="font-fantasy font-bold">{altSkill.name}</span>
                          {isCurrent && <span className="ml-1 text-[8px] opacity-70">(đang dùng)</span>}
                          <span className="block text-muted-foreground text-[9px]">{altSkill.description.slice(0, 55)}…</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {lockedBonusSkills.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
            🔒 Kỹ Năng Chưa Mở Khóa
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {lockedBonusSkills.map(bs => {
              const skill = SKILLS[bs.skillId]
              if (!skill) return null
              return (
                <div key={bs.skillId} className="rounded-lg border border-dashed border-muted-foreground/40 p-2 bg-muted/10 opacity-70">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-[10px]">🔒</span>
                    <span className="font-fantasy font-bold text-[11px] text-muted-foreground">{skill.name}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/70 mb-1">{skill.description.slice(0, 70)}…</p>
                  <p className="text-[9px] text-primary/70 uppercase tracking-wider">
                    Điều kiện: {getUnlockConditionText(bs.unlockCondition)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
