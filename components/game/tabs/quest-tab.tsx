"use client"

import { useMemo } from "react"
import { useGame } from "@/lib/game/store"
import {
  DIFFICULTY_LABEL, DIFFICULTY_BADGE,
  getObjectiveProgress,
  checkObjectiveCompletion,
} from "@/lib/game/quests"
import type { Quest } from "@/lib/game/quests"
import { RARITY_LABEL } from "@/lib/game/rarity"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Scroll,
  RefreshCw,
  CheckCircle2,
  CircleDashed,
  Coins,
  Gem,
  Sword,
  Trophy,
  Star,
  Package,
  Zap,
  Users,
  Shield,
  Target,
  TrendingUp,
  Flame,
  Crown,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ----------------------------------------------------------------
// Icon per objective type
// ----------------------------------------------------------------
function ObjectiveIcon({ type }: { type: string }) {
  const cls = "size-4 shrink-0"
  switch (type) {
    case "kill_total": return <Sword className={cn(cls, "text-red-400")} />
    case "kill_streak": return <Flame className={cn(cls, "text-orange-400")} />
    case "kill_monster_rarity": return <Star className={cn(cls, "text-yellow-400")} />
    case "reach_stage": return <TrendingUp className={cn(cls, "text-blue-400")} />
    case "win_no_deaths": return <Shield className={cn(cls, "text-green-400")} />
    case "own_hero_rarity": return <Crown className={cn(cls, "text-rarity-legendary")} />
    case "own_hero_role": return <Users className={cn(cls, "text-purple-400")} />
    case "own_hero_origin": return <Zap className={cn(cls, "text-cyan-400")} />
    case "collect_gold": return <Coins className={cn(cls, "text-yellow-400")} />
    case "level_hero": return <TrendingUp className={cn(cls, "text-green-400")} />
    case "win_consecutive": return <Target className={cn(cls, "text-red-400")} />
    case "recruit_total": return <Users className={cn(cls, "text-blue-400")} />
    default: return <CircleDashed className={cls} />
  }
}

// ----------------------------------------------------------------
// Reward display
// ----------------------------------------------------------------
function RewardBadges({ reward }: { reward: Quest["reward"] }) {
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {reward.gold ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
          <Coins className="size-3" />
          {reward.gold.toLocaleString()}🪙
        </span>
      ) : null}
      {reward.gems ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
          <Gem className="size-3" />
          {reward.gems}💎
        </span>
      ) : null}
      {reward.items?.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-violet-500/15 text-violet-400 border border-violet-500/30">
          <Package className="size-3" />
          ×{it.quantity} Thuốc
        </span>
      ))}
      {reward.heroRarity ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-rarity-legendary/15 text-rarity-legendary border border-rarity-legendary/40">
          <Crown className="size-3" />
          Tướng {RARITY_LABEL[reward.heroRarity]}+
        </span>
      ) : null}
    </div>
  )
}

// ----------------------------------------------------------------
// Progress bar
// ----------------------------------------------------------------
function ProgressBar({ pct, done }: { pct: number; done: boolean }) {
  return (
    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden mt-2">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          done
            ? "bg-gradient-to-r from-green-500 to-emerald-400"
            : "bg-gradient-to-r from-primary/80 to-primary"
        )}
        style={{ width: `${Math.round(pct * 100)}%` }}
      />
    </div>
  )
}

// ----------------------------------------------------------------
// Single quest card
// ----------------------------------------------------------------
function QuestCard({ quest }: { quest: Quest }) {
  const { state, dispatch } = useGame()
  const qs = state.questState
  const progress = getObjectiveProgress(quest.objective, state)
  const completed = qs ? checkObjectiveCompletion(quest.objective, state, qs) : false
  const claimed = quest.completed

  function handleClaim() {
    dispatch({ type: "CLAIM_QUEST", questId: quest.id })
  }

  return (
    <div
      className={cn(
        "relative rounded-xl border p-4 transition-all duration-200",
        claimed
          ? "bg-white/3 border-white/10 opacity-50"
          : completed
          ? "bg-green-500/8 border-green-500/30 shadow-[0_0_12px_rgba(34,197,94,0.12)]"
          : "bg-card/60 border-white/10 hover:border-white/20"
      )}
    >
      {/* Header row */}
      <div className="flex items-start gap-2 mb-1">
        <ObjectiveIcon type={quest.objective.type} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm leading-tight">{quest.title}</span>
            <Badge
              variant="outline"
              className={cn("text-[10px] px-1.5 py-0 h-4 border", DIFFICULTY_BADGE[quest.difficulty])}
            >
              {DIFFICULTY_LABEL[quest.difficulty]}
            </Badge>
          </div>
          {/* Description */}
          <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">
            {quest.description.replace(/\*\*(.*?)\*\*/g, "$1")}
          </p>
        </div>
        {/* Status icon */}
        <div className="shrink-0 ml-1">
          {claimed ? (
            <CheckCircle2 className="size-5 text-green-500" />
          ) : completed ? (
            <CheckCircle2 className="size-5 text-green-400 animate-pulse" />
          ) : (
            <CircleDashed className="size-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Progress */}
      {!claimed && (
        <>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-muted-foreground">{progress.label}</span>
            <span className="text-[11px] text-muted-foreground">{Math.round(progress.pct * 100)}%</span>
          </div>
          <ProgressBar pct={progress.pct} done={completed} />
        </>
      )}

      {/* Rewards */}
      <RewardBadges reward={quest.reward} />

      {/* Claim button */}
      {completed && !claimed && (
        <Button
          size="sm"
          className="mt-3 w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-semibold text-xs h-8"
          onClick={handleClaim}
        >
          <Trophy className="size-3.5 mr-1" />
          Nhận Thưởng!
        </Button>
      )}
    </div>
  )
}

// ----------------------------------------------------------------
// Main Quest Tab
// ----------------------------------------------------------------
export function QuestTab() {
  const { state, dispatch } = useGame()
  const qs = state.questState

  const activeQuests = qs?.active ?? []
  const completedCount = (qs?.completed ?? []).length
  const readyToClaim = activeQuests.filter(q => {
    if (q.completed || !qs) return false
    return checkObjectiveCompletion(q.objective, state, qs)
  }).length

  // Sort: claimable first, then by difficulty rank, then incomplete
  const DIFF_RANK = { legendary: 0, extreme: 1, hard: 2, normal: 3, easy: 4 }
  const sortedQuests = useMemo(() => {
    return [...activeQuests].sort((a, b) => {
      const aDone = qs ? checkObjectiveCompletion(a.objective, state, qs) : false
      const bDone = qs ? checkObjectiveCompletion(b.objective, state, qs) : false
      if (aDone && !bDone) return -1
      if (!aDone && bDone) return 1
      return DIFF_RANK[a.difficulty] - DIFF_RANK[b.difficulty]
    })
  }, [activeQuests, qs, state])

  function handleRefresh() {
    dispatch({ type: "REFRESH_QUESTS" })
  }

  return (
    <div className="space-y-4">
      {/* Header card */}
      <Card className="ornate-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="font-fantasy flex items-center gap-2">
              <Scroll className="size-5 text-primary" />
              Bảng Nhiệm Vụ
            </CardTitle>
            <div className="flex items-center gap-3">
              {readyToClaim > 0 && (
                <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-2 py-0.5 font-medium animate-pulse">
                  {readyToClaim} có thể nhận!
                </span>
              )}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Trophy className="size-3.5 text-rarity-legendary" />
                <span>{completedCount} hoàn thành</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Hoàn thành nhiệm vụ để nhận phần thưởng độc quyền. Nhiệm vụ khó hơn sẽ cho phần thưởng tốt hơn — thậm chí cả tướng hiếm!
          </p>
          <div className="flex items-center gap-3 pt-1">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Clock className="size-3.5" />
              <span>{activeQuests.length} nhiệm vụ đang hoạt động</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto text-xs h-7 gap-1.5"
              onClick={handleRefresh}
            >
              <RefreshCw className="size-3" />
              Làm Mới
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quest stats strip */}
      {qs && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card/50 rounded-lg border border-white/8 p-3 text-center">
            <div className="text-lg font-bold text-orange-400">{qs.killStreak}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Chuỗi Diệt</div>
          </div>
          <div className="bg-card/50 rounded-lg border border-white/8 p-3 text-center">
            <div className="text-lg font-bold text-green-400">{qs.consecutiveWins}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Liên Thắng</div>
          </div>
          <div className="bg-card/50 rounded-lg border border-white/8 p-3 text-center">
            <div className="text-lg font-bold text-blue-400">{qs.noDeathStreak}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Vô Thương</div>
          </div>
        </div>
      )}

      {/* Quest list */}
      {activeQuests.length === 0 ? (
        <Card className="ornate-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Scroll className="size-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Chưa có nhiệm vụ.</p>
            <Button size="sm" className="mt-3" onClick={handleRefresh}>
              Tạo Nhiệm Vụ Mới
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {sortedQuests.map(q => (
            <QuestCard key={q.id} quest={q} />
          ))}
        </div>
      )}

      {/* Difficulty legend */}
      <Card className="bg-card/40 border-white/8">
        <CardContent className="py-3 px-4">
          <p className="text-[11px] text-muted-foreground mb-2 font-medium">Phần Thưởng Theo Độ Khó:</p>
          <div className="grid grid-cols-5 gap-1 text-[10px] text-center">
            {(["easy", "normal", "hard", "extreme", "legendary"] as const).map(d => (
              <div key={d} className={cn("rounded px-1 py-1 border", DIFFICULTY_BADGE[d])}>
                {DIFFICULTY_LABEL[d]}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-1 text-[10px] text-center mt-1 text-muted-foreground">
            <div>~300🪙</div>
            <div>~600🪙 + 💎</div>
            <div>~1200🪙 + 💎</div>
            <div>~2500🪙 + Tướng</div>
            <div>~5000🪙 + Tướng Hiếm</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
