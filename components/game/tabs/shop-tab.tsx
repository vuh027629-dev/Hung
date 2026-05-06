"use client"

import { useState } from "react"
import { useGame } from "@/lib/game/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DIG_RATES,
  RARITY_BG_CLASS,
  RARITY_LABEL,
  RARITY_ORDER,
  RARITY_TEXT_CLASS,
} from "@/lib/game/rarity"
import { ITEMS_BY_ID } from "@/lib/game/items"
import type { ShopKind, ShopStockItem } from "@/lib/game/types"
import { cn } from "@/lib/utils"
import { getEventPriceMultiplier } from "@/lib/game/store"
import {
  Coins,
  Sword as SwordIcon,
  Shield as ShieldIcon,
  Gem as GemIcon,
  FlaskConical,
  Pickaxe,
  Zap,
  ShoppingBag,
  Lock,
  Sparkles,
} from "lucide-react"

const BATTLES_PER_DAY = 5

export function ShopTab() {
  return (
    <Tabs defaultValue="weapon" className="space-y-3">
      <TabsList className="flex flex-wrap justify-start h-auto gap-1 bg-card/60 ornate-border p-1">
        <TabsTrigger value="weapon" className="font-fantasy">
          <SwordIcon className="size-4 mr-1" />
          Vũ Khí
        </TabsTrigger>
        <TabsTrigger value="armor" className="font-fantasy">
          <ShieldIcon className="size-4 mr-1" />
          Giáp
        </TabsTrigger>
        <TabsTrigger value="trinket" className="font-fantasy">
          <GemIcon className="size-4 mr-1" />
          Trang Sức
        </TabsTrigger>
        <TabsTrigger value="potion" className="font-fantasy">
          <FlaskConical className="size-4 mr-1" />
          Thuốc
        </TabsTrigger>
        <TabsTrigger value="dig" className="font-fantasy">
          <Pickaxe className="size-4 mr-1" />
          Đào Cổ Vật
        </TabsTrigger>
        <TabsTrigger value="premium" className="font-fantasy">
          <Sparkles className="size-4 mr-1" />
          Huyền Bảo
        </TabsTrigger>
      </TabsList>

      <TabsContent value="weapon">
        <ShopGrid kind="weapon" title="Cửa Hàng Vũ Khí" />
      </TabsContent>
      <TabsContent value="armor">
        <ShopGrid kind="armor" title="Cửa Hàng Giáp" />
      </TabsContent>
      <TabsContent value="trinket">
        <ShopGrid kind="trinket" title="Cửa Hàng Trang Sức" />
      </TabsContent>
      <TabsContent value="potion">
        <ShopGrid kind="potion" title="Cửa Hàng Thuốc" />
      </TabsContent>
      <TabsContent value="dig">
        <DigSite />
      </TabsContent>
      <TabsContent value="premium">
        <PremiumShop />
      </TabsContent>
    </Tabs>
  )
}

function ShopGrid({ kind, title }: { kind: ShopKind; title: string }) {
  const { state, buyShopItem } = useGame()
  const stock = state.shopStock?.[kind]
  const battlesWon = state.battlesWon
  const battlesToNextRestock = BATTLES_PER_DAY - (battlesWon % BATTLES_PER_DAY)
  const dayNumber = stock?.dayNumber ?? 1

  if (!stock) {
    return (
      <Card className="ornate-border">
        <CardContent className="py-8 text-center text-muted-foreground">
          Đang tải cửa hàng...
        </CardContent>
      </Card>
    )
  }

  const items = stock.items

  return (
    <Card className="ornate-border">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="font-fantasy flex items-center gap-2">
            <ShoppingBag className="size-5" />
            {title}
          </CardTitle>
          <div className="text-xs text-muted-foreground bg-card/60 px-2 py-1 rounded border border-border">
            📅 Ngày {dayNumber} · Restock sau <span className="font-bold text-primary">{battlesToNextRestock}</span> trận
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Cửa hàng tự restock mỗi 5 trận chiến. Mỗi vật phẩm có giới hạn lượt mua.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((si, idx) => (
            <ShopItemCard
              key={`${si.itemId}-${idx}`}
              stockItem={si}
              gold={state.gold}
              priceMult={getEventPriceMultiplier(state)}
              onBuy={() => buyShopItem(kind, idx)}
            />
          ))}
          {items.length === 0 && (
            <p className="col-span-3 text-center text-muted-foreground py-6 text-sm">
              Hết hàng — nhấn Restock để lấy hàng mới.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ShopItemCard({
  stockItem,
  gold,
  priceMult = 1,
  onBuy,
}: {
  stockItem: ShopStockItem
  gold: number
  priceMult?: number
  onBuy: () => void
}) {
  const item = ITEMS_BY_ID[stockItem.itemId]
  if (!item) return null
  const soldOut = stockItem.stock <= 0
  const hasInnate = !!stockItem.innate
  const finalPrice = Math.round(item.basePrice * priceMult)
  const isPriceInflated = priceMult > 1

  return (
    <div
      className={cn(
        "rounded-lg border-2 p-3 bg-card/70 relative",
        RARITY_BG_CLASS[item.rarity],
        soldOut && "opacity-50",
      )}
    >
      {hasInnate && (
        <div className="absolute top-2 right-2">
          <Zap className="size-3.5 text-rarity-legendary" title="Có nội tại" />
        </div>
      )}
      <div className="flex items-start justify-between pr-5">
        <h4
          className={cn(
            "font-fantasy font-bold text-sm",
            RARITY_TEXT_CLASS[item.rarity],
          )}
        >
          {item.name}
        </h4>
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground ml-1 shrink-0">
          {RARITY_LABEL[item.rarity]}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
        {item.description}
      </p>
      {item.stats && (
        <div className="mt-2 flex flex-wrap gap-1">
          {Object.entries(item.stats).map(([k, v]) => (
            <span
              key={k}
              className="text-[10px] px-1.5 py-0.5 rounded bg-background/60 border border-border font-mono"
            >
              {(v as number) >= 0 ? "+" : ""}{v as number} {k.toUpperCase()}
            </span>
          ))}
        </div>
      )}
      {/* Innate bonus display */}
      {stockItem.innate && (
        <div className="mt-2 px-2 py-1 rounded bg-rarity-legendary/15 border border-rarity-legendary/40">
          <div className="flex items-center gap-1">
            <Zap className="size-3 text-rarity-legendary" />
            <span className="text-[10px] font-bold text-rarity-legendary">Nội Tại</span>
          </div>
          <span className="text-[10px] font-mono text-rarity-legendary">
            +{stockItem.innate.value} {stockItem.innate.label}
          </span>
        </div>
      )}
      {item.passive?.description && (
        <div className="mt-1 text-[10px] text-primary/80 italic">
          ◆ {item.passive.description}
        </div>
      )}
      {item.potion && (
        <div className="mt-2 text-[11px] text-muted-foreground italic">
          {item.potion.healPct
            ? `Hồi ${Math.round(item.potion.healPct * 100)}% HP`
            : item.potion.buff
            ? `Buff: ${item.potion.buff.name}`
            : ""}
          {item.potion.cleanse && " · Thanh tẩy"}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1 text-rarity-legendary font-bold">
          <Coins className="size-4" />
          <span className="font-mono">{finalPrice}</span>
          {isPriceInflated && (
            <span className="text-[9px] text-red-400 font-semibold ml-0.5">📈+25%</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[10px] font-mono",
            soldOut ? "text-destructive" : stockItem.stock <= 1 ? "text-yellow-400" : "text-muted-foreground"
          )}>
            {soldOut ? "Hết" : `×${stockItem.stock}`}
          </span>
          <Button
            size="sm"
            onClick={onBuy}
            disabled={gold < finalPrice || soldOut}
          >
            Mua
          </Button>
        </div>
      </div>
    </div>
  )
}

function DigSite() {
  const { state, digArtifact } = useGame()
  const [digging, setDigging] = useState(false)
  return (
    <Card className="ornate-border">
      <CardHeader>
        <CardTitle className="font-fantasy flex items-center gap-2">
          <Pickaxe className="size-5 text-primary" />
          Khu Khai Quật Cổ Vật
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={cn(
            "relative h-44 rounded-xl border-2 border-primary/30 grid place-items-center overflow-hidden ornate-border",
            digging && "animate-pulse",
          )}
          style={{
            background:
              "linear-gradient(180deg, oklch(0.25 0.05 60) 0%, oklch(0.18 0.04 50) 100%)",
          }}
        >
          <div className="text-center z-10">
            <Pickaxe
              className={cn(
                "size-12 mx-auto text-primary",
                digging && "shake",
              )}
            />
            <p className="font-fantasy text-xl mt-1 text-primary">
              Đào sâu vào lòng đất
            </p>
            <p className="text-xs text-muted-foreground italic">
              Có thể không tìm thấy gì... hoặc kho báu của các vị thần.
            </p>
          </div>
        </div>
        <Button
          size="lg"
          className="w-full font-fantasy"
          disabled={state.gold < 60 || digging}
          onClick={() => {
            setDigging(true)
            setTimeout(() => {
              digArtifact()
              setDigging(false)
            }, 700)
          }}
        >
          <Coins className="size-4 mr-2" />
          Đào — 60 vàng
        </Button>

        <div>
          <h5 className="font-fantasy font-bold text-sm mb-2">
            Tỉ lệ tìm thấy
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded border border-border bg-card/50">
              <span className="text-muted-foreground">Không có gì</span>
              <span className="font-mono">{(DIG_RATES.nothing * 100).toFixed(0)}%</span>
            </div>
            {RARITY_ORDER.map((r) => (
              <div
                key={r}
                className="flex items-center justify-between p-2 rounded border border-border bg-card/50"
              >
                <span className={cn("font-fantasy", RARITY_TEXT_CLASS[r])}>
                  {RARITY_LABEL[r]}
                </span>
                <span className="font-mono">
                  {(DIG_RATES[r] * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// Premium Shop — Cửa Hàng Huyền Bảo
// ============================================================
function PremiumShop() {
  const { state, buyPremiumShopItem, restockPremiumShop } = useGame()
  const level = state.level
  const towerRecord = state.towerRecord ?? 0

  let tier: 1 | 2 | 3 | null = null
  if (level >= 100 && towerRecord >= 60) tier = 3
  else if (level >= 70 && towerRecord >= 40) tier = 2
  else if (level >= 50) tier = 1

  // ── Locked state ────────────────────────────────────────
  if (tier === null) {
    return (
      <Card className="ornate-border">
        <CardContent className="py-12 flex flex-col items-center gap-4">
          <div className="size-16 rounded-full bg-muted/30 border-2 border-border flex items-center justify-center">
            <Lock className="size-8 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="font-fantasy text-xl font-bold text-muted-foreground">Cửa Hàng Huyền Bảo</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Cửa hàng bí ẩn chỉ bán trang bị cực phẩm. Đạt đủ điều kiện để mở khóa.
            </p>
          </div>
          <div className="w-full max-w-sm space-y-2 text-sm">
            {[
              { req: "Cấp 50", met: level >= 50, cur: level, max: 50, info: "60% Legend · 30% Mythic · 10% Transcendent" },
              { req: "Cấp 70 + Tầng 40", met: level >= 70 && towerRecord >= 40, cur: Math.min(level, 70), max: 70, info: "60% Mythic · 35% Transcendent · 5% Divine" },
              { req: "Cấp 100 + Tầng 60", met: level >= 100 && towerRecord >= 60, cur: Math.min(level, 100), max: 100, info: "65% Transcendent · 34% Divine · 1% Primordial" },
            ].map(({ req, met, info }) => (
              <div key={req} className={cn(
                "flex flex-col gap-0.5 px-3 py-2 rounded-lg border text-xs",
                met ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-border bg-card/40 text-muted-foreground"
              )}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{met ? "✅" : "🔒"} {req}</span>
                  <span className={met ? "text-green-400" : "text-muted-foreground"}>{met ? "Đạt" : `${level}/${req.includes("50") ? 50 : req.includes("70") ? 70 : 100}`}</span>
                </div>
                <span className="text-muted-foreground italic">{info}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const stock = state.premiumShopStock
  const battlesWon = state.battlesWon ?? 0
  const battlesToRestock = BATTLES_PER_DAY - (battlesWon % BATTLES_PER_DAY)
  const dayNumber = stock?.dayNumber ?? 1

  const tierConfig = {
    1: { label: "Cấp 1 · Huyền Thoại", desc: "60% Legend · 30% Mythic · 10% Transcendent", border: "border-yellow-500/60", text: "text-yellow-400", glow: "from-yellow-500/15 to-orange-500/10", next: level < 70 || towerRecord < 40 ? `Cấp 2: Cần Lv70 + Tầng 40 (hiện: Lv${level}, T${towerRecord})` : null },
    2: { label: "Cấp 2 · Thần Thoại", desc: "60% Mythic · 35% Transcendent · 5% Divine", border: "border-purple-400/60", text: "text-purple-300", glow: "from-purple-500/15 to-pink-500/10", next: level < 100 || towerRecord < 60 ? `Cấp 3: Cần Lv100 + Tầng 60 (hiện: Lv${level}, T${towerRecord})` : null },
    3: { label: "Cấp 3 · Nguyên Thủy", desc: "65% Transcendent · 34% Divine · 1% Primordial", border: "border-cyan-400/60", text: "text-cyan-300", glow: "from-cyan-500/15 to-blue-500/10", next: null },
  }[tier]

  return (
    <Card className={cn("ornate-border border-2", tierConfig.border)}>
      <CardHeader className="pb-2">
        <div className={cn("rounded-xl p-3 bg-gradient-to-r mb-1", tierConfig.glow)}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className={cn("font-fantasy flex items-center gap-2 text-base", tierConfig.text)}>
              <Sparkles className="size-5" />
              Cửa Hàng Huyền Bảo
              <span className="text-xs font-normal opacity-80 border border-current/40 px-2 py-0.5 rounded">
                {tierConfig.label}
              </span>
            </CardTitle>
            <div className="text-xs text-muted-foreground bg-card/60 px-2 py-1 rounded border border-border">
              📅 Ngày {dayNumber} · Restock sau <span className={cn("font-bold", tierConfig.text)}>{battlesToRestock}</span> trận
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{tierConfig.desc}</p>
        </div>
        {tierConfig.next && (
          <p className="text-[11px] text-muted-foreground italic px-1">🔒 {tierConfig.next}</p>
        )}
      </CardHeader>
      <CardContent>
        {!stock ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Đang tải...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {stock.items.map((si, idx) => (
              <ShopItemCard
                key={`premium-${si.itemId}-${idx}`}
                stockItem={si}
                gold={state.gold}
                onBuy={() => buyPremiumShopItem(idx)}
              />
            ))}
            {stock.items.length === 0 && (
              <p className="col-span-4 text-center text-muted-foreground py-8 text-sm">
                Hết hàng — nhấn làm mới để lấy hàng mới.
              </p>
            )}
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className={cn("font-fantasy gap-1.5 border", tierConfig.border, tierConfig.text)}
            onClick={restockPremiumShop}
          >
            <Sparkles className="size-3.5" />
            Làm Mới Huyền Bảo
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
