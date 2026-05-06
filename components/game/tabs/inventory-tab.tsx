"use client"

import { useGame } from "@/lib/game/store"
import { ITEMS_BY_ID } from "@/lib/game/items"
import {
  RARITY_BG_CLASS,
  RARITY_LABEL,
  RARITY_TEXT_CLASS,
} from "@/lib/game/rarity"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Backpack, Coins, Sparkles } from "lucide-react"

const LUCK_POTION_IDS = new Set(["p_luck_small", "p_luck_medium", "p_luck_large"])
const LUCK_POTION_TIER: Record<string, 1 | 2 | 3> = {
  p_luck_small: 1,
  p_luck_medium: 2,
  p_luck_large: 3,
}

export function InventoryTab() {
  const { state, sellItem, useLuckPotion } = useGame()

  if (state.inventory.length === 0) {
    return (
      <Card className="ornate-border">
        <CardContent className="py-12 text-center">
          <Backpack className="size-10 mx-auto text-muted-foreground" />
          <p className="font-fantasy mt-2">Kho đồ trống</p>
          <p className="text-xs text-muted-foreground">
            Hãy mua đồ ở cửa hàng hoặc đào cổ vật.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Group by kind
  const groups: Record<string, typeof state.inventory> = {}
  for (const inv of state.inventory) {
    const it = ITEMS_BY_ID[inv.itemId]
    if (!it) continue
    const key =
      it.kind === "equip"
        ? `Trang Bị · ${it.slot}`
        : it.kind === "potion"
        ? "Bình Thuốc"
        : it.kind === "artifact"
        ? "Cổ Vật"
        : "Vật Liệu"
    groups[key] = groups[key] || []
    groups[key].push(inv)
  }

  return (
    <div className="space-y-4">
      {state.luckBuff && (
        <Card className="ornate-border border-yellow-500/60 bg-yellow-500/10">
          <CardContent className="py-3 flex items-center gap-3">
            <Sparkles className="size-5 text-yellow-400 shrink-0" />
            <div>
              <p className="font-fantasy font-bold text-sm text-yellow-300">
                ✨ May Mắn đang hoạt động! +{[0, 25, 50, 75][state.luckBuff.tier]}%
              </p>
              <p className="text-xs text-muted-foreground">
                Còn <span className="font-bold text-yellow-400">{state.luckBuff.rollsLeft}</span> lần roll được buff (tướng + phúc/kèo)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {Object.entries(groups).map(([group, items]) => (
        <Card key={group} className="ornate-border">
          <CardHeader>
            <CardTitle className="font-fantasy text-base">{group}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((inv) => {
                const it = ITEMS_BY_ID[inv.itemId]
                const isLuckPotion = LUCK_POTION_IDS.has(inv.itemId)
                const tier = LUCK_POTION_TIER[inv.itemId]
                return (
                  <div
                    key={inv.uid}
                    className={cn(
                      "rounded-lg border-2 p-3 bg-card/70",
                      RARITY_BG_CLASS[it.rarity],
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4
                          className={cn(
                            "font-fantasy font-bold text-sm",
                            RARITY_TEXT_CLASS[it.rarity],
                          )}
                        >
                          {isLuckPotion && "✨ "}{it.name}
                        </h4>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {RARITY_LABEL[it.rarity]} · ×{inv.quantity}
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 h-8">
                      {it.description}
                    </p>
                    {it.stats && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Object.entries(it.stats).map(([k, v]) => (
                          <span
                            key={k}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-background/60 border border-border font-mono"
                          >
                            {(v as number) >= 0 ? "+" : ""}
                            {v as number} {k.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-rarity-legendary font-bold text-xs">
                        <Coins className="size-3.5" />
                        <span className="font-mono">
                          {Math.round(it.basePrice * 0.4)}
                        </span>
                        <span className="text-muted-foreground">/cái</span>
                      </div>
                      <div className="flex gap-1">
                        {isLuckPotion && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-yellow-500/60 text-yellow-300 hover:bg-yellow-500/20 text-xs px-2"
                            onClick={() => useLuckPotion(inv.uid, tier)}
                          >
                            <Sparkles className="size-3 mr-1" />
                            Dùng
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sellItem(inv.uid)}
                        >
                          Bán
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
