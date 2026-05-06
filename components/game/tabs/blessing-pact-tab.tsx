"use client"

import { useState, useMemo } from "react"
import { useGame, BLESSINGS, PACTS, ALL_BLESSINGS_BY_ID } from "@/lib/game/store"
import { HEROES_BY_ID } from "@/lib/game/heroes"
import type { BlessingPact } from "@/lib/game/blessings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Sparkles, Gem, Coins, Star, Zap, Shield, Skull,
  ChevronDown, ChevronUp, Users, Flame, Crown, Info,
  Feather, Swords,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ──────────────────────────────────────────────
// Tier config
// ──────────────────────────────────────────────
const TIER_LABEL = { 1: "Cơ Bản", 2: "Nâng Cao", 3: "Đỉnh Cao" } as const
const TIER_COLOR = {
  1: "text-blue-400 border-blue-500/40 bg-blue-500/10",
  2: "text-purple-400 border-purple-500/40 bg-purple-500/10",
  3: "text-rarity-legendary border-rarity-legendary/50 bg-rarity-legendary/10",
} as const

// ──────────────────────────────────────────────
// Shard display
// ──────────────────────────────────────────────
function ShardIcon({ kind }: { kind: "blessing" | "pact" }) {
  return kind === "blessing"
    ? <Feather className="size-4 text-sky-300" />
    : <Skull className="size-4 text-red-400" />
}

// ──────────────────────────────────────────────
// Roll panel (top section)
// ──────────────────────────────────────────────
function RollPanel() {
  const { state, rollShardsWithGems, rollShardsWithGold } = useGame()
  const [lastResult, setLastResult] = useState<{ blessingShards: number; pactShards: number } | null>(null)

  function handleRollGems() {
    const before = { b: state.blessingShards, p: state.pactShards }
    rollShardsWithGems()
    // Show result after dispatch (approximate)
    setTimeout(() => {
      setLastResult({
        blessingShards: (state.blessingShards ?? 0) - before.b,
        pactShards: (state.pactShards ?? 0) - before.p,
      })
    }, 50)
  }

  function handleRollGold() {
    rollShardsWithGold()
  }

  return (
    <Card className="ornate-border">
      <CardHeader className="pb-3">
        <CardTitle className="font-fantasy flex items-center gap-2">
          <Sparkles className="size-5 text-sky-300" />
          Lễ Cầu Phúc
          {state.luckBuff && (
            <span className="ml-auto text-xs font-normal text-yellow-300 flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/40 rounded px-2 py-0.5">
              ✨ May Mắn +{[0,25,50,75][state.luckBuff.tier]}% · còn {state.luckBuff.rollsLeft} lần
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Tiêu hao tài nguyên để nhận <span className="text-sky-300 font-semibold">Mảnh Thiên Thần</span> và <span className="text-red-400 font-semibold">Mảnh Ác Quỷ</span> — dùng để trang bị nội tại đặc biệt cho tướng.
        </p>

        {/* Current shards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-3 flex items-center gap-3">
            <Feather className="size-5 text-sky-300 shrink-0" />
            <div>
              <div className="text-xl font-bold text-sky-300">{state.blessingShards ?? 0}</div>
              <div className="text-[11px] text-muted-foreground">Mảnh Thiên Thần</div>
            </div>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-3">
            <Skull className="size-5 text-red-400 shrink-0" />
            <div>
              <div className="text-xl font-bold text-red-400">{state.pactShards ?? 0}</div>
              <div className="text-[11px] text-muted-foreground">Mảnh Ác Quỷ</div>
            </div>
          </div>
        </div>

        {/* Roll buttons */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-card/60 p-3 space-y-2">
            <div className="text-xs font-semibold text-center">Lễ Thiên Đường</div>
            <div className="text-[11px] text-muted-foreground text-center">2–8 mảnh ngẫu nhiên</div>
            <div className="text-[11px] text-center text-sky-300">60% Thiên Thần · 40% Ác Quỷ</div>
            <Button
              size="sm"
              className="w-full bg-gradient-to-r from-sky-600 to-blue-500 hover:from-sky-500 hover:to-blue-400 text-white text-xs h-8 gap-1"
              onClick={rollShardsWithGems}
              disabled={state.gems < 50}
            >
              <Gem className="size-3" />
              50 💎
            </Button>
          </div>
          <div className="rounded-xl border border-white/10 bg-card/60 p-3 space-y-2">
            <div className="text-xs font-semibold text-center">Lễ Địa Ngục</div>
            <div className="text-[11px] text-muted-foreground text-center">1–4 mảnh ngẫu nhiên</div>
            <div className="text-[11px] text-center text-orange-300">50% Thiên Thần · 50% Ác Quỷ</div>
            <Button
              size="sm"
              className="w-full bg-gradient-to-r from-orange-700 to-red-600 hover:from-orange-600 hover:to-red-500 text-white text-xs h-8 gap-1"
              onClick={rollShardsWithGold}
              disabled={state.gold < 1000}
            >
              <Coins className="size-3" />
              1000 🪙
            </Button>
          </div>
        </div>

        {/* Drop rate table */}
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer hover:text-foreground transition-colors flex items-center gap-1">
            <Info className="size-3" /> Tỉ lệ nhận mảnh
          </summary>
          <div className="mt-2 pl-2 space-y-0.5 text-[11px]">
            <div>Lễ Thiên Đường: 2 (20%) · 3 (30%) · 4 (25%) · 5 (15%) · 6 (6%) · 7 (3%) · 8 (1%)</div>
            <div>Lễ Địa Ngục: 1 (50%) · 2 (30%) · 3 (15%) · 4 (5%)</div>
          </div>
        </details>
      </CardContent>
    </Card>
  )
}

// ──────────────────────────────────────────────
// Single blessing/pact card
// ──────────────────────────────────────────────
function BlessingCard({
  bp,
  selectedHeroUid,
}: {
  bp: BlessingPact
  selectedHeroUid: string | null
}) {
  const { state, equipBlessingPact } = useGame()
  const [expanded, setExpanded] = useState(false)

  const isBlessing = bp.kind === "blessing"
  const shardKey = isBlessing ? "blessingShards" : "pactShards"
  const currentShards = state[shardKey] ?? 0
  const canAfford = currentShards >= bp.shardCost

  // Check if already equipped on any team member
  const teamUids = state.team.filter(Boolean) as string[]
  const equippedOn = state.heroes.find(h => teamUids.includes(h.uid) && h.blessingPactId === bp.id)
  const selectedHero = selectedHeroUid ? state.heroes.find(h => h.uid === selectedHeroUid) : null
  const alreadyOnSelected = selectedHero?.blessingPactId === bp.id

  // Does selected hero have a conflicting same-type bp?
  const selectedHasBlessingPact = selectedHero?.blessingPactId !== undefined

  function handleEquip() {
    if (!selectedHeroUid) return
    equipBlessingPact(selectedHeroUid, bp.id)
  }

  const borderClass = isBlessing
    ? "border-sky-500/25 hover:border-sky-400/50"
    : "border-red-500/25 hover:border-red-400/50"

  const headerGradient = isBlessing
    ? "from-sky-500/15 to-blue-600/5"
    : "from-red-600/15 to-orange-900/5"

  return (
    <div className={cn(
      "rounded-xl border transition-all duration-200 overflow-hidden",
      borderClass,
      equippedOn && "ring-1 ring-inset",
      equippedOn && isBlessing ? "ring-sky-400/40" : equippedOn ? "ring-red-400/40" : "",
    )}>
      {/* Header */}
      <div className={cn("bg-gradient-to-r p-3", headerGradient)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ShardIcon kind={bp.kind} />
            <div className="min-w-0">
              <div className="font-semibold text-sm leading-tight">{bp.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4 border", TIER_COLOR[bp.tier])}>
                  {TIER_LABEL[bp.tier]}
                </Badge>
                <span className={cn("text-[10px]", isBlessing ? "text-sky-300" : "text-red-400")}>
                  {bp.kind === "blessing" ? "✦ Chúc Phúc" : "☠ Giao Kèo"}
                </span>
              </div>
            </div>
          </div>
          {/* Shard cost */}
          <div className={cn(
            "shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border",
            canAfford
              ? isBlessing ? "bg-sky-500/20 text-sky-300 border-sky-500/40" : "bg-red-500/20 text-red-400 border-red-500/40"
              : "bg-white/5 text-muted-foreground border-white/10"
          )}>
            <ShardIcon kind={bp.kind} />
            {bp.shardCost}
          </div>
        </div>

        {/* Description */}
        <p className="text-[12px] text-foreground/80 mt-2 leading-relaxed">{bp.description}</p>
        {bp.curseSuffix && (
          <p className="text-[11px] text-red-400 mt-1 italic">⚠ {bp.curseSuffix}</p>
        )}
      </div>

      {/* Lore + actions */}
      <div className="px-3 pb-3 pt-2 space-y-2">
        <button
          className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          onClick={() => setExpanded(v => !v)}
        >
          {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          Lore & Chi Tiết
        </button>
        {expanded && (
          <p className="text-[11px] text-muted-foreground italic leading-relaxed pl-1 border-l border-white/10">
            "{bp.lore}"
          </p>
        )}

        {/* Equipped on */}
        {equippedOn && (
          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Users className="size-3" />
            Đang trang bị cho: <span className="font-semibold text-foreground">
              {HEROES_BY_ID[equippedOn.templateId]?.name ?? "?"}
            </span>
          </div>
        )}

        {/* Equip button */}
        {selectedHeroUid && !alreadyOnSelected && (
          <Button
            size="sm"
            variant={canAfford ? "default" : "outline"}
            disabled={!canAfford || !!equippedOn}
            className={cn(
              "w-full text-xs h-7",
              canAfford && !equippedOn && isBlessing
                ? "bg-gradient-to-r from-sky-600 to-blue-500 hover:from-sky-500 hover:to-blue-400 text-white"
                : canAfford && !equippedOn
                ? "bg-gradient-to-r from-red-700 to-orange-600 hover:from-red-600 hover:to-orange-500 text-white"
                : ""
            )}
            onClick={handleEquip}
          >
            {equippedOn ? "Đã trang bị cho tướng khác" : !canAfford
              ? `Cần thêm ${bp.shardCost - currentShards} mảnh`
              : `Trang bị cho ${HEROES_BY_ID[selectedHero?.templateId ?? ""]?.name ?? "tướng"}`
            }
          </Button>
        )}
        {alreadyOnSelected && (
          <div className="text-[11px] text-green-400 text-center flex items-center justify-center gap-1">
            <Star className="size-3" /> Đang trang bị cho tướng này
          </div>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Hero selector
// ──────────────────────────────────────────────
function HeroSelector({
  selectedUid,
  onSelect,
}: {
  selectedUid: string | null
  onSelect: (uid: string) => void
}) {
  const { state, unequipBlessingPact } = useGame()
  const teamHeroes = state.team
    .map(uid => uid ? state.heroes.find(h => h.uid === uid) : null)
    .filter(Boolean)

  if (teamHeroes.length === 0) {
    return (
      <Card className="ornate-border">
        <CardContent className="py-6 text-center text-muted-foreground text-sm">
          <Users className="size-8 mx-auto mb-2 opacity-20" />
          Chưa có tướng trong đội hình
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="ornate-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-fantasy flex items-center gap-2">
          <Users className="size-4 text-primary" />
          Chọn Tướng Trang Bị
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {teamHeroes.map(hero => {
          if (!hero) return null
          const tpl = HEROES_BY_ID[hero.templateId]
          if (!tpl) return null
          const bp = hero.blessingPactId ? ALL_BLESSINGS_BY_ID[hero.blessingPactId] : null
          const isSelected = selectedUid === hero.uid

          return (
            <div
              key={hero.uid}
              className={cn(
                "relative rounded-lg border p-2 cursor-pointer transition-all text-center",
                isSelected
                  ? "border-primary bg-primary/15 shadow-[0_0_8px_rgba(var(--primary)/0.3)]"
                  : "border-white/10 bg-card/40 hover:border-white/25"
              )}
              onClick={() => onSelect(hero.uid)}
            >
              <div className="text-xs font-semibold truncate">{tpl.name}</div>
              <div className="text-[10px] text-muted-foreground">Cấp {hero.level}</div>
              {bp && (
                <div className="mt-1 flex items-center justify-center gap-0.5">
                  <ShardIcon kind={bp.kind} />
                  <span className="text-[10px] truncate max-w-[60px]">{bp.name}</span>
                </div>
              )}
              {bp && isSelected && (
                <button
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full text-[10px] w-4 h-4 flex items-center justify-center hover:bg-red-400"
                  onClick={e => { e.stopPropagation(); unequipBlessingPact(hero.uid) }}
                  title="Gỡ nội tại"
                >×</button>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// ──────────────────────────────────────────────
// Blessing list panel
// ──────────────────────────────────────────────
function BlessingListPanel({ selectedHeroUid }: { selectedHeroUid: string | null }) {
  const [tierFilter, setTierFilter] = useState<1 | 2 | 3 | null>(null)

  const filtered = BLESSINGS.filter(b => tierFilter === null || b.tier === tierFilter)

  return (
    <div className="space-y-3">
      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Bậc:</span>
        {([null, 1, 2, 3] as const).map(t => (
          <button
            key={String(t)}
            onClick={() => setTierFilter(t)}
            className={cn(
              "text-[11px] px-2 py-0.5 rounded-full border transition-colors",
              tierFilter === t
                ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                : "border-white/10 text-muted-foreground hover:border-white/25"
            )}
          >
            {t === null ? "Tất Cả" : TIER_LABEL[t]}
          </button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {filtered.map(bp => (
          <BlessingCard key={bp.id} bp={bp} selectedHeroUid={selectedHeroUid} />
        ))}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Pact list panel
// ──────────────────────────────────────────────
function PactListPanel({ selectedHeroUid }: { selectedHeroUid: string | null }) {
  const [tierFilter, setTierFilter] = useState<1 | 2 | 3 | null>(null)

  const filtered = PACTS.filter(p => tierFilter === null || p.tier === tierFilter)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Bậc:</span>
        {([null, 1, 2, 3] as const).map(t => (
          <button
            key={String(t)}
            onClick={() => setTierFilter(t)}
            className={cn(
              "text-[11px] px-2 py-0.5 rounded-full border transition-colors",
              tierFilter === t
                ? "bg-red-500/20 text-red-400 border-red-500/40"
                : "border-white/10 text-muted-foreground hover:border-white/25"
            )}
          >
            {t === null ? "Tất Cả" : TIER_LABEL[t]}
          </button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {filtered.map(bp => (
          <BlessingCard key={bp.id} bp={bp} selectedHeroUid={selectedHeroUid} />
        ))}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Main tab
// ──────────────────────────────────────────────
export function BlessingPactTab() {
  const { state } = useGame()
  const [selectedHeroUid, setSelectedHeroUid] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      {/* Roll panel */}
      <RollPanel />

      {/* Hero selector */}
      <HeroSelector selectedUid={selectedHeroUid} onSelect={setSelectedHeroUid} />

      {/* Tip */}
      {selectedHeroUid === null && (
        <div className="text-xs text-muted-foreground text-center py-1">
          ↑ Chọn một tướng phía trên để trang bị nội tại
        </div>
      )}

      {/* Tabs: Blessings / Pacts */}
      <Tabs defaultValue="blessings">
        <TabsList className="bg-card/60 ornate-border p-1">
          <TabsTrigger value="blessings" className="font-fantasy gap-1.5">
            <Feather className="size-3.5 text-sky-300" />
            Chúc Phúc Thiên Thần
            <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1 rounded-full">
              {BLESSINGS.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="pacts" className="font-fantasy gap-1.5">
            <Skull className="size-3.5 text-red-400" />
            Giao Kèo Ác Quỷ
            <span className="text-[10px] bg-red-500/20 text-red-400 px-1 rounded-full">
              {PACTS.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blessings" className="mt-4">
          {/* Info box */}
          <div className="mb-3 rounded-lg border border-sky-500/25 bg-sky-500/5 p-3 text-xs text-sky-200/80 leading-relaxed">
            <Feather className="size-3.5 inline mr-1" />
            <strong>Chúc Phúc Thiên Thần</strong> — Nội tại thuần lợi, tăng cường cơ chế chiến đấu của tướng theo những cách đặc biệt. Mỗi tướng chỉ được trang bị 1 nội tại, không được 2 tướng cùng 1 loại.
          </div>
          <BlessingListPanel selectedHeroUid={selectedHeroUid} />
        </TabsContent>

        <TabsContent value="pacts" className="mt-4">
          {/* Info box */}
          <div className="mb-3 rounded-lg border border-red-500/25 bg-red-500/5 p-3 text-xs text-red-200/80 leading-relaxed">
            <Skull className="size-3.5 inline mr-1" />
            <strong>Giao Kèo Ác Quỷ</strong> — Nội tại hai mặt: sức mạnh cực lớn đi kèm với bất lợi nghiêm trọng. Rủi ro cao, phần thưởng cao — dành cho những chiến lược gia táo bạo.
          </div>
          <PactListPanel selectedHeroUid={selectedHeroUid} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
