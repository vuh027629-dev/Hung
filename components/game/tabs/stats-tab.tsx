"use client"

import { useGame } from "@/lib/game/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BRANCH_LABEL,
  SKILL_TREE,
  canLearnNode,
  type SkillTreeNode,
} from "@/lib/game/skill-tree"
import { cn } from "@/lib/utils"
import { Sparkles, Plus, Brain, Sword, Shield, Heart, RotateCcw } from "lucide-react"

const BRANCH_ICON = {
  warrior: Sword,
  arcane: Brain,
  shadow: Sparkles,
  guardian: Shield,
}

export function StatsTab() {
  const { state, dispatch, resetPlayerStats } = useGame()
  const ps = state.playerStats

  const STATS: {
    key: keyof typeof ps
    label: string
    color: string
    perPoint: number
    icon: React.ReactNode
  }[] = [
    {
      key: "attackBonus",
      label: "Sức Mạnh (ATK)",
      color: "text-rarity-mythic",
      perPoint: 4,
      icon: <Sword className="size-4" />,
    },
    {
      key: "magicBonus",
      label: "Trí Tuệ (MAG)",
      color: "text-rarity-rare",
      perPoint: 5,
      icon: <Brain className="size-4" />,
    },
    {
      key: "defenseBonus",
      label: "Phòng Thủ (DEF)",
      color: "text-rarity-legendary",
      perPoint: 4,
      icon: <Shield className="size-4" />,
    },
    {
      key: "hpBonus",
      label: "Sinh Lực (HP)",
      color: "text-destructive",
      perPoint: 30,
      icon: <Heart className="size-4" />,
    },
    {
      key: "speedBonus",
      label: "Nhanh Nhẹn (SPD)",
      color: "text-rarity-celestial",
      perPoint: 2,
      icon: <Sparkles className="size-4" />,
    },
    {
      key: "critBonus",
      label: "Chí Mạng (CRIT)",
      color: "text-rarity-epic",
      perPoint: 1,
      icon: <Sparkles className="size-4" />,
    },
  ]

  // Group skill tree by branch
  const grouped: Record<string, SkillTreeNode[]> = {}
  for (const n of SKILL_TREE) {
    grouped[n.branch] = grouped[n.branch] || []
    grouped[n.branch].push(n)
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card className="ornate-border lg:col-span-1">
        <CardHeader>
          <CardTitle className="font-fantasy flex items-center justify-between">
            <span>Chỉ Số Người Chơi</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Điểm chỉ số
            </p>
            <p className="font-fantasy text-2xl font-bold text-primary">
              {state.statPoints}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Lên cấp +3 điểm chỉ số / +1 điểm kĩ năng
            </p>
          </div>
          {/* Reset stat points button */}
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">Reset Chỉ Số</p>
            <p className="text-[10px] text-muted-foreground">Hoàn lại toàn bộ điểm chỉ số đã phân bổ.</p>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="text-yellow-400 font-bold">10,000🪙</span>
              <span>+</span>
              <span className="text-blue-400 font-bold">1,000💎</span>
              <span>/ lần reset</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:border-amber-400"
              disabled={state.gold < 10000 || state.gems < 1000}
              onClick={resetPlayerStats}
            >
              <RotateCcw className="size-3.5 mr-1.5" />
              Reset Điểm Chỉ Số
            </Button>
            {(state.gold < 10000 || state.gems < 1000) && (
              <p className="text-[10px] text-red-400/70">
                {state.gold < 10000 ? `Thiếu ${(10000 - state.gold).toLocaleString()}🪙` : ""}
                {state.gold < 10000 && state.gems < 1000 ? " · " : ""}
                {state.gems < 1000 ? `Thiếu ${(1000 - state.gems).toLocaleString()}💎` : ""}
              </p>
            )}
          </div>
          {STATS.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between rounded border border-border bg-card/60 p-2"
            >
              <div className="flex items-center gap-2">
                <span className={s.color}>{s.icon}</span>
                <div>
                  <p className="text-xs">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground">
                    +{s.perPoint}/điểm · Hiện: +{ps[s.key]}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={state.statPoints <= 0}
                onClick={() => dispatch({ type: "INC_STAT", key: s.key })}
              >
                <Plus className="size-3.5" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="ornate-border lg:col-span-2">
        <CardHeader>
          <CardTitle className="font-fantasy flex items-center justify-between">
            <span>Cây Kỹ Năng</span>
            <span className="text-xs text-muted-foreground font-normal">
              Điểm kỹ năng:{" "}
              <span className="font-bold text-primary">
                {state.skillPoints}
              </span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(grouped).map(([branch, nodes]) => {
            const Icon = BRANCH_ICON[branch as keyof typeof BRANCH_ICON]
            return (
              <div key={branch}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="size-4 text-primary" />
                  <h5 className="font-fantasy font-bold text-sm uppercase tracking-wider">
                    {BRANCH_LABEL[branch as keyof typeof BRANCH_LABEL]}
                  </h5>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {nodes
                    .sort((a, b) => a.tier - b.tier)
                    .map((n) => {
                      const rank = state.skillTree.nodes[n.id] || 0
                      const canLearn =
                        canLearnNode(n, state.skillTree.nodes) &&
                        rank < n.maxRank &&
                        state.skillPoints >= n.cost
                      return (
                        <div
                          key={n.id}
                          className={cn(
                            "rounded-lg border-2 p-2 text-xs transition-colors",
                            rank > 0
                              ? "border-primary/60 bg-primary/10"
                              : canLearn
                              ? "border-border bg-card/60 hover:border-primary/50"
                              : "border-border/40 bg-card/30 opacity-60",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-fantasy font-bold">
                              {n.name}
                            </span>
                            <span className="text-[10px] uppercase text-muted-foreground">
                              T{n.tier}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-3 h-12">
                            {n.description}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[10px]">
                              {rank}/{n.maxRank} · {n.cost} pt
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-[10px]"
                              disabled={!canLearn}
                              onClick={() =>
                                dispatch({ type: "LEARN_NODE", nodeId: n.id })
                              }
                            >
                              <Plus className="size-3" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
