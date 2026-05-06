"use client"

import { cn } from "@/lib/utils"
import { HEROES_BY_ID } from "@/lib/game/heroes"
import { ORIGIN_LABEL, ROLE_LABEL } from "@/lib/game/factions"
import {
  RARITY_BG_CLASS,
  RARITY_GLOW,
  RARITY_LABEL,
  RARITY_TEXT_CLASS,
} from "@/lib/game/rarity"
import { computeHeroStats } from "@/lib/game/store"
import type { OwnedHero } from "@/lib/game/types"
import { Sword, Shield, Sparkles, Zap, Crosshair, Heart } from "lucide-react"
import { useAvatar } from "@/hooks/use-avatar"

const ROLE_ICON = {
  warrior: Sword,
  assassin: Zap,
  mage: Sparkles,
  marksman: Crosshair,
  tank: Shield,
  support: Heart,
}

export function HeroCard({
  hero,
  onClick,
  selected,
  compact = false,
  showStats = true,
  badge,
}: {
  hero: OwnedHero
  onClick?: () => void
  selected?: boolean
  compact?: boolean
  showStats?: boolean
  badge?: React.ReactNode
}) {
  const tpl = HEROES_BY_ID[hero.templateId]
  if (!tpl) return null
  const stats = computeHeroStats(hero, tpl)
  const Icon = ROLE_ICON[tpl.role] || Sword

  const avatarSrc = useAvatar({
    templateId: hero.templateId,
    name: tpl.name,
    role: tpl.role,
    rarity: tpl.rarity,
    origins: tpl.origins,
    isEnemy: false,
    flavor: tpl.flavor,
  })

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group text-left relative rounded-lg border-2 bg-card/80 backdrop-blur-sm p-3 transition-all",
        "hover:scale-[1.02] hover:border-primary/70",
        RARITY_BG_CLASS[tpl.rarity],
        RARITY_GLOW[tpl.rarity],
        selected && "ring-2 ring-primary scale-[1.02]",
        compact && "p-2",
      )}
    >
      {badge && <div className="absolute -top-2 -right-2 z-10">{badge}</div>}
      <div className="flex items-start gap-2">
        <div
          className={cn(
            "shrink-0 size-12 rounded-md grid place-items-center bg-background/60 border overflow-hidden",
            RARITY_BG_CLASS[tpl.rarity],
          )}
        >
          {avatarSrc ? (
            <img src={avatarSrc} alt={tpl.name} className="size-full object-cover" />
          ) : (
            <Icon className={cn("size-6", RARITY_TEXT_CLASS[tpl.rarity])} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4
              className={cn(
                "font-fantasy font-bold text-sm leading-tight truncate",
                RARITY_TEXT_CLASS[tpl.rarity],
              )}
            >
              {tpl.name}
            </h4>
          </div>
          <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider">
            {RARITY_LABEL[tpl.rarity]} · Lv.{hero.level}
          </p>
          {!compact && (
            <p className="text-[11px] text-muted-foreground/80 italic truncate">
              {tpl.title}
            </p>
          )}
        </div>
      </div>

      {!compact && (
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
            {ROLE_LABEL[tpl.role]}
          </span>
          {tpl.origins.map((o) => (
            <span
              key={o}
              className="text-[9px] px-1.5 py-0.5 rounded bg-secondary/60 text-secondary-foreground border border-border"
            >
              {ORIGIN_LABEL[o]}
            </span>
          ))}
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/30 text-accent-foreground border border-accent/40">
            {tpl.range === "melee" ? "Cận Chiến" : "Tầm Xa"}
          </span>
        </div>
      )}

      {showStats && !compact && (
        <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
          <Stat label="HP" value={stats.hp} />
          <Stat label="ATK" value={stats.atk} />
          <Stat label="MAG" value={stats.mag} />
          <Stat label="DEF" value={stats.def} />
          <Stat label="SPD" value={stats.spd} />
          <Stat label="CRIT" value={`${stats.crit}%`} />
        </div>
      )}
    </button>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between gap-1 px-1.5 py-0.5 rounded bg-background/50 border border-border/50">
      <span className="text-[9px] text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground">{value}</span>
    </div>
  )
}
