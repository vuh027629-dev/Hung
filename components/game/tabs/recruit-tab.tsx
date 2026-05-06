"use client"

import { useGame } from "@/lib/game/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HEROES_BY_RARITY } from "@/lib/game/heroes"
import {
  HERO_GACHA_RATES,
  HERO_GACHA_RATES_GOLD,
  RARITY_LABEL,
  RARITY_ORDER,
  RARITY_TEXT_CLASS,
} from "@/lib/game/rarity"
import type { Rarity } from "@/lib/game/types"
import { Gem, Sparkles, Coins, Star } from "lucide-react"
import { cn } from "@/lib/utils"

export function RecruitTab() {
  return (
    <Tabs defaultValue="gem" className="space-y-3">
      <TabsList className="bg-card/60 ornate-border p-1">
        <TabsTrigger value="gem" className="font-fantasy">
          <Gem className="size-4 mr-1 text-rarity-celestial" />
          Vực Tinh Tú
        </TabsTrigger>
        <TabsTrigger value="gold" className="font-fantasy">
          <Coins className="size-4 mr-1 text-rarity-legendary" />
          Quán Lữ Hành
        </TabsTrigger>
      </TabsList>

      <TabsContent value="gem">
        <GemBanner />
      </TabsContent>
      <TabsContent value="gold">
        <GoldBanner />
      </TabsContent>
    </Tabs>
  )
}

function GemBanner() {
  const { state, rollHero } = useGame()
  // Only show rarities available in gem banner
  const displayRarities = RARITY_ORDER.filter((r) => HERO_GACHA_RATES[r] > 0)

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2 ornate-border">
        <CardHeader>
          <CardTitle className="font-fantasy flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            Cổng Triệu Hồi Anh Hùng
            {state.luckBuff && (
              <span className="ml-auto text-xs font-normal text-yellow-300 flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/40 rounded px-2 py-0.5">
                ✨ May Mắn +{[0,25,50,75][state.luckBuff.tier]}% · còn {state.luckBuff.rollsLeft} lần
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="relative rounded-xl border-2 border-primary/40 ornate-border h-56 grid place-items-center"
            aria-hidden
            style={{
              background:
                "radial-gradient(ellipse at center, oklch(0.4 0.15 80 / 0.3), transparent 70%), oklch(0.18 0.03 270)",
            }}
          >
            <div className="absolute inset-0 shimmer rounded-xl opacity-30" />
            <div className="text-center">
              <Sparkles className="size-12 text-primary mx-auto pulse-rarity" />
              <p className="font-fantasy text-2xl text-primary mt-2">Vực Tinh Tú</p>
              <p className="text-xs text-muted-foreground italic max-w-xs mx-auto px-4">
                Hơi thở của các vị thần đang chờ một anh hùng mới được khắc lên vũ trụ.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              size="lg"
              variant="secondary"
              className="font-fantasy"
              onClick={() => rollHero(1)}
              disabled={state.gems < 30}
            >
              <Gem className="size-4 mr-1 text-rarity-celestial" />
              x1 — 30 đá quý
            </Button>
            <Button
              size="lg"
              className="font-fantasy"
              onClick={() => rollHero(10)}
              disabled={state.gems < 280}
            >
              <Gem className="size-4 mr-1" />
              x10 — 280 (Đảm bảo Sử Thi+)
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Triệu hồi tướng trùng sẽ nhận được đá quý hoàn trả theo độ hiếm.
          </p>
        </CardContent>
      </Card>

      <Card className="ornate-border">
        <CardHeader>
          <CardTitle className="font-fantasy text-base">Tỉ lệ rơi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {displayRarities.map((r) => (
            <div
              key={r}
              className="flex items-center justify-between p-2 rounded border border-border bg-card/50"
            >
              <span className={cn("font-fantasy font-bold text-sm", RARITY_TEXT_CLASS[r])}>
                {RARITY_LABEL[r]}
              </span>
              <span className="font-mono text-sm">
                {(HERO_GACHA_RATES[r] * 100).toFixed(2)}%
              </span>
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground italic mt-2">
            Tổng cộng:{" "}
            {RARITY_ORDER.reduce((a, r) => a + (HEROES_BY_RARITY[r]?.length || 0), 0)} tướng.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function GoldBanner() {
  const { state, rollHeroGold } = useGame()
  // Only common/rare/epic
  const goldRarities: Rarity[] = ["common", "rare", "epic"]

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2 ornate-border">
        <CardHeader>
          <CardTitle className="font-fantasy flex items-center gap-2">
            <Star className="size-5 text-rarity-legendary" />
            Quán Lữ Hành
            {state.luckBuff && (
              <span className="ml-auto text-xs font-normal text-yellow-300 flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/40 rounded px-2 py-0.5">
                ✨ May Mắn +{[0,25,50,75][state.luckBuff.tier]}% · còn {state.luckBuff.rollsLeft} lần
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="relative rounded-xl border-2 border-rarity-legendary/40 ornate-border h-56 grid place-items-center"
            aria-hidden
            style={{
              background:
                "radial-gradient(ellipse at center, oklch(0.45 0.12 60 / 0.25), transparent 70%), oklch(0.18 0.04 50)",
            }}
          >
            <div className="text-center">
              <Coins className="size-12 text-rarity-legendary mx-auto" />
              <p className="font-fantasy text-2xl text-rarity-legendary mt-2">Quán Lữ Hành</p>
              <p className="text-xs text-muted-foreground italic max-w-xs mx-auto px-4">
                Những anh hùng lang thang ghé lại quán trọ — dùng vàng để chiêu mộ họ. Không có bậc huyền thoại trở lên.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              size="lg"
              variant="secondary"
              className="font-fantasy border-rarity-legendary/40"
              onClick={() => rollHeroGold(1)}
              disabled={state.gold < 500}
            >
              <Coins className="size-4 mr-1 text-rarity-legendary" />
              x1 — 500 vàng
            </Button>
            <Button
              size="lg"
              className="font-fantasy"
              onClick={() => rollHeroGold(10)}
              disabled={state.gold < 4500}
            >
              <Coins className="size-4 mr-1 text-rarity-legendary" />
              x10 — 4500 vàng (Đảm bảo Hiếm+)
            </Button>
          </div>

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            ⚠️ Giới hạn tối đa <span className="font-bold">Sử Thi</span> — không thể triệu hồi Huyền Thoại, Thần Thoại, Thiên Thần từ quán này.
          </div>
        </CardContent>
      </Card>

      <Card className="ornate-border">
        <CardHeader>
          <CardTitle className="font-fantasy text-base flex items-center gap-2">
            <Coins className="size-4 text-rarity-legendary" />
            Tỉ lệ rơi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {goldRarities.map((r) => (
            <div
              key={r}
              className="flex items-center justify-between p-2 rounded border border-border bg-card/50"
            >
              <span className={cn("font-fantasy font-bold text-sm", RARITY_TEXT_CLASS[r])}>
                {RARITY_LABEL[r]}
              </span>
              <span className="font-mono text-sm">
                {(HERO_GACHA_RATES_GOLD[r] * 100).toFixed(0)}%
              </span>
            </div>
          ))}
          <div className="mt-3 text-[10px] text-muted-foreground space-y-1">
            <p>• x10 đảm bảo ít nhất 1 Hiếm trở lên</p>
            <p>• Tướng trùng hoàn trả vàng theo độ hiếm</p>
            <p>• Phù hợp để thu thập tướng phổ thông → sử thi</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
